import express from 'express';
import db from '../db.js';

const router = express.Router();
const table = 'tblSalesLines';
const pk = 'lineId';

// 📥 دریافت همه خطوط فاکتور
router.get('/', (req, res) => {
  try {
    const rows = db.prepare(`SELECT * FROM ${table} ORDER BY invoiceId DESC, lineId`).all();
    res.json(rows);
  } catch (err) {
    console.error('❌ خطا در دریافت خطوط فاکتور:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// 📥 دریافت یک خط خاص
router.get('/:id', (req, res) => {
  try {
    const row = db.prepare(`SELECT * FROM ${table} WHERE ${pk} = ?`).get(req.params.id);
    res.json(row || {});
  } catch (err) {
    console.error('❌ خطا در دریافت خط فاکتور:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// ➕ ثبت خط جدید
router.post('/', (req, res) => {
  try {
    const {
      invoiceId, itemCode, itemName,
      unit = '', quantity = 0, unitPrice = 0, factorNo = 0
    } = req.body;

    if (!invoiceId || !itemCode || !itemName || !quantity || !unitPrice) {
      return res.status(400).json({ error: 'اطلاعات خط فاکتور ناقص یا نامعتبر است' });
    }

    const sql = `
      INSERT INTO ${table} (
        invoiceId, itemCode, itemName,
        unit, quantity, unitPrice, factorNo
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const result = db.prepare(sql).run(
      invoiceId, itemCode, itemName,
      unit, quantity, unitPrice, factorNo
    );

    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    console.error('❌ خطا در ثبت خط فاکتور:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✏️ بروزرسانی خط فاکتور
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
    console.error('❌ خطا در بروزرسانی خط فاکتور:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🗑️ حذف خط فاکتور
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare(`DELETE FROM ${table} WHERE ${pk} = ?`).run(req.params.id);
    res.json({ deleted: result.changes });
  } catch (err) {
    console.error('❌ خطا در حذف خط فاکتور:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// 🔍 جستجوی شرطی خطوط فاکتور
router.post('/search', (req, res) => {
  try {
    const { where, params = [] } = req.body;
    const rows = db.prepare(`SELECT * FROM ${table} WHERE ${where} ORDER BY invoiceId DESC, lineId`).all(...params);
    res.json(rows);
  } catch (err) {
    console.error('❌ خطا در جستجوی خطوط فاکتور:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

export default router;
