import express from 'express';
import db from '../db.js';

const router = express.Router();
const table = 'tblInventory';
const pk = 'id';

// 📥 دریافت همه موجودی‌ها
router.get('/', (req, res) => {
  try {
    const rows = db.prepare(`SELECT * FROM ${table} ORDER BY itemCode`).all();
    res.json(rows);
  } catch (err) {
    console.error('❌ خطا در دریافت لیست موجودی:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// 📥 دریافت یک رکورد خاص
router.get('/:id', (req, res) => {
  try {
    const row = db.prepare(`SELECT * FROM ${table} WHERE ${pk} = ?`).get(req.params.id);
    res.json(row || {});
  } catch (err) {
    console.error('❌ خطا در دریافت موجودی:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// ➕ ثبت موجودی جدید
// 📈 افزایش موجودی کالا در انبار مشخص
router.post('/increase', (req, res) => {
  try {
    const { itemCode, warehouseid = 1, quantity } = req.body;

    if (!itemCode || quantity == null || quantity <= 0) {
      return res.status(400).json({ error: 'itemCode و quantity معتبر الزامی هستند' });
    }

    // بررسی موجودی فعلی در انبار مشخص
    const current = db.prepare(`
      SELECT quantity FROM ${table}
      WHERE itemCode = ? AND warehouseid = ?
    `).get(itemCode, warehouseid);

    if (current) {
      // افزایش موجودی
      const newQty = current.quantity + quantity;
      db.prepare(`
        UPDATE ${table}
        SET quantity = ?
        WHERE itemCode = ? AND warehouseid = ?
      `).run(newQty, itemCode, warehouseid);
    } else {
      // درج موجودی جدید
      db.prepare(`
        INSERT INTO ${table} (itemCode, warehouseid, quantity)
        VALUES (?, ?, ?)
      `).run(itemCode, warehouseid, quantity);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('❌ خطا در افزایش موجودی:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// 📉 کاهش موجودی کالا از انبار مشخص
router.post('/decrease', (req, res) => {
  try {
    const { itemCode, warehouseid = 1, quantity } = req.body;

    if (!itemCode || quantity == null || quantity <= 0) {
      return res.status(400).json({ error: 'itemCode و quantity معتبر الزامی هستند' });
    }

    // بررسی موجودی فعلی
    const current = db.prepare(`
      SELECT quantity FROM ${table}
      WHERE itemCode = ? AND warehouseid = ?
    `).get(itemCode, warehouseid);

    if (!current) {
      return res.status(404).json({ error: 'کالا در این انبار یافت نشد' });
    }

    if (current.quantity < quantity) {
      return res.status(400).json({ error: 'موجودی کافی برای خروج وجود ندارد' });
    }

    // کاهش موجودی
    const newQty = current.quantity - quantity;
    db.prepare(`
      UPDATE ${table}
      SET quantity = ?
      WHERE itemCode = ? AND warehouseid = ?
    `).run(newQty, itemCode, warehouseid);

    res.json({ success: true, remaining: newQty });
  } catch (err) {
    console.error('❌ خطا در کاهش موجودی:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// ✏️ بروزرسانی موجودی
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
    console.error('❌ خطا در بروزرسانی موجودی:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🗑️ حذف رکورد موجودی
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare(`DELETE FROM ${table} WHERE ${pk} = ?`).run(req.params.id);
    res.json({ deleted: result.changes });
  } catch (err) {
    console.error('❌ خطا در حذف موجودی:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// 🔍 جستجوی شرطی موجودی‌ها
router.post('/search', (req, res) => {
  try {
    const { where, params = [] } = req.body;
    const rows = db.prepare(`SELECT * FROM ${table} WHERE ${where} ORDER BY itemCode`).all(...params);
    res.json(rows);
  } catch (err) {
    console.error('❌ خطا در جستجوی موجودی:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

export default router;
