// src/auth/permissions.js
export const PermissionCatalog = {
  appointment: [
    'appointment:create',
    'appointment:read:self',
    'appointment:read:group',
    'appointment:update:group',
    'appointment:cancel:self'
  ],
  patient: [
    'patient:read:self',
    'patient:read:group',
    'patient:update:self'
  ],
  doctor: [
    'doctor:dashboard:access',
    'doctor:schedule:manage'
  ],
  billing: [
    'billing:read:group',
    'billing:manage:group'
  ],
  admin: ['*']
};
