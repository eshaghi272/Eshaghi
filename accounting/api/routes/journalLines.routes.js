import express from 'express';
import db from '../db.js';

const router = express.Router();
const table = 'tblJournalLines';
const pk = 'LineId';

// 📥 دریافت همه خطوط سند حسابداری
router.get('/', (req, res) => {
  try {
    const rows = db.prepare(`SELECT * FROM ${table} ORDER BY EntryId DESC, LineId`).all();
    res.json(rows);
  } catch (err) {
    console.error('❌ خطا در دریافت لیست خطوط سند:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// 📥 دریافت یک خط خاص
router.get('/:id', (req, res) => {
  try {
    const row = db.prepare(`SELECT * FROM ${table} WHERE ${pk} = ?`).get(req.params.id);
    res.json(row || {});
  } catch (err) {
    console.error('❌ خطا در دریافت خط سند:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// ➕ ثبت خط جدید
router.post('/', (req, res) => {
  try {
    const { EntryId, AccountCode, DebitAmount = 0, CreditAmount = 0, SubsidiaryId = null } = req.body;
    if (!EntryId || !AccountCode) {
      return res.status(400).json({ error: 'شناسه سند و کد حساب الزامی هستند' });
    }

    const sql = `
      INSERT INTO ${table} (EntryId, AccountCode, DebitAmount, CreditAmount, SubsidiaryId)
      VALUES (?, ?, ?, ?, ?)
    `;
    const result = db.prepare(sql).run(EntryId, AccountCode, DebitAmount, CreditAmount, SubsidiaryId);
    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    console.error('❌ خطا در ثبت خط سند:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✏️ بروزرسانی خط سند
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
    console.error('❌ خطا در بروزرسانی خط سند:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🗑️ حذف خط سند
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare(`DELETE FROM ${table} WHERE ${pk} = ?`).run(req.params.id);
    res.json({ deleted: result.changes });
  } catch (err) {
    console.error('❌ خطا در حذف خط سند:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// 🔍 جستجوی شرطی خطوط سند
router.post('/search', (req, res) => {
  try {
    const { where, params = [] } = req.body;
    const rows = db.prepare(`SELECT * FROM ${table} WHERE ${where} ORDER BY EntryId DESC, LineId`).all(...params);
    res.json(rows);
  } catch (err) {
    console.error('❌ خطا در جستجوی خطوط سند:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

export default router;
