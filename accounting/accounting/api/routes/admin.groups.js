// backend/routes/admin.groups.js
import express from 'express';
import db from '../db.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = express.Router();
router.use(authenticate, authorize({ roles: ['admin'], any: ['roles:read','roles:create','roles:update','roles:delete'] }));

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT id, name, slug, permissions FROM tblgroups ORDER BY name').all();
  const groups = rows.map(r => ({ ...r, permissions: r.permissions ? JSON.parse(r.permissions) : [] }));
  res.json(groups);
});

router.post('/', (req, res) => {
  const { id, name, slug, permissions = [] } = req.body;
  if (!id || !name || !slug) return res.status(400).json({ message: 'id, name, slug required' });
  db.prepare('INSERT INTO tblgroups (id, name, slug, permissions) VALUES (?, ?, ?, ?)').run(
    id, name, slug, JSON.stringify(permissions)
  );
  res.status(201).json({ id, name, slug, permissions });
});

router.put('/:id', (req, res) => {
  const { name, slug, permissions = [] } = req.body;
  const g = db.prepare('SELECT * FROM tblgroups WHERE id = ?').get(req.params.id);
  if (!g) return res.status(404).json({ message: 'Group not found' });
  db.prepare('UPDATE tblgroups SET name = ?, slug = ?, permissions = ? WHERE id = ?').run(
    name ?? g.name, slug ?? g.slug, JSON.stringify(permissions), req.params.id
  );
  const updated = db.prepare('SELECT id, name, slug, permissions FROM tblgroups WHERE id = ?').get(req.params.id);
  updated.permissions = updated.permissions ? JSON.parse(updated.permissions) : [];
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM tblgroups WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
