import express from 'express';
import db from '../db.js';

const router = express.Router();
const table = 'tblUserGroups';
const pk = 'id';

// 📥 دریافت همه گروه‌های کاربری
router.get('/', (req, res) => {
  try {
    const rows = db.prepare(`SELECT * FROM ${table} ORDER BY name`).all();
    res.json(rows);
  } catch (err) {
    console.error('❌ خطا در دریافت گروه‌ها:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// 📥 دریافت یک گروه خاص
router.get('/:id', (req, res) => {
  try {
    const row = db.prepare(`SELECT * FROM ${table} WHERE ${pk} = ?`).get(req.params.id);
    res.json(row || {});
  } catch (err) {
    console.error('❌ خطا در دریافت گروه:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// ➕ ثبت گروه جدید
router.post('/', (req, res) => {
  try {
    const { id, name, slug, permissions = '[]' } = req.body;
    if (!id || !name || !slug) {
      return res.status(400).json({ error: 'شناسه، نام و slug گروه الزامی هستند' });
    }

    const sql = `INSERT INTO ${table} (id, name, slug, permissions) VALUES (?, ?, ?, ?)`;
    const result = db.prepare(sql).run(id, name, slug, permissions);
    res.json({ id });
  } catch (err) {
    console.error('❌ خطا در ثبت گروه:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✏️ بروزرسانی گروه
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
    console.error('❌ خطا در بروزرسانی گروه:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🗑️ حذف گروه
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare(`DELETE FROM ${table} WHERE ${pk} = ?`).run(req.params.id);
    res.json({ deleted: result.changes });
  } catch (err) {
    console.error('❌ خطا در حذف گروه:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// 🔍 جستجوی شرطی گروه‌ها
router.post('/search', (req, res) => {
  try {
    const { where, params = [] } = req.body;
    const rows = db.prepare(`SELECT * FROM ${table} WHERE ${where} ORDER BY name`).all(...params);
    res.json(rows);
  } catch (err) {
    console.error('❌ خطا در جستجوی گروه‌ها:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

export default router;
