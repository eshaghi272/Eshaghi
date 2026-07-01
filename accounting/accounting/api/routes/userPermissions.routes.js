import express from 'express';
import db from '../db.js';

const router = express.Router();
const table = 'tblUser_Permissions';

// 📥 دریافت همه مجوزهای یک کاربر
router.get('/:userid', (req, res) => {
  try {
    const rows = db.prepare(`SELECT permission FROM ${table} WHERE userid = ?`).all(req.params.userid);
    res.json(rows.map(r => r.permission));
  } catch (err) {
    console.error('❌ خطا در دریافت مجوزهای کاربر:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// ➕ ثبت مجوز جدید برای کاربر
router.post('/', (req, res) => {
  try {
    const { userid, permission } = req.body;
    if (!userid || !permission) {
      return res.status(400).json({ error: 'شناسه کاربر و مجوز الزامی هستند' });
    }

    const sql = `INSERT INTO ${table} (userid, permission) VALUES (?, ?)`;
    db.prepare(sql).run(userid, permission);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ خطا در ثبت مجوز:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🗑️ حذف یک مجوز خاص از کاربر
router.delete('/', (req, res) => {
  try {
    const { userid, permission } = req.body;
    if (!userid || !permission) {
      return res.status(400).json({ error: 'شناسه کاربر و مجوز الزامی هستند' });
    }

    const sql = `DELETE FROM ${table} WHERE userid = ? AND permission = ?`;
    const result = db.prepare(sql).run(userid, permission);
    res.json({ deleted: result.changes });
  } catch (err) {
    console.error('❌ خطا در حذف مجوز:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🔁 ثبت یا حذف گروهی مجوزها
router.post('/bulk', (req, res) => {
  try {
    const { userid, permissions = [], mode = 'add' } = req.body;
    if (!userid || !Array.isArray(permissions)) {
      return res.status(400).json({ error: 'شناسه کاربر و لیست مجوزها الزامی هستند' });
    }

    const insert = db.prepare(`INSERT INTO ${table} (userid, permission) VALUES (?, ?)`);
    const del = db.prepare(`DELETE FROM ${table} WHERE userid = ? AND permission = ?`);

    const tx = db.transaction(() => {
      permissions.forEach(p => {
        if (mode === 'add') insert.run(userid, p);
        else if (mode === 'remove') del.run(userid, p);
      });
    });

    tx();
    res.json({ success: true, count: permissions.length });
  } catch (err) {
    console.error('❌ خطا در عملیات گروهی مجوزها:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
