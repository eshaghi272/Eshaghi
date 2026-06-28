import express from 'express';
import db from '../db.js';

const router = express.Router();
const table = 'tblAccounts';
const pk = 'AccountCode';

router.get('/', (req, res) => {
  try {
    const rows = db.prepare(`SELECT * FROM ${table}`).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const row = db.prepare(`SELECT * FROM ${table} WHERE ${pk} = ?`).get(req.params.id);
    res.json(row || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const data = req.body;
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');
    const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
    const result = db.prepare(sql).run(...values);
    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare(`DELETE FROM ${table} WHERE ${pk} = ?`).run(req.params.id);
    res.json({ deleted: result.changes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/search', (req, res) => {
  try {
    const { where, params = [] } = req.body;
    const rows = db.prepare(`SELECT * FROM ${table} WHERE ${where}`).all(...params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/journal", (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT 
        e.EntryId,
        e.DocumentNumber,
        e.EntryDate,
        e.Description,
        l.LineId,
        l.AccountCode,
        l.DebitAmount,
        l.CreditAmount
      FROM tblJournalEntries e
      JOIN tblJournalLines l ON e.EntryId = l.EntryId
      ORDER BY e.EntryDate, e.EntryId, l.LineId
    `);

    const rows = stmt.all();
    res.json(rows);
  } catch (err) {
    console.error("❌ خطا در دریافت دفتر روزنامه:", err.message);
    res.status(500).json({ error: "خطای داخلی سرور: " + err.message });
  }
});


export default router;
