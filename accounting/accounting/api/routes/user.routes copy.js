import express from 'express';
import db from '../db.js';

const router = express.Router();
const table = 'tblUsers';
const pk = 'id';

// 📥 دریافت همه کاربران
router.get('/', (req, res) => {
  try {
    const rows = db.prepare(`SELECT * FROM ${table} ORDER BY createdAt DESC`).all();
    res.json(rows);
  } catch (err) {
    console.error('❌ خطا در دریافت کاربران:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// 📥 دریافت یک کاربر خاص
router.get('/:id', (req, res) => {
  try {
    const row = db.prepare(`SELECT * FROM ${table} WHERE ${pk} = ?`).get(req.params.id);
    res.json(row || {});
  } catch (err) {
    console.error('❌ خطا در دریافت کاربر:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// ➕ ثبت کاربر جدید
router.post('/', (req, res) => {
  try {
    const {
      firstName, lastName, userName, nationalCode,
      phoneNumber, email, imageUrl = '', groupid = '',
      meta = '', passwordHash, role, status = 'active',
      address = ''
    } = req.body;

    if (!firstName || !lastName || !userName || !nationalCode || !phoneNumber || !email || !passwordHash || role === undefined) {
      return res.status(400).json({ error: 'اطلاعات ضروری کاربر ناقص است' });
    }

    const sql = `
      INSERT INTO ${table} (
        firstName, lastName, userName, nationalCode,
        phoneNumber, email, imageUrl, groupid,
        meta, passwordHash, role, status, address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = db.prepare(sql).run(
      firstName, lastName, userName, nationalCode,
      phoneNumber, email, imageUrl, groupid,
      meta, passwordHash, role, status, address
    );

    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    console.error('❌ خطا در ثبت کاربر:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✏️ بروزرسانی کاربر
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
    console.error('❌ خطا در بروزرسانی کاربر:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🗑️ حذف کاربر
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare(`DELETE FROM ${table} WHERE ${pk} = ?`).run(req.params.id);
    res.json({ deleted: result.changes });
  } catch (err) {
    console.error('❌ خطا در حذف کاربر:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// 🔍 جستجوی شرطی کاربران
router.post('/search', (req, res) => {
  try {
    const { where, params = [] } = req.body;
    const rows = db.prepare(`SELECT * FROM ${table} WHERE ${where} ORDER BY createdAt DESC`).all(...params);
    res.json(rows);
  } catch (err) {
    console.error('❌ خطا در جستجوی کاربران:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});


export default router;
