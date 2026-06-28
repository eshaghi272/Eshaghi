// src/utils/isAdmin.js
export default function isAdmin(u) {
  if (!u) return false;

  if (typeof u.role === 'string' && u.role.toLowerCase() === 'admin') return true;
  if (typeof u.role === 'number' && [1, 99].includes(u.role)) return true;

  if (u.role && typeof u.role === 'object') {
    const name = u.role.name?.toLowerCase?.();
    const code = u.role.code?.toLowerCase?.();
    if (name === 'admin' || code === '1') return true;
    if ([1, 99].includes(u.role.id)) return true;
  }

  if (Array.isArray(u.roles)) {
    return u.roles.some(r =>
      (typeof r === 'string' && r.toLowerCase() === 'admin') ||
      (r?.name?.toLowerCase?.() === 'admin') ||
      (r?.code?.toLowerCase?.() === '1') ||
      ([1, 99].includes(r?.id))
    );
  }

  if (Array.isArray(u.permissions)) {
    return u.permissions.some(p => String(p).toLowerCase().startsWith('admin'));
  }

  return u.isAdmin === true;
}
