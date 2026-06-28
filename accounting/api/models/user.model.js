import db from '../db.js';
import { hash } from '../core/hash.js';

// آماده‌سازی کوئری‌ها
const insertUser = db.prepare(`
  INSERT INTO tblusers (
    firstName, lastName, userName, nationalCode,
    phoneNumber, email, passwordHash, role
  )
  VALUES (
    @firstName, @lastName, @userName, @nationalCode,
    @phoneNumber, @email, @passwordHash, @role
  )
`);

const getByEmail     = db.prepare(`SELECT * FROM tblusers WHERE email = @email LIMIT 1`);
const getByUserName  = db.prepare(`SELECT * FROM tblusers WHERE userName = @userName LIMIT 1`);
const getByPhone     = db.prepare(`SELECT * FROM tblusers WHERE phoneNumber = @phoneNumber LIMIT 1`);
const getByNation    = db.prepare(`SELECT * FROM tblusers WHERE nationalCode = @nationalCode LIMIT 1`);
const getById        = db.prepare(`SELECT * FROM tblusers WHERE id = @id LIMIT 1`);

// نرمال‌سازی ورودی
function normalize(p) {
  return {
    firstName: (p.firstName || '').trim(),
    lastName: (p.lastName || '').trim(),
    userName: (p.userName || '').trim(),
    nationalCode: String(p.nationalCode || '').trim(),
    phoneNumber: String(p.phoneNumber || '').trim(),
    email: String(p.email || '').trim().toLowerCase(),
    role: Number(p.role ?? 5)
  };
}

// بررسی وجود مقدار یکتا
function existsBy(key, val) {
  const map = {
    email: getByEmail,
    userName: getByUserName,
    phoneNumber: getByPhone,
    nationalCode: getByNation,
  };
  if (!map[key]) throw new Error(`کلید نامعتبر: ${key}`);
  return !!map[key].get({ [key]: val });
}

// ثبت کاربر جدید
async function registerUser(payload) {
  const p = normalize(payload);

  // اعتبارسنجی
  if (!p.firstName || !p.lastName) throw new Error('نام و نام خانوادگی الزامی است');
  if (!/^[a-zA-Z0-9._-]{3,}$/.test(p.userName)) throw new Error('نام کاربری نامعتبر است');
  if (!/^\d{10}$/.test(p.nationalCode)) throw new Error('کد ملی نامعتبر است');
  if (!/^\d{10,11}$/.test(p.phoneNumber)) throw new Error('شماره موبایل نامعتبر است');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) throw new Error('ایمیل نامعتبر است');
  if (![1,2,3,4].includes(p.role)) throw new Error('نقش نامعتبر است');
  if (!payload.password || String(payload.password).length < 6) {
    throw new Error('رمز عبور حداقل ۶ کاراکتر باشد');
  }

  for (const k of ['email','userName','phoneNumber','nationalCode']) {
    if (existsBy(k, p[k])) throw new Error(`${k} قبلاً ثبت شده است`);
  }

  const passwordHash = await hash(payload.password);
  const info = insertUser.run({ ...p, passwordHash });
  const userId = info.lastInsertRowid;

  
  return { id: userId, ...p };
}

// دریافت عنوان نقش
function getRoleLabel(slug) {
  const role = db.prepare(`SELECT name FROM tbluserRoles WHERE slug = ? LIMIT 1`).get(slug);
  return role?.name || 'کاربر';
}

// دریافت کاربر با کد ملی
function findByNationalCode(nationalCode) {
  return db.prepare(`SELECT * FROM tblusers WHERE nationalCode = ? LIMIT 1`).get(nationalCode.trim());
}

function findUserByNationalCode(nationalCode) {
  return db.prepare(`SELECT * FROM tblusers WHERE nationalCode = ?`).get(nationalCode.trim());
}

// ثبت کاربر با رمز تصادفی (مثلاً برای پزشک یا بیمار)
async function createUserWithRandomPassword({ firstName, lastName, nationalCode, role }) {
  const rawPassword = Math.floor(100000 + Math.random() * 900000).toString();
  const passwordHash = await hash(rawPassword);

  db.prepare(`
    INSERT INTO tblusers (firstName, lastName, nationalCode, role, passwordHash, status, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, 'active', DATETIME('now'), DATETIME('now'))
  `).run(firstName, lastName, nationalCode.trim(), role, passwordHash);

  const user = db.prepare(`SELECT * FROM tblusers WHERE nationalCode = ?`).get(nationalCode.trim());
  return { user, rawPassword };
}

// بروزرسانی رمز عبور
async function resetUserPassword(userId) {
  const rawPassword = Math.floor(100000 + Math.random() * 900000).toString();
  const passwordHash = await hash(rawPassword);

  db.prepare(`
    UPDATE tblusers SET passwordHash = ?, updatedAt = DATETIME('now') WHERE id = ?
  `).run(passwordHash, userId);

  return rawPassword;
}

// ✅ خروجی هماهنگ با ES Module
export default {
  findByEmail: (email) => getByEmail.get({ email: String(email || '').trim().toLowerCase() }),
  findByUserName: (userName) => getByUserName.get({ userName: String(userName || '').trim() }),
  findByPhone: (phoneNumber) => getByPhone.get({ phoneNumber: String(phoneNumber || '').trim() }),
  findByNationCode: (nationalCode) => getByNation.get({ nationalCode: String(nationalCode || '').trim() }),
  findById: (id) => getById.get({ id }),
  registerUser,
  getRoleLabel,
  findByNationalCode,
  findUserByNationalCode,
  resetUserPassword,
  existsBy,
  createUserWithRandomPassword
};
