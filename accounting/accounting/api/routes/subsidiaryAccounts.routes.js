import express from 'express';
import db from '../db.js';

const router = express.Router();
const table = 'tblSubsidiaryAccounts';
const pk = 'SubsidiaryId';

// 📥 دریافت همه حساب‌های تفصیل
router.get('/', (req, res) => {
  try {
    const rows = db.prepare(`SELECT * FROM ${table} ORDER BY SubsidiaryCode`).all();
    res.json(rows);
  } catch (err) {
    console.error('❌ خطا در دریافت لیست حساب‌های تفصیل:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// 📥 دریافت یک حساب تفصیل خاص
router.get('/:id', (req, res) => {
  try {
    const row = db.prepare(`SELECT * FROM ${table} WHERE ${pk} = ?`).get(req.params.id);
    res.json(row || {});
  } catch (err) {
    console.error('❌ خطا در دریافت حساب تفصیل:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// ➕ ثبت حساب تفصیل جدید
router.post('/', (req, res) => {
  try {
    const { AccountCode, SubsidiaryCode, SubsidiaryName } = req.body;
    if (!AccountCode || !SubsidiaryCode || !SubsidiaryName) {
      return res.status(400).json({ error: 'کد حساب، کد تفصیل و نام تفصیل الزامی هستند' });
    }

    const sql = `
      INSERT INTO ${table} (AccountCode, SubsidiaryCode, SubsidiaryName)
      VALUES (?, ?, ?)
    `;
    const result = db.prepare(sql).run(AccountCode, SubsidiaryCode, SubsidiaryName);
    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    console.error('❌ خطا در ثبت حساب تفصیل:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✏️ بروزرسانی حساب تفصیل
router.put('/:id', (req, res) => {
  try {
    const data = req.body;
    const keys = Object.keys(data);
    const fields = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => data[k]);
    const sql = `UPDATE ${table} SET ${fields} WHERE ${pk} = ?`;
    const result = db.prepare(sql).run(...values, req.params.id);
    res.json({ success: true, changes: result.changes });
  } catch (err) {
    console.error('❌ خطا در بروزرسانی حساب تفصیل:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🗑️ حذف حساب تفصیل
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare(`DELETE FROM ${table} WHERE ${pk} = ?`).run(req.params.id);
    res.json({ deleted: result.changes });
  } catch (err) {
    console.error('❌ خطا در حذف حساب تفصیل:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// 🔍 جستجوی شرطی حساب‌های تفصیل
router.post('/search', (req, res) => {
  try {
    const { where, params = [] } = req.body;
    const rows = db.prepare(`SELECT * FROM ${table} WHERE ${where} ORDER BY SubsidiaryCode`).all(...params);
    res.json(rows);
  } catch (err) {
    console.error('❌ خطا در جستجوی حساب‌های تفصیل:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

export default router;
