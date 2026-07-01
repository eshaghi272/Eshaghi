// routes/financialStatements.routes.js
import express from 'express';
import db from '../db.js';

const router = express.Router();

// دریافت صورت‌های مالی
router.get('/:yearCode', (req, res) => {
  const { yearCode } = req.params;
  const { period = 'yearly' } = req.query;
  
  try {
    // اطلاعات سال مالی
    const fiscalYear = db.prepare(`
      SELECT * FROM tblFiscalYear WHERE YearCode = ?
    `).get(yearCode);
    
    if (!fiscalYear) {
      return res.status(404).json({
        success: false,
        error: `سال مالی ${yearCode} یافت نشد`
      });
    }
    
    // ================ ترازنامه ================
    const balanceSheet = {
      currentAssets: [],
      nonCurrentAssets: [],
      accumulatedDepreciation: [],
      currentLiabilities: [],
      nonCurrentLiabilities: [],
      equity: [],
      totalCurrentAssets: 0,
      totalNonCurrentAssets: 0,
      totalAssets: 0,
      totalCurrentLiabilities: 0,
      totalNonCurrentLiabilities: 0,
      totalLiabilities: 0,
      totalEquity: 0
    };
    
    // دریافت مانده حساب‌ها
    const accounts = db.prepare(`
      SELECT 
        a.AccountCode,
        a.TitleFa,
        a.Type,
        a.Nature,
        COALESCE(SUM(jl.DebitAmount), 0) as TotalDebit,
        COALESCE(SUM(jl.CreditAmount), 0) as TotalCredit,
        CASE 
          WHEN a.Nature = 'بدهكار' 
          THEN COALESCE(SUM(jl.DebitAmount), 0) - COALESCE(SUM(jl.CreditAmount), 0)
          WHEN a.Nature = 'بستانكار'
          THEN COALESCE(SUM(jl.CreditAmount), 0) - COALESCE(SUM(jl.DebitAmount), 0)
          ELSE COALESCE(SUM(jl.DebitAmount), 0) - COALESCE(SUM(jl.CreditAmount), 0)
        END as Balance
      FROM tblAccounts a
      LEFT JOIN tblJournalLines jl ON a.AccountCode = jl.AccountCode
      LEFT JOIN tblJournalEntries je ON jl.EntryId = je.EntryId
        AND je.FiscalYearId = ?
      WHERE a.IsActive = 1
      GROUP BY a.AccountCode, a.TitleFa, a.Type, a.Nature
      HAVING ABS(Balance) > 0.01
      ORDER BY a.AccountCode
    `).all(fiscalYear.FiscalYearId);
    
    // دسته‌بندی حساب‌ها
    accounts.forEach(acc => {
      const balance = Math.abs(acc.Balance);
      const accountCode = acc.AccountCode.toString();
      
      // تشخیص حساب کاهنده دارایی
      const isContraAsset = 
        accountCode.startsWith('121') || 
        accountCode.startsWith('1211') ||
        (acc.Nature === 'بستانكار' && 
         (acc.Type === 'Assets' || acc.Type === 'CurrentAssets' || acc.Type === 'NonCurrentAssets'));
      
      const item = {
        code: acc.AccountCode,
        title: acc.TitleFa,
        balance: balance
      };
      
      if (isContraAsset) {
        balanceSheet.accumulatedDepreciation.push(item);
        balanceSheet.totalAssets -= balance;
      }
      else if (acc.Type === 'CurrentAssets') {
        balanceSheet.currentAssets.push(item);
        balanceSheet.totalCurrentAssets += balance;
        balanceSheet.totalAssets += balance;
      }
      else if (acc.Type === 'NonCurrentAssets') {
        balanceSheet.nonCurrentAssets.push(item);
        balanceSheet.totalNonCurrentAssets += balance;
        balanceSheet.totalAssets += balance;
      }
      else if (acc.Type === 'CurrentDebit') {
        balanceSheet.currentLiabilities.push(item);
        balanceSheet.totalCurrentLiabilities += balance;
        balanceSheet.totalLiabilities += balance;
      }
      else if (acc.Type === 'NonCurrentDebit') {
        balanceSheet.nonCurrentLiabilities.push(item);
        balanceSheet.totalNonCurrentLiabilities += balance;
        balanceSheet.totalLiabilities += balance;
      }
      else if (acc.Type === 'Equity') {
        balanceSheet.equity.push(item);
        balanceSheet.totalEquity += balance;
      }
    });
    
    // ================ صورت سود و زیان ================
    const incomeStatement = {
      revenues: [],
      expenses: [],
      totalRevenue: 0,
      totalExpenses: 0,
      costOfGoodsSold: 0,
      grossProfit: 0,
      netProfit: 0,
      grossProfitMargin: 0,
      netProfitMargin: 0,
      expenseToRevenueRatio: 0,
      returnOnSales: 0
    };
    
    // دریافت حساب‌های موقت
    const tempAccounts = db.prepare(`
      SELECT 
        a.AccountCode,
        a.TitleFa,
        a.Type,
        a.Nature,
        COALESCE(SUM(jl.CreditAmount), 0) - COALESCE(SUM(jl.DebitAmount), 0) as Balance
      FROM tblAccounts a
      LEFT JOIN tblJournalLines jl ON a.AccountCode = jl.AccountCode
      LEFT JOIN tblJournalEntries je ON jl.EntryId = je.EntryId
        AND je.FiscalYearId = ?
      WHERE a.Type IN ('Incomes', 'COSP', 'OperatingCost', 'NonOperatingCost')
        AND a.IsActive = 1
      GROUP BY a.AccountCode, a.TitleFa, a.Type, a.Nature
      HAVING ABS(Balance) > 0.01
    `).all(fiscalYear.FiscalYearId);
    
    tempAccounts.forEach(acc => {
      const balance = Math.abs(acc.Balance);
      
      if (acc.Type === 'Incomes') {
        incomeStatement.revenues.push({
          code: acc.AccountCode,
          title: acc.TitleFa,
          amount: balance
        });
        incomeStatement.totalRevenue += balance;
      }
      else if (acc.Type === 'COSP') {
        incomeStatement.costOfGoodsSold += balance;
      }
      else if (acc.Type === 'OperatingCost' || acc.Type === 'NonOperatingCost') {
        incomeStatement.expenses.push({
          code: acc.AccountCode,
          title: acc.TitleFa,
          amount: balance
        });
        incomeStatement.totalExpenses += balance;
      }
    });
    
    // محاسبات سود و زیان
    incomeStatement.grossProfit = incomeStatement.totalRevenue - incomeStatement.costOfGoodsSold;
    incomeStatement.netProfit = incomeStatement.grossProfit - incomeStatement.totalExpenses;
    
    // نسبت‌ها
    if (incomeStatement.totalRevenue > 0) {
      incomeStatement.grossProfitMargin = (incomeStatement.grossProfit / incomeStatement.totalRevenue) * 100;
      incomeStatement.netProfitMargin = (incomeStatement.netProfit / incomeStatement.totalRevenue) * 100;
      incomeStatement.expenseToRevenueRatio = (incomeStatement.totalExpenses / incomeStatement.totalRevenue) * 100;
      incomeStatement.returnOnSales = (incomeStatement.netProfit / incomeStatement.totalRevenue) * 100;
    }
    
    // ================ صورت جریان وجوه نقد ================
    const cashFlow = {
      operatingActivities: [],
      investingActivities: [],
      financingActivities: [],
      operatingCashFlow: 0,
      investingCashFlow: 0,
      financingCashFlow: 0,
      netCashFlow: 0,
      beginningCash: 0,
      endingCash: 0
    };
    
    // مانده نقد ابتدای دوره
    const prevYear = db.prepare(`
      SELECT * FROM tblFiscalYear 
      WHERE YearCode = ?
    `).get((parseInt(yearCode) - 1).toString());
    
    if (prevYear) {
      const beginningCashBalance = db.prepare(`
        SELECT 
          COALESCE(SUM(CASE WHEN a.Nature = 'بدهكار' THEN jl.DebitAmount - jl.CreditAmount END), 0) as Balance
        FROM tblJournalLines jl
        JOIN tblJournalEntries je ON jl.EntryId = je.EntryId
        JOIN tblAccounts a ON jl.AccountCode = a.AccountCode
        WHERE je.FiscalYearId = ? 
          AND a.AccountCode IN (111001, 111002, 111003, 111005)
      `).get(prevYear.FiscalYearId);
      
      cashFlow.beginningCash = beginningCashBalance?.Balance || 0;
    }
    
    // مانده نقد انتهای دوره
    const endingCashBalance = db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN a.Nature = 'بدهكار' THEN jl.DebitAmount - jl.CreditAmount END), 0) as Balance
      FROM tblJournalLines jl
      JOIN tblJournalEntries je ON jl.EntryId = je.EntryId
      JOIN tblAccounts a ON jl.AccountCode = a.AccountCode
      WHERE je.FiscalYearId = ? 
        AND a.AccountCode IN (111001, 111002, 111003, 111005)
    `).get(fiscalYear.FiscalYearId);
    
    cashFlow.endingCash = endingCashBalance?.Balance || 0;
    
    // محاسبه جریان‌های نقد (ساده شده)
    cashFlow.operatingCashFlow = incomeStatement.netProfit; // تقریبی
    cashFlow.investingCashFlow = 0;
    cashFlow.financingCashFlow = 0;
    cashFlow.netCashFlow = cashFlow.endingCash - cashFlow.beginningCash;
    
    res.json({
      success: true,
      fiscalYear: {
        code: fiscalYear.YearCode,
        startDate: fiscalYear.StartDate,
        endDate: fiscalYear.EndDate
      },
      balanceSheet,
      incomeStatement,
      cashFlow
    });
    
  } catch (error) {
    console.error('❌ خطا در دریافت صورت‌های مالی:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در دریافت صورت‌های مالی',
      details: error.message
    });
  }
});

export default router;