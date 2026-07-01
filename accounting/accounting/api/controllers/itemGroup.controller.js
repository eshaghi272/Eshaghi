import db from '../db.js';

export const getAllItemGroups = (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT groupId, groupName, parentId
      FROM tblItemGroup
      ORDER BY groupName
    `);
    const rows = stmt.all();
    res.json(rows);
  } catch (err) {
    console.error('❌ خطا در دریافت گروه‌ها:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
};

export const createItemGroup = (req, res) => {
  const { groupName, parentId } = req.body;
  if (!groupName?.trim()) return res.status(400).json({ error: 'نام گروه الزامی است' });

  try {
    const stmt = db.prepare(`
      INSERT INTO tblItemGroup (groupName, parentId)
      VALUES (?, ?)
    `);
    const result = stmt.run(groupName.trim(), parentId || null);
    res.json({ groupId: result.lastInsertRowid, groupName });
  } catch (err) {
    console.error('❌ خطا در ثبت گروه:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
};
