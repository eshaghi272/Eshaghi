import express from 'express';
import db from '../db.js';

const router = express.Router();

// ✅ ایجاد جدول لاگ افتتاحیه اگر وجود ندارد
const initOpeningLogsTable = () => {
  try {
    // بررسی وجود جدول
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='tblOpeningLogs'
    `).get();
    
    if (!tableExists) {
      db.prepare(`
        CREATE TABLE tblOpeningLogs (
          LogId INTEGER PRIMARY KEY AUTOINCREMENT,
          SourceFiscalYear TEXT NOT NULL,
          TargetFiscalYear TEXT,
          OperationType TEXT NOT NULL,
          EntryId INTEGER,
          Details TEXT,
          CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          CreatedBy TEXT DEFAULT 'SYSTEM'
        )
      `).run();
      console.log('✅ جدول لاگ افتتاحیه حساب‌ها ایجاد شد');
    }
  } catch (error) {
    console.error('❌ خطا در ایجاد جدول لاگ:', error);
  }
};
initOpeningLogsTable();

// ✅ تابع کمکی برای ثبت لاگ
const logOperation = (operationType, sourceYear, targetYear = null, entryId = null, details = {}) => {
  try {
    db.prepare(`
      INSERT INTO tblOpeningLogs (SourceFiscalYear, TargetFiscalYear, OperationType, EntryId, Details)
      VALUES (?, ?, ?, ?, ?)
    `).run(sourceYear, targetYear, operationType, entryId, JSON.stringify(details));
  } catch (error) {
    console.error('❌ خطا در ثبت لاگ:', error);
  }
};

// ✅ تابع کمکی برای نمایش نوع حساب به فارسی
const getTypeFa = (type) => {
  const types = {
    'CurrentAssets': 'دارایی جاری',
    'NonCurrentAssets': 'دارایی غیرجاری',
    'CurrentDebit': 'بدهی جاری',
    'NonCurrentDebit': 'بدهی غیرجاری',
    'Equity': 'حقوق مالکانه',
    'Incomes': 'درآمد',
    'OperatingCost': 'هزینه عملیاتی',
    'NonOperatingCost': 'هزینه غیرعملیاتی',
    'COSP': 'بهای تمام شده',
    'ContraAccounts': 'حساب انتظامی'
  };
  return types[type] || type;
};

// ✅ 1. دریافت سال‌های مالی برای افتتاحیه
router.get('/fiscal-years', (req, res) => {
  try {
    const years = db.prepare(`
      SELECT 
        FiscalYearId,
        YearCode,
        StartDate,
        EndDate,
        IsActive,
        CASE 
          WHEN IsActive = 1 THEN 'فعال'
          ELSE 'بسته شده'
        END as StatusFa,
        (SELECT COUNT(*) FROM tblJournalEntries WHERE FiscalYearId = tf.FiscalYearId) as EntryCount
      FROM tblFiscalYear tf
      ORDER BY YearCode DESC
    `).all();
    
    const formattedYears = years.map(year => ({
      ...year,
      YearCode: year.YearCode.toString(),
      FiscalYearId: year.FiscalYearId,
      StartDate: year.StartDate,
      EndDate: year.EndDate,
      IsActive: year.IsActive,
      StatusFa: year.StatusFa,
      EntryCount: year.EntryCount || 0
    }));
    
    res.json(formattedYears);
  } catch (error) {
    console.error('❌ خطا در دریافت سال‌های مالی:', error);
    res.status(500).json({ 
      error: 'خطا در دریافت سال‌های مالی',
      details: error.message 
    });
  }
});

// ✅ 2. بررسی شرایط افتتاحیه - اصلاح شده برای تطابق با فرانت‌اند
router.get('/check-opening-requirements/:sourceYear', (req, res) => {
  const { sourceYear } = req.params;
  const { targetYear } = req.query;
  
  try {
    // بررسی وجود سال مبدأ
    const sourceFiscalYear = db.prepare(`
      SELECT * FROM tblFiscalYear WHERE YearCode = ?
    `).get(sourceYear);
    
    if (!sourceFiscalYear) {
      return res.status(404).json({ 
        success: false,
        canOpen: false, 
        error: `سال مالی مبدأ ${sourceYear} یافت نشد` 
      });
    }
    
    // بررسی وجود سال هدف
    let targetFiscalYear = null;
    if (targetYear) {
      targetFiscalYear = db.prepare(`
        SELECT * FROM tblFiscalYear WHERE YearCode = ?
      `).get(targetYear);
    }
    
    console.log(`🔍 بررسی شرایط افتتاحیه از سال ${sourceYear} به سال ${targetYear || 'جدید'}`);
    
    // 1. بررسی بسته بودن سال مبدأ
    const isSourceClosed = sourceFiscalYear.IsActive === 0;
    
    // 2. بررسی وجود سند اختتامیه در سال مبدأ
    const closingEntry = db.prepare(`
      SELECT EntryId, DocumentNumber, EntryDate 
      FROM tblJournalEntries 
      WHERE FiscalYearId = ? AND TypeDoc = 'اختتامیه'
      LIMIT 1
    `).get(sourceFiscalYear.FiscalYearId);
    
    // 3. بررسی وجود سند افتتاحیه قبلی برای سال هدف
    let existingOpening = null;
    if (targetFiscalYear) {
      existingOpening = db.prepare(`
        SELECT EntryId FROM tblJournalEntries
        WHERE FiscalYearId = ? AND TypeDoc = 'افتتاحيه'
        LIMIT 1
      `).get(targetFiscalYear.FiscalYearId);
    }
    
    // 4. بررسی وجود مانده در حساب‌های دائمی سال مبدأ
    const permanentAccountsWithBalance = db.prepare(`
      SELECT COUNT(DISTINCT a.AccountCode) as count
      FROM tblAccounts a
      LEFT JOIN (
        SELECT 
          AccountCode,
          SUM(DebitAmount) as TotalDebit,
          SUM(CreditAmount) as TotalCredit
        FROM tblJournalLines jl
        JOIN tblJournalEntries je ON jl.EntryId = je.EntryId
        WHERE je.FiscalYearId = ?
        GROUP BY AccountCode
      ) balances ON a.AccountCode = balances.AccountCode
      WHERE a.Type IN ('CurrentAssets', 'NonCurrentAssets', 'CurrentDebit', 'NonCurrentDebit', 'Equity')
        AND a.IsActive = 1
      AND ABS(
        CASE 
          WHEN a.Nature = 'بدهكار' 
          THEN COALESCE(balances.TotalDebit, 0) - COALESCE(balances.TotalCredit, 0)
          WHEN a.Nature = 'بستانكار'
          THEN COALESCE(balances.TotalCredit, 0) - COALESCE(balances.TotalDebit, 0)
          ELSE COALESCE(balances.TotalDebit, 0) - COALESCE(balances.TotalCredit, 0)
        END
      ) > 0.01
    `).get(sourceFiscalYear.FiscalYearId);
    
    // آرایه خطاها
    const missingRequirements = [];
    if (!isSourceClosed) missingRequirements.push('سال مبدأ بسته نشده است');
    if (!closingEntry) missingRequirements.push('سند اختتامیه برای سال مبدأ ثبت نشده است');
    if (existingOpening) missingRequirements.push('سال هدف قبلاً افتتاح شده است');
    if (permanentAccountsWithBalance.count === 0) missingRequirements.push('حساب دائمی با مانده یافت نشد');
    
    const result = {
      success: true,
      canOpen: isSourceClosed && !!closingEntry && !existingOpening && permanentAccountsWithBalance.count > 0,
      missingRequirements: missingRequirements,
      sourceFiscalYear: {
        yearCode: sourceFiscalYear.YearCode.toString(),
        fiscalYearId: sourceFiscalYear.FiscalYearId,
        isActive: sourceFiscalYear.IsActive,
        isClosed: sourceFiscalYear.IsActive === 0,
        startDate: sourceFiscalYear.StartDate,
        endDate: sourceFiscalYear.EndDate
      },
      targetFiscalYear: targetFiscalYear ? {
        yearCode: targetFiscalYear.YearCode.toString(),
        fiscalYearId: targetFiscalYear.FiscalYearId,
        isActive: targetFiscalYear.IsActive,
        exists: true
      } : {
        yearCode: (parseInt(sourceYear) + 1).toString(),
        exists: false
      },
      requirements: {
        sourceClosed: isSourceClosed,
        hasClosingEntry: !!closingEntry,
        closingEntry: closingEntry || null,
        targetNotOpened: !existingOpening,
        hasPermanentBalances: permanentAccountsWithBalance.count > 0,
        permanentAccountsCount: permanentAccountsWithBalance.count || 0
      }
    };
    
    console.log('✅ نتایج بررسی شرایط افتتاحیه:', result.canOpen);
    
    logOperation('CHECK_OPENING_REQUIREMENTS', sourceYear, result.targetFiscalYear.yearCode, null, result);
    res.json(result);
    
  } catch (error) {
    console.error('❌ خطا در بررسی شرایط افتتاحیه:', error);
    res.status(500).json({ 
      success: false,
      canOpen: false,
      error: 'خطا در بررسی شرایط افتتاحیه',
      details: error.message 
    });
  }
});

// ✅ 3. دریافت مانده حساب‌های دائمی
router.get('/permanent-accounts-balances/:yearCode', (req, res) => {
  const { yearCode } = req.params;
  
  try {
    const fiscalYear = db.prepare(`
      SELECT * FROM tblFiscalYear WHERE YearCode = ?
    `).get(yearCode);
    
    if (!fiscalYear) {
      return res.status(404).json({ 
        success: false,
        error: `سال مالی ${yearCode} یافت نشد` 
      });
    }
    
    console.log(`🔍 دریافت مانده حساب‌های دائمی برای سال ${yearCode}`);
    
    // دریافت مانده حساب‌های دائمی
    const permanentAccounts = db.prepare(`
      SELECT 
        a.AccountCode,
        a.TopCode,
        a.TitleFa,
        a.TitleEn,
        a.Type,
        a.Nature,
        a.Level,
        a.ParentCode,
        COALESCE(SUM(jl.DebitAmount), 0) as TotalDebit,
        COALESCE(SUM(jl.CreditAmount), 0) as TotalCredit,
        CASE 
          WHEN a.Nature = 'بدهكار' THEN COALESCE(SUM(jl.DebitAmount), 0) - COALESCE(SUM(jl.CreditAmount), 0)
          WHEN a.Nature = 'بستانكار' THEN COALESCE(SUM(jl.CreditAmount), 0) - COALESCE(SUM(jl.DebitAmount), 0)
          ELSE COALESCE(SUM(jl.DebitAmount), 0) - COALESCE(SUM(jl.CreditAmount), 0)
        END as Balance
      FROM tblAccounts a
      LEFT JOIN tblJournalLines jl ON a.AccountCode = jl.AccountCode
      LEFT JOIN tblJournalEntries je ON jl.EntryId = je.EntryId
        AND je.FiscalYearId = ?
      WHERE a.Type IN ('CurrentAssets', 'NonCurrentAssets', 'CurrentDebit', 'NonCurrentDebit', 'Equity')
        AND a.IsActive = 1
      GROUP BY a.AccountCode, a.TopCode, a.TitleFa, a.TitleEn, a.Type, a.Nature, a.Level, a.ParentCode
      HAVING ABS(Balance) > 0.01
      ORDER BY 
        CASE 
          WHEN a.Type = 'CurrentAssets' THEN 1
          WHEN a.Type = 'NonCurrentAssets' THEN 2
          WHEN a.Type = 'CurrentDebit' THEN 3
          WHEN a.Type = 'NonCurrentDebit' THEN 4
          WHEN a.Type = 'Equity' THEN 5
          ELSE 6
        END,
        a.AccountCode
    `).all(fiscalYear.FiscalYearId);
    
    // محاسبه جمع‌ها
    let totalDebit = 0;
    let totalCredit = 0;
    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;
    
    permanentAccounts.forEach(acc => {
      totalDebit += acc.TotalDebit;
      totalCredit += acc.TotalCredit;
      
      if (acc.Type === 'CurrentAssets' || acc.Type === 'NonCurrentAssets') {
        totalAssets += acc.Balance;
      }
      if (acc.Type === 'CurrentDebit' || acc.Type === 'NonCurrentDebit') {
        totalLiabilities += acc.Balance;
      }
      if (acc.Type === 'Equity') {
        totalEquity += acc.Balance;
      }
    });
    
    const isBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01;
    
    // آمار حساب‌ها
    const assetsCount = permanentAccounts.filter(acc => 
      acc.Type === 'CurrentAssets' || acc.Type === 'NonCurrentAssets'
    ).length;
    
    const liabilitiesCount = permanentAccounts.filter(acc => 
      acc.Type === 'CurrentDebit' || acc.Type === 'NonCurrentDebit'
    ).length;
    
    const equityCount = permanentAccounts.filter(acc => 
      acc.Type === 'Equity'
    ).length;
    
    // فرمت کردن حساب‌ها برای فرانت‌اند
    const formattedAccounts = permanentAccounts.map(acc => ({
      AccountCode: acc.AccountCode,
      TitleFa: acc.TitleFa,
      Nature: acc.Nature,
      Type: acc.Type,
      Balance: Math.abs(acc.Balance),
      BalanceDisplay: `${Math.abs(acc.Balance).toLocaleString('fa-IR')} ریال`,
      Side: acc.Balance > 0 ? (acc.Nature === 'بدهكار' ? 'بدهکار' : 'بستانکار') : 'صفر',
      TypeFa: getTypeFa(acc.Type)
    }));
    
    const response = {
      success: true,
      fiscalYear: {
        yearCode: fiscalYear.YearCode.toString(),
        fiscalYearId: fiscalYear.FiscalYearId,
        startDate: fiscalYear.StartDate,
        endDate: fiscalYear.EndDate
      },
      accounts: formattedAccounts,
      summary: {
        totalAccounts: permanentAccounts.length,
        assets: {
          count: assetsCount,
          total: Math.abs(totalAssets),
          displayTotal: `${Math.abs(totalAssets).toLocaleString('fa-IR')} ریال`
        },
        liabilities: {
          count: liabilitiesCount,
          total: Math.abs(totalLiabilities),
          displayTotal: `${Math.abs(totalLiabilities).toLocaleString('fa-IR')} ریال`
        },
        equity: {
          count: equityCount,
          total: Math.abs(totalEquity),
          displayTotal: `${Math.abs(totalEquity).toLocaleString('fa-IR')} ریال`
        },
        totalDebit,
        totalCredit,
        totalBalance: Math.abs(totalAssets - totalLiabilities),
        isBalanced,
        balanceStatus: isBalanced ? '✅ متوازن' : '❌ نامتوازن',
        difference: Math.abs(totalAssets - (totalLiabilities + totalEquity))
      }
    };
    
    console.log(`✅ حساب‌های دائمی دریافت شدند: ${permanentAccounts.length} حساب`);
    
    logOperation('GET_PERMANENT_ACCOUNTS', yearCode, yearCode, null, {
      count: permanentAccounts.length,
      assetsCount,
      liabilitiesCount,
      equityCount,
      isBalanced
    });
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ خطا در دریافت مانده حساب‌های دائمی:', error);
    res.status(500).json({ 
      success: false,
      error: 'خطا در دریافت مانده حساب‌های دائمی',
      details: error.message 
    });
  }
});

// ✅ 4. دریافت مراحل افتتاحیه
router.get('/opening-steps/:sourceYear', (req, res) => {
  const { sourceYear } = req.params;
  const { targetYear } = req.query;
  
  try {
    const sourceFiscalYear = db.prepare(`
      SELECT * FROM tblFiscalYear WHERE YearCode = ?
    `).get(sourceYear);
    
    if (!sourceFiscalYear) {
      return res.status(404).json({ 
        success: false,
        error: `سال مالی مبدأ ${sourceYear} یافت نشد` 
      });
    }
    
    const defaultTargetYear = (parseInt(sourceYear) + 1).toString();
    const actualTargetYear = targetYear || defaultTargetYear;
    
    let targetFiscalYear = null;
    if (actualTargetYear) {
      targetFiscalYear = db.prepare(`
        SELECT * FROM tblFiscalYear WHERE YearCode = ?
      `).get(actualTargetYear);
    }
    
    // بررسی وجود سند افتتاحیه قبلی
    const existingOpening = targetFiscalYear ? db.prepare(`
      SELECT EntryId, DocumentNumber, EntryDate 
      FROM tblJournalEntries 
      WHERE FiscalYearId = ? AND TypeDoc = 'افتتاحيه'
      LIMIT 1
    `).get(targetFiscalYear.FiscalYearId) : null;
    
    // دریافت تعداد حساب‌های دائمی با مانده
    const permanentAccountsCount = db.prepare(`
      SELECT COUNT(DISTINCT a.AccountCode) as count
      FROM tblAccounts a
      LEFT JOIN (
        SELECT 
          AccountCode,
          SUM(DebitAmount) as TotalDebit,
          SUM(CreditAmount) as TotalCredit
        FROM tblJournalLines jl
        JOIN tblJournalEntries je ON jl.EntryId = je.EntryId
        WHERE je.FiscalYearId = ?
        GROUP BY AccountCode
      ) balances ON a.AccountCode = balances.AccountCode
      WHERE a.Type IN ('CurrentAssets', 'NonCurrentAssets', 'CurrentDebit', 'NonCurrentDebit', 'Equity')
        AND a.IsActive = 1
      AND ABS(
        CASE 
          WHEN a.Nature = 'بدهكار' THEN COALESCE(balances.TotalDebit, 0) - COALESCE(balances.TotalCredit, 0)
          WHEN a.Nature = 'بستانكار' THEN COALESCE(balances.TotalCredit, 0) - COALESCE(balances.TotalDebit, 0)
          ELSE COALESCE(balances.TotalDebit, 0) - COALESCE(balances.TotalCredit, 0)
        END
      ) > 0.01
    `).get(sourceFiscalYear.FiscalYearId).count;
    
    // بررسی وجود سند اختتامیه
    const closingEntry = db.prepare(`
      SELECT EntryId, DocumentNumber, EntryDate 
      FROM tblJournalEntries 
      WHERE FiscalYearId = ? AND TypeDoc = 'اختتامیه'
      LIMIT 1
    `).get(sourceFiscalYear.FiscalYearId);
    
    const result = {
      success: true,
      status: existingOpening ? 'already_opened' : 'ready_to_open',
      sourceFiscalYear: {
        yearCode: sourceFiscalYear.YearCode.toString(),
        fiscalYearId: sourceFiscalYear.FiscalYearId,
        isActive: sourceFiscalYear.IsActive,
        isClosed: sourceFiscalYear.IsActive === 0
      },
      targetFiscalYear: targetFiscalYear ? {
        yearCode: targetFiscalYear.YearCode.toString(),
        fiscalYearId: targetFiscalYear.FiscalYearId,
        startDate: targetFiscalYear.StartDate,
        endDate: targetFiscalYear.EndDate,
        isActive: targetFiscalYear.IsActive,
        exists: true
      } : {
        yearCode: actualTargetYear,
        exists: false
      },
      steps: [
        {
          step: 1,
          title: 'بررسی سال مالی مبدأ',
          description: `سال مالی ${sourceYear} - ${sourceFiscalYear.IsActive === 0 ? 'بسته شده' : 'فعال'}`,
          status: sourceFiscalYear.IsActive === 0 ? 'completed' : 'pending',
          icon: 'check-circle'
        },
        {
          step: 2,
          title: 'بررسی سند اختتامیه',
          description: closingEntry ? 
            `سند اختتامیه شماره ${closingEntry.DocumentNumber}` : 
            'سال مبدأ باید بسته شده باشد',
          status: closingEntry ? 'completed' : 'pending',
          icon: 'file-text'
        },
        {
          step: 3,
          title: 'دریافت مانده حساب‌های دائمی',
          description: `${permanentAccountsCount} حساب با مانده یافت شد`,
          status: permanentAccountsCount > 0 ? 'completed' : 'pending',
          icon: 'database'
        },
        {
          step: 4,
          title: 'ایجاد سال مالی جدید',
          description: targetFiscalYear ? 
            `سال مالی ${targetFiscalYear.YearCode} موجود است` : 
            `ایجاد سال مالی ${actualTargetYear}`,
          status: targetFiscalYear ? 'completed' : 'pending',
          icon: 'calendar'
        },
        {
          step: 5,
          title: 'ایجاد سند افتتاحیه',
          description: existingOpening ? 
            `سند افتتاحیه شماره ${existingOpening.DocumentNumber}` : 
            'انتقال مانده حساب‌های دائمی به سال جدید',
          status: existingOpening ? 'completed' : 'pending',
          icon: 'file-plus'
        }
      ],
      requirements: {
        sourceClosed: sourceFiscalYear.IsActive === 0,
        hasClosingEntry: !!closingEntry,
        hasPermanentBalances: permanentAccountsCount > 0,
        permanentAccountsCount,
        targetExists: !!targetFiscalYear,
        alreadyOpened: !!existingOpening
      },
      existingOpening: existingOpening || null
    };
    
    logOperation('GET_OPENING_STEPS', sourceYear, actualTargetYear, null, {
      status: result.status,
      permanentAccountsCount
    });
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ خطا در دریافت مراحل افتتاحیه:', error);
    res.status(500).json({ 
      success: false,
      error: 'خطا در دریافت مراحل افتتاحیه',
      details: error.message 
    });
  }
});

// ✅ 5. ایجاد سال مالی جدید
router.post('/create-new-fiscal-year', (req, res) => {
  const { sourceYear, targetYear, startDate, endDate } = req.body;
  
  if (!sourceYear || !targetYear || !startDate || !endDate) {
    return res.status(400).json({
      success: false,
      error: 'اطلاعات سال مالی کامل نیست',
      required: ['sourceYear', 'targetYear', 'startDate', 'endDate']
    });
  }
  
  const transaction = db.transaction(() => {
    try {
      // بررسی تکراری نبودن سال مالی
      const existingYear = db.prepare(`
        SELECT * FROM tblFiscalYear WHERE YearCode = ?
      `).get(targetYear);
      
      if (existingYear) {
        throw new Error(`سال مالی ${targetYear} قبلاً تعریف شده است`);
      }
      
      // ایجاد سال مالی جدید
      const result = db.prepare(`
        INSERT INTO tblFiscalYear (
          YearCode,
          StartDate,
          EndDate,
          IsActive
        ) VALUES (?, ?, ?, 1)
      `).run(targetYear, startDate, endDate);
      
      const fiscalYearId = result.lastInsertRowid;
      
      console.log(`✅ سال مالی جدید ایجاد شد: ${targetYear} (ID: ${fiscalYearId})`);
      
      logOperation('CREATE_FISCAL_YEAR', sourceYear, targetYear, null, {
        fiscalYearId,
        startDate,
        endDate
      });
      
      return {
        success: true,
        fiscalYearId,
        yearCode: targetYear,
        startDate,
        endDate,
        isActive: 1,
        message: `سال مالی ${targetYear} با موفقیت ایجاد شد`
      };
      
    } catch (error) {
      console.error('❌ خطا در ایجاد سال مالی:', error.message);
      throw error;
    }
  });
  
  try {
    const result = transaction();
    res.json(result);
  } catch (error) {
    console.error('❌ خطا در ایجاد سال مالی:', error.message);
    res.status(500).json({ 
      success: false,
      error: error.message || 'خطا در ایجاد سال مالی',
      details: error.message 
    });
  }
});

// ✅ 6. ایجاد سند افتتاحیه - نسخه نهایی اصلاح شده
// ✅ 6. ایجاد سند افتتاحیه - نسخه نهایی با رفع مشکل صفر بودن مبالغ
// ✅ 6. ایجاد سند افتتاحیه - نسخه نهایی با دیباگ کامل
router.post('/create-opening-entry', (req, res) => {
  const { 
    sourceYear, 
    targetYear, 
    accounts, 
    summary 
  } = req.body;
  
  console.log('='.repeat(80));
  console.log('🔴 شروع فرآیند ایجاد سند افتتاحیه');
  console.log('='.repeat(80));
  
  if (!sourceYear || !targetYear) {
    console.log('❌ خطا: اطلاعات سال مالی ناقص');
    return res.status(400).json({ 
      success: false,
      error: 'اطلاعات سال مالی مبدأ و هدف الزامی است' 
    });
  }
  
  // نمایش دقیق داده‌های دریافتی
  console.log('📥 داده‌های دریافتی:');
  console.log(`   منبع: ${sourceYear} -> مقصد: ${targetYear}`);
  console.log(`   نوع accounts: ${typeof accounts}, آرایه است؟ ${Array.isArray(accounts)}`);
  
  if (accounts && Array.isArray(accounts)) {
    console.log(`   تعداد خطوط: ${accounts.length}`);
    
    // محاسبه مجموع
    let totalDebitCheck = 0;
    let totalCreditCheck = 0;
    
    accounts.forEach((line, idx) => {
      const debitRaw = line.DebitAmount;
      const creditRaw = line.CreditAmount;
      
      console.log(`   خط ${idx + 1}:`);
      console.log(`      کد حساب: ${line.AccountCode} (${typeof line.AccountCode})`);
      console.log(`      بدهکار خام: ${debitRaw} (${typeof debitRaw})`);
      console.log(`      بستانکار خام: ${creditRaw} (${typeof creditRaw})`);
      console.log(`      شرح: ${line.Description}`);
      
      // تبدیل به عدد
      const debit = parseFloat(debitRaw) || 0;
      const credit = parseFloat(creditRaw) || 0;
      
      totalDebitCheck += debit;
      totalCreditCheck += credit;
    });
    
    console.log(`   📊 مجموع حساب شده:`);
    console.log(`      کل بدهکار: ${totalDebitCheck.toLocaleString()}`);
    console.log(`      کل بستانکار: ${totalCreditCheck.toLocaleString()}`);
    console.log(`      اختلاف: ${(totalDebitCheck - totalCreditCheck).toLocaleString()}`);
    console.log(`      متوازن: ${Math.abs(totalDebitCheck - totalCreditCheck) < 1 ? '✅' : '❌'}`);
  } else {
    console.log('⚠️ accounts ارسال نشده یا معتبر نیست');
  }
  
  const transaction = db.transaction(() => {
    try {
      // 1. بررسی وجود سال مالی مبدأ
      const sourceYearInfo = db.prepare(`
        SELECT * FROM tblFiscalYear WHERE YearCode = ?
      `).get(sourceYear);
      
      if (!sourceYearInfo) {
        throw new Error(`سال مالی مبدأ ${sourceYear} یافت نشد`);
      }
      console.log(`✅ سال مبدأ یافت شد: ID=${sourceYearInfo.FiscalYearId}`);
      
      // 2. بررسی وجود سال مالی هدف
      const targetYearInfo = db.prepare(`
        SELECT * FROM tblFiscalYear WHERE YearCode = ?
      `).get(targetYear);
      
      if (!targetYearInfo) {
        throw new Error(`سال مالی هدف ${targetYear} یافت نشد`);
      }
      console.log(`✅ سال هدف یافت شد: ID=${targetYearInfo.FiscalYearId}`);
      
      // 3. بررسی وجود سند افتتاحیه قبلی
      const existingOpening = db.prepare(`
        SELECT EntryId FROM tblJournalEntries 
        WHERE FiscalYearId = ? AND TypeDoc = 'افتتاحيه'
      `).get(targetYearInfo.FiscalYearId);
      
      if (existingOpening) {
        throw new Error(`سال مالی ${targetYear} قبلاً افتتاح شده است (سند ${existingOpening.EntryId})`);
      }
      
      // 4. ایجاد شماره سند
      const date = new Date();
      const persianDate = new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(date).replace(/\//g, '');
      
      const docNumber = `OPN-${targetYear}-${persianDate}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
      console.log(`📄 شماره سند: ${docNumber}`);
      
      // 5. ایجاد سند افتتاحیه
      const entryDate = targetYearInfo.StartDate;
      
      const openingEntry = db.prepare(`
        INSERT INTO tblJournalEntries (
          DocumentNumber, 
          TypeDoc, 
          Description, 
          EntryDate, 
          IsBalanced, 
          SourceTable, 
          SourceId, 
          FiscalYearId, 
          IsAuto,
          CreatedAt
        ) VALUES (?, ?, ?, ?, 1, 'OPENING', ?, ?, 1, CURRENT_TIMESTAMP)
      `).run(
        docNumber,
        'افتتاحيه',
        `افتتاح حساب‌های سال مالی ${targetYear} بر اساس مانده پایان سال ${sourceYear}`,
        entryDate,
        sourceYearInfo.FiscalYearId,
        targetYearInfo.FiscalYearId
      );
      
      const openingEntryId = openingEntry.lastInsertRowid;
      console.log(`✅ سند افتتاحیه ایجاد شد: ID=${openingEntryId}`);
      
      // 6. بررسی و استفاده از حساب‌ها
      let accountsToUse = [];
      let totalDebit = 0;
      let totalCredit = 0;
      
      if (accounts && Array.isArray(accounts) && accounts.length > 0) {
        console.log('📝 استفاده از حساب‌های ارسالی فرانت‌اند');
        
        // تبدیل و ثبت هر خط
        accounts.forEach((line, index) => {
          // تبدیل به عدد با اطمینان
          const debitAmount = parseFloat(line.DebitAmount) || 0;
          const creditAmount = parseFloat(line.CreditAmount) || 0;
          
          console.log(`   ثبت خط ${index + 1}:`);
          console.log(`      AccountCode: ${line.AccountCode}`);
          console.log(`      DebitAmount: ${debitAmount} (نوع: ${typeof debitAmount})`);
          console.log(`      CreditAmount: ${creditAmount} (نوع: ${typeof creditAmount})`);
          
          // ثبت در دیتابیس
          const insertResult = db.prepare(`
            INSERT INTO tblJournalLines (
              EntryId, 
              AccountCode, 
              DebitAmount, 
              CreditAmount, 
              Description,
              SubsidiaryId
            ) VALUES (?, ?, ?, ?, ?, NULL)
          `).run(
            openingEntryId,
            line.AccountCode,
            debitAmount,
            creditAmount,
            line.Description || `مانده افتتاحیه حساب ${line.AccountCode}`
          );
          
          console.log(`      result: lastInsertRowid=${insertResult.lastInsertRowid}, changes=${insertResult.changes}`);
          
          totalDebit += debitAmount;
          totalCredit += creditAmount;
        });
        
        console.log(`📊 مجموع نهایی:`);
        console.log(`   کل بدهکار: ${totalDebit.toLocaleString()}`);
        console.log(`   کل بستانکار: ${totalCredit.toLocaleString()}`);
      } else {
        console.log('⚠️ حساب‌ایی ارسال نشده، استفاده از دیتابیس...');
        
        // دریافت از دیتابیس و ثبت
        const dbAccounts = db.prepare(`
          SELECT 
            a.AccountCode,
            a.TitleFa,
            a.Nature,
            a.Type,
            CASE 
              WHEN a.Nature = 'بدهكار' THEN COALESCE(SUM(jl.DebitAmount), 0) - COALESCE(SUM(jl.CreditAmount), 0)
              WHEN a.Nature = 'بستانكار' THEN COALESCE(SUM(jl.CreditAmount), 0) - COALESCE(SUM(jl.DebitAmount), 0)
              ELSE COALESCE(SUM(jl.DebitAmount), 0) - COALESCE(SUM(jl.CreditAmount), 0)
            END as Balance
          FROM tblAccounts a
          LEFT JOIN tblJournalLines jl ON a.AccountCode = jl.AccountCode
          LEFT JOIN tblJournalEntries je ON jl.EntryId = je.EntryId
            AND je.FiscalYearId = ?
          WHERE a.Type IN ('CurrentAssets', 'NonCurrentAssets', 'CurrentDebit', 'NonCurrentDebit', 'Equity')
            AND a.IsActive = 1
          GROUP BY a.AccountCode, a.TitleFa, a.Nature, a.Type
          HAVING ABS(Balance) > 0.01
        `).all(sourceYearInfo.FiscalYearId);
        
        console.log(`📊 تعداد حساب‌های دریافتی از دیتابیس: ${dbAccounts.length}`);
        
        dbAccounts.forEach(acc => {
          const balance = Math.abs(acc.Balance);
          const accountCode = acc.AccountCode?.toString() || '';
          
          const isContraAsset = 
            accountCode.startsWith('121') || 
            accountCode.startsWith('1211') ||
            (acc.Nature === 'بستانكار' && (acc.Type === 'Assets' || acc.Type === 'CurrentAssets' || acc.Type === 'NonCurrentAssets'));
          
          let debitAmount = 0;
          let creditAmount = 0;
          let description = '';
          
          if (isContraAsset) {
            debitAmount = 0;
            creditAmount = balance;
            description = `مانده افتتاحیه ${acc.TitleFa} (کاهنده دارایی)`;
          } else if (acc.Type === 'Assets' || acc.Type === 'CurrentAssets' || acc.Type === 'NonCurrentAssets') {
            debitAmount = balance;
            creditAmount = 0;
            description = `مانده افتتاحیه ${acc.TitleFa}`;
          } else {
            debitAmount = 0;
            creditAmount = balance;
            description = `مانده افتتاحیه ${acc.TitleFa}`;
          }
          
          db.prepare(`
            INSERT INTO tblJournalLines (
              EntryId, 
              AccountCode, 
              DebitAmount, 
              CreditAmount, 
              Description,
              SubsidiaryId
            ) VALUES (?, ?, ?, ?, ?, NULL)
          `).run(
            openingEntryId,
            acc.AccountCode,
            debitAmount,
            creditAmount,
            description
          );
          
          totalDebit += debitAmount;
          totalCredit += creditAmount;
        });
      }
      
      // 7. بررسی توازن نهایی
      const isBalanced = Math.abs(totalDebit - totalCredit) < 1;
      console.log(`📊 بررسی نهایی توازن:`);
      console.log(`   بدهکار: ${totalDebit.toLocaleString()}`);
      console.log(`   بستانکار: ${totalCredit.toLocaleString()}`);
      console.log(`   اختلاف: ${(totalDebit - totalCredit).toLocaleString()}`);
      console.log(`   وضعیت: ${isBalanced ? '✅ متوازن' : '❌ نامتوازن'}`);
      
      if (!isBalanced) {
        // پاک کردن سند در صورت نامتوازن
        db.prepare(`DELETE FROM tblJournalLines WHERE EntryId = ?`).run(openingEntryId);
        db.prepare(`DELETE FROM tblJournalEntries WHERE EntryId = ?`).run(openingEntryId);
        throw new Error(`سند افتتاحیه نامتوازن است (بدهکار: ${totalDebit.toLocaleString()}, بستانکار: ${totalCredit.toLocaleString()})`);
      }
      
      // 8. بروزرسانی سند به عنوان متوازن
      db.prepare(`
        UPDATE tblJournalEntries 
        SET IsBalanced = 1 
        WHERE EntryId = ?
      `).run(openingEntryId);
      
      // 9. فعال کردن سال مالی هدف
      db.prepare(`
        UPDATE tblFiscalYear 
        SET IsActive = 1
        WHERE FiscalYearId = ?
      `).run(targetYearInfo.FiscalYearId);
      
      console.log(`✅ سال مالی ${targetYear} فعال شد`);
      
      // 10. ثبت لاگ
      const operationDetails = {
        openingEntryId,
        documentNumber: docNumber,
        sourceYear,
        targetYear,
        linesCount: accountsToUse.length || accounts?.length || 0,
        totalDebit,
        totalCredit,
        isBalanced,
        usedFrontendData: !!(accounts && accounts.length > 0)
      };
      
      logOperation('CREATE_OPENING_ENTRY', sourceYear, targetYear, openingEntryId, operationDetails);
      
      console.log('='.repeat(80));
      console.log('✅ عملیات با موفقیت به پایان رسید');
      console.log('='.repeat(80));
      
      return {
        success: true,
        openingEntryId,
        documentNumber: docNumber,
        sourceYear,
        targetYear,
        entryDate,
        linesCount: accountsToUse.length || accounts?.length || 0,
        totals: {
          debit: totalDebit,
          credit: totalCredit,
          isBalanced
        },
        message: `✅ سند افتتاحیه سال مالی ${targetYear} با موفقیت ایجاد شد`
      };
      
    } catch (error) {
      console.error('❌ خطا در تراکنش:', error.message);
      throw error;
    }
  });
  
  try {
    const result = transaction();
    res.json(result);
  } catch (error) {
    console.error('❌ خطا در ایجاد سند افتتاحیه:', error.message);
    res.status(500).json({ 
      success: false,
      error: error.message || 'خطا در ایجاد سند افتتاحیه',
      details: error.message 
    });
  }
});

