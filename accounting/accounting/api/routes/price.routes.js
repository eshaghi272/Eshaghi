import express from 'express';
import db from '../db.js';

const router = express.Router();

// 📦 دریافت آخرین قیمت خرید کالا بر اساس itemCode
router.get('/:itemCode', (req, res) => {
  const itemCode = parseInt(req.params.itemCode);
  if (!itemCode) return res.status(400).json({ error: 'کد کالا نامعتبر است' });

  try {
    const row = db.prepare(`
      SELECT UnitPrice
      FROM tblPurchase
      WHERE ItemCode = ?
      ORDER BY PurchaseDate DESC, PurchaseId DESC
      LIMIT 1
    `).get(itemCode);

    if (!row) return res.status(404).json({ error: 'قیمت یافت نشد' });

    res.json({ unitPrice: row.UnitPrice });
  } catch (err) {
    console.error('❌ خطا در دریافت قیمت کالا:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

export default router;
