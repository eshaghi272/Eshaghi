import express from 'express';
import db from '../db.js';

const router = express.Router();
const table = 'tblSystemSettings';
const pk = 'settingKey';

// 📥 دریافت همه تنظیمات
router.get('/', (req, res) => {
  try {
    const rows = db.prepare(`SELECT * FROM ${table} ORDER BY ${pk}`).all();
    res.json(rows);
  } catch (err) {
    console.error('❌ خطا در دریافت تنظیمات:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// 📥 دریافت یک تنظیم خاص
router.get('/:key', (req, res) => {
  try {
    const row = db.prepare(`SELECT * FROM ${table} WHERE ${pk} = ?`).get(req.params.key);
    res.json(row || {});
  } catch (err) {
    console.error('❌ خطا در دریافت تنظیم:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// ➕ ثبت تنظیم جدید
router.post('/', (req, res) => {
  try {
    const { settingKey, settingValue } = req.body;
    if (!settingKey) return res.status(400).json({ error: 'کلید تنظیم الزامی است' });

    const sql = `INSERT INTO ${table} (${pk}, settingValue) VALUES (?, ?)`;
    const result = db.prepare(sql).run(settingKey, settingValue);
    res.json({ key: settingKey });
  } catch (err) {
    console.error('❌ خطا در ثبت تنظیم:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✏️ بروزرسانی تنظیم
router.put('/:key', (req, res) => {
  try {
    const { settingValue } = req.body;
    const sql = `UPDATE ${table} SET settingValue = ? WHERE ${pk} = ?`;
    const result = db.prepare(sql).run(settingValue, req.params.key);
    res.json({ success: true, changes: result.changes });
  } catch (err) {
    console.error('❌ خطا در بروزرسانی تنظیم:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🗑️ حذف تنظیم
router.delete('/:key', (req, res) => {
  try {
    const result = db.prepare(`DELETE FROM ${table} WHERE ${pk} = ?`).run(req.params.key);
    res.json({ deleted: result.changes });
  } catch (err) {
    console.error('❌ خطا در حذف تنظیم:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// 🔍 جستجوی شرطی تنظیمات
router.post('/search', (req, res) => {
  try {
    const { where, params = [] } = req.body;
    const rows = db.prepare(`SELECT * FROM ${table} WHERE ${where} ORDER BY ${pk}`).all(...params);
    res.json(rows);
  } catch (err) {
    console.error('❌ خطا در جستجوی تنظیمات:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

export default router;
