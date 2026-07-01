import express from 'express';
import db from '../db.js';
import { createAccountingEntry } from '../services/accounting.service.js';
import { getAccountSetting } from '../utils/accounting.js';

const router = express.Router();
const table = 'tblAccountGroups';
const pk = 'GroupCode';

/**
 * ثبت سند حسابداری عمومی
 */
export const insertAccountingEntry = (req, res) => {
  try {
    const { date, docNumber, description, entries } = req.body;

    if (!date || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: 'اطلاعات سند ناقص یا نامعتبر است' });
    }

    const entryId = createAccountingEntry({
      date,
      docNumber,
      description,
      entries
    });

    res.json({ success: true, entryId });
  } catch (err) {
    console.error('❌ خطا در ثبت سند حسابداری:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور: ' + err.message });
  }
};

/**
 * دریافت لیست حساب‌های معین با مسیر درختی
 */
export const getAllAccounts = (req, res) => {
  try {
    const stmt = db.prepare(`
      WITH RECURSIVE acc_path(accCode, accTitleFa, accTopId, path) AS (
        SELECT accCode, accTitleFa, accTopId, accTitleFa
        FROM tblacc
        WHERE accTopId IS NULL OR accTopId = 0

        UNION ALL

        SELECT a.accCode, a.accTitleFa, a.accTopId, p.path || ' > ' || a.accTitleFa
        FROM tblacc a
        JOIN acc_path p ON a.accTopId = p.accCode
      )
      SELECT acc.accCode, acc.accKind, acc_path.path
      FROM tblacc acc
      JOIN acc_path ON acc.accCode = acc_path.accCode
      WHERE acc.accKind = 'معین'
      ORDER BY acc.accCode;
    `);

    const rows = stmt.all().map(r => ({
      accCode: r.accCode,
      accKind: r.accKind,
      accTitleFa: r.path
    }));

    res.json(rows);
  } catch (err) {
    console.error('❌ خطا در دریافت حساب‌ها:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
};

/**
 * ثبت سند حسابداری فروش برای چند فروش انتخاب‌شده
 */
export const generateSaleEntries = (req, res) => {
  const { saleIds } = req.body;

  console.log("📥 دریافت درخواست ثبت سند فروش برای شناسه‌ها:", saleIds);

  if (!Array.isArray(saleIds) || saleIds.length === 0) {
    console.warn("⚠️ هیچ شناسه فروشی ارسال نشده است");
    return res.status(400).json({ error: 'هیچ شناسه فروشی ارسال نشده است' });
  }

  try {
    const placeholders = saleIds.map(() => '?').join(',');
    console.log("🔍 در حال دریافت اطلاعات فروش از tblSale با شناسه‌ها:", placeholders);

    const getSalesStmt = db.prepare(`
      SELECT SaleId, ItemCode, ItemName, CustomerName, CustomerNationalCode, Quantity, UnitPrice, SaleDate
      FROM tblSale
      WHERE SaleId IN (${placeholders})
    `);
    const sales = getSalesStmt.all(...saleIds);

    console.log("📦 اطلاعات فروش دریافت شد:", sales);

    const debitAcc = getAccountSetting('saleDebitAccount');
    const creditAcc = getAccountSetting('saleCreditAccount');

    console.log("📘 حساب بدهکار:", debitAcc);
    console.log("📗 حساب بستانکار:", creditAcc);

    if (!debitAcc || !creditAcc) {
      console.error("❌ حساب‌های فروش در تنظیمات تعریف نشده‌اند");
      return res.status(500).json({ error: 'حساب‌های فروش در تنظیمات تعریف نشده‌اند' });
    }

    const markPostedStmt = db.prepare(`UPDATE tblSale SET IsPosted = 1 WHERE SaleId = ?`);
    let successCount = 0;

    for (const sale of sales) {
      const amount = Number(sale.Quantity) * Number(sale.UnitPrice);
      console.log(`🧾 SaleId ${sale.SaleId} → مبلغ: ${amount} | کالا: ${sale.ItemName} | مشتری: ${sale.CustomerName}`);

      if (!amount || isNaN(amount)) {
        console.warn(`⚠️ مبلغ نامعتبر برای SaleId ${sale.SaleId}:`, sale);
        continue;
      }

      try {
        console.log("📤 در حال ثبت سند حسابداری برای SaleId:", sale.SaleId);

        const entryId = createAccountingEntry({
          date: sale.SaleDate,
          docNumber: `SALE-${sale.SaleId}`,
          description: `فروش ${sale.ItemName} به ${sale.CustomerName}`,
          sourceTable: 'tblSale',
          sourceId: sale.SaleId,
          entries: [
            {
              AccountCode: debitAcc,
              DebitAmount: amount,
              CreditAmount: 0,
              SubsidiaryId: sale.CustomerNationalCode || null
            },
            {
              AccountCode: creditAcc,
              DebitAmount: 0,
              CreditAmount: amount
            }
          ]
        });

        console.log(`✅ سند ثبت شد → EntryId ${entryId} برای SaleId ${sale.SaleId}`);

        markPostedStmt.run(sale.SaleId);
        console.log(`📌 وضعیت IsPosted به 1 تغییر کرد برای SaleId ${sale.SaleId}`);

        successCount++;
      } catch (entryErr) {
        console.error(`❌ خطا در ثبت سند برای SaleId ${sale.SaleId}:`, entryErr.message);
      }
    }

    console.log(`📊 مجموع موفق: ${successCount} | مجموع شکست: ${sales.length - successCount}`);

    res.json({
      success: true,
      message: `${successCount} سند حسابداری ثبت شد`,
      total: sales.length,
      failed: sales.length - successCount
    });

  } catch (err) {
    console.error('❌ خطای کلی در ثبت سند فروش:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور: ' + err.message });
  }
};

// 📥 دریافت همه گروه‌های حساب
router.get('/', (req, res) => {
  try {
    const rows = db.prepare(`SELECT * FROM ${table} ORDER BY ${pk}`).all();
    res.json(rows);
  } catch (err) {
    console.error('❌ خطا در دریافت گروه‌ها:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// 📥 دریافت یک گروه خاص
router.get('/:code', (req, res) => {
  try {
    const row = db.prepare(`SELECT * FROM ${table} WHERE ${pk} = ?`).get(req.params.code);
    res.json(row || {});
  } catch (err) {
    console.error('❌ خطا در دریافت گروه حساب:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});
export const autoPostUnpostedSales = (req, res) => {
  console.log("📥 شروع ثبت سند اتوماتیک برای فروش‌های ثبت‌نشده");

  try {
    // واکشی فروش‌های ثبت‌نشده
    const getUnpostedSalesStmt = db.prepare(`
      SELECT SaleId, ItemCode, ItemName, CustomerName, CustomerNationalCode,
             Quantity, UnitPrice, SaleDate
      FROM tblSale
      WHERE IsPosted = 0
      ORDER BY SaleDate ASC
    `);
    const sales = getUnpostedSalesStmt.all();

    if (sales.length === 0) {
      console.warn("⚠️ هیچ فروش ثبت‌نشده‌ای یافت نشد");
      return res.status(200).json({
        success: true,
        message: 'هیچ فروش ثبت‌نشده‌ای وجود ندارد',
        total: 0,
        posted: 0,
        failed: 0
      });
    }

    // دریافت حساب‌های بدهکار و بستانکار از تنظیمات
    const debitAcc = getAccountSetting('saleDebitAccount');
    const creditAcc = getAccountSetting('saleCreditAccount');

    if (!debitAcc || !creditAcc) {
      console.error("❌ حساب‌های فروش در تنظیمات تعریف نشده‌اند");
      return res.status(500).json({ error: 'حساب‌های فروش در تنظیمات تعریف نشده‌اند' });
    }

    const markPostedStmt = db.prepare(`UPDATE tblSale SET IsPosted = 1 WHERE SaleId = ?`);
    let postedCount = 0;
    let failedCount = 0;

    for (const sale of sales) {
      const amount = Number(sale.Quantity) * Number(sale.UnitPrice);

      if (!amount || isNaN(amount)) {
        console.warn(`⚠️ مبلغ نامعتبر برای SaleId ${sale.SaleId}:`, sale);
        failedCount++;
        continue;
      }

      try {
        const entryId = createAccountingEntry({
          date: sale.SaleDate,
          docNumber: `SALE-${sale.SaleId}`,
          description: `فروش ${sale.ItemName} به ${sale.CustomerName}`,
          sourceTable: 'tblSale',
          sourceId: sale.SaleId,
          entries: [
            {
              AccountCode: debitAcc,
              DebitAmount: amount,
              CreditAmount: 0,
              SubsidiaryId: sale.CustomerNationalCode || null
            },
            {
              AccountCode: creditAcc,
              DebitAmount: 0,
              CreditAmount: amount
            }
          ]
        });

        markPostedStmt.run(sale.SaleId);
        console.log(`✅ سند ثبت شد → EntryId ${entryId} برای SaleId ${sale.SaleId}`);
        postedCount++;
      } catch (entryErr) {
        console.error(`❌ خطا در ثبت سند برای SaleId ${sale.SaleId}:`, entryErr.message);
        failedCount++;
      }
    }

    res.json({
      success: true,
      message: `${postedCount} سند حسابداری فروش ثبت شد`,
      total: sales.length,
      posted: postedCount,
      failed: failedCount
    });

  } catch (err) {
    console.error('❌ خطای کلی در ثبت سند اتوماتیک فروش:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور: ' + err.message });
  }
};

// ➕ ثبت گروه جدید
router.post('/', (req, res) => {
  try {
    const { GroupCode, TitleFa, TitleEn = '', Type = 'گروه' } = req.body;
    if (!GroupCode || !TitleFa) {
      return res.status(400).json({ error: 'کد گروه و عنوان فارسی الزامی هستند' });
    }

    const sql = `INSERT INTO ${table} (${pk}, TitleFa, TitleEn, Type) VALUES (?, ?, ?, ?)`;
    const result = db.prepare(sql).run(GroupCode, TitleFa, TitleEn, Type);
    res.json({ id: GroupCode });
  } catch (err) {
    console.error('❌ خطا در ثبت گروه حساب:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✏️ بروزرسانی گروه حساب
router.put('/:code', (req, res) => {
  try {
    const data = req.body;
    const keys = Object.keys(data);
    const fields = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => data[k]);
    const sql = `UPDATE ${table} SET ${fields} WHERE ${pk} = ?`;
    const result = db.prepare(sql).run(...values, req.params.code);
    res.json({ success: true, changes: result.changes });
  } catch (err) {
    console.error('❌ خطا در بروزرسانی گروه حساب:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🗑️ حذف گروه حساب
router.delete('/:code', (req, res) => {
  try {
    const result = db.prepare(`DELETE FROM ${table} WHERE ${pk} = ?`).run(req.params.code);
    res.json({ deleted: result.changes });
  } catch (err) {
    console.error('❌ خطا در حذف گروه حساب:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// 🔍 جستجوی شرطی گروه‌ها
router.post('/search', (req, res) => {
  try {
    const { where, params = [] } = req.body;
    const rows = db.prepare(`SELECT * FROM ${table} WHERE ${where} ORDER BY ${pk}`).all(...params);
    res.json(rows);
  } catch (err) {
    console.error('❌ خطا در جستجوی گروه‌ها:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

export default router;
