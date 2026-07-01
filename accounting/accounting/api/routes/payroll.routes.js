import express from 'express';
import db from '../db.js';

const router = express.Router();

/** Helpers */
const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const parsePeriodYear = (period) => {
  if (typeof period === 'string' && /^\d{4}-\d{2}$/.test(period)) {
    return toNumber(period.slice(0, 4));
  }
  return 1404;
};

/** تابع تولید شماره سند سریال */
function generateDocumentNumber() {
  try {
    // دریافت آخرین شماره سند معتبر
    const lastEntry = db.prepare(`
      SELECT DocumentNumber 
      FROM tblJournalEntries 
      WHERE DocumentNumber IS NOT NULL 
        AND DocumentNumber != ''
      ORDER BY EntryId DESC 
      LIMIT 1
    `).get();
    
    let nextNumber = 10000; // شماره شروع پیش‌فرض
    
    if (lastEntry && lastEntry.DocumentNumber) {
      // استخراج اعداد از رشته
      const numbers = lastEntry.DocumentNumber.match(/\d+/g);
      if (numbers && numbers.length > 0) {
        // تبدیل به عدد و پیدا کردن بزرگترین
        const nums = numbers.map(n => parseInt(n)).filter(n => !isNaN(n));
        if (nums.length > 0) {
          const maxNum = Math.max(...nums);
          if (maxNum >= 10000) {
            nextNumber = maxNum + 1;
          }
        }
      }
    }
    
    return nextNumber.toString(); // برگرداندن به صورت رشته
    
  } catch (error) {
    console.error('خطا در تولید شماره سند:', error);
    return '10000'; // مقدار پیش‌فرض در صورت خطا
  }
}

