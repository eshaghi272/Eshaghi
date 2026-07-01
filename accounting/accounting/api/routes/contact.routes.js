//api/routes/contact.routes.js
import express from 'express';
import {
  saveContactMessage,
  getAllMessages,
  replyToMessage
} from '../controllers/contact.controller.js';

const router = express.Router();

// مسیر ثبت پیام تماس
router.post('/', saveContactMessage);

// مسیر دریافت همه پیام‌ها
router.get('/messages', getAllMessages);

// مسیر ثبت پاسخ
router.put('/messages/:id/reply', replyToMessage);

export default router;
