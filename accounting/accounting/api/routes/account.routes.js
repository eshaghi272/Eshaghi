import express from 'express';
import { getAllAccounts } from '../controllers/account.controller.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Accounts
 *   description: عملیات مربوط به حساب‌ها

 * /api/tblaccounts:
 *   get:
 *     summary: دریافت لیست حساب‌ها
 *     tags: [Accounts]
 *     responses:
 *       200:
 *         description: لیست حساب‌ها با موفقیت دریافت شد
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   title:
 *                     type: string
 *                     example: "دارایی جاری"
 */
router.get('/', getAllAccounts); // مسیر: /api/tblaccounts

export default router;
