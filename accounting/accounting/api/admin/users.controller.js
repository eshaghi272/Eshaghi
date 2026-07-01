import { User } from '../../models';
import asyncHandler from '../../utils/asyncHandler.js';

export const listUsers = asyncHandler(async (req, res) => {
  const users = await User.findAll({ include: 'Role' });
  res.json(users);
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ message: 'کاربر یافت نشد' });
  await user.update({ roleId: req.body.roleId || null });
  res.json(user);
});
