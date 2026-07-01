import express from 'express';
import db from '../db.js';

const router = express.Router();
const table = 'tblBankAccounts';
const pk = 'id';

// 📥 دریافت همه حساب‌های بانکی
router.get('/', (req, res) => {
  try {
    const rows = db.prepare(`SELECT * FROM ${table}`).all();
    res.json(rows);
  } catch (err) {
    console.error('❌ خطا در دریافت لیست حساب‌های بانکی:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// 📥 دریافت یک حساب بانکی خاص
router.get('/:id', (req, res) => {
  try {
    const row = db.prepare(`SELECT * FROM ${table} WHERE ${pk} = ?`).get(req.params.id);
    res.json(row || {});
  } catch (err) {
    console.error('❌ خطا در دریافت حساب بانکی:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// ➕ ثبت حساب بانکی جدید
router.post('/', (req, res) => {
  try {
    const data = req.body;
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');
    const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
    const result = db.prepare(sql).run(...values);
    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    console.error('❌ خطا در درج حساب بانکی:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✏️ بروزرسانی حساب بانکی
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
    console.error('❌ خطا در بروزرسانی حساب بانکی:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🗑️ حذف حساب بانکی
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare(`DELETE FROM ${table} WHERE ${pk} = ?`).run(req.params.id);
    res.json({ deleted: result.changes });
  } catch (err) {
    console.error('❌ خطا در حذف حساب بانکی:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// 🔍 جستجوی شرطی حساب‌های بانکی
router.post('/search', (req, res) => {
  try {
    const { where, params = [] } = req.body;
    const rows = db.prepare(`SELECT * FROM ${table} WHERE ${where}`).all(...params);
    res.json(rows);
  } catch (err) {
    console.error('❌ خطا در جستجوی حساب بانکی:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

export default router;
