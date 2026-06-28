import { Role } from '../../models';
import asyncHandler from '../../utils/asyncHandler.js';

export const listRoles = asyncHandler(async (req, res) => {
  const roles = await Role.findAll();
  res.json(roles);
});

export const createRole = asyncHandler(async (req, res) => {
  const role = await Role.create(req.body);
  res.status(201).json(role);
});

export const updateRole = asyncHandler(async (req, res) => {
  const role = await Role.findByPk(req.params.id);
  if (!role) return res.status(404).json({ message: 'نقش یافت نشد' });
  await role.update(req.body);
  res.json(role);
});

export const deleteRole = asyncHandler(async (req, res) => {
  const role = await Role.findByPk(req.params.id);
  if (!role) return res.status(404).json({ message: 'نقش یافت نشد' });
  await role.destroy();
  res.json({ message: 'حذف شد' });
});
