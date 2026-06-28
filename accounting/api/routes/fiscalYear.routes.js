// api/routes/fiscalYear.routes.js

import express from 'express';
import db from '../db.js';

const router = express.Router();

// ➕ تعریف سال مالی جدید
router.post('/', (req, res) => {
  try {
    const { YearCode, StartDate, EndDate } = req.body;
    if (!YearCode || !StartDate || !EndDate) {
      return res.status(400).json({ success: false, error: "اطلاعات ناقص است" });
    }

    const result = db.prepare(`
      INSERT INTO tblFiscalYear (YearCode, StartDate, EndDate, IsActive)
      VALUES (?, ?, ?, 0)
    `).run(YearCode, StartDate, EndDate);

    res.json({
      success: true,
      FiscalYearId: result.lastInsertRowid,
      message: "سال مالی جدید ثبت شد"
    });
  } catch (err) {
    console.error("❌ خطا در تعریف سال مالی:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ انتخاب سال مالی جاری
router.post('/:id/activate', (req, res) => {
  try {
    const fiscalYearId = req.params.id;

    db.prepare(`UPDATE tblFiscalYear SET IsActive=0`).run();
    const result = db.prepare(`UPDATE tblFiscalYear SET IsActive=1 WHERE FiscalYearId=?`).run(fiscalYearId);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: "سال مالی یافت نشد" });
    }

    res.json({ success: true, message: "سال مالی جاری انتخاب شد" });
  } catch (err) {
    console.error("❌ خطا در انتخاب سال مالی:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 📋 لیست سال‌های مالی
router.get('/', (req, res) => {
  try {
    const rows = db.prepare(`SELECT * FROM tblFiscalYear ORDER BY YearCode DESC`).all();
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("❌ خطا در دریافت لیست سال‌های مالی:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
