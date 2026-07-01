// src/config/permissions.catalog.js
export const PermissionCatalog = {
  version: '1.0.0',
  groups: {
    roles: ['roles:read', 'roles:create', 'roles:update', 'roles:delete'],
    users: ['users:read', 'users:assignRole'],
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
    admin: ['*'] // wildcard
  }
};
