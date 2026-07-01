import express from 'express';
import db from '../db.js';

const router = express.Router();
const table = 'tblUserRoles';
const pk = 'id';

// 📥 دریافت همه نقش‌ها
router.get('/', (req, res) => {
  try {
    const rows = db.prepare(`SELECT * FROM ${table} ORDER BY name`).all();
    res.json(rows);
  } catch (err) {
    console.error('❌ خطا در دریافت نقش‌ها:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// 📥 دریافت یک نقش خاص
router.get('/:id', (req, res) => {
  try {
    const row = db.prepare(`SELECT * FROM ${table} WHERE ${pk} = ?`).get(req.params.id);
    res.json(row || {});
  } catch (err) {
    console.error('❌ خطا در دریافت نقش:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// ➕ ثبت نقش جدید
router.post('/', (req, res) => {
  try {
    const { name, slug, description = '' } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ error: 'نام و slug نقش الزامی هستند' });
    }

    const sql = `INSERT INTO ${table} (name, slug, description) VALUES (?, ?, ?)`;
    const result = db.prepare(sql).run(name, slug, description);
    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    console.error('❌ خطا در ثبت نقش:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✏️ بروزرسانی نقش
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
    console.error('❌ خطا در بروزرسانی نقش:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🗑️ حذف نقش
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare(`DELETE FROM ${table} WHERE ${pk} = ?`).run(req.params.id);
    res.json({ deleted: result.changes });
  } catch (err) {
    console.error('❌ خطا در حذف نقش:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// 🔍 جستجوی شرطی نقش‌ها
router.post('/search', (req, res) => {
  try {
    const { where, params = [] } = req.body;
    const rows = db.prepare(`SELECT * FROM ${table} WHERE ${where} ORDER BY name`).all(...params);
    res.json(rows);
  } catch (err) {
    console.error('❌ خطا در جستجوی نقش‌ها:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

export default router;
