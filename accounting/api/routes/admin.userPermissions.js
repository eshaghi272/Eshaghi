// backend/routes/admin.userPermissions.js
import express from 'express';
import db from '../db.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = express.Router();
router.use(authenticate, authorize({ roles: ['admin'], any: ['users:read','users:assignPermission'] }));

router.get('/:userid', (req, res) => {
  const rows = db.prepare('SELECT permission FROM tbluser_permissions WHERE userid = ?').all(req.params.userid);
  res.json(rows.map(r => r.permission));
});

router.post('/:userid', (req, res) => {
  const { permissions = [] } = req.body;
  const tx = db.transaction((perms) => {
    db.prepare('DELETE FROM tbluser_permissions WHERE userid = ?').run(req.params.userid);
    const stmt = db.prepare('INSERT INTO tbluser_permissions (userid, permission) VALUES (?, ?)');
    perms.forEach(p => stmt.run(req.params.userid, p));
  });
  tx(permissions);
  res.json({ ok: true });
});

router.delete('/:userid/:perm', (req, res) => {
  db.prepare('DELETE FROM tbluser_permissions WHERE userid = ? AND permission = ?').run(req.params.userid, req.params.perm);
  res.json({ ok: true });
});

export default router;
