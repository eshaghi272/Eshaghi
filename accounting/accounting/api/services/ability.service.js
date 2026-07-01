// backend/services/ability.service.js
import db from '../db.js';

const RolePermissions = {
  patient: ['profile:read:self','appointment:create','appointment:read:self'],
  doctor: ['doctor:dashboard:access','appointment:read:group','patient:read:group'],
  staff:  ['appointment:*:group','billing:*:group'],
  admin:  ['*']
};

export function getUserEffectivePermissions({ role, group_id, user_id }) {
  const base = RolePermissions[role] || [];

  const group = db.prepare('SELECT permissions FROM tblgroups WHERE id = ?').get(group_id);
  const fromGroup = group?.permissions ? JSON.parse(group.permissions) : [];

  const overrides = db.prepare('SELECT permission FROM tbluser_permissions WHERE userid = ?').all(user_id).map(r => r.permission);

  // union بدون تکرار
  const perms = Array.from(new Set([...base, ...fromGroup, ...overrides]));
  return perms;
}
