import express from 'express';
import db from '../db.js';

const router = express.Router();

// ✅ ایجاد جدول لاگ اگر وجود ندارد
const initClosingLogsTable = () => {
  try {
    db.prepare(`
      CREATE TABLE IF NOT EXISTS tblClosingLogs (
        LogId INTEGER PRIMARY KEY AUTOINCREMENT,
        OperationType TEXT NOT NULL,
        FiscalYear TEXT NOT NULL,
        EntryId INTEGER,
        Details TEXT,
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        CreatedBy TEXT DEFAULT 'SYSTEM'
      )
    `).run();
    console.log('✅ جدول لاگ بستن حساب‌ها آماده است');
  } catch (error) {
    console.error('❌ خطا در ایجاد جدول لاگ:', error);
  }
};

initClosingLogsTable();

// ✅ تابع کمکی برای ثبت لاگ
const logOperation = (operationType, fiscalYear, entryId = null, details = '') => {
  try {
    db.prepare(`
      INSERT INTO tblClosingLogs (OperationType, FiscalYear, EntryId, Details)
      VALUES (?, ?, ?, ?)
    `).run(operationType, fiscalYear, entryId, JSON.stringify(details));
  } catch (error) {
    console.error('خطا در ثبت لاگ:', error);
  }
};

// ✅ 1. دریافت سال‌های مالی
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
          ELSE 'غیرفعال'
        END as StatusFa,
        (SELECT COUNT(*) FROM tblJournalEntries WHERE FiscalYearId = tf.FiscalYearId) as EntryCount
      FROM tblFiscalYear tf
      ORDER BY YearCode DESC
    `).all();
    
    const formattedYears = years.map(year => ({
      ...year,
      StartDate: year.StartDate,
      EndDate: year.EndDate,
      YearCode: year.YearCode.toString()
    }));
    
    logOperation('GET_FISCAL_YEARS', 'ALL', null, { count: formattedYears.length });
    res.json(formattedYears);
  } catch (error) {
    console.error('❌ خطا در دریافت سال‌های مالی:', error);
    res.status(500).json({ 
      error: 'خطا در دریافت سال‌های مالی',
      details: error.message 
    });
  }
});

// ✅ 2. بررسی شرایط بستن حساب‌ها
router.get('/check-closing-requirements/:year', (req, res) => {
  const { year } = req.params;
  
  try {
    const fiscalYear = db.prepare(`
      SELECT * FROM tblFiscalYear WHERE YearCode = ?
    `).get(year);
    
    if (!fiscalYear) {
      return res.status(404).json({ 
        canClose: false, 
        error: `سال مالی ${year} یافت نشد` 
      });
    }
    
    console.log(`🔍 بررسی شرایط بستن برای سال ${year}`);
    
    // پیدا کردن حساب سرمایه
    const capitalAccount = db.prepare(`
      SELECT AccountCode, TitleFa, Type, Nature
      FROM tblAccounts 
      WHERE Type = 'Equity'
        AND (AccountCode = '311001' OR AccountCode = '3110')
      LIMIT 1
    `).get();
    
    // بررسی وجود سند اختتامیه قبلی
    const existingClosing = db.prepare(`
      SELECT EntryId, DocumentNumber, EntryDate 
      FROM tblJournalEntries 
      WHERE FiscalYearId = ? AND TypeDoc = 'اختتامیه'
      LIMIT 1
    `).get(fiscalYear.FiscalYearId);
    
    // بررسی حساب‌های موقت
    const temporaryAccounts = db.prepare(`
      SELECT COUNT(*) as count
      FROM tblAccounts 
      WHERE Type IN ('Incomes', 'OperatingCost', 'NonOperatingCost', 'COSP')
    `).get();
    
    // بررسی مانده حساب‌های موقت
    const tempAccountsWithBalance = db.prepare(`
      SELECT COUNT(DISTINCT a.AccountCode) as count
      FROM tblAccounts a
      LEFT JOIN tblJournalLines jl ON a.AccountCode = jl.AccountCode
      LEFT JOIN tblJournalEntries je ON jl.EntryId = je.EntryId
        AND je.FiscalYearId = ?
      WHERE a.Type IN ('Incomes', 'OperatingCost', 'NonOperatingCost', 'COSP')
        AND (jl.DebitAmount > 0 OR jl.CreditAmount > 0)
    `).get(fiscalYear.FiscalYearId);
    
    const result = {
      canClose: !existingClosing && capitalAccount && tempAccountsWithBalance.count > 0,
      fiscalYear: fiscalYear.YearCode,
      fiscalYearId: fiscalYear.FiscalYearId,
      hasCapitalAccount: !!capitalAccount,
      capitalAccount: capitalAccount,
      alreadyClosed: !!existingClosing,
      existingClosing: existingClosing,
      hasTemporaryAccounts: temporaryAccounts.count > 0,
      temporaryAccountsCount: temporaryAccounts.count,
      tempAccountsWithBalance: tempAccountsWithBalance.count
    };
    
    console.log('✅ نتایج بررسی شرایط:');
    console.log(`  حساب سرمایه: ${result.hasCapitalAccount ? 'موجود' : 'یافت نشد'}`);
    console.log(`  قبلاً بسته شده: ${result.alreadyClosed}`);
    console.log(`  حساب‌های موقت: ${temporaryAccounts.count}`);
    console.log(`  حساب‌های موقت با مانده: ${tempAccountsWithBalance.count}`);
    console.log(`  می‌توان بست: ${result.canClose}`);
    
    logOperation('CHECK_CLOSING_REQUIREMENTS', year, null, result);
    res.json(result);
    
  } catch (error) {
    console.error('❌ خطا در بررسی شرایط:', error);
    res.status(500).json({ 
      error: 'خطا در بررسی شرایط بستن حساب‌ها',
      details: error.message 
    });
  }
});

// ✅ 3. دریافت حساب‌های موقت با مانده
// ✅ دریافت حساب‌های موقت با مانده (اصلاح شده)
// ✅ دریافت حساب‌های موقت با مانده (نسخه نهایی برای فرانت)
router.get('/temporary-accounts/:year', (req, res) => {
  const { year } = req.params;
  
  try {
    const fiscalYear = db.prepare(`
      SELECT * FROM tblFiscalYear WHERE YearCode = ?
    `).get(year);
    
    if (!fiscalYear) {
      return res.status(404).json({ 
        success: false,
        error: `سال مالی ${year} یافت نشد` 
      });
    }
    
    console.log(`🔍 دریافت حساب‌های موقت برای سال ${year}`);
    
    // کوئری ساده و واضح
    const query = `
      SELECT 
        a.AccountCode,
        a.TitleFa,
        a.Type,
        a.Nature,
        COALESCE(SUM(jl.DebitAmount), 0) as debit,
        COALESCE(SUM(jl.CreditAmount), 0) as credit
      FROM tblAccounts a
      LEFT JOIN tblJournalLines jl ON a.AccountCode = jl.AccountCode
      LEFT JOIN tblJournalEntries je ON jl.EntryId = je.EntryId
        AND je.FiscalYearId = ?
      WHERE a.Type IN ('Incomes', 'OperatingCost', 'NonOperatingCost', 'COSP')
      GROUP BY a.AccountCode, a.TitleFa, a.Type, a.Nature
      HAVING ABS(COALESCE(SUM(jl.DebitAmount), 0)) > 0.01 
         OR ABS(COALESCE(SUM(jl.CreditAmount), 0)) > 0.01
      ORDER BY a.Type, a.AccountCode
    `;
    
    const rawAccounts = db.prepare(query).all(fiscalYear.FiscalYearId);
    
    // پردازش داده‌ها
    const accounts = [];
    let totalCreditBalance = 0;  // مجموع بستانکار (درآمد)
    let totalDebitBalance = 0;   // مجموع بدهکار (هزینه)
    
    rawAccounts.forEach(acc => {
      const isIncome = acc.Type === 'Incomes';
      const balance = isIncome ? acc.credit - acc.debit : acc.debit - acc.credit;
      
      if (Math.abs(balance) > 0.01) {
        let balanceSide, balanceDisplay, closingOperation;
        
        if (isIncome) {
          if (balance > 0) {
            balanceSide = 'بستانکار';
            totalCreditBalance += balance;
            balanceDisplay = `${balance.toLocaleString('fa-IR')} ریال (بستانکار)`;
            closingOperation = 'بدهکار';
          } else {
            balanceSide = 'بدهکار';
            totalDebitBalance += Math.abs(balance);
            balanceDisplay = `${Math.abs(balance).toLocaleString('fa-IR')} ریال (بدهکار)`;
            closingOperation = 'بستانکار';
          }
        } else {
          if (balance > 0) {
            balanceSide = 'بدهکار';
            totalDebitBalance += balance;
            balanceDisplay = `${balance.toLocaleString('fa-IR')} ریال (بدهکار)`;
            closingOperation = 'بستانکار';
          } else {
            balanceSide = 'بستانکار';
            totalCreditBalance += Math.abs(balance);
            balanceDisplay = `${Math.abs(balance).toLocaleString('fa-IR')} ریال (بستانکار)`;
            closingOperation = 'بدهکار';
          }
        }
        
        accounts.push({
          AccountCode: acc.AccountCode,
          TitleFa: acc.TitleFa,
          Type: acc.Type,
          Nature: acc.Nature,
          debit: acc.debit,
          credit: acc.credit,
          balance: Math.abs(balance),
          balanceDisplay: balanceDisplay,
          balanceSide: balanceSide,
          closingOperation: closingOperation,
          closingAmount: Math.abs(balance)
        });
      }
    });
    
    // محاسبه سود و زیان
    const totalRevenue = accounts
      .filter(acc => acc.Type === 'Incomes' && acc.balanceSide === 'بستانکار')
      .reduce((sum, acc) => sum + acc.balance, 0);
    
    const totalExpense = accounts
      .filter(acc => acc.Type !== 'Incomes' && acc.balanceSide === 'بدهکار')
      .reduce((sum, acc) => sum + acc.balance, 0);
    
    const netProfitLoss = totalRevenue - totalExpense;
    
    // ساختار پاسخ نهایی
    const response = {
      success: true,
      accounts: accounts,
      totals: {
        totalAccounts: accounts.length,
        incomeAccounts: accounts.filter(acc => acc.Type === 'Incomes').length,
        expenseAccounts: accounts.filter(acc => acc.Type !== 'Incomes').length,
        totalCreditBalance: totalCreditBalance,  // مهم: مجموع مانده بستانکار
        totalDebitBalance: totalDebitBalance,    // مهم: مجموع مانده بدهکار
        accountsWithCreditBalance: accounts.filter(acc => acc.balanceSide === 'بستانکار').length,
        accountsWithDebitBalance: accounts.filter(acc => acc.balanceSide === 'بدهکار').length
      },
      profitLoss: {
        totalRevenue: totalRevenue,
        totalExpense: totalExpense,
        netProfitLoss: netProfitLoss,
        isProfit: netProfitLoss > 0,
        isLoss: netProfitLoss < 0,
        absoluteValue: Math.abs(netProfitLoss)
      },
      fiscalYear: {
        yearCode: fiscalYear.YearCode,
        yearName: `سال مالی ${fiscalYear.YearCode}`,
        startDate: fiscalYear.StartDate,
        endDate: fiscalYear.EndDate
      }
    };
    
    console.log('✅ پاسخ ارسالی به فرانت:');
    console.log(`  مجموع مانده بستانکار: ${totalCreditBalance.toLocaleString()}`);
    console.log(`  مجموع مانده بدهکار: ${totalDebitBalance.toLocaleString()}`);
    console.log(`  درآمد: ${totalRevenue.toLocaleString()}`);
    console.log(`  هزینه: ${totalExpense.toLocaleString()}`);
    console.log(`  سود: ${netProfitLoss.toLocaleString()}`);
    
    logOperation('GET_TEMPORARY_ACCOUNTS', year, null, {
      count: accounts.length,
      totalCreditBalance,
      totalDebitBalance,
      netProfitLoss
    });
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ خطا در دریافت حساب‌های موقت:', error);
    res.status(500).json({ 
      success: false,
      error: 'خطا در دریافت حساب‌های موقت',
      details: error.message
    });
  }
});

// ✅ 4. محاسبه سود و زیان
// ✅ 4. محاسبه سود و زیان - بهبود یافته
// ✅ 4. محاسبه سود و زیان
router.get('/calculate-profit-loss-detailed/:year', async (req, res) => {
  const { year } = req.params;
  
  try {
    console.log(`📊 درخواست محاسبه سود و زیان برای سال ${year}`);
    
    // 1. بررسی وجود سال مالی
    const fiscalYear = db.prepare(`
      SELECT * FROM tblFiscalYear WHERE YearCode = ?
    `).get(year);
    
    if (!fiscalYear) {
      return res.status(404).json({ 
        success: false,
        error: `سال مالی ${year} یافت نشد`,
        errorCode: 'FISCAL_YEAR_NOT_FOUND'
      });
    }
    
    console.log(`📅 سال مالی پیدا شد: ${fiscalYear.YearCode}`);
    
    // 2. محاسبه جزئیات حساب‌های موقت
    const detailQuery = `
      SELECT 
        a.AccountCode,
        a.TitleFa,
        a.Type,
        a.Nature,
        COALESCE(SUM(jl.DebitAmount), 0) as totalDebit,
        COALESCE(SUM(jl.CreditAmount), 0) as totalCredit,
        CASE 
          WHEN a.Type = 'Incomes' THEN COALESCE(SUM(jl.CreditAmount), 0) - COALESCE(SUM(jl.DebitAmount), 0)
          WHEN a.Type IN ('OperatingCost', 'NonOperatingCost', 'COSP') 
          THEN COALESCE(SUM(jl.DebitAmount), 0) - COALESCE(SUM(jl.CreditAmount), 0)
          ELSE 0
        END as netBalance
      FROM tblAccounts a
      LEFT JOIN tblJournalLines jl ON a.AccountCode = jl.AccountCode
      LEFT JOIN tblJournalEntries je ON jl.EntryId = je.EntryId
        AND je.FiscalYearId = ?
        AND je.IsDeleted = 0
      WHERE a.Type IN ('Incomes', 'OperatingCost', 'NonOperatingCost', 'COSP')
        AND a.Status = 'Active'
      GROUP BY a.AccountCode, a.TitleFa, a.Type, a.Nature
      HAVING ABS(
        CASE 
          WHEN a.Type = 'Incomes' THEN COALESCE(SUM(jl.CreditAmount), 0) - COALESCE(SUM(jl.DebitAmount), 0)
          WHEN a.Type IN ('OperatingCost', 'NonOperatingCost', 'COSP') 
          THEN COALESCE(SUM(jl.DebitAmount), 0) - COALESCE(SUM(jl.CreditAmount), 0)
          ELSE 0
        END
      ) > 0.01
      ORDER BY 
        CASE a.Type
          WHEN 'Incomes' THEN 1
          WHEN 'COSP' THEN 2
          WHEN 'OperatingCost' THEN 3
          WHEN 'NonOperatingCost' THEN 4
          ELSE 5
        END,
        a.AccountCode
    `;
    
    const details = db.prepare(detailQuery).all(fiscalYear.FiscalYearId);
    console.log(`🔍 ${details.length} حساب موقت با مانده یافت شد`);
    
    // 3. محاسبه مجموع‌ها
    let totalRevenue = 0;
    let totalExpense = 0;
    let revenueAccounts = 0;
    let expenseAccounts = 0;
    
    details.forEach(d => {
      if (d.Type === 'Incomes' && d.netBalance > 0) {
        totalRevenue += d.netBalance;
        revenueAccounts++;
      } else if (d.Type !== 'Incomes' && d.netBalance > 0) {
        totalExpense += d.netBalance;
        expenseAccounts++;
      }
    });
    
    const netProfitLoss = totalRevenue - totalExpense;
    
    // 4. یافتن حساب سرمایه
    const capitalAccount = db.prepare(`
      SELECT AccountCode, TitleFa, Type 
      FROM tblAccounts 
      WHERE Type = 'Equity' AND Status = 'Active'
      LIMIT 1
    `).get();
    
    console.log('📈 نتایج محاسبه:');
    console.log(`  درآمد کل: ${totalRevenue.toLocaleString()}`);
    console.log(`  هزینه کل: ${totalExpense.toLocaleString()}`);
    console.log(`  سود/زیان خالص: ${netProfitLoss.toLocaleString()}`);
    console.log(`  حساب سرمایه: ${capitalAccount ? capitalAccount.TitleFa : 'یافت نشد'}`);
    
    // 5. ساخت پاسخ
    const result = {
      success: true,
      fiscalYear: {
        yearCode: fiscalYear.YearCode,
        fiscalYearId: fiscalYear.FiscalYearId,
        startDate: fiscalYear.StartDate,
        endDate: fiscalYear.EndDate
      },
      capitalAccount: capitalAccount || null,
      details: {
        items: details,
        count: details.length,
        revenueAccounts,
        expenseAccounts
      },
      profitLoss: {
        totalRevenue,
        totalExpense,
        netProfitLoss,
        isProfit: netProfitLoss > 0,
        isLoss: netProfitLoss < 0,
        absoluteValue: Math.abs(netProfitLoss)
      },
      timestamp: new Date().toISOString(),
      calculationId: `calc_${fiscalYear.FiscalYearId}_${Date.now()}`
    };
    
    // اگر logOperation تعریف شده باشد
    if (typeof logOperation === 'function') {
      logOperation('CALCULATE_PROFIT_LOSS_DETAILED', year, null, {
        totalRevenue,
        totalExpense,
        netProfitLoss,
        detailCount: details.length,
        calculationId: result.calculationId
      });
    }
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ خطا در محاسبه سود و زیان:', error);
    
    const errorResponse = {
      success: false,
      error: 'خطا در محاسبه سود و زیان',
      errorCode: 'CALCULATION_ERROR',
      details: error.message,
      timestamp: new Date().toISOString(),
      suggestions: [
        'بررسی اتصال به پایگاه داده',
        'بررسی وجود سال مالی',
        'بررسی حساب‌های موقت'
      ]
    };
    
    res.status(500).json(errorResponse);
  }
});
// ✅ 5. دریافت مراحل بستن حساب
router.get('/closing-steps/:year', (req, res) => {
  const { year } = req.params;
  
  try {
    const fiscalYear = db.prepare(`
      SELECT * FROM tblFiscalYear WHERE YearCode = ?
    `).get(year);
    
    if (!fiscalYear) {
      return res.status(404).json({ 
        error: `سال مالی ${year} یافت نشد` 
      });
    }
    
    // بررسی وجود سند اختتامیه قبلی
    const existingClosing = db.prepare(`
      SELECT EntryId, DocumentNumber, EntryDate 
      FROM tblJournalEntries 
      WHERE FiscalYearId = ? AND TypeDoc = 'اختتامیه'
      LIMIT 1
    `).get(fiscalYear.FiscalYearId);
    
    if (existingClosing) {
      return res.json({
        status: 'already_closed',
        message: `سال مالی ${year} قبلاً بسته شده است`,
        closingEntryId: existingClosing.EntryId,
        documentNumber: existingClosing.DocumentNumber,
        entryDate: existingClosing.EntryDate
      });
    }
    
    // حساب سرمایه
    const capitalAccount = db.prepare(`
      SELECT AccountCode, TitleFa, Type, Nature
      FROM tblAccounts 
      WHERE Type = 'Equity'
        AND (AccountCode = '311001' OR AccountCode = '3110')
      LIMIT 1
    `).get();
    
    // دریافت حساب‌های موقت
    const temporaryAccountsQuery = `
      SELECT COUNT(*) as count
      FROM (
        SELECT a.AccountCode
        FROM tblAccounts a
        LEFT JOIN tblJournalLines jl ON a.AccountCode = jl.AccountCode
        LEFT JOIN tblJournalEntries je ON jl.EntryId = je.EntryId
          AND je.FiscalYearId = ?
        WHERE a.Type IN ('Incomes', 'OperatingCost', 'NonOperatingCost', 'COSP')
          AND (jl.DebitAmount > 0 OR jl.CreditAmount > 0)
        GROUP BY a.AccountCode
        HAVING ABS(
          CASE 
            WHEN a.Type = 'Incomes' THEN 
              COALESCE(SUM(jl.CreditAmount), 0) - COALESCE(SUM(jl.DebitAmount), 0)
            ELSE 
              COALESCE(SUM(jl.DebitAmount), 0) - COALESCE(SUM(jl.CreditAmount), 0)
          END
        ) > 0.01
      )
    `;
    
    const temporaryAccountsCount = db.prepare(temporaryAccountsQuery).get(fiscalYear.FiscalYearId).count;
    
    const formatNumber = (num) => {
      return new Intl.NumberFormat('fa-IR').format(Math.round(num));
    };
    
    const result = {
      status: 'ready_to_close',
      fiscalYear: {
        yearCode: fiscalYear.YearCode,
        fiscalYearId: fiscalYear.FiscalYearId,
        startDate: fiscalYear.StartDate,
        endDate: fiscalYear.EndDate,
        isActive: fiscalYear.IsActive
      },
      requirements: {
        hasCapitalAccount: !!capitalAccount,
        capitalAccount: capitalAccount,
        notAlreadyClosed: true,
        hasTemporaryAccounts: temporaryAccountsCount > 0
      },
      steps: [
        {
          step: 1,
          title: 'بررسی شرایط',
          description: 'بررسی سال مالی و حساب سرمایه',
          status: 'completed',
          icon: 'check'
        },
        {
          step: 2,
          title: 'بررسی حساب‌های موقت',
          description: `${temporaryAccountsCount} حساب موقت یافت شد`,
          status: 'completed',
          icon: 'file-text'
        },
        {
          step: 3,
          title: 'محاسبه سود و زیان',
          description: 'برای محاسبه سود و زیان روی دکمه محاسبه کلیک کنید',
          status: 'pending',
          icon: 'dollar-sign'
        },
        {
          step: 4,
          title: 'ایجاد سند اختتامیه',
          description: 'ایجاد سند بستن حساب‌ها',
          status: 'pending',
          icon: 'lock'
        },
        {
          step: 5,
          title: 'انتقال به حساب سرمایه',
          description: capitalAccount ? 
            `انتقال به ${capitalAccount.AccountCode} - ${capitalAccount.TitleFa}` : 
            'حساب سرمایه یافت نشد',
          status: 'pending',
          icon: 'refresh-cw'
        }
      ]
    };
    
    logOperation('GET_CLOSING_STEPS', year, null, {
      status: result.status,
      accountCount: temporaryAccountsCount
    });
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ خطا در دریافت مراحل:', error);
    res.status(500).json({ 
      success: false,
      error: 'خطا در دریافت مراحل بستن حساب',
      details: error.message 
    });
  }
});

// ✅ 6. بستن حساب‌های موقت
// ✅ 6. بستن حساب‌های موقت - اصلاح شده
router.post('/close-temporary-accounts', (req, res) => {
  const { fiscalYear, calculatedAccounts, profitLoss, capitalAccount } = req.body;
  
  if (!fiscalYear) {
    return res.status(400).json({ 
      success: false,
      error: 'سال مالی الزامی است' 
    });
  }
  
  const transaction = db.transaction(() => {
    try {
      // 1. بررسی شرایط
      const fiscalYearInfo = db.prepare(`
        SELECT * FROM tblFiscalYear WHERE YearCode = ?
      `).get(fiscalYear);
      
      if (!fiscalYearInfo) {
        throw new Error(`سال مالی ${fiscalYear} یافت نشد`);
      }
      
      console.log(`🔍 بستن حساب‌های موقت برای سال ${fiscalYear} (ID: ${fiscalYearInfo.FiscalYearId})`);
      
      // بررسی وجود سند اختتامیه قبلی
      const existingClosing = db.prepare(`
        SELECT EntryId FROM tblJournalEntries 
        WHERE FiscalYearId = ? AND TypeDoc = 'اختتامیه'
      `).get(fiscalYearInfo.FiscalYearId);
      
      if (existingClosing) {
        throw new Error(`حساب‌های سال ${fiscalYear} قبلاً بسته شده‌اند`);
      }
      
      // 2. اگر حساب‌های محاسبه شده ارسال شده، از آنها استفاده کن
      let revenueAccountsToClose = [];
      let expenseAccountsToClose = [];
      let totalRevenue = 0;
      let totalExpense = 0;
      let netProfitLoss = 0;
      let capitalAccountInfo = capitalAccount;
      
      if (calculatedAccounts && calculatedAccounts.length > 0) {
        // استفاده از حساب‌های محاسبه شده از فرانت
        calculatedAccounts.forEach(account => {
          const amount = account.calculatedAmount || account.finalBalance || 0;
          
          if (account.Type === 'درآمد' || account.Type === 'Incomes') {
            totalRevenue += amount;
            revenueAccountsToClose.push({
              AccountCode: account.AccountCode,
              TitleFa: account.TitleFa,
              Balance: amount,
              Operation: 'بدهکار'
            });
          } else {
            totalExpense += amount;
            expenseAccountsToClose.push({
              AccountCode: account.AccountCode,
              TitleFa: account.TitleFa,
              Balance: amount,
              Operation: 'بستانکار'
            });
          }
        });
        
        netProfitLoss = profitLoss?.netProfitLoss || (totalRevenue - totalExpense);
      } else {
        // محاسبه مجدد در سرور
        const accountsQuery = db.prepare(`
          WITH AccountBalances AS (
            SELECT 
              a.AccountCode,
              a.TitleFa,
              a.Type,
              a.Nature,
              COALESCE(SUM(jl.DebitAmount), 0) as debitTotal,
              COALESCE(SUM(jl.CreditAmount), 0) as creditTotal
            FROM tblAccounts a
            LEFT JOIN tblJournalLines jl ON a.AccountCode = jl.AccountCode
            LEFT JOIN tblJournalEntries je ON jl.EntryId = je.EntryId
              AND je.FiscalYearId = ?
            WHERE a.Type IN ('Incomes', 'OperatingCost', 'NonOperatingCost', 'COSP')
            GROUP BY a.AccountCode, a.TitleFa, a.Type, a.Nature
          )
          SELECT 
            AccountCode,
            TitleFa,
            Type,
            Nature,
            debitTotal,
            creditTotal,
            CASE 
              WHEN Type = 'Incomes' THEN creditTotal - debitTotal
              ELSE debitTotal - creditTotal
            END as CalculatedBalance
          FROM AccountBalances
          WHERE ABS(
            CASE 
              WHEN Type = 'Incomes' THEN creditTotal - debitTotal
              ELSE debitTotal - creditTotal
            END
          ) > 0.01
          ORDER BY Type, AccountCode
        `);
        
        const allAccounts = accountsQuery.all(fiscalYearInfo.FiscalYearId);
        
        allAccounts.forEach(account => {
          const balance = Math.abs(account.CalculatedBalance);
          
          if (account.Type === 'Incomes' && balance > 0.01) {
            totalRevenue += balance;
            revenueAccountsToClose.push({
              AccountCode: account.AccountCode,
              TitleFa: account.TitleFa,
              Balance: balance,
              Operation: 'بدهکار'
            });
          } else if (account.Type !== 'Incomes' && balance > 0.01) {
            totalExpense += balance;
            expenseAccountsToClose.push({
              AccountCode: account.AccountCode,
              TitleFa: account.TitleFa,
              Balance: balance,
              Operation: 'بستانکار'
            });
          }
        });
        
        netProfitLoss = totalRevenue - totalExpense;
      }
      
      console.log(`📊 آمار بستن حساب:`);
      console.log(`  - حساب‌های درآمد: ${revenueAccountsToClose.length} حساب, جمع: ${totalRevenue.toLocaleString()} ریال`);
      console.log(`  - حساب‌های هزینه: ${expenseAccountsToClose.length} حساب, جمع: ${totalExpense.toLocaleString()} ریال`);
      console.log(`  - سود/زیان خالص: ${netProfitLoss.toLocaleString()} ریال`);
      
      // 3. پیدا کردن حساب سرمایه (اگر از فرانت ارسال نشده)
      if (!capitalAccountInfo) {
        capitalAccountInfo = db.prepare(`
          SELECT AccountCode, TitleFa, Type, Nature
          FROM tblAccounts 
          WHERE (Type = 'Equity' OR Type = 'Equity')
            AND (AccountCode = '311001' OR AccountCode = '3110')
          LIMIT 1
        `).get();
      }
      
      if (!capitalAccountInfo) {
        throw new Error('حساب سرمایه (3110 یا 311001) در سیستم تعریف نشده است');
      }
      
      // 4. ایجاد شماره سند
      const date = new Date();
      const dateStr = `${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2,'0')}${date.getDate().toString().padStart(2,'0')}`;
      const docNumber = `CLS-${fiscalYear}-${dateStr}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
      
      // 5. ایجاد سند اختتامیه
      const closingEntry = db.prepare(`
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
        ) VALUES (?, ?, ?, DATE('now'), 1, 'CLOSING', NULL, ?, 1, CURRENT_TIMESTAMP)
      `).run(
        docNumber,
        'اختتامیه',
        `بستن حساب‌های موقت سال مالی ${fiscalYear} - سود/زیان: ${netProfitLoss.toLocaleString()} ریال`,
        fiscalYearInfo.FiscalYearId
      );
      
      const closingEntryId = closingEntry.lastInsertRowid;
      console.log(`📝 سند اختتامیه ایجاد شد: ID=${closingEntryId}, شماره=${docNumber}`);
      
      let totalDebit = 0;
      let totalCredit = 0;
      
      // 6. بستن حساب‌های درآمد (بدهکار کردن)
      revenueAccountsToClose.forEach(account => {
        const amount = account.Balance;
        db.prepare(`
          INSERT INTO tblJournalLines (
            EntryId, 
            AccountCode, 
            DebitAmount, 
            CreditAmount, 
            Description,
            SubsidiaryId
          ) VALUES (?, ?, ?, 0, ?, NULL)
        `).run(
          closingEntryId,
          account.AccountCode,
          amount,
          `بستن حساب درآمد ${account.TitleFa}`
        );
        totalDebit += amount;
        console.log(`  + بدهکار: ${account.AccountCode} - ${amount.toLocaleString()} ریال - ${account.TitleFa}`);
      });
      
      // 7. بستن حساب‌های هزینه (بستانکار کردن)
      expenseAccountsToClose.forEach(account => {
        const amount = account.Balance;
        db.prepare(`
          INSERT INTO tblJournalLines (
            EntryId, 
            AccountCode, 
            DebitAmount, 
            CreditAmount, 
            Description,
            SubsidiaryId
          ) VALUES (?, ?, 0, ?, ?, NULL)
        `).run(
          closingEntryId,
          account.AccountCode,
          amount,
          `بستن حساب هزینه ${account.TitleFa}`
        );
        totalCredit += amount;
        console.log(`  - بستانکار: ${account.AccountCode} - ${amount.toLocaleString()} ریال - ${account.TitleFa}`);
      });
      
      // 8. انتقال سود/زیان به حساب سرمایه
      if (Math.abs(netProfitLoss) > 0.01) {
        if (netProfitLoss > 0) {
          // سود: بستانکار کردن حساب سرمایه
          db.prepare(`
            INSERT INTO tblJournalLines (
              EntryId, 
              AccountCode, 
              DebitAmount, 
              CreditAmount, 
              Description,
              SubsidiaryId
            ) VALUES (?, ?, 0, ?, ?, NULL)
          `).run(
            closingEntryId,
            capitalAccountInfo.AccountCode,
            netProfitLoss,
            `انتقال سود سال ${fiscalYear} به حساب سرمایه`
          );
          totalCredit += netProfitLoss;
          console.log(`  💰 بستانکار (سود): ${capitalAccountInfo.AccountCode} - ${netProfitLoss.toLocaleString()} ریال - ${capitalAccountInfo.TitleFa}`);
        } else {
          // زیان: بدهکار کردن حساب سرمایه
          const lossAmount = Math.abs(netProfitLoss);
          db.prepare(`
            INSERT INTO tblJournalLines (
              EntryId, 
              AccountCode, 
              DebitAmount, 
              CreditAmount, 
              Description,
              SubsidiaryId
            ) VALUES (?, ?, ?, 0, ?, NULL)
          `).run(
            closingEntryId,
            capitalAccountInfo.AccountCode,
            lossAmount,
            `انتقال زیان سال ${fiscalYear} به حساب سرمایه`
          );
          totalDebit += lossAmount;
          console.log(`  💰 بدهکار (زیان): ${capitalAccountInfo.AccountCode} - ${lossAmount.toLocaleString()} ریال - ${capitalAccountInfo.TitleFa}`);
        }
      }
      
      // 9. بررسی توازن سند
      const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;
      console.log(`📊 توازن سند: بدهکار=${totalDebit.toLocaleString()}, بستانکار=${totalCredit.toLocaleString()}, ${isBalanced ? '✅ متوازن' : '❌ نامتوازن'}`);
      
      if (!isBalanced) {
        // اگر نامتوازن بود، سند را حذف کنیم
        db.prepare(`DELETE FROM tblJournalLines WHERE EntryId = ?`).run(closingEntryId);
        db.prepare(`DELETE FROM tblJournalEntries WHERE EntryId = ?`).run(closingEntryId);
        throw new Error(`سند اختتامیه نامتوازن است (بدهکار: ${totalDebit.toLocaleString()}, بستانکار: ${totalCredit.toLocaleString()})`);
      }
      
      // 10. بروزرسانی وضعیت سال مالی (غیرفعال کردن) - بدون ستون UpdatedAt
      db.prepare(`
        UPDATE tblFiscalYear 
        SET IsActive = 0
        WHERE FiscalYearId = ?
      `).run(fiscalYearInfo.FiscalYearId);
      
      console.log(`✅ سال مالی ${fiscalYear} غیرفعال شد`);
      
      // 11. ثبت لاگ
      const operationDetails = {
        closingEntryId,
        documentNumber: docNumber,
        fiscalYear,
        totalRevenue,
        totalExpense,
        netProfitLoss,
        revenueAccounts: revenueAccountsToClose.length,
        expenseAccounts: expenseAccountsToClose.length,
        totalDebit,
        totalCredit,
        isBalanced
      };
      
      try {
        logOperation('CLOSE_TEMPORARY_ACCOUNTS', fiscalYear, closingEntryId, operationDetails);
        console.log(`✅ لاگ عملیات ثبت شد`);
      } catch (logError) {
        console.error('⚠️ خطا در ثبت لاگ:', logError.message);
      }
      
      return {
        success: true,
        closingEntryId,
        documentNumber: docNumber,
        fiscalYear,
        netProfitLoss,
        absoluteProfitLoss: Math.abs(netProfitLoss),
        isProfit: netProfitLoss > 0,
        isLoss: netProfitLoss < 0,
        capitalAccount: {
          code: capitalAccountInfo.AccountCode,
          title: capitalAccountInfo.TitleFa
        },
        revenueAccounts: {
          count: revenueAccountsToClose.length,
          total: totalRevenue
        },
        expenseAccounts: {
          count: expenseAccountsToClose.length,
          total: totalExpense
        },
        totals: {
          debit: totalDebit,
          credit: totalCredit,
          isBalanced
        },
        message: netProfitLoss > 0 
          ? `✅ حساب‌های موقت با موفقیت بسته شدند. سود خالص: ${Math.abs(netProfitLoss).toLocaleString('fa-IR')} ریال`
          : netProfitLoss < 0
          ? `✅ حساب‌های موقت با موفقیت بسته شدند. زیان خالص: ${Math.abs(netProfitLoss).toLocaleString('fa-IR')} ریال`
          : `✅ حساب‌های موقت با موفقیت بسته شدند. سود و زیان صفر است.`
      };
      
    } catch (error) {
      console.error('❌ خطا در تراکنش بستن حساب‌ها:', error.message);
      throw error;
    }
  });
  
  try {
    const result = transaction();
    console.log('✅ عملیات بستن حساب‌ها با موفقیت انجام شد');
    res.json(result);
  } catch (error) {
    console.error('❌ خطا در بستن حساب‌ها:', error.message);
    res.status(500).json({ 
      success: false,
      error: error.message || 'خطا در بستن حساب‌ها',
      details: error.message
    });
  }
});
// ✅ 7. دریافت لاگ‌های عملیات
router.get('/operation-logs', (req, res) => {
  try {
    const logs = db.prepare(`
      SELECT 
        LogId,
        OperationType,
        FiscalYear,
        EntryId,
        Details,
        CreatedAt,
        CreatedBy
      FROM tblClosingLogs
      ORDER BY CreatedAt DESC
      LIMIT 100
    `).all();
    
    res.json({
      logs,
      totalLogs: logs.length
    });
    
  } catch (error) {
    console.error('❌ خطا در دریافت لاگ‌ها:', error);
    res.status(500).json({ 
      error: 'خطا در دریافت لاگ‌های عملیات',
      details: error.message 
    });
  }
});

export default router;