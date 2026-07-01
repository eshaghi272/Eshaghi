import { Router } from 'express';
import { listRoles, createRole, updateRole, deleteRole } from './roles.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

router.use(authenticate, authorize(['admin']));
router.get(
  '/',
  authorize({ roles: ['admin'], permissions: ['roles:read'] }),
  listRoles
);

router.post(
  '/',
  authorize({ roles: ['admin'], permissions: ['roles:create'] }),
  createRole
);


router.get('/', listRoles);
router.post('/', createRole);
router.put('/:id', updateRole);
router.delete('/:id', deleteRole);

export default router;
