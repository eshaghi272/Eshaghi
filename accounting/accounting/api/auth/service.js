// auth/service.js
import jwt from 'jsonwebtoken';
import { getUserByEmail, getGroupById, getUserOverrides } from '../db';

const rolePermissions = {
  patient: ['profile:read:self','appointment:create','appointment:read:self'],
  doctor: ['doctor:dashboard:access','appointment:read:group','patient:read:group'],
  staff:  ['appointment:*:group','billing:*:group'],
  admin:  ['*']
};

export async function buildPrincipal(user) {
  const base = rolePermissions[user.role] || [];
  const group = user.group_id ? await getGroupById(user.group_id) : null;
  const fromGroup = Array.isArray(group?.permissions) ? group.permissions : [];
  const overrides = await getUserOverrides(user.id); // ['perm:...']
  const perms = Array.from(new Set([...base, ...fromGroup, ...overrides]));
  return { sub: user.id, role: user.role, groupId: user.group_id || null, perms };
}

export async function issueAccessToken(user) {
  const principal = await buildPrincipal(user);
  return jwt.sign(principal, process.env.JWT_SECRET, { expiresIn: '15m' });
}
