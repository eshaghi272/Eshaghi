import db from '../db.js';

export const createItem = (req, res) => {
  const { itemCode, itemName, unit, description, isActive, itemGroupId } = req.body;
  if (!itemCode || !itemName?.trim()) return res.status(400).json({ error: 'کد و نام کالا الزامی است' });

  try {
    const stmt = db.prepare(`
      INSERT INTO tblItems (itemCode, itemName, unit, description, isActive, itemGroupId)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(itemCode, itemName.trim(), unit || '', description || '', isActive || 'true', itemGroupId || null);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ خطا در ثبت کالا:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
};
