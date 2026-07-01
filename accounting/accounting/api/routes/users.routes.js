import express from 'express';
import { sign, verify as verifyToken } from '../core/jwt.js';
import users from '../models/user.model.js';
import userController from '../controllers/user.controller.js';
import upload from '../middlewares/upload.js';
import { hash, verify as verifyPassword } from '../core/hash.js';

/**
 * @param {import('better-sqlite3').Database} db
 */
export function createUserRouter(db) {
  const router = express.Router();

  function setCookie(res, token) {
    res.cookie('accessToken', token, {
      httpOnly: true,
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 86400000 // 1 روز
    });
  }

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
      console.error('❌ Registration Error:', err);
      res.status(status).json({ message: msg || 'خطا در ثبت‌نام' });
    }
  });

  router.post('/login', async (req, res) => {
    try {
      const { nationalCode, password } = req.body || {};
      const code = String(nationalCode || '').trim();

      const user = users.findByNationCode(code);
      if (!user) return res.status(401).json({ message: 'کد ملی اشتباه است' });

      const ok = await verifyPassword(password, user.passwordHash);
      if (!ok) return res.status(401).json({ message: 'رمز عبور اشتباه است' });

      const token = sign({ id: user.id, role: user.role });
      setCookie(res, token);
      res.json({ message: 'ورود موفقیت‌آمیز بود' });
    } catch (err) {
      console.error('❌ Login Error:', err);
      res.status(500).json({ message: 'خطا در ورود' });
    }
  });

  router.post('/logout', (req, res) => {
    res.clearCookie('accessToken');
    res.json({ message: 'خروج انجام شد' });
  });

  router.get('/me', (req, res) => {
    try {
      const token = req.cookies?.accessToken;
      if (!token) return res.json({ user: null });

      const payload = verifyToken(token);
      const user = users.findById(payload.id);
      if (!user) return res.json({ user: null });

      const { passwordHash, ...safeUser } = user;
      let doctorId = null;
      if (user.role === 2) {
        const doctor = users.getDoctorIdByUserID(user.id);
        doctorId = doctor?.doctorId || null;
      }

      res.json({ user: { ...safeUser, doctorId } });
    } catch (err) {
      console.error('❌ خطا در دریافت اطلاعات کاربر:', err);
      res.json({ user: null });
    }
  });

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

  router.get('/users/:userId', userController.getUserProfile);
  router.put('/users/:userId', userController.updateUserProfile);

  router.put('/complete-profile/:id', (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'شناسه نامعتبر است' });

      const {
        firstName, lastName, nationalCode, phoneNumber,
        email, role, address, imageUrl
      } = req.body;

      const stmt = db.prepare(`
        UPDATE tblusers
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

  router.post('/upload-avatar', upload.single('avatar'), userController.uploadAvatar);
  router.post('/check-national-code', userController.handleCheckNationalCode);
  router.get('/ping', (_req, res) => res.json({ ok: true }));

  return router;
  
}
