import { Router } from 'express';
import { listUsers, updateUserRole } from './users.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

router.use(authenticate, authorize(['admin']));

router.get('/', listUsers);
router.put('/:id/role', updateUserRole);
router.put(
  '/:id/role',
  authorize({ roles: ['admin'], permissions: ['users:assignRole'] }),
  updateUserRole
);

export default router;