/** GET: لیست حقوق‌ها */
router.get('/', (req, res) => {
  try {
    const rows = db.prepare(`SELECT * FROM tblPayroll ORDER BY PayrollId DESC`).all();
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('❌ لیست حقوق‌ها:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/** GET: نرخ‌های پایه یک سال */
router.get('/base/:year', (req, res) => {
  try {
    const year = toNumber(req.params.year);
    const base = db.prepare(`SELECT * FROM tblPayrollBase WHERE Year = ?`).get(year);
    if (!base) {
      return res.status(404).json({ success: false, error: `نرخ‌های پایه برای سال ${year} یافت نشد` });
    }
    return res.json({ success: true, data: base });
  } catch (err) {
    console.error('❌ دریافت نرخ‌های پایه:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/** POST: محاسبه و ثبت حقوق */
router.post('/', (req, res) => {
  try {
    const {
      PersonnelCode,
      NationalCode,
      FullName,
      Period,
      PayDate,
      WorkDays,
      OvertimeHours,
      ChildrenCount,
      SeniorityYears,
      IsMarried,
    } = req.body;

    // اعتبارسنجی اولیه
    if (!PersonnelCode) return res.status(400).json({ success: false, error: 'کد پرسنل الزامی است' });
    if (!NationalCode) return res.status(400).json({ success: false, error: 'کد ملی الزامی است' });
    if (!FullName) return res.status(400).json({ success: false, error: 'نام پرسنل الزامی است' });
    if (!Period) return res.status(400).json({ success: false, error: 'دوره الزامی است' });

    const year = parsePeriodYear(Period);

    const base = db.prepare(`SELECT * FROM tblPayrollBase WHERE Year = ?`).get(year);
    if (!base) throw new Error(`مقادیر پایه حقوق برای سال ${year} تعریف نشده است`);

    // محاسبات
    const workDays = toNumber(WorkDays);
    const overtimeHours = toNumber(OvertimeHours);
    const childrenCount = toNumber(ChildrenCount);
    const seniorityYears = toNumber(SeniorityYears);
    const isMarried = toNumber(IsMarried) === 1;

    const BaseSalary = workDays * toNumber(base.DailyWage);
    const OvertimeAmount = overtimeHours * toNumber(base.OvertimeHourly);
    const SeniorityPay = seniorityYears > 0 ? workDays * toNumber(base.SeniorityDaily) : 0;
    const MarriageAllowance = isMarried ? toNumber(base.MarriageAllowance) : 0;
    const ChildAllowanceTotal = childrenCount * toNumber(base.ChildAllowance);

    const HousingAllowance = toNumber(base.HousingAllowance);
    const FoodAllowance = toNumber(base.FoodAllowance);

    const GrossSalary =
      BaseSalary +
      OvertimeAmount +
      SeniorityPay +
      HousingAllowance +
      FoodAllowance +
      MarriageAllowance +
      ChildAllowanceTotal;

    // بیمه و مالیات
    const InsuranceEmployee = Math.round(GrossSalary * 0.07);
    const InsuranceEmployer = Math.round(GrossSalary * 0.23);
    const TaxAmount = GrossSalary > 24000000 ? Math.round(GrossSalary * 0.10) : 0;

    const Deductions = InsuranceEmployee + TaxAmount;
    const NetSalary = GrossSalary - Deductions;

    // ذخیره در جدول
    const stmt = db.prepare(`
      INSERT INTO tblPayroll
      (PersonnelCode, NationalCode, FullName, Period, PayDate,
       WorkDays, OvertimeHours, ChildrenCount, SeniorityYears, IsMarried,
       BaseSalary, OvertimeAmount, SeniorityPay,
       HousingAllowance, FoodAllowance, ChildAllowanceTotal, MarriageAllowance,
       GrossSalary, InsuranceEmployee, InsuranceEmployer,
       TaxAmount, Deductions, NetSalary, IsPosted, DocNumber)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      PersonnelCode, NationalCode, FullName, Period, PayDate || null,
      workDays, overtimeHours, childrenCount, seniorityYears, isMarried ? 1 : 0,
      BaseSalary, OvertimeAmount, SeniorityPay,
      HousingAllowance, FoodAllowance, ChildAllowanceTotal, MarriageAllowance,
      GrossSalary, InsuranceEmployee, InsuranceEmployer,
      TaxAmount, Deductions, NetSalary,
      0, // IsPosted = 0 (هنوز سند صادر نشده)
      null // DocNumber = null (هنوز سند صادر نشده)
    );

    // خروجی کامل
    return res.json({
      success: true,
      payrollId: result.lastInsertRowid,
      message: 'حقوق محاسبه و ثبت شد',
      data: {
        PersonnelCode, NationalCode, FullName, Period, PayDate,
        WorkDays: workDays,
        OvertimeHours: overtimeHours,
        ChildrenCount: childrenCount,
        SeniorityYears: seniorityYears,
        IsMarried: isMarried ? 1 : 0,
        BaseSalary,
        OvertimeAmount,
        SeniorityPay,
        HousingAllowance,
        FoodAllowance,
        MarriageAllowance,
        ChildAllowanceTotal,
        GrossSalary,
        InsuranceEmployee,
        InsuranceEmployer,
        TaxAmount,
        Deductions,
        NetSalary,
        IsPosted: 0,
        DocNumber: null
      }
    });

  } catch (err) {
    console.error('❌ محاسبه/ثبت حقوق:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ➕ صدور سند حسابداری حقوق
router.post('/:id/generate-entry', (req, res) => {
  try {
    const payrollId = req.params.id;
    const payroll = db.prepare("SELECT * FROM tblPayroll WHERE PayrollId=?").get(payrollId);
    if (!payroll) return res.status(404).json({ success: false, error: "حقوق یافت نشد" });

    // بررسی اینکه آیا قبلاً سند صادر شده است
    if (payroll.IsPosted === 1) {
      return res.status(400).json({ 
        success: false, 
        error: "سند حسابداری برای این فیش حقوقی قبلاً صادر شده است" 
      });
    }

    const getSetting = db.prepare(`SELECT settingValue FROM tblSystemSettings WHERE settingKey = ?`);

    // 📑 حساب‌های هزینه حقوق (بدهکار)
    const accounts = {
      BaseSalary: getSetting.get('salaryBaseExpense')?.settingValue,
      OvertimeAmount: getSetting.get('overtimeExpense')?.settingValue,
      SeniorityPay: getSetting.get('seniorityExpense')?.settingValue,
      HousingAllowance: getSetting.get('housingExpense')?.settingValue,
      FoodAllowance: getSetting.get('foodExpense')?.settingValue,
      ChildAllowanceTotal: getSetting.get('childExpense')?.settingValue,
      MarriageAllowance: getSetting.get('attractionExpense')?.settingValue,
    };

    // 📑 حساب‌های پرداختنی (بستانکار)
    const creditAccSalary = getSetting.get('salaryPayable')?.settingValue;
    const creditAccTax = getSetting.get('salaryTaxPayable')?.settingValue;
    const creditAccInsurance = getSetting.get('employeeInsurancePayable')?.settingValue;

    if (!creditAccSalary || !creditAccTax || !creditAccInsurance) {
      throw new Error("حساب‌های پرداختنی حقوق در تنظیمات تعریف نشده‌اند");
    }

    // تولید شماره سند سریال
    const docNumber = generateDocumentNumber(); // ✅ اصلاح: فراخوانی تابع
    const description = `ثبت هزینه حقوق دوره ${payroll.Period} برای ${payroll.FullName}`;

    // ✅ افزودن TypeDoc = 'PAYROLL' به کوئری INSERT
    const entryInfo = db.prepare(`
      INSERT INTO tblJournalEntries 
      (DocumentNumber, Description, EntryDate, SourceTable, SourceId, IsBalanced, TypeDoc)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      docNumber, 
      description, 
      payroll.PayDate || new Date().toISOString().slice(0,10), 
      "tblPayroll", 
      payrollId, 
      1,
      "PAYROLL" // ✅ اضافه کردن نوع سند
    );

    const entryId = entryInfo.lastInsertRowid;

    // 🔄 بروزرسانی tblPayroll برای ثبت شماره سند و وضعیت IsPosted
    const updatePayroll = db.prepare(`
      UPDATE tblPayroll 
      SET DocNumber = ?, IsPosted = ?
      WHERE PayrollId = ?
    `);
    
    updatePayroll.run(docNumber, 1, payrollId);

    const insertLine = db.prepare(`
      INSERT INTO tblJournalLines (EntryId, AccountCode, DebitAmount, CreditAmount, SubsidiaryId)
      VALUES (?, ?, ?, ?, ?)
    `);

    // بدهکار: تک‌تک آیتم‌های حقوق
    for (const [field, acc] of Object.entries(accounts)) {
      const amount = payroll[field];
      if (acc && amount > 0) {
        insertLine.run(entryId, acc, amount, 0, null);
      }
    }

    // بستانکار: حقوق پرداختنی (خالص)
    insertLine.run(entryId, creditAccSalary, 0, payroll.NetSalary, null);

    // بستانکار: مالیات پرداختنی
    if (payroll.TaxAmount > 0) {
      insertLine.run(entryId, creditAccTax, 0, payroll.TaxAmount, null);
    }

    // بستانکار: بیمه پرداختنی
    if (payroll.InsuranceEmployee > 0) {
      insertLine.run(entryId, creditAccInsurance, 0, payroll.InsuranceEmployee, null);
    }

    res.json({ 
      success: true, 
      entryId, 
      documentNumber: docNumber,
      message: "سند حسابداری حقوق صادر شد",
      details: {
        payrollId,
        period: payroll.Period,
        fullName: payroll.FullName,
        netSalary: payroll.NetSalary,
        isPosted: 1,
        docNumber: docNumber
      }
    });
  } catch (err) {
    console.error("❌ خطا در صدور سند حقوق:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET: دریافت یک فیش حقوقی خاص
router.get('/:id', (req, res) => {
  try {
    const payrollId = req.params.id;
    const payroll = db.prepare("SELECT * FROM tblPayroll WHERE PayrollId=?").get(payrollId);
    
    if (!payroll) {
      return res.status(404).json({ success: false, error: "فیش حقوقی یافت نشد" });
    }
    
    return res.json({ success: true, data: payroll });
  } catch (err) {
    console.error('❌ دریافت فیش حقوقی:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;