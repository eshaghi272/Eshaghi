// backend/middleware/authorize.js
function hasAll(perms, required = []) {
  if (!required.length) return true;
  if (perms.includes('*')) return true;
  return required.every(p => perms.includes(p));
}
function hasAny(perms, any = []) {
  if (!any.length) return true;
  if (perms.includes('*')) return true;
  return any.some(p => perms.includes(p));
}

export function authorize({ roles = [], all = [], any = [] } = {}) {
  return (req, res, next) => {
    const user = req.auth;
    if (!user) return res.status(401).json({ message: 'Unauthenticated' });
    if (roles.length && !roles.includes(user.role)) {
      return res.status(403).json({ message: 'Forbidden: role' });
    }
    if (!hasAll(user.permissions, all)) {
      return res.status(403).json({ message: 'Forbidden: permissions (all)' });
    }
    if (!hasAny(user.permissions, any)) {
      return res.status(403).json({ message: 'Forbidden: permissions (any)' });
    }
    next();
  };
}
