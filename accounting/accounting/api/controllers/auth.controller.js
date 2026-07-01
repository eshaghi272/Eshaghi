import db from '../db.js';
import {
  findUserByNationalCode,
  resetUserPassword
} from '../models/auth.model.js';
import { hash, verify as verifyHash } from '../core/hash.js';

// بررسی وجود کد ملی
export function handleCheckNationalCode(req, res) {
  const { nationalCode } = req.body;

  if (!nationalCode || !/^\d{10}$/.test(nationalCode)) {
    return res.status(400).json({ message: 'کد ملی باید ۱۰ رقم باشد' });
  }

  try {
    const user = findUserByNationalCode(nationalCode);
    if (user) return res.json({ exists: true, role: user.role, userId: user.id });

   
    return res.json({ exists: false });
  } catch (err) {
    console.error('❌ خطا در بررسی کد ملی:', err);
    return res.status(500).json({ message: 'خطای داخلی سرور' });
  }
}

// بازیابی یا ساخت رمز عبور
export async function handleRecoverPassword(req, res) {
  const { nationalCode } = req.body;

  if (!nationalCode || !/^\d{10}$/.test(nationalCode)) {
    return res.status(400).json({ message: 'کد ملی باید ۱۰ رقم باشد' });
  }

  try {
    const existingUser = findUserByNationalCode(nationalCode);
    if (existingUser) {
      const newPassword = await resetUserPassword(existingUser.id);
      return res.json({ success: true, userId: existingUser.id, password: newPassword });
    }

    
    return res.json({ success: true, userId: result.user.id, password: result.rawPassword });
  } catch (err) {
    console.error('❌ خطا در بازیابی رمز عبور:', err);
    return res.status(500).json({ message: 'خطای داخلی سرور' });
  }
}

// تغییر رمز عبور
export async function handleChangePassword(req, res) {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user?.id;

  if (!userId || !oldPassword || !newPassword) {
    return res.status(400).json({ message: 'اطلاعات ناقص است' });
  }

  const user = db.prepare(`SELECT * FROM tblusers WHERE id = ?`).get(userId);
  if (!user) return res.status(404).json({ message: 'کاربر یافت نشد' });

  const isValid = await verifyHash(oldPassword, user.passwordHash);
  if (!isValid) return res.status(403).json({ message: 'رمز فعلی اشتباه است' });

  const newHash = await hash(newPassword);
  db.prepare(`UPDATE tblusers SET passwordHash = ?, updatedAt = DATETIME('now') WHERE id = ?`)
    .run(newHash, userId);

  return res.json({ success: true });
}
