import express from 'express';
import db from '../db.js';

const router = express.Router();
const table = 'tblWarehouse';
const pk = 'id';

// 📥 دریافت همه انبارها
router.get('/', (req, res) => {
  try {
    const rows = db.prepare(`SELECT * FROM ${table} ORDER BY warehouseName`).all();
    res.json(rows);
  } catch (err) {
    console.error('❌ خطا در دریافت انبارها:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// 📥 دریافت یک انبار خاص
router.get('/:id', (req, res) => {
  try {
    const row = db.prepare(`SELECT * FROM ${table} WHERE ${pk} = ?`).get(req.params.id);
    res.json(row || {});
  } catch (err) {
    console.error('❌ خطا در دریافت انبار:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// ➕ ثبت انبار جدید
router.post('/', (req, res) => {
  try {
    const { warehouseName, location = '', isActive = 1 } = req.body;
    if (!warehouseName) {
      return res.status(400).json({ error: 'نام انبار الزامی است' });
    }

    const sql = `INSERT INTO ${table} (warehouseName, location, isActive) VALUES (?, ?, ?)`;
    const result = db.prepare(sql).run(warehouseName, location, isActive);
    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    console.error('❌ خطا در ثبت انبار:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✏️ بروزرسانی انبار
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
    console.error('❌ خطا در بروزرسانی انبار:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🗑️ حذف انبار
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare(`DELETE FROM ${table} WHERE ${pk} = ?`).run(req.params.id);
    res.json({ deleted: result.changes });
  } catch (err) {
    console.error('❌ خطا در حذف انبار:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// 🔍 جستجوی شرطی انبارها
router.post('/search', (req, res) => {
  try {
    const { where, params = [] } = req.body;
    const rows = db.prepare(`SELECT * FROM ${table} WHERE ${where} ORDER BY warehouseName`).all(...params);
    res.json(rows);
  } catch (err) {
    console.error('❌ خطا در جستجوی انبارها:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

export default router;
