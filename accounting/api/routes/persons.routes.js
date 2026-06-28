import express from 'express';
import db from '../db.js';

const router = express.Router();
const table = 'tblPersons';
const pk = 'id';

// 📥 دریافت همه اشخاص
router.get('/', (req, res) => {
  try {
    const rows = db.prepare(`SELECT * FROM ${table} ORDER BY lastName, firstName`).all();
    res.json(rows);
  } catch (err) {
    console.error('❌ خطا در دریافت لیست اشخاص:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// 📥 دریافت یک شخص خاص
router.get('/:id', (req, res) => {
  try {
    const row = db.prepare(`SELECT * FROM ${table} WHERE ${pk} = ?`).get(req.params.id);
    res.json(row || {});
  } catch (err) {
    console.error('❌ خطا در دریافت شخص:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// ➕ ثبت شخص جدید
router.post('/', (req, res) => {
  try {
    const {
      nationalCode, firstName, lastName,
      phoneNumber, email, birthDate, gender,
      address, postalCode, companyName, economicCode,
      isSeller = 0, isLegalEntity = 0
    } = req.body;

    if (!nationalCode || !firstName || !lastName) {
      return res.status(400).json({ error: 'کد ملی، نام و نام خانوادگی الزامی هستند' });
    }

    const sql = `
      INSERT INTO ${table} (
        nationalCode, firstName, lastName,
        phoneNumber, email, birthDate, gender,
        address, postalCode, companyName, economicCode,
        isSeller, isLegalEntity
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = db.prepare(sql).run(
      nationalCode, firstName, lastName,
      phoneNumber, email, birthDate, gender,
      address, postalCode, companyName, economicCode,
      isSeller, isLegalEntity
    );

    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    console.error('❌ خطا در ثبت شخص:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✏️ بروزرسانی اطلاعات شخص
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
    console.error('❌ خطا در بروزرسانی شخص:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🗑️ حذف شخص
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare(`DELETE FROM ${table} WHERE ${pk} = ?`).run(req.params.id);
    res.json({ deleted: result.changes });
  } catch (err) {
    console.error('❌ خطا در حذف شخص:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// 🔍 جستجوی شرطی اشخاص
router.post('/search', (req, res) => {
  try {
    const { where, params = [] } = req.body;
    const rows = db.prepare(`SELECT * FROM ${table} WHERE ${where} ORDER BY lastName, firstName`).all(...params);
    res.json(rows);
  } catch (err) {
    console.error('❌ خطا در جستجوی اشخاص:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

export default router;
