import express from 'express';
import {
  handleCheckNationalCode,
  handleRecoverPassword,
  handleChangePassword
} from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/check-national-code', handleCheckNationalCode);
router.post('/recover-password', handleRecoverPassword);
router.post('/change-password', handleChangePassword);

export default router;
