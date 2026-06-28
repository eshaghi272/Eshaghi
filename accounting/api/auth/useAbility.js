// src/auth/useAbility.js
import { useAuth } from './AuthContext';

function matchPerm(perms, needed) {
  if (!perms) return false;
  if (perms.includes('*')) return true;
  if (perms.includes(needed)) return true;
  const [r1, r2, r3] = needed.split(':');
  return perms.some(p => {
    const [p1, p2, p3] = p.split(':');
    return (p1 === r1 || p1 === '*') && (p2 === r2 || p2 === '*') && (p3 === r3 || p3 === '*');
  });
}

export function useAbility() {
  const { user } = useAuth();
  const perms = user?.permissions || [];
  return {
    can: (perm) => matchPerm(perms, perm),
    roleIs: (r) => user?.role === r,
    groupId: user?.groupId,
    userId: user?.id
  };
}
