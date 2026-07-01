// utils/mailer.js
const nodemailer = require('nodemailer');

// تنظیمات ارسال‌کننده
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'eshaghi272@gmail.com',
    pass: process.env.MAIL_PASS // باید App Password باشه
  }
});

/**
 * ارسال ایمیل رمز عبور جدید به آدرس ثابت
 * @param {Object} param0
 * @param {string} param0.name - نام کاربر
 * @param {string} param0.password - رمز عبور جدید
 */
function sendPasswordEmail({ name, password }) {
  const mailOptions = {
    from: `"ClinicJS" <eshaghi272@gmail.com>`,
    to: 'eshaghi272@gmail.com', // گیرنده ثابت
    subject: 'رمز عبور جدید کاربر',
    html: `
      <div style="font-family:Tahoma; direction:rtl; text-align:right">
        <h3>اطلاع‌رسانی رمز عبور جدید</h3>
        <p>نام کاربر: <strong>${name}</strong></p>
        <p>رمز عبور جدید: <strong>${password}</strong></p>
        <hr />
        <small>این ایمیل به‌صورت خودکار ارسال شده است.</small>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
}

module.exports = { sendPasswordEmail };
