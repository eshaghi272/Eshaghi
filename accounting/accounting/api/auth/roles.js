// backend/auth/roles.js
export const Roles = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  ADMIN: 'admin'
};

export const RolePermissions = {
  [Roles.PATIENT]: [
    'profile:read:self',
    'appointment:create',
    'appointment:read:self'
  ],
  [Roles.DOCTOR]: [
    'patient:read:group',
    'appointment:manage:group'
  ],
  [Roles.ADMIN]: ['*'] // دسترسی کامل
};