// ✅ 7. بررسی توازن حساب‌ها در سال هدف
router.get('/check-balance/:yearCode', (req, res) => {
  const { yearCode } = req.params;
  
  try {
    const fiscalYear = db.prepare(`
      SELECT * FROM tblFiscalYear WHERE YearCode = ?
    `).get(yearCode);
    
    if (!fiscalYear) {
      return res.status(404).json({ 
        success: false,
        error: `سال مالی ${yearCode} یافت نشد` 
      });
    }
    
    const totals = db.prepare(`
      SELECT 
        COALESCE(SUM(jl.DebitAmount), 0) as TotalDebit,
        COALESCE(SUM(jl.CreditAmount), 0) as TotalCredit,
        COUNT(DISTINCT je.EntryId) as EntryCount,
        COUNT(jl.LineId) as LineCount
      FROM tblJournalEntries je
      LEFT JOIN tblJournalLines jl ON je.EntryId = jl.EntryId
      WHERE je.FiscalYearId = ?
        AND je.IsDeleted = 0
    `).get(fiscalYear.FiscalYearId);
    
    const isBalanced = Math.abs(totals.TotalDebit - totals.TotalCredit) < 0.01;
    
    const openingEntry = db.prepare(`
      SELECT EntryId, DocumentNumber, EntryDate, Description
      FROM tblJournalEntries
      WHERE FiscalYearId = ? AND TypeDoc = 'افتتاحيه'
      LIMIT 1
    `).get(fiscalYear.FiscalYearId);
    
    const result = {
      success: true,
      fiscalYear: {
        yearCode: fiscalYear.YearCode.toString(),
        isActive: fiscalYear.IsActive
      },
      totals: {
        totalDebit: totals.TotalDebit,
        totalCredit: totals.TotalCredit,
        difference: Math.abs(totals.TotalDebit - totals.TotalCredit),
        isBalanced
      },
      statistics: {
        entryCount: totals.EntryCount,
        lineCount: totals.LineCount
      },
      openingEntry: openingEntry || null,
      message: isBalanced ? 
        '✅ مانده حساب‌ها متوازن است' : 
        '❌ مانده حساب‌ها نامتوازن است'
    };
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ خطا در بررسی توازن:', error);
    res.status(500).json({ 
      success: false,
      error: 'خطا در بررسی توازن حساب‌ها',
      details: error.message 
    });
  }
});

