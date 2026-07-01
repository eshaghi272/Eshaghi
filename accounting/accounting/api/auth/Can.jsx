// src/auth/Can.jsx
import { useAbility } from './useAbility';
export default function Can({ perm, children, fallback = null }) {
  const { can } = useAbility();
  return can(perm) ? children : fallback;
}
