// 📁 routes/payrollNew.js
import express from 'express';
import db from '../db.js';

const router = express.Router();

/** Helpers */
const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const formatJalaliDate = () => {
  const now = new Date();
  const jalali = new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now);
  return jalali.replace(/\//g, '/');
};

/** GET: لیست کارمندان حقوق‌بگیر */
router.get('/employees', (req, res) => {
  try {
    const query = `
      SELECT 
        p.id,
        p.nationalCode,
        p.firstName,
        p.lastName,
        p.phoneNumber,
        p.email,
        p.birthDate,
        p.gender,
        p.isSalary,
        pd.baseSalary,
        pd.department,
        pd.jobTitle,
        pd.hireDate,
        pd.isActive,
        pd.annualLeaveDays,
        pd.leaveBalance,
        pd.childrenCount,
        pd.seniorityYears,
        pd.isMarried
      FROM tblpersons p
      LEFT JOIN tblpayroll_details pd ON p.nationalCode = pd.nationalCode
      WHERE p.isSalary = 1
      ORDER BY p.lastName, p.firstName
    `;
    
    const rows = db.prepare(query).all();
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('❌ خطا در دریافت لیست کارمندان:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/** GET: تنظیمات سیستم حقوق */
router.get('/settings', (req, res) => {
  try {
    const settings = db.prepare(`
      SELECT * FROM tblpayroll_settings 
      WHERE isActive = 1 
      ORDER BY effectiveFrom DESC 
      LIMIT 1
    `).get();
    
    if (!settings) {
      // تنظیمات پیش‌فرض اگر وجود نداشت
      const defaultSettings = {
        id: 0,
        taxExemptionSingle: 50000000,
        taxExemptionMarried: 60000000,
        taxChildExemption: 2000000,
        insuranceEmployeePercent: 7.0,
        insuranceEmployerPercent: 23.0,
        insuranceBaseMin: 30000000,
        insuranceBaseMax: 300000000,
        housingAllowanceAmount: 15000000,
        foodAllowanceAmount: 5000000,
        transportationAllowanceAmount: 3000000,
        childAllowanceAmount: 2000000,
        marriageAllowanceAmount: 5000000,
        seniorityPercent: 1.0,
        seniorityMaxYears: 30,
        overtimeNormalRate: 1.4,
        overtimeHolidayRate: 2.0,
        overtimeNightRate: 1.75,
        annualLeaveDays: 26,
        sickLeaveDays: 14,
        workHoursPerDay: 8,
        workDaysPerMonth: 30,
        payrollDay: 1,
        description: 'تنظیمات پیش‌فرض سیستم',
        effectiveFrom: formatJalaliDate(),
        isActive: 1
      };
      return res.json({ success: true, data: defaultSettings });
    }
    
    return res.json({ success: true, data: settings });
  } catch (err) {
    console.error('❌ خطا در دریافت تنظیمات:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/** POST: ذخیره تنظیمات جدید */
router.post('/settings', (req, res) => {
  try {
    const {
      taxExemptionSingle,
      taxExemptionMarried,
      taxChildExemption,
      insuranceEmployeePercent,
      insuranceEmployerPercent,
      insuranceBaseMin,
      insuranceBaseMax,
      housingAllowanceAmount,
      foodAllowanceAmount,
      transportationAllowanceAmount,
      childAllowanceAmount,
      marriageAllowanceAmount,
      seniorityPercent,
      seniorityMaxYears,
      overtimeNormalRate,
      overtimeHolidayRate,
      overtimeNightRate,
      annualLeaveDays,
      sickLeaveDays,
      workHoursPerDay,
      workDaysPerMonth,
      payrollDay,
      description
    } = req.body;

    // غیرفعال کردن تنظیمات قبلی
    db.prepare(`UPDATE tblpayroll_settings SET isActive = 0 WHERE isActive = 1`).run();

    // ذخیره تنظیمات جدید
    const stmt = db.prepare(`
      INSERT INTO tblpayroll_settings (
        taxExemptionSingle, taxExemptionMarried, taxChildExemption,
        insuranceEmployeePercent, insuranceEmployerPercent, insuranceBaseMin, insuranceBaseMax,
        housingAllowanceAmount, foodAllowanceAmount, transportationAllowanceAmount,
        childAllowanceAmount, marriageAllowanceAmount,
        seniorityPercent, seniorityMaxYears,
        overtimeNormalRate, overtimeHolidayRate, overtimeNightRate,
        annualLeaveDays, sickLeaveDays,
        workHoursPerDay, workDaysPerMonth, payrollDay,
        description, effectiveFrom, isActive
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      toNumber(taxExemptionSingle),
      toNumber(taxExemptionMarried),
      toNumber(taxChildExemption),
      toNumber(insuranceEmployeePercent),
      toNumber(insuranceEmployerPercent),
      toNumber(insuranceBaseMin),
      toNumber(insuranceBaseMax),
      toNumber(housingAllowanceAmount),
      toNumber(foodAllowanceAmount),
      toNumber(transportationAllowanceAmount),
      toNumber(childAllowanceAmount),
      toNumber(marriageAllowanceAmount),
      toNumber(seniorityPercent),
      toNumber(seniorityMaxYears),
      toNumber(overtimeNormalRate),
      toNumber(overtimeHolidayRate),
      toNumber(overtimeNightRate),
      toNumber(annualLeaveDays),
      toNumber(sickLeaveDays),
      toNumber(workHoursPerDay),
      toNumber(workDaysPerMonth),
      toNumber(payrollDay),
      description || 'تنظیمات جدید سیستم حقوق',
      formatJalaliDate(),
      1
    );

    return res.json({
      success: true,
      message: 'تنظیمات جدید ذخیره شد',
      settingId: result.lastInsertRowid
    });

  } catch (err) {
    console.error('❌ خطا در ذخیره تنظیمات:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/** POST: محاسبه و ثبت حقوق برای چندین کارمند */
/** POST: محاسبه و ثبت حقوق برای چندین کارمند */
router.post('/calculate-bulk', (req, res) => {
  try {
    const {
      nationalCodes,
      periodYear,
      periodMonth,
      payDate,
      workDays,
      overtimeHours,
      commonSettings = {}
    } = req.body;

    if (!nationalCodes || nationalCodes.length === 0) {
      return res.status(400).json({ success: false, error: 'لیست کارمندان الزامی است' });
    }

    if (!periodYear || !periodMonth) {
      return res.status(400).json({ success: false, error: 'سال و ماه دوره الزامی است' });
    }

    const periodCode = `${periodYear}-${String(periodMonth).padStart(2, '0')}`;
    
    // بررسی تکراری نبودن دوره برای هر کارمند
    const placeholders = nationalCodes.map(() => '?').join(',');
    const existingPayrolls = db.prepare(`
      SELECT nationalCode FROM tblpayroll_monthly 
      WHERE nationalCode IN (${placeholders}) 
      AND periodCode = ?
    `).all(...nationalCodes, periodCode);

    if (existingPayrolls.length > 0) {
      return res.status(400).json({
        success: false,
        error: `برای دوره ${periodCode} حقوق ثبت شده است`,
        existingEmployees: existingPayrolls.map(p => p.nationalCode)
      });
    }

    // دریافت تنظیمات
    const settings = db.prepare(`
      SELECT * FROM tblpayroll_settings 
      WHERE isActive = 1 
      ORDER BY effectiveFrom DESC 
      LIMIT 1
    `).get();

    if (!settings) {
      return res.status(400).json({ success: false, error: 'تنظیمات سیستم یافت نشد' });
    }

    const results = [];
    const errors = [];

    // محاسبه حقوق برای هر کارمند
    for (const nationalCode of nationalCodes) {
      try {
        // دریافت اطلاعات کارمند
        const employeeQuery = `
          SELECT 
            p.nationalCode,
            p.firstName,
            p.lastName,
            pd.baseSalary,
            pd.childrenCount,
            pd.seniorityYears,
            pd.isMarried,
            pd.housingAllowance,
            pd.foodAllowance,
            pd.transportationAllowance,
            pd.overtimeRate,
            pd.seniorityPercent,
            pd.taxExemptionAmount
          FROM tblpersons p
          LEFT JOIN tblpayroll_details pd ON p.nationalCode = pd.nationalCode
          WHERE p.nationalCode = ? AND p.isSalary = 1
        `;

        const employee = db.prepare(employeeQuery).get(nationalCode);

        if (!employee) {
          errors.push({ nationalCode, error: 'کارمند یافت نشد یا حقوق‌بگیر نیست' });
          continue;
        }

        // محاسبات حقوق
        const effectiveWorkDays = commonSettings.workDays || workDays || 30;
        const effectiveOvertimeHours = commonSettings.overtimeHours || overtimeHours || 0;
        
        const dailyRate = employee.baseSalary / 30;
        const hourlyRate = dailyRate / 8;
        
        // محاسبه اضافه‌کاری
        const overtimeAmount = employee.overtimeRate 
          ? effectiveOvertimeHours * employee.overtimeRate 
          : effectiveOvertimeHours * hourlyRate * settings.overtimeNormalRate;
        
        // محاسبه سنوات
        const seniorityPercent = employee.seniorityPercent || settings.seniorityPercent;
        const maxSeniorityYears = Math.min(employee.seniorityYears || 0, settings.seniorityMaxYears);
        const seniorityAmount = (employee.baseSalary * seniorityPercent * maxSeniorityYears) / 100;
        
        // حق مسکن و خواربار
        const housingAllowance = employee.housingAllowance || settings.housingAllowanceAmount;
        const foodAllowance = employee.foodAllowance || settings.foodAllowanceAmount;
        const transportationAllowance = employee.transportationAllowance || settings.transportationAllowanceAmount;
        
        // حق اولاد
        const childAllowance = (employee.childrenCount || 0) * settings.childAllowanceAmount;
        
        // حق تأهل
        const marriageAllowance = (employee.isMarried === 1) ? settings.marriageAllowanceAmount : 0;
        
        // جمع حقوق ناخالص
        const grossSalary = employee.baseSalary + 
                          overtimeAmount + 
                          seniorityAmount + 
                          housingAllowance + 
                          foodAllowance + 
                          transportationAllowance + 
                          childAllowance + 
                          marriageAllowance;
        
        // محاسبه بیمه
        const insuranceBase = Math.min(
          Math.max(grossSalary, settings.insuranceBaseMin),
          settings.insuranceBaseMax
        );
        
        const insuranceEmployee = Math.round(insuranceBase * settings.insuranceEmployeePercent / 100);
        const insuranceEmployer = Math.round(insuranceBase * settings.insuranceEmployerPercent / 100);
        
        // محاسبه مالیات
        const taxExemption = employee.taxExemptionAmount || 
                           (employee.isMarried === 1 ? settings.taxExemptionMarried : settings.taxExemptionSingle) +
                           (employee.childrenCount || 0) * settings.taxChildExemption;
        
        const taxableIncome = Math.max(0, grossSalary - taxExemption);
        const taxAmount = taxableIncome > 0 ? Math.round(taxableIncome * 0.1) : 0;
        
        // کسر وام‌ها
        const loanDeductionsQuery = `
          SELECT SUM(monthlyInstallment) as totalLoan
          FROM tblpayroll_loans 
          WHERE nationalCode = ? AND loanStatus = 'active'
        `;
        const loanResult = db.prepare(loanDeductionsQuery).get(nationalCode);
        const loanDeductionAmount = loanResult?.totalLoan || 0;
        
        // کسورات کل
        const totalDeductions = insuranceEmployee + taxAmount + loanDeductionAmount;
        
        // حقوق خالص
        const netSalary = grossSalary - totalDeductions;
        
        // تاریخ جاری برای ایجاد و به‌روزرسانی
        const currentDate = new Date().toISOString().slice(0, 10);
        
        // درج در جدول حقوق ماهانه
        // ابتدا تعداد ستون‌ها را بررسی کنید
        const insertStmt = db.prepare(`
          INSERT INTO tblpayroll_monthly (
            nationalCode, periodYear, periodMonth, periodCode,
            workDays, actualWorkDays, overtimeHours,
            childrenCount, seniorityYears, isMarried,
            baseSalary, overtimeAmount, seniorityAmount,
            housingAllowanceAmount, foodAllowanceAmount, transportationAllowanceAmount,
            childAllowanceAmount, marriageAllowanceAmount, bonusAmount, otherAllowances,
            grossSalary, insuranceEmployee, insuranceEmployer,
            taxAmount, loanDeductionAmount, otherDeductionsAmount,
            totalDeductions, netSalary,
            payDate, paymentStatus, paymentMethod,
            createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        const result = insertStmt.run(
          nationalCode,
          periodYear,
          periodMonth,
          periodCode,
          effectiveWorkDays,
          effectiveWorkDays, // actualWorkDays
          effectiveOvertimeHours,
          employee.childrenCount || 0,
          employee.seniorityYears || 0,
          employee.isMarried || 0,
          employee.baseSalary,
          Math.round(overtimeAmount),
          Math.round(seniorityAmount),
          housingAllowance,
          foodAllowance,
          transportationAllowance,
          childAllowance,
          marriageAllowance,
          0, // bonusAmount
          0, // otherAllowances
          Math.round(grossSalary),
          insuranceEmployee,
          insuranceEmployer,
          taxAmount,
          loanDeductionAmount,
          0, // otherDeductionsAmount
          totalDeductions,
          Math.round(netSalary),
          payDate || currentDate,
          'pending',
          'bank',
          currentDate, // createdAt
          currentDate  // updatedAt
        );
        
        results.push({
          nationalCode,
          fullName: `${employee.firstName} ${employee.lastName}`,
          payrollId: result.lastInsertRowid,
          grossSalary: Math.round(grossSalary),
          netSalary: Math.round(netSalary),
          success: true
        });
        
      } catch (error) {
        console.error(`❌ خطا در محاسبه حقوق برای ${nationalCode}:`, error);
        errors.push({
          nationalCode,
          error: error.message,
          success: false
        });
      }
    }
    
    return res.json({
      success: true,
      message: `محاسبه حقوق برای ${results.length} کارمند با موفقیت انجام شد`,
      period: periodCode,
      results,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (err) {
    console.error('❌ خطا در محاسبه گروهی حقوق:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});
/** GET: لیست حقوق‌های ماهانه */
router.get('/monthly', (req, res) => {
  try {
    const { period, nationalCode, paymentStatus } = req.query;
    
    let query = `
      SELECT 
        pm.*,
        p.firstName,
        p.lastName,
        pd.department,
        pd.jobTitle
      FROM tblpayroll_monthly pm
      LEFT JOIN tblpersons p ON pm.nationalCode = p.nationalCode
      LEFT JOIN tblpayroll_details pd ON pm.nationalCode = pd.nationalCode
      WHERE 1=1
    `;
    
    const params = [];
    
    if (period) {
      query += ' AND pm.periodCode = ?';
      params.push(period);
    }
    
    if (nationalCode) {
      query += ' AND pm.nationalCode = ?';
      params.push(nationalCode);
    }
    
    if (paymentStatus) {
      query += ' AND pm.paymentStatus = ?';
      params.push(paymentStatus);
    }
    
    query += ' ORDER BY pm.periodCode DESC, p.lastName, p.firstName';
    
    const rows = db.prepare(query).all(...params);
    return res.json({ success: true, data: rows });
    
  } catch (err) {
    console.error('❌ خطا در دریافت لیست حقوق ماهانه:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/** GET: خلاصه حقوق‌های یک دوره */
router.get('/summary/:period', (req, res) => {
  try {
    const period = req.params.period;
    
    const summary = db.prepare(`
      SELECT 
        COUNT(*) as employeeCount,
        SUM(grossSalary) as totalGross,
        SUM(netSalary) as totalNet,
        SUM(insuranceEmployee) as totalInsuranceEmployee,
        SUM(insuranceEmployer) as totalInsuranceEmployer,
        SUM(taxAmount) as totalTax,
        SUM(loanDeductionAmount) as totalLoanDeductions,
        SUM(childAllowanceAmount) as totalChildAllowance,
        SUM(marriageAllowanceAmount) as totalMarriageAllowance,
        AVG(grossSalary) as avgGross,
        AVG(netSalary) as avgNet
      FROM tblpayroll_monthly
      WHERE periodCode = ?
    `).get(period);
    
    const details = db.prepare(`
      SELECT 
        paymentStatus,
        COUNT(*) as count,
        SUM(netSalary) as totalNet
      FROM tblpayroll_monthly
      WHERE periodCode = ?
      GROUP BY paymentStatus
    `).all(period);
    
    return res.json({
      success: true,
      data: {
        period,
        summary,
        details
      }
    });
    
  } catch (err) {
    console.error('❌ خطا در دریافت خلاصه حقوق:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/** PUT: تغییر وضعیت پرداخت */
router.put('/monthly/:id/status', (req, res) => {
  try {
    const payrollId = req.params.id;
    const { paymentStatus, payDate, paymentMethod } = req.body;
    
    if (!paymentStatus) {
      return res.status(400).json({ success: false, error: 'وضعیت پرداخت الزامی است' });
    }
    
    // بررسی وجود فیش حقوقی
    const payroll = db.prepare('SELECT * FROM tblpayroll_monthly WHERE id = ?').get(payrollId);
    if (!payroll) {
      return res.status(404).json({ success: false, error: 'فیش حقوقی یافت نشد' });
    }
    
    const updateStmt = db.prepare(`
      UPDATE tblpayroll_monthly 
      SET paymentStatus = ?, 
          payDate = ?,
          paymentMethod = ?,
          updatedAt = ?
      WHERE id = ?
    `);
    
    updateStmt.run(
      paymentStatus,
      payDate || formatJalaliDate(),
      paymentMethod || 'bank',
      formatJalaliDate(),
      payrollId
    );
    
    return res.json({
      success: true,
      message: `وضعیت پرداخت به ${paymentStatus} تغییر یافت`
    });
    
  } catch (err) {
    console.error('❌ خطا در تغییر وضعیت پرداخت:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/** GET: اطلاعات حقوقی یک کارمند */
router.get('/employee/:nationalCode', (req, res) => {
  try {
    const nationalCode = req.params.nationalCode;
    
    const employee = db.prepare(`
      SELECT 
        p.*,
        pd.*
      FROM tblpersons p
      LEFT JOIN tblpayroll_details pd ON p.nationalCode = pd.nationalCode
      WHERE p.nationalCode = ?
    `).get(nationalCode);
    
    if (!employee) {
      return res.status(404).json({ success: false, error: 'کارمند یافت نشد' });
    }
    
    // تاریخچه حقوق‌ها
    const payrollHistory = db.prepare(`
      SELECT * FROM tblpayroll_monthly 
      WHERE nationalCode = ? 
      ORDER BY periodCode DESC
      LIMIT 12
    `).all(nationalCode);
    
    // وام‌ها
    const loans = db.prepare(`
      SELECT * FROM tblpayroll_loans 
      WHERE nationalCode = ? 
      ORDER BY loanDate DESC
    `).all(nationalCode);
    
    // مرخصی‌ها
    const leaves = db.prepare(`
      SELECT * FROM tblpayroll_leaves 
      WHERE nationalCode = ? 
      ORDER BY startDate DESC
      LIMIT 10
    `).all(nationalCode);
    
    return res.json({
      success: true,
      data: {
        employee,
        payrollHistory,
        loans,
        leaves
      }
    });
    
  } catch (err) {
    console.error('❌ خطا در دریافت اطلاعات کارمند:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/** POST: صدور سند حسابداری برای فیش حقوقی */
router.post('/monthly/:id/generate-entry', (req, res) => {
  try {
    const payrollId = req.params.id;
    
    // دریافت فیش حقوقی
    const payroll = db.prepare(`
      SELECT pm.*, p.firstName, p.lastName
      FROM tblpayroll_monthly pm
      LEFT JOIN tblpersons p ON pm.nationalCode = p.nationalCode
      WHERE pm.id = ?
    `).get(payrollId);
    
    if (!payroll) {
      return res.status(404).json({ success: false, error: 'فیش حقوقی یافت نشد' });
    }
    
    // بررسی اینکه قبلاً سند صادر نشده باشد
    if (payroll.accountingEntryId) {
      return res.status(400).json({ 
        success: false, 
        error: 'برای این فیش حقوقی قبلاً سند حسابداری صادر شده است' 
      });
    }
    
    // تابع تولید شماره سند (مشابه قبلی)
    function generateDocumentNumber() {
      try {
        const lastEntry = db.prepare(`
          SELECT DocumentNumber 
          FROM tblJournalEntries 
          WHERE DocumentNumber IS NOT NULL 
            AND DocumentNumber != ''
          ORDER BY EntryId DESC 
          LIMIT 1
        `).get();
        
        let nextNumber = 10000;
        
        if (lastEntry && lastEntry.DocumentNumber) {
          const numbers = lastEntry.DocumentNumber.match(/\d+/g);
          if (numbers && numbers.length > 0) {
            const nums = numbers.map(n => parseInt(n)).filter(n => !isNaN(n));
            if (nums.length > 0) {
              const maxNum = Math.max(...nums);
              if (maxNum >= 10000) {
                nextNumber = maxNum + 1;
              }
            }
          }
        }
        
        return nextNumber.toString();
        
      } catch (error) {
        console.error('خطا در تولید شماره سند:', error);
        return '10000';
      }
    }
    
    // دریافت تنظیمات حساب‌ها
    const getSetting = db.prepare(`SELECT settingValue FROM tblSystemSettings WHERE settingKey = ?`);
    
    const accounts = {
      baseSalary: getSetting.get('salaryBaseExpense')?.settingValue,
      overtimeAmount: getSetting.get('overtimeExpense')?.settingValue,
      seniorityAmount: getSetting.get('seniorityExpense')?.settingValue,
      housingAllowanceAmount: getSetting.get('housingExpense')?.settingValue,
      foodAllowanceAmount: getSetting.get('foodExpense')?.settingValue,
      childAllowanceAmount: getSetting.get('childExpense')?.settingValue,
      marriageAllowanceAmount: getSetting.get('attractionExpense')?.settingValue,
    };
    
    const creditAccSalary = getSetting.get('salaryPayable')?.settingValue;
    const creditAccTax = getSetting.get('salaryTaxPayable')?.settingValue;
    const creditAccInsurance = getSetting.get('employeeInsurancePayable')?.settingValue;
    
    if (!creditAccSalary || !creditAccTax || !creditAccInsurance) {
      throw new Error("حساب‌های پرداختنی حقوق در تنظیمات تعریف نشده‌اند");
    }
    
    // تولید شماره سند
    const docNumber = generateDocumentNumber();
    const description = `ثبت هزینه حقوق دوره ${payroll.periodCode} برای ${payroll.firstName} ${payroll.lastName}`;
    
    // ایجاد سند اصلی
    const entryInfo = db.prepare(`
      INSERT INTO tblJournalEntries 
      (DocumentNumber, Description, EntryDate, SourceTable, SourceId, IsBalanced, TypeDoc)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      docNumber, 
      description, 
      payroll.payDate || formatJalaliDate(), 
      "tblpayroll_monthly", 
      payrollId, 
      1,
      "PAYROLL"
    );
    
    const entryId = entryInfo.lastInsertRowid;
    
    // بروزرسانی فیش حقوقی با شماره سند
    db.prepare(`
      UPDATE tblpayroll_monthly 
      SET accountingEntryId = ?, accountingEntryDate = ?
      WHERE id = ?
    `).run(docNumber, formatJalaliDate(), payrollId);
    
    // ثبت ردیف‌های سند
    const insertLine = db.prepare(`
      INSERT INTO tblJournalLines (EntryId, AccountCode, DebitAmount, CreditAmount, SubsidiaryId)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    // بدهکار: اقلام هزینه
    for (const [field, acc] of Object.entries(accounts)) {
      const amount = payroll[field];
      if (acc && amount > 0) {
        insertLine.run(entryId, acc, amount, 0, null);
      }
    }
    
    // بستانکار: حقوق پرداختنی (خالص)
    insertLine.run(entryId, creditAccSalary, 0, payroll.netSalary, null);
    
    // بستانکار: مالیات پرداختنی
    if (payroll.taxAmount > 0) {
      insertLine.run(entryId, creditAccTax, 0, payroll.taxAmount, null);
    }
    
    // بستانکار: بیمه پرداختنی
    if (payroll.insuranceEmployee > 0) {
      insertLine.run(entryId, creditAccInsurance, 0, payroll.insuranceEmployee, null);
    }
    
    return res.json({
      success: true,
      message: 'سند حسابداری با موفقیت صادر شد',
      data: {
        entryId,
        documentNumber: docNumber,
        payrollId: payroll.id,
        period: payroll.periodCode,
        employeeName: `${payroll.firstName} ${payroll.lastName}`
      }
    });
    
  } catch (err) {
    console.error('❌ خطا در صدور سند حسابداری:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/** POST: اضافه کردن اطلاعات حقوقی برای کارمند */
router.post('/employee/details', (req, res) => {
  try {
    const {
      nationalCode,
      baseSalary,
      department,
      jobTitle,
      hireDate,
      childrenCount,
      seniorityYears,
      isMarried,
      housingAllowance,
      foodAllowance,
      transportationAllowance,
      overtimeRate,
      seniorityPercent,
      taxExemptionAmount,
      bankName,
      bankAccount,
      shebaNumber,
      employmentType,
      jobGrade,
      annualLeaveDays
    } = req.body;
    
    if (!nationalCode) {
      return res.status(400).json({ success: false, error: 'کد ملی الزامی است' });
    }
    
    // بررسی وجود کارمند
    const person = db.prepare('SELECT * FROM tblpersons WHERE nationalCode = ?').get(nationalCode);
    if (!person) {
      return res.status(404).json({ success: false, error: 'کارمند یافت نشد' });
    }
    
    // بررسی وجود اطلاعات قبلی
    const existing = db.prepare('SELECT id FROM tblpayroll_details WHERE nationalCode = ?').get(nationalCode);
    
    let result;
    if (existing) {
      // بروزرسانی اطلاعات موجود
      const updateStmt = db.prepare(`
        UPDATE tblpayroll_details SET
          baseSalary = ?,
          dailyRate = ?,
          hourlyRate = ?,
          department = ?,
          jobTitle = ?,
          hireDate = ?,
          childrenCount = ?,
          seniorityYears = ?,
          isMarried = ?,
          housingAllowance = ?,
          foodAllowance = ?,
          transportationAllowance = ?,
          overtimeRate = ?,
          seniorityPercent = ?,
          taxExemptionAmount = ?,
          bankName = ?,
          bankAccount = ?,
          shebaNumber = ?,
          employmentType = ?,
          jobGrade = ?,
          annualLeaveDays = ?,
          leaveBalance = ?,
          updatedAt = ?,
          isActive = 1
        WHERE nationalCode = ?
      `);
      
      const dailyRate = toNumber(baseSalary) / 30;
      const hourlyRate = dailyRate / 8;
      
      result = updateStmt.run(
        toNumber(baseSalary),
        dailyRate,
        hourlyRate,
        department,
        jobTitle,
        hireDate,
        toNumber(childrenCount),
        toNumber(seniorityYears),
        toNumber(isMarried),
        toNumber(housingAllowance),
        toNumber(foodAllowance),
        toNumber(transportationAllowance),
        toNumber(overtimeRate),
        toNumber(seniorityPercent),
        toNumber(taxExemptionAmount),
        bankName,
        bankAccount,
        shebaNumber,
        employmentType || 'permanent',
        jobGrade,
        toNumber(annualLeaveDays) || 26,
        toNumber(annualLeaveDays) || 26,
        formatJalaliDate(),
        nationalCode
      );
      
    } else {
      // ایجاد اطلاعات جدید
      const insertStmt = db.prepare(`
        INSERT INTO tblpayroll_details (
          nationalCode, baseSalary, dailyRate, hourlyRate,
          department, jobTitle, hireDate,
          childrenCount, seniorityYears, isMarried,
          housingAllowance, foodAllowance, transportationAllowance,
          overtimeRate, seniorityPercent, taxExemptionAmount,
          bankName, bankAccount, shebaNumber,
          employmentType, jobGrade, annualLeaveDays, leaveBalance,
          isActive, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const dailyRate = toNumber(baseSalary) / 30;
      const hourlyRate = dailyRate / 8;
      
      result = insertStmt.run(
        nationalCode,
        toNumber(baseSalary),
        dailyRate,
        hourlyRate,
        department,
        jobTitle,
        hireDate,
        toNumber(childrenCount),
        toNumber(seniorityYears),
        toNumber(isMarried),
        toNumber(housingAllowance),
        toNumber(foodAllowance),
        toNumber(transportationAllowance),
        toNumber(overtimeRate),
        toNumber(seniorityPercent),
        toNumber(taxExemptionAmount),
        bankName,
        bankAccount,
        shebaNumber,
        employmentType || 'permanent',
        jobGrade,
        toNumber(annualLeaveDays) || 26,
        toNumber(annualLeaveDays) || 26,
        1,
        formatJalaliDate(),
        formatJalaliDate()
      );
    }
    
    // به‌روزرسانی وضعیت حقوق‌بگیر بودن در جدول persons
    db.prepare('UPDATE tblpersons SET isSalary = 1 WHERE nationalCode = ?').run(nationalCode);
    
    return res.json({
      success: true,
      message: existing ? 'اطلاعات حقوقی بروزرسانی شد' : 'اطلاعات حقوقی ایجاد شد',
      detailId: existing ? existing.id : result.lastInsertRowid,
      nationalCode
    });
    
  } catch (err) {
    console.error('❌ خطا در ذخیره اطلاعات حقوقی:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;