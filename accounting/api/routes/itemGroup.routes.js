import express from 'express';
import db from '../db.js';

const router = express.Router();
const table = 'tblItemGroup';
const pk = 'groupId';

// 📥 دریافت همه گروه‌های کالا
router.get('/', (req, res) => {
  try {
    const rows = db.prepare(`SELECT * FROM ${table} ORDER BY groupName`).all();
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
    const { groupId, groupName, parentId = null } = req.body;
    if (!groupId || !groupName) {
      return res.status(400).json({ error: 'شناسه و نام گروه الزامی هستند' });
    }

    const sql = `INSERT INTO ${table} (groupId, groupName, parentId) VALUES (?, ?, ?)`;
    const result = db.prepare(sql).run(groupId, groupName, parentId);
    res.json({ id: result.lastInsertRowid });
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
    const rows = db.prepare(`SELECT * FROM ${table} WHERE ${where} ORDER BY groupName`).all(...params);
    res.json(rows);
  } catch (err) {
    console.error('❌ خطا در جستجوی گروه‌ها:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

export default router;