// ✅ 8. دریافت لاگ‌های عملیات افتتاحیه
router.get('/operation-logs', (req, res) => {
  try {
    const logs = db.prepare(`
      SELECT 
        LogId,
        SourceFiscalYear,
        TargetFiscalYear,
        OperationType,
        EntryId,
        Details,
        CreatedAt,
        CreatedBy
      FROM tblOpeningLogs
      ORDER BY CreatedAt DESC
      LIMIT 100
    `).all();
    
    const processedLogs = logs.map(log => ({
      ...log,
      Details: log.Details ? JSON.parse(log.Details) : null,
      CreatedAt: new Date(log.CreatedAt).toLocaleDateString('fa-IR')
    }));
    
    res.json({
      success: true,
      logs: processedLogs,
      totalLogs: processedLogs.length
    });
    
  } catch (error) {
    console.error('❌ خطا در دریافت لاگ‌ها:', error);
    res.status(500).json({ 
      success: false,
      error: 'خطا در دریافت لاگ‌های عملیات',
      details: error.message 
    });
  }
});

// ✅ 9. دریافت خلاصه وضعیت افتتاحیه
router.get('/opening-summary/:sourceYear', (req, res) => {
  const { sourceYear } = req.params;
  
  try {
    const sourceYearInfo = db.prepare(`
      SELECT * FROM tblFiscalYear WHERE YearCode = ?
    `).get(sourceYear);
    
    if (!sourceYearInfo) {
      return res.status(404).json({
        success: false,
        error: `سال مالی ${sourceYear} یافت نشد`
      });
    }
    
    const targetYear = (parseInt(sourceYear) + 1).toString();
    const targetYearInfo = db.prepare(`
      SELECT * FROM tblFiscalYear WHERE YearCode = ?
    `).get(targetYear);
    
    const closingEntry = db.prepare(`
      SELECT EntryId, DocumentNumber, EntryDate
      FROM tblJournalEntries
      WHERE FiscalYearId = ? AND TypeDoc = 'اختتامیه'
      LIMIT 1
    `).get(sourceYearInfo.FiscalYearId);
    
    let openingEntry = null;
    if (targetYearInfo) {
      openingEntry = db.prepare(`
        SELECT EntryId, DocumentNumber, EntryDate
        FROM tblJournalEntries
        WHERE FiscalYearId = ? AND TypeDoc = 'افتتاحيه'
        LIMIT 1
      `).get(targetYearInfo.FiscalYearId);
    }
    
    // دریافت مانده حساب‌های دائمی
    const permanentAccounts = db.prepare(`
      SELECT 
        a.Type,
        CASE 
          WHEN a.Nature = 'بدهكار' THEN COALESCE(SUM(jl.DebitAmount), 0) - COALESCE(SUM(jl.CreditAmount), 0)
          WHEN a.Nature = 'بستانكار' THEN COALESCE(SUM(jl.CreditAmount), 0) - COALESCE(SUM(jl.DebitAmount), 0)
          ELSE COALESCE(SUM(jl.DebitAmount), 0) - COALESCE(SUM(jl.CreditAmount), 0)
        END as Balance
      FROM tblAccounts a
      LEFT JOIN tblJournalLines jl ON a.AccountCode = jl.AccountCode
      LEFT JOIN tblJournalEntries je ON jl.EntryId = je.EntryId
        AND je.FiscalYearId = ?
      WHERE a.Type IN ('CurrentAssets', 'NonCurrentAssets', 'CurrentDebit', 'NonCurrentDebit', 'Equity')
        AND a.IsActive = 1
      GROUP BY a.Type, a.Nature
      HAVING ABS(Balance) > 0.01
    `).all(sourceYearInfo.FiscalYearId);
    
    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;
    let permanentAccountsCount = 0;
    
    permanentAccounts.forEach(acc => {
      permanentAccountsCount++;
      if (acc.Type === 'CurrentAssets' || acc.Type === 'NonCurrentAssets') {
        totalAssets += acc.Balance;
      }
      if (acc.Type === 'CurrentDebit' || acc.Type === 'NonCurrentDebit') {
        totalLiabilities += acc.Balance;
      }
      if (acc.Type === 'Equity') {
        totalEquity += acc.Balance;
      }
    });
    
    const isBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01;
    
    const result = {
      success: true,
      sourceYear: {
        yearCode: sourceYearInfo.YearCode.toString(),
        isActive: sourceYearInfo.IsActive,
        isClosed: sourceYearInfo.IsActive === 0,
        startDate: sourceYearInfo.StartDate,
        endDate: sourceYearInfo.EndDate
      },
      targetYear: targetYearInfo ? {
        yearCode: targetYearInfo.YearCode.toString(),
        isActive: targetYearInfo.IsActive,
        startDate: targetYearInfo.StartDate,
        endDate: targetYearInfo.EndDate,
        exists: true
      } : {
        yearCode: targetYear,
        exists: false
      },
      closingEntry: closingEntry || null,
      openingEntry: openingEntry || null,
      statistics: {
        permanentAccountsCount,
        totalAssets: Math.abs(totalAssets),
        totalLiabilities: Math.abs(totalLiabilities),
        totalEquity: Math.abs(totalEquity),
        isBalanced,
        balanceStatus: isBalanced ? '✅ متوازن' : '❌ نامتوازن'
      },
      status: {
        canOpen: sourceYearInfo.IsActive === 0 && !!closingEntry && !openingEntry && permanentAccountsCount > 0,
        isOpened: !!openingEntry,
        isReady: sourceYearInfo.IsActive === 0 && !!closingEntry && permanentAccountsCount > 0
      }
    };
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ خطا در دریافت خلاصه وضعیت:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در دریافت خلاصه وضعیت افتتاحیه',
      details: error.message
    });
  }
});

export default router;