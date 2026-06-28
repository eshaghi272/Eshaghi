// auth/routes.js
import express from 'express';
import bcrypt from 'bcryptjs';
import { authenticate } from './middleware.js';
import { getUserByEmail, getUserById } from '../db';
import { issueAccessToken, buildPrincipal } from './service.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { identifier, password } = req.body;
  const user = await getUserByEmail(identifier);
  if (!user) return res.status(400).json({ message: 'نام کاربری یا رمز نادرست است' });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(400).json({ message: 'نام کاربری یا رمز نادرست است' });

  const token = await issueAccessToken(user);
  res.cookie('access_token', token, {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 15 * 60 * 1000
  });
  res.json({ message: 'OK' });
});

router.post('/logout', (req, res) => {
  res.clearCookie('access_token');
  res.json({ message: 'OK' });
});

router.get('/me', authenticate, async (req, res) => {
  const user = await getUserById(req.auth.userId);
  const principal = await buildPrincipal(user);
  res.json({ user: { id: user.id, email: user.email, role: user.role, groupId: user.group_id, permissions: principal.perms } });
});

export default router;
