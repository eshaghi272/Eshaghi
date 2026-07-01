import express from 'express';
import db from '../db.js';
import { sign, verify as verifyToken } from '../core/jwt.js';
import { hash, verify as verifyPassword } from '../core/hash.js';
import users from '../models/user.model.js';
import userController from '../controllers/user.controller.js';
import upload from '../middlewares/upload.js';

const router = express.Router();
const table = 'tblUsers';
const pk = 'id';

function setCookie(res, token) {
  res.cookie('accessToken', token, {
    httpOnly: true,
    sameSite: 'Lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 86400000
  });
}

// 📥 دریافت همه کاربران
router.get('/', (req, res) => {
  try {
    const rows = db.prepare(`SELECT * FROM ${table} ORDER BY createdAt DESC`).all();
    res.json(rows);
  } catch (err) {
    console.error('❌ دریافت کاربران:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// 📥 دریافت یک کاربر خاص
router.get('/:id', (req, res) => {
  try {
    const row = db.prepare(`SELECT * FROM ${table} WHERE ${pk} = ?`).get(req.params.id);
    res.json(row || {});
  } catch (err) {
    console.error('❌ دریافت کاربر:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// ➕ ثبت کاربر جدید
router.post('/', (req, res) => {
  try {
    const {
      firstName, lastName, userName, nationalCode,
      phoneNumber, email, imageUrl = '', groupid = '',
      meta = '', passwordHash, role, status = 'active',
      address = ''
    } = req.body;

    if (!firstName || !lastName || !userName || !nationalCode || !phoneNumber || !email || !passwordHash || role === undefined) {
      return res.status(400).json({ error: 'اطلاعات ضروری ناقص است' });
    }

    const sql = `
      INSERT INTO ${table} (
        firstName, lastName, userName, nationalCode,
        phoneNumber, email, imageUrl, groupid,
        meta, passwordHash, role, status, address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = db.prepare(sql).run(
      firstName, lastName, userName, nationalCode,
      phoneNumber, email, imageUrl, groupid,
      meta, passwordHash, role, status, address
    );

    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    console.error('❌ ثبت کاربر:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✏️ بروزرسانی کاربر
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
    console.error('❌ بروزرسانی کاربر:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🗑️ حذف کاربر
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare(`DELETE FROM ${table} WHERE ${pk} = ?`).run(req.params.id);
    res.json({ deleted: result.changes });
  } catch (err) {
    console.error('❌ حذف کاربر:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// 🔍 جستجوی شرطی
router.post('/search', (req, res) => {
  try {
    const { where, params = [] } = req.body;
    const rows = db.prepare(`SELECT * FROM ${table} WHERE ${where} ORDER BY createdAt DESC`).all(...params);
    res.json(rows);
  } catch (err) {
    console.error('❌ جستجو:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// 🧾 ثبت‌نام
router.post('/register', async (req, res) => {
  try {
    const user = await users.registerUser(req.body);
    const token = sign({ id: user.id, role: user.role });
    setCookie(res, token);
    res.status(201).json({ message: 'ثبت‌نام موفق بود', id: user.id });
  } catch (err) {
    const msg = String(err.message || '');
    const status =
      msg.includes('قبلاً ثبت شده') || msg.toLowerCase().includes('unique') ? 409 :
      msg.includes('نامعتبر') ? 422 : 400;
    console.error('❌ ثبت‌نام:', err);
    res.status(status).json({ message: msg || 'خطا در ثبت‌نام' });
  }
});

// 🔐 ورود
router.post('/login', async (req, res) => {
  try {
    const { nationalCode, password } = req.body || {};
    const code = String(nationalCode || '').trim();

    const user = await users.findByNationCode(code);
    if (!user) return res.status(401).json({ message: 'کد ملی اشتباه است' });

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'رمز عبور اشتباه است' });

    const token = sign({ id: user.id, role: user.role });
    setCookie(res, token);
    res.json({ message: 'ورود موفقیت‌آمیز بود' });
  } catch (err) {
    console.error('❌ ورود:', err);
    res.status(500).json({ message: 'خطا در ورود' });
  }
});

// 🚪 خروج
router.post('/logout', (req, res) => {
  res.clearCookie('accessToken');
  res.json({ message: 'خروج انجام شد' });
});

// 👤 اطلاعات کاربر جاری
router.get('/me', async (req, res) => {
  try {
    const token = req.cookies?.accessToken;
    if (!token) return res.json({ user: null });

    const payload = verifyToken(token);
    const user = await users.findById(payload.id);
    if (!user) return res.json({ user: null });

    const { passwordHash, ...safeUser } = user;
    let doctorId = null;
    if (user.role === 2) {
      const doctor = await users.getDoctorIdByUserID(user.id);
      doctorId = doctor?.doctorId || null;
    }

    res.json({ user: { ...safeUser, doctorId } });
  } catch (err) {
    console.error('❌ دریافت اطلاعات کاربر:', err);
    res.json({ user: null });
  }
});

// 🆔 دریافت شناسه از توکن
router.get('/userId', (req, res) => {
  const token = req.cookies?.accessToken;
  if (!token) return res.status(401).json({ message: 'احراز هویت نشده' });

  try {
    const payload = verifyToken(token);
    res.json({ userId: payload.id });
  } catch (err) {
    res.status(401).json({ message: 'توکن نامعتبر است' });
  }
});

// ✏️ تکمیل پروفایل
router.put('/complete-profile/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'شناسه نامعتبر است' });

    const {
      firstName, lastName, nationalCode, phoneNumber,
      email, role, address, imageUrl
    } = req.body;

    const stmt = db.prepare(`
      UPDATE ${table}
      SET firstName=?, lastName=?, nationalCode=?, phoneNumber=?, email=?, role=?, address=?, imageUrl=?, updatedAt=CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const result = stmt.run(
      firstName?.trim(),
      lastName?.trim(),
      nationalCode?.trim(),
      phoneNumber?.trim(),
      email?.trim(),
      parseInt(role ?? 3),
      address?.trim(),
      imageUrl ?? null,
      id
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'کاربر یافت نشد' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('❌ خطا در تکمیل اطلاعات کاربر:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});
// 📤 آپلود آواتار
router.post('/upload-avatar', upload.single('avatar'), userController.uploadAvatar);

// 🔍 بررسی کد ملی
router.post('/check-national-code', userController.handleCheckNationalCode);

// 🧪 تست اتصال
router.get('/ping', (_req, res) => res.json({ ok: true }));

export default router;
