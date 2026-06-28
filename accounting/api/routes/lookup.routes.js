// 📁 routes/lookup.routes.js
import express from 'express';
import db from '../db.js';

const router = express.Router();

/**
 * ✅ دریافت حساب‌های بانکی فعال
 * مسیر: GET /api/lookup/bank-accounts
 */
router.get('/bank-accounts', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT id, bankName || ' - ' || accountNumber AS label
      FROM tblBankAccounts
      WHERE isActive = 1
    `).all();

    res.json(rows);
  } catch (err) {
    console.error('❌ خطا در دریافت حساب‌های بانکی:', err.message);
    res.status(500).json({ error: 'خطا در دریافت حساب‌های بانکی' });
  }
});

/**
 * ✅ دریافت حساب‌های کل و معین
 * مسیر: GET /api/lookup/accounts
 */
router.get('/accounts', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT AccountCode AS id, AccountCode || ' - ' || TitleFa AS label
      FROM tblAccounts
      ORDER BY AccountCode
    `).all();

    res.json(rows);
  } catch (err) {
    console.error('❌ خطا در دریافت حساب‌ها:', err.message);
    res.status(500).json({ error: 'خطا در دریافت حساب‌ها' });
  }
});

/**
 * ✅ دریافت حساب‌های تفصیل
 * مسیر: GET /api/lookup/subsidiaries
 */
router.get('/subsidiaries', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT SubsidiaryId AS id, SubsidiaryName AS label
      FROM tblSubsidiaryAccounts
      ORDER BY SubsidiaryCode
    `).all();

    res.json(rows);
  } catch (err) {
    console.error('❌ خطا در دریافت حساب‌های تفصیل:', err.message);
    res.status(500).json({ error: 'خطا در دریافت حساب‌های تفصیل' });
  }
});

/**
 * ✅ دریافت لیست بابت پرداخت (قابل مدیریت از tblLookupValues)
 * مسیر: GET /api/lookup/paymentpurpose
 */
router.get('/paymentpurpose', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT valueKey AS value, labelFa AS label, accountCode
      FROM tblLookupValues
      WHERE groupKey = 'paymentPurpose'
      ORDER BY id
    `).all();

    res.json(rows);
  } catch (err) {
    console.error('❌ خطا در دریافت لیست بابت پرداخت:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

/**
 * ✅ مسیر عمومی برای دریافت lookup بر اساس groupKey
 * مسیر: GET /api/lookup/:groupKey
 */
router.get('/:groupKey', (req, res) => {
  const { groupKey } = req.params;

  try {
    const rows = db.prepare(`
      SELECT id, valueKey AS value, labelFa AS label, accountCode
      FROM tblLookupValues
      WHERE groupKey = ?
      ORDER BY id
    `).all(groupKey);

    res.json(rows);
  } catch (err) {
    console.error(`❌ خطا در دریافت lookup برای ${groupKey}:`, err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});
/**
 * ✏️ ویرایش گزینه در tblLookupValues
 * مسیر: PUT /api/lookup/update/:id
 */
router.put('/update/:id', (req, res) => {
  const { id } = req.params;
  const { groupKey, valueKey, labelFa, accountCode } = req.body;

  if (!groupKey || !valueKey || !labelFa || !accountCode) {
    return res.status(400).json({ error: 'اطلاعات ناقص است' });
  }

  try {
    const exists = db.prepare(`SELECT 1 FROM tblLookupValues WHERE id = ?`).get(id);
    if (!exists) return res.status(404).json({ error: 'گزینه مورد نظر یافت نشد' });

    db.prepare(`
      UPDATE tblLookupValues
      SET groupKey = ?, valueKey = ?, labelFa = ?, accountCode = ?
      WHERE id = ?
    `).run(groupKey, valueKey, labelFa, accountCode, id);

    res.json({ success: true });
  } catch (err) {
    console.error('❌ خطا در ویرایش گزینه:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});
/**
 * 🗑 حذف گزینه از tblLookupValues
 * مسیر: DELETE /api/lookup/delete/:id
 */
router.delete('/delete/:id', (req, res) => {
  const { id } = req.params;

  try {
    const exists = db.prepare(`SELECT 1 FROM tblLookupValues WHERE id = ?`).get(id);
    if (!exists) return res.status(404).json({ error: 'گزینه مورد نظر یافت نشد' });

    db.prepare(`DELETE FROM tblLookupValues WHERE id = ?`).run(id);

    res.json({ success: true });
  } catch (err) {
    console.error('❌ خطا در حذف گزینه:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

//مسیر حذف و ویرایش گزینه‌ها رو هم اضافه کنم
router.post('/add', (req, res) => {
  const { groupKey, valueKey, labelFa, accountCode } = req.body;

  if (!groupKey || !valueKey || !labelFa || !accountCode) {
    return res.status(400).json({ error: 'اطلاعات ناقص است' });
  }

  try {
    const exists = db.prepare(`
      SELECT 1 FROM tblLookupValues
      WHERE groupKey = ? AND valueKey = ?
    `).get(groupKey, valueKey);

    if (exists) {
      return res.status(409).json({ error: 'این گزینه قبلاً ثبت شده است' });
    }

    db.prepare(`
      INSERT INTO tblLookupValues (groupKey, valueKey, labelFa, accountCode)
      VALUES (?, ?, ?, ?)
    `).run(groupKey, valueKey, labelFa, accountCode);

    res.json({ success: true });
  } catch (err) {
    console.error('❌ خطا در ثبت گزینه:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

router.get('/api/tabs', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT tabLabel AS label, routePath AS to
      FROM tblTabs
      ORDER BY id
    `).all();

    res.json(rows);
  } catch (err) {
    console.error('❌ خطا در دریافت تب‌ها:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

export default router;
