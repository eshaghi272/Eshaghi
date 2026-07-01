import db from '../db.js';

// 📥 ثبت پیام تماس
export function saveContactMessage(req, res) {
  const { name, email, message } = req.body;

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).json({ message: 'همه فیلدها الزامی هستند' });
  }

  try {
    db.prepare(`
      INSERT INTO tblcontactmessages (name, email, message)
      VALUES (?, ?, ?)
    `).run(name.trim(), email.trim(), message.trim());
console.log('📥 فرم دریافتی:', req.body);

    res.status(201).json({ message: '✅ پیام با موفقیت ذخیره شد' });
  } catch (err) {
  console.error('❌ خطا در ذخیره پیام:', err); // نه فقط err.message
  res.status(500).json({ message: 'خطا در ذخیره پیام', error: err.message });
}

}

// 📋 دریافت همه پیام‌ها
export function getAllMessages(req, res) {
  try {
    const rows = db.prepare(`
      SELECT id, name, email, reply, message, createdAt
      FROM tblcontactmessages
      ORDER BY createdAt DESC
    `).all();

    res.json(rows);
  } catch (err) {
    console.error('❌ خطا در دریافت پیام‌ها:', err.message);
    res.status(500).json({ message: 'خطا در دریافت پیام‌ها' });
  }
}

// 📤 پاسخ به پیام خاص
export function replyToMessage(req, res) {
  const id = Number(req.params.id);
  const { reply } = req.body;

  if (!reply?.trim() || !Number.isInteger(id)) {
    return res.status(400).json({ message: 'اطلاعات ناقص یا شناسه نامعتبر است' });
  }

  try {
    const result = db.prepare(`
      UPDATE tblcontactmessages SET reply = ? WHERE id = ?
    `).run(reply.trim(), id);

    if (result.changes === 0) {
      return res.status(404).json({ message: 'پیام مورد نظر یافت نشد' });
    }

    res.json({ message: '✅ پاسخ با موفقیت ثبت شد' });
  } catch (err) {
    console.error('❌ خطا در ثبت پاسخ:', err.message);
    res.status(500).json({ message: 'خطا در ثبت پاسخ' });
  }
}
