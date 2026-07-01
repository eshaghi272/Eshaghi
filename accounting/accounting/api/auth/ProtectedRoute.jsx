// src/auth/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useAbility } from './useAbility';

export default function ProtectedRoute({ children, roles, anyPerm, allPerms }) {
  const { user, loading } = useAuth();
  const ability = useAbility();

  if (loading) return <div>در حال بارگذاری…</div>;
  if (!user) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(user.role)) return <Navigate to="/403" replace />;
  if (anyPerm && !anyPerm.some(p => ability.can(p))) return <Navigate to="/403" replace />;
  if (allPerms && !allPerms.every(p => ability.can(p))) return <Navigate to="/403" replace />;

  return children;
}
