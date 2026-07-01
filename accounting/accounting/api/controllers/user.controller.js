import users from '../models/user.model.js';
import db from '../db.js';
import path from 'path';

/**
 * بررسی وجود کد ملی در دیتابیس و تعیین نقش کاربر
 */
function handleCheckNationalCode(req, res) {
  try {
    const { nationalCode } = req.body;

    if (!nationalCode || !/^\d{10}$/.test(nationalCode)) {
      return res.status(400).json({ message: 'کد ملی نامعتبر است' });
    }

    const user = users.findByNationCode(nationalCode);
    if (user) {
      return res.status(200).json({ exists: true, role: user.role, userId: user.id });
    }

    
    return res.status(200).json({ exists: false });
  } catch (error) {
    console.error('❌ خطا در بررسی کد ملی:', error);
    return res.status(500).json({ message: 'خطای داخلی سرور' });
  }
}

/**
 * دریافت پروفایل کاربر
 */
function getUserProfile(req, res) {
  try {
    const { userId } = req.params;

    if (!userId || isNaN(userId)) {
      return res.status(400).json({ error: 'شناسه نامعتبر است' });
    }

    const stmt = db.prepare('SELECT * FROM tblusers WHERE id = ?');
    const user = stmt.get(userId);

    if (!user) {
      return res.status(404).json({ error: 'کاربر یافت نشد' });
    }

    res.json(user);
  } catch (error) {
    console.error('❌ خطا در دریافت پروفایل کاربر:', error);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
}

/**
 * بروزرسانی پروفایل کاربر
 */
function updateUserProfile(req, res) {
  try {
    const { userId } = req.params;
    const { firstName, lastName, email, address, imageUrl } = req.body;

    if (!userId || isNaN(userId)) {
      return res.status(400).json({ error: 'شناسه نامعتبر است' });
    }

    const stmt = db.prepare(`
      UPDATE tblusers 
      SET firstName = ?, lastName = ?, email = ?, address = ?, imageUrl = ? 
      WHERE id = ?
    `);

    const result = stmt.run(firstName, lastName, email, address, imageUrl, userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'کاربر یافت نشد یا تغییری اعمال نشد' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('❌ خطا در بروزرسانی پروفایل:', error);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
}

/**
 * آپلود آواتار کاربر
 */
function uploadAvatar(req, res) {
  try {
    const { nationalCode } = req.body;

    if (!req.file || !nationalCode) {
      return res.status(400).json({ error: 'اطلاعات ناقص است' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    const stmt = db.prepare(`
      UPDATE tblusers 
      SET imageUrl = ? 
      WHERE nationalCode = ?
    `);

    const result = stmt.run(imageUrl, nationalCode);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'کاربر با این کد ملی یافت نشد' });
    }

    res.json({ imageUrl });
  } catch (error) {
    console.error('❌ خطا در آپلود آواتار:', error);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
}

// ✅ خروجی به صورت default برای هماهنگی با ES Module
export default {
  handleCheckNationalCode,
  getUserProfile,
  updateUserProfile,
  uploadAvatar
};
