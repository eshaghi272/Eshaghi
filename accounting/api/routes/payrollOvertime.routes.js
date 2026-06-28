// 📁 routes/payrollOvertime.routes.js
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

/** GET: لیست اضافه‌کاری‌ها */
router.get('/', (req, res) => {
  try {
    const { period, nationalCode, status } = req.query;
    
    let query = `
      SELECT 
        ot.*,
        p.firstName,
        p.lastName,
        pd.department,
        pd.jobTitle,
        pd.baseSalary as employeeBaseSalary
      FROM tblpayroll_overtime ot
      LEFT JOIN tblpersons p ON ot.nationalCode = p.nationalCode
      LEFT JOIN tblpayroll_details pd ON ot.nationalCode = pd.nationalCode
      WHERE 1=1
    `;
    
    const params = [];
    
    if (period) {
      query += ' AND ot.periodCode = ?';
      params.push(period);
    }
    
    if (nationalCode) {
      query += ' AND ot.nationalCode = ?';
      params.push(nationalCode);
    }
    
    if (status) {
      query += ' AND ot.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY ot.periodCode DESC, ot.createdAt DESC';
    
    const rows = db.prepare(query).all(...params);
    
    return res.json({ 
      success: true, 
      data: rows,
      count: rows.length
    });
    
  } catch (err) {
    console.error('❌ خطا در دریافت لیست اضافه‌کاری:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/** GET: اطلاعات یک اضافه‌کاری خاص */
router.get('/:id', (req, res) => {
  try {
    const overtimeId = req.params.id;
    
    const query = `
      SELECT 
        ot.*,
        p.firstName,
        p.lastName,
        pd.department,
        pd.jobTitle,
        pd.baseSalary as employeeBaseSalary
      FROM tblpayroll_overtime ot
      LEFT JOIN tblpersons p ON ot.nationalCode = p.nationalCode
      LEFT JOIN tblpayroll_details pd ON ot.nationalCode = pd.nationalCode
      WHERE ot.id = ?
    `;
    
    const overtime = db.prepare(query).get(overtimeId);
    
    if (!overtime) {
      return res.status(404).json({ 
        success: false, 
        error: 'رکورد اضافه‌کاری یافت نشد' 
      });
    }
    
    return res.json({ success: true, data: overtime });
    
  } catch (err) {
    console.error('❌ خطا در دریافت اطلاعات اضافه‌کاری:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/** GET: خلاصه اضافه‌کاری‌های یک دوره */
router.get('/summary/:period', (req, res) => {
  try {
    const period = req.params.period;
    
    const summary = db.prepare(`
      SELECT 
        COUNT(*) as recordCount,
        COUNT(DISTINCT nationalCode) as employeeCount,
        SUM(totalHours) as totalHours,
        SUM(totalAmount) as totalAmount,
        SUM(normalHours) as totalNormalHours,
        SUM(holidayHours) as totalHolidayHours,
        SUM(nightHours) as totalNightHours,
        SUM(normalAmount) as totalNormalAmount,
        SUM(holidayAmount) as totalHolidayAmount,
        SUM(nightAmount) as totalNightAmount,
        AVG(totalHours) as avgHoursPerEmployee,
        AVG(totalAmount) as avgAmountPerEmployee
      FROM tblpayroll_overtime
      WHERE periodCode = ?
    `).get(period);
    
    const byStatus = db.prepare(`
      SELECT 
        status,
        COUNT(*) as count,
        SUM(totalAmount) as totalAmount
      FROM tblpayroll_overtime
      WHERE periodCode = ?
      GROUP BY status
    `).all(period);
    
    const topEmployees = db.prepare(`
      SELECT 
        ot.nationalCode,
        p.firstName || ' ' || p.lastName as fullName,
        SUM(ot.totalHours) as totalHours,
        SUM(ot.totalAmount) as totalAmount
      FROM tblpayroll_overtime ot
      LEFT JOIN tblpersons p ON ot.nationalCode = p.nationalCode
      WHERE ot.periodCode = ?
      GROUP BY ot.nationalCode
      ORDER BY totalAmount DESC
      LIMIT 10
    `).all(period);
    
    return res.json({
      success: true,
      data: {
        period,
        summary,
        byStatus,
        topEmployees
      }
    });
    
  } catch (err) {
    console.error('❌ خطا در دریافت خلاصه اضافه‌کاری:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/** POST: ثبت گروهی اضافه‌کاری */
/** POST: ثبت گروهی اضافه‌کاری */
router.post('/bulk', (req, res) => {
  try {
    const {
      overtimeRecords,
      periodYear,
      periodMonth,
      periodCode,
      description,
      calculateDate
    } = req.body;
    
    console.log('📥 دریافت داده‌های اضافه‌کاری:', {
      recordCount: overtimeRecords?.length,
      periodCode,
      description,
      calculateDate
    });
    
    if (!overtimeRecords || overtimeRecords.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'لیست رکوردهای اضافه‌کاری الزامی است' 
      });
    }
    
    if (!periodCode && (!periodYear || !periodMonth)) {
      return res.status(400).json({ 
        success: false, 
        error: 'دوره اضافه‌کاری الزامی است' 
      });
    }
    
    const effectivePeriodCode = periodCode || `${periodYear}-${String(periodMonth).padStart(2, '0')}`;
    const currentDate = formatJalaliDate();
    
    // استفاده از تاریخ ارسالی یا تاریخ امروز
    const effectiveCalculateDate = calculateDate || currentDate;
    
    const results = [];
    const errors = [];
    
    for (const record of overtimeRecords) {
      try {
        const {
          nationalCode,
          normalHours = 0,
          holidayHours = 0,
          nightHours = 0,
          otherHours = 0,
          normalRate = 1.4,
          holidayRate = 2.0,
          nightRate = 1.75,
          otherRate = 1.0,
          notes = '',
          baseSalary: providedBaseSalary,
          hourlyRate: providedHourlyRate
        } = record;
        
        // بررسی وجود کارمند
        const employeeQuery = `
          SELECT 
            p.nationalCode,
            p.firstName,
            p.lastName,
            pd.baseSalary,
            pd.department,
            pd.jobTitle
          FROM tblpersons p
          LEFT JOIN tblpayroll_details pd ON p.nationalCode = pd.nationalCode
          WHERE p.nationalCode = ? AND p.isSalary = 1
        `;
        
        const employee = db.prepare(employeeQuery).get(nationalCode);
        
        if (!employee) {
          errors.push({
            nationalCode,
            error: 'کارمند یافت نشد یا حقوق‌بگیر نیست',
            success: false
          });
          continue;
        }
        
        // محاسبه حقوق پایه و نرخ ساعتی
        const baseSalary = providedBaseSalary || employee.baseSalary || 0;
        const hourlyRate = providedHourlyRate || (baseSalary / 30 / 8);
        
        // محاسبه مبالغ
        const normalAmount = Math.round(normalHours * hourlyRate * normalRate);
        const holidayAmount = Math.round(holidayHours * hourlyRate * holidayRate);
        const nightAmount = Math.round(nightHours * hourlyRate * nightRate);
        const otherAmount = Math.round(otherHours * hourlyRate * otherRate);
        
        const totalHours = normalHours + holidayHours + nightHours + otherHours;
        const totalAmount = normalAmount + holidayAmount + nightAmount + otherAmount;
        
        // بررسی وجود رکورد قبلی برای این دوره
        const existingQuery = `
          SELECT id FROM tblpayroll_overtime 
          WHERE nationalCode = ? AND periodCode = ?
        `;
        
        const existing = db.prepare(existingQuery).get(nationalCode, effectivePeriodCode);
        
        let result;
        if (existing) {
          // بروزرسانی رکورد موجود
          const updateStmt = db.prepare(`
            UPDATE tblpayroll_overtime SET
              normalHours = ?,
              holidayHours = ?,
              nightHours = ?,
              otherHours = ?,
              normalRate = ?,
              holidayRate = ?,
              nightRate = ?,
              otherRate = ?,
              baseSalary = ?,
              hourlyRate = ?,
              normalAmount = ?,
              holidayAmount = ?,
              nightAmount = ?,
              otherAmount = ?,
              totalHours = ?,
              totalAmount = ?,
              calculateDate = ?,
              notes = ?,
              updatedAt = ?,
              status = 'pending'
            WHERE id = ?
          `);
          
          result = updateStmt.run(
            normalHours,
            holidayHours,
            nightHours,
            otherHours,
            normalRate,
            holidayRate,
            nightRate,
            otherRate,
            baseSalary,
            hourlyRate,
            normalAmount,
            holidayAmount,
            nightAmount,
            otherAmount,
            totalHours,
            totalAmount,
            effectiveCalculateDate,
            notes || '',
            currentDate,
            existing.id
          );
          
        } else {
          // ایجاد رکورد جدید
          const insertStmt = db.prepare(`
            INSERT INTO tblpayroll_overtime (
              nationalCode, 
              periodYear, 
              periodMonth, 
              periodCode,
              normalHours, 
              holidayHours, 
              nightHours, 
              otherHours,
              normalRate, 
              holidayRate, 
              nightRate, 
              otherRate,
              baseSalary, 
              hourlyRate,
              normalAmount, 
              holidayAmount, 
              nightAmount, 
              otherAmount,
              totalHours, 
              totalAmount,
              status, 
              calculateDate, 
              description, 
              notes,
              submittedDate, 
              createdAt, 
              updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          
          const periodYearNum = parseInt(effectivePeriodCode.split('-')[0]);
          const periodMonthNum = parseInt(effectivePeriodCode.split('-')[1]);
          
          result = insertStmt.run(
            nationalCode,
            periodYearNum,
            periodMonthNum,
            effectivePeriodCode,
            normalHours,
            holidayHours,
            nightHours,
            otherHours,
            normalRate,
            holidayRate,
            nightRate,
            otherRate,
            baseSalary,
            hourlyRate,
            normalAmount,
            holidayAmount,
            nightAmount,
            otherAmount,
            totalHours,
            totalAmount,
            'pending',
            effectiveCalculateDate,
            description || 'ثبت گروهی اضافه‌کاری',
            notes || '',
            currentDate,
            currentDate,
            currentDate
          );
        }
        
        results.push({
          nationalCode,
          fullName: `${employee.firstName} ${employee.lastName}`,
          overtimeId: existing ? existing.id : result.lastInsertRowid,
          totalHours,
          totalAmount,
          calculateDate: effectiveCalculateDate,
          success: true
        });
        
      } catch (error) {
        console.error(`❌ خطا در ثبت اضافه‌کاری برای ${record.nationalCode}:`, error);
        errors.push({
          nationalCode: record.nationalCode,
          error: error.message,
          success: false
        });
      }
    }
    
    return res.json({
      success: true,
      message: `ثبت اضافه‌کاری برای ${results.length} کارمند با موفقیت انجام شد`,
      period: effectivePeriodCode,
      calculateDate: effectiveCalculateDate,
      results,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (err) {
    console.error('❌ خطا در ثبت گروهی اضافه‌کاری:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});
/** PUT: تغییر وضعیت اضافه‌کاری */
router.put('/:id/status', (req, res) => {
  try {
    const overtimeId = req.params.id;
    const { status, approvedBy, paymentDate, paymentMethod, notes } = req.body;
    
    if (!status) {
      return res.status(400).json({ 
        success: false, 
        error: 'وضعیت جدید الزامی است' 
      });
    }
    
    // بررسی وجود رکورد
    const overtime = db.prepare('SELECT * FROM tblpayroll_overtime WHERE id = ?').get(overtimeId);
    
    if (!overtime) {
      return res.status(404).json({ 
        success: false, 
        error: 'رکورد اضافه‌کاری یافت نشد' 
      });
    }
    
    const updateStmt = db.prepare(`
      UPDATE tblpayroll_overtime SET
        status = ?,
        approvedBy = ?,
        approvedDate = ?,
        paymentDate = ?,
        paymentMethod = ?,
        notes = ?,
        updatedAt = ?
      WHERE id = ?
    `);
    
    const approvedDate = status === 'approved' ? formatJalaliDate() : overtime.approvedDate;
    
    updateStmt.run(
      status,
      approvedBy || overtime.approvedBy,
      approvedDate,
      paymentDate || overtime.paymentDate,
      paymentMethod || overtime.paymentMethod,
      notes || overtime.notes,
      formatJalaliDate(),
      overtimeId
    );
    
    return res.json({
      success: true,
      message: `وضعیت اضافه‌کاری به "${status}" تغییر یافت`
    });
    
  } catch (err) {
    console.error('❌ خطا در تغییر وضعیت اضافه‌کاری:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/** POST: صدور سند حسابداری برای اضافه‌کاری */
router.post('/:id/generate-entry', (req, res) => {
  try {
    const overtimeId = req.params.id;
    
    // دریافت اطلاعات اضافه‌کاری
    const overtimeQuery = `
      SELECT ot.*, p.firstName, p.lastName
      FROM tblpayroll_overtime ot
      LEFT JOIN tblpersons p ON ot.nationalCode = p.nationalCode
      WHERE ot.id = ?
    `;
    
    const overtime = db.prepare(overtimeQuery).get(overtimeId);
    
    if (!overtime) {
      return res.status(404).json({ 
        success: false, 
        error: 'رکورد اضافه‌کاری یافت نشد' 
      });
    }
    
    // بررسی اینکه قبلاً سند صادر نشده باشد
    if (overtime.accountingEntryId) {
      return res.status(400).json({ 
        success: false, 
        error: 'برای این اضافه‌کاری قبلاً سند حسابداری صادر شده است' 
      });
    }
    
    // تابع تولید شماره سند
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
        
        let nextNumber = 20000; // شروع از 20000 برای اضافه‌کاری
        
        if (lastEntry && lastEntry.DocumentNumber) {
          const numbers = lastEntry.DocumentNumber.match(/\d+/g);
          if (numbers && numbers.length > 0) {
            const nums = numbers.map(n => parseInt(n)).filter(n => !isNaN(n));
            if (nums.length > 0) {
              const maxNum = Math.max(...nums);
              if (maxNum >= 20000) {
                nextNumber = maxNum + 1;
              }
            }
          }
        }
        
        return nextNumber.toString();
        
      } catch (error) {
        console.error('خطا در تولید شماره سند:', error);
        return '20000';
      }
    }
    
    // دریافت تنظیمات حساب‌ها
    const getSetting = db.prepare(`SELECT settingValue FROM tblSystemSettings WHERE settingKey = ?`);
    
    // حساب هزینه اضافه‌کاری
    const overtimeExpenseAccount = getSetting.get('overtimeExpense')?.settingValue;
    
    // حساب پرداختنی حقوق (یا حساب هزینه اضافه‌کاری خاص)
    const overtimePayableAccount = getSetting.get('overtimePayable')?.settingValue || 
                                  getSetting.get('salaryPayable')?.settingValue;
    
    if (!overtimeExpenseAccount || !overtimePayableAccount) {
      return res.status(400).json({ 
        success: false, 
        error: 'حساب‌های مربوط به اضافه‌کاری در تنظیمات تعریف نشده‌اند' 
      });
    }
    
    // تولید شماره سند
    const docNumber = generateDocumentNumber();
    const description = `ثبت هزینه اضافه‌کاری دوره ${overtime.periodCode} برای ${overtime.firstName} ${overtime.lastName}`;
    
    // ایجاد سند اصلی
    const entryInfo = db.prepare(`
      INSERT INTO tblJournalEntries 
      (DocumentNumber, Description, EntryDate, SourceTable, SourceId, IsBalanced, TypeDoc)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      docNumber, 
      description, 
      formatJalaliDate(), 
      "tblpayroll_overtime", 
      overtimeId, 
      1,
      "OVERTIME"
    );
    
    const entryId = entryInfo.lastInsertRowid;
    
    // بروزرسانی رکورد اضافه‌کاری با شماره سند
    db.prepare(`
      UPDATE tblpayroll_overtime 
      SET accountingEntryId = ?, accountingEntryDate = ?
      WHERE id = ?
    `).run(docNumber, formatJalaliDate(), overtimeId);
    
    // ثبت ردیف‌های سند
    const insertLine = db.prepare(`
      INSERT INTO tblJournalLines (EntryId, AccountCode, DebitAmount, CreditAmount, SubsidiaryId)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    // بدهکار: حساب هزینه اضافه‌کاری
    insertLine.run(entryId, overtimeExpenseAccount, overtime.totalAmount, 0, null);
    
    // بستانکار: حساب پرداختنی اضافه‌کاری
    insertLine.run(entryId, overtimePayableAccount, 0, overtime.totalAmount, null);
    
    return res.json({
      success: true,
      message: 'سند حسابداری اضافه‌کاری با موفقیت صادر شد',
      data: {
        entryId,
        documentNumber: docNumber,
        overtimeId: overtime.id,
        period: overtime.periodCode,
        amount: overtime.totalAmount,
        employeeName: `${overtime.firstName} ${overtime.lastName}`
      }
    });
    
  } catch (err) {
    console.error('❌ خطا در صدور سند حسابداری اضافه‌کاری:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/** DELETE: حذف رکورد اضافه‌کاری */
router.delete('/:id', (req, res) => {
  try {
    const overtimeId = req.params.id;
    
    // بررسی وجود رکورد
    const overtime = db.prepare('SELECT * FROM tblpayroll_overtime WHERE id = ?').get(overtimeId);
    
    if (!overtime) {
      return res.status(404).json({ 
        success: false, 
        error: 'رکورد اضافه‌کاری یافت نشد' 
      });
    }
    
    // بررسی وضعیت - اگر تایید شده یا پرداخت شده نباشد، اجازه حذف بده
    if (overtime.status === 'paid' || overtime.status === 'approved') {
      return res.status(400).json({ 
        success: false, 
        error: 'امکان حذف رکورد تایید شده یا پرداخت شده وجود ندارد' 
      });
    }
    
    const deleteStmt = db.prepare('DELETE FROM tblpayroll_overtime WHERE id = ?');
    const result = deleteStmt.run(overtimeId);
    
    return res.json({
      success: true,
      message: 'رکورد اضافه‌کاری با موفقیت حذف شد',
      deletedCount: result.changes
    });
    
  } catch (err) {
    console.error('❌ خطا در حذف رکورد اضافه‌کاری:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/** GET: دریافت لیست کارمندان برای انتخاب */
router.get('/employees/list', (req, res) => {
  try {
    const { department, activeOnly = true } = req.query;
    
    let query = `
      SELECT 
        p.nationalCode,
        p.firstName,
        p.lastName,
        pd.baseSalary,
        pd.department,
        pd.jobTitle,
        pd.hourlyRate,
        pd.isActive,
        pd.hireDate
      FROM tblpersons p
      LEFT JOIN tblpayroll_details pd ON p.nationalCode = pd.nationalCode
      WHERE p.isSalary = 1
    `;
    
    const params = [];
    
    if (activeOnly === 'true' || activeOnly === true) {
      query += ' AND pd.isActive = 1';
    }
    
    if (department) {
      query += ' AND pd.department = ?';
      params.push(department);
    }
    
    query += ' ORDER BY p.lastName, p.firstName';
    
    const rows = db.prepare(query).all(...params);
    
    // محاسبه حقوق ساعتی اگر موجود نباشد
    const processedRows = rows.map(emp => ({
      ...emp,
      calculatedHourlyRate: emp.hourlyRate || (emp.baseSalary / 30 / 8)
    }));
    
    return res.json({ 
      success: true, 
      data: processedRows,
      count: processedRows.length
    });
    
  } catch (err) {
    console.error('❌ خطا در دریافت لیست کارمندان:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;