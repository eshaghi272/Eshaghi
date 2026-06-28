import db from '../db.js';

export const increaseInventory = (req, res) => {
  const { itemCode, quantity } = req.body;

  if (!itemCode || !quantity || isNaN(quantity)) {
    return res.status(400).json({ error: 'اطلاعات کالا ناقص یا نامعتبر است' });
  }

  try {
    const updateStmt = db.prepare(`
      UPDATE tblInventory
      SET quantity = quantity + ?
      WHERE itemCode = ?
    `);
    const result = updateStmt.run(quantity, itemCode);

    if (result.changes === 0) {
      const insertStmt = db.prepare(`
        INSERT INTO tblInventory (itemCode, quantity)
        VALUES (?, ?)
      `);
      insertStmt.run(itemCode, quantity);
      return res.json({ success: true, message: '✅ موجودی کالا ثبت شد' });
    }

    res.json({ success: true, message: '✅ موجودی کالا افزایش یافت' });
  } catch (err) {
    console.error('❌ خطا در افزایش موجودی:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
};
