// مسیر: api/services/user.service.js

const users = require('../models/user.model');
const doctorModel = require('../models/doctor.model');
const patientModel = require('../models/patient.model');

/**
 * بررسی وجود کد ملی در دیتابیس و تعیین نقش کاربر
 * @param {string} nationalCode - کد ملی ۱۰ رقمی
 * @returns {object} - اطلاعات وجود و نقش کاربر
 */
async function handleCheckNationalCode(req, res) {
  try {
    const { nationalCode } = req.body;

    // اعتبارسنجی اولیه
    if (!nationalCode || !/^\d{10}$/.test(nationalCode)) {
      return res.status(400).json({ message: 'کد ملی نامعتبر است' });
    }

    // جستجو در مدل‌های مختلف
    const user = users.findByNationCode(nationalCode);
    const doctor = doctorModel.findByNationalCode(nationalCode);
    const patient = patientModel?.findByNationalCode?.(nationalCode);

    // پاسخ‌دهی بر اساس نقش
    if (user) {
      return res.status(200).json({ exists: true, role: user.role, userId: user.id });
    }
    if (doctor) {
      return res.status(200).json({ exists: true, role: 2, doctorId: doctor.id });
    }
    if (patient) {
      return res.status(200).json({ exists: true, role: 4, patientId: patient.id });
    }

    // اگر هیچ موردی پیدا نشد
    return res.status(200).json({ exists: false });
  } catch (error) {
    console.error('❌ خطا در بررسی کد ملی:', error);
    return res.status(500).json({ message: 'خطای داخلی سرور' });
  }
}

module.exports = { handleCheckNationalCode };
