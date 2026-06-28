// backend/middleware/authenticate.js
import jwt from 'jsonwebtoken';
import db from '../db.js';
import { getUserEffectivePermissions } from '../services/ability.service.js';

export function authenticate(req, res, next) {
  const token = req.cookies?.access_token;
  if (!token) return res.status(401).json({ message: 'Unauthenticated' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET); // { sub, role, groupId }
    const user = db.prepare('SELECT id, email, role, groupId FROM tblusers WHERE id = ?').get(payload.sub);
    if (!user) return res.status(401).json({ message: 'User not found' });

    const permissions = getUserEffectivePermissions({
      role: user.role,
      groupId: user.groupId,
      userid: user.id
    });

    req.auth = { ...user, permissions };
    next();
  } catch (e) {
    res.status(401).json({ message: 'Invalid token' });
  }
}
