import express from 'express';
import db from '../db.js';

const router = express.Router();
const table = 'tblContactMessages';
const pk = 'id';

// 📥 دریافت همه پیام‌ها
router.get('/', (req, res) => {
  try {
    const rows = db.prepare(`SELECT * FROM ${table} ORDER BY createdAt DESC`).all();
    res.json(rows);
  } catch (err) {
    console.error('❌ خطا در دریافت پیام‌ها:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// 📥 دریافت یک پیام خاص
router.get('/:id', (req, res) => {
  try {
    const row = db.prepare(`SELECT * FROM ${table} WHERE ${pk} = ?`).get(req.params.id);
    res.json(row || {});
  } catch (err) {
    console.error('❌ خطا در دریافت پیام:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// ➕ ثبت پیام جدید
router.post('/', (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'نام، ایمیل و پیام الزامی هستند' });
    }

    const sql = `INSERT INTO ${table} (name, email, message) VALUES (?, ?, ?)`;
    const result = db.prepare(sql).run(name, email, message);
    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    console.error('❌ خطا در ثبت پیام:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✏️ پاسخ یا بروزرسانی پیام
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
    console.error('❌ خطا در بروزرسانی پیام:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🗑️ حذف پیام
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare(`DELETE FROM ${table} WHERE ${pk} = ?`).run(req.params.id);
    res.json({ deleted: result.changes });
  } catch (err) {
    console.error('❌ خطا در حذف پیام:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// 🔍 جستجوی شرطی پیام‌ها
router.post('/search', (req, res) => {
  try {
    const { where, params = [] } = req.body;
    const rows = db.prepare(`SELECT * FROM ${table} WHERE ${where} ORDER BY createdAt DESC`).all(...params);
    res.json(rows);
  } catch (err) {
    console.error('❌ خطا در جستجوی پیام‌ها:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

export default router;
