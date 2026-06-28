import express from 'express';
import db from '../db.js';

const router = express.Router();
const table = 'tblCompanies';
const pk = 'id';

// 📥 دریافت همه شرکت‌ها
router.get('/', (req, res) => {
  try {
    const rows = db.prepare(`SELECT * FROM ${table} ORDER BY companyName`).all();
    res.json(rows);
  } catch (err) {
    console.error('❌ خطا در دریافت لیست شرکت‌ها:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// 📥 دریافت یک شرکت خاص
router.get('/:id', (req, res) => {
  try {
    const row = db.prepare(`SELECT * FROM ${table} WHERE ${pk} = ?`).get(req.params.id);
    res.json(row || {});
  } catch (err) {
    console.error('❌ خطا در دریافت شرکت:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// ➕ ثبت شرکت جدید
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
    console.error('❌ خطا در ثبت شرکت:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✏️ بروزرسانی شرکت
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
    console.error('❌ خطا در بروزرسانی شرکت:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🗑️ حذف شرکت
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare(`DELETE FROM ${table} WHERE ${pk} = ?`).run(req.params.id);
    res.json({ deleted: result.changes });
  } catch (err) {
    console.error('❌ خطا در حذف شرکت:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// 🔍 جستجوی شرطی شرکت‌ها
router.post('/search', (req, res) => {
  try {
    const { where, params = [] } = req.body;
    const rows = db.prepare(`SELECT * FROM ${table} WHERE ${where} ORDER BY companyName`).all(...params);
    res.json(rows);
  } catch (err) {
    console.error('❌ خطا در جستجوی شرکت‌ها:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

export default router;
