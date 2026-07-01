import express from 'express';
import db from '../db.js';

const router = express.Router();
const table = 'tblStockTransaction';
const pk = 'transId';

// 📥 دریافت همه تراکنش‌های انبار
router.get('/', (req, res) => {
  try {
    const rows = db.prepare(`SELECT * FROM ${table} ORDER BY transDate DESC`).all();
    res.json(rows);
  } catch (err) {
    console.error('❌ خطا در دریافت لیست تراکنش‌ها:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// 📥 دریافت یک تراکنش خاص
router.get('/:id', (req, res) => {
  try {
    const row = db.prepare(`SELECT * FROM ${table} WHERE ${pk} = ?`).get(req.params.id);
    res.json(row || {});
  } catch (err) {
    console.error('❌ خطا در دریافت تراکنش:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// ➕ ثبت تراکنش جدید
router.post('/', (req, res) => {
  try {
    const {
      transType, transDate, itemCode,
      warehouseId, quantity, reference = '',
      description = '', unitPrice = 0, factorNo = 0
    } = req.body;

    if (!transType || !transDate || !itemCode || !warehouseId || !quantity) {
      return res.status(400).json({ error: 'اطلاعات تراکنش ناقص یا نامعتبر است' });
    }

    const sql = `
      INSERT INTO ${table} (
        transType, transDate, itemCode,
        warehouseId, quantity, reference,
        description, unitPrice, factorNo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = db.prepare(sql).run(
      transType, transDate, itemCode,
      warehouseId, quantity, reference,
      description, unitPrice, factorNo
    );

    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    console.error('❌ خطا در ثبت تراکنش:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✏️ بروزرسانی تراکنش
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
    console.error('❌ خطا در بروزرسانی تراکنش:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🗑️ حذف تراکنش
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare(`DELETE FROM ${table} WHERE ${pk} = ?`).run(req.params.id);
    res.json({ deleted: result.changes });
  } catch (err) {
    console.error('❌ خطا در حذف تراکنش:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});




/**
 * دریافت تراکنش‌های انبار با جزئیات کالا و انبار
 */
router.get('/with-details', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT 
        st.*,
        i.itemName,
        i.itemCode,
        w.warehouseName,
        w.warehouseCode
      FROM stocktransactions st
      LEFT JOIN items i ON st.itemId = i.itemId
      LEFT JOIN warehouses w ON st.warehouseId = w.warehouseId
      ORDER BY st.transDate DESC, st.transId DESC
    `).all();

    // فرمت‌دهی تاریخ
    const formattedRows = rows.map(row => ({
      ...row,
      transDate: row.transDate ? new Date(row.transDate).toISOString().split('T')[0] : null,
      quantity: parseFloat(row.quantity || 0)
    }));

    res.json(formattedRows);
  } catch (err) {
    console.error('❌ خطا در دریافت تراکنش‌ها با جزئیات:', err.message);
    res.status(500).json({
      error: 'خطای داخلی سرور',
      details: err.message
    });
  }
});



// 🔍 جستجوی شرطی تراکنش‌ها
router.post('/search', (req, res) => {
  try {
    const { where, params = [] } = req.body;
    const rows = db.prepare(`SELECT * FROM ${table} WHERE ${where} ORDER BY transDate DESC`).all(...params);
    res.json(rows);
  } catch (err) {
    console.error('❌ خطا در جستجوی تراکنش‌ها:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

export default router;
