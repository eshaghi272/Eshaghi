import express from 'express';
import db from '../db.js';

const router = express.Router();

// 📊 دریافت کاردکس کالا بر اساس کد کالا
router.get('/:itemCode', (req, res) => {
  const { itemCode } = req.params;

  if (!itemCode || isNaN(itemCode)) {
    return res.status(400).json({ error: 'کد کالا معتبر نیست' });
  }

  try {
    const query = `
      SELECT
        transDate,
        transType,
        reference,
        quantity,
        unitPrice,
        description
      FROM tblStockTransaction
      WHERE itemCode = ?
      ORDER BY transDate, transType DESC, transId;
    `;

    const rows = db.prepare(query).all(itemCode);

    let balance = 0;
    const result = rows.map(row => {
      const isEntry = row.transType === 'ورود';
      balance += isEntry ? row.quantity : -row.quantity;
      const amount = row.unitPrice ? row.quantity * row.unitPrice : null;

      return {
        تاریخ: row.transDate,
        وارده: isEntry ? row.quantity : null,
        صادره: !isEntry ? row.quantity : null,
        سند: row.reference,
        مقدار: row.quantity,
        نرخ: row.unitPrice,
        مبلغ: amount,
        توضیح: row.description,
        مانده: balance
      };
    });

    res.json(result);
  } catch (err) {
    console.error('❌ خطا در واکشی کاردکس:', err);
    res.status(500).json({ error: 'خطا در واکشی کاردکس کالا' });
  }
});

export default router;
