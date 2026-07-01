import db from '../db.js';
import { createAccountingEntry } from '../services/accounting.service.js';
import { getAccountSetting } from '../utils/accounting.js';

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

// ثبت سند خرید
export const generatePurchaseEntries = (req, res) => {
  const { purchaseIds } = req.body;

  console.log("📥 دریافت درخواست ثبت سند خرید برای شناسه‌ها:", purchaseIds);

  if (!Array.isArray(purchaseIds) || purchaseIds.length === 0) {
    console.warn("⚠️ هیچ شناسه خریدی ارسال نشده است");
    return res.status(400).json({ error: 'هیچ شناسه خریدی ارسال نشده است' });
  }

  try {
    const placeholders = purchaseIds.map(() => '?').join(',');
    const getPurchasesStmt = db.prepare(`
      SELECT PurchaseId, ItemCode, ItemName, SupplierName, SupplierNationalCode, Quantity, UnitPrice, PurchaseDate
      FROM tblPurchase
      WHERE PurchaseId IN (${placeholders})
    `);
    const purchases = getPurchasesStmt.all(...purchaseIds);

    console.log("📦 اطلاعات خرید دریافت شد:", purchases);

    const debitAcc = getAccountSetting('purchaseDebitAccount');
    const creditAcc = getAccountSetting('purchaseCreditAccount');

    if (!debitAcc || !creditAcc) {
      console.error("❌ حساب‌های خرید در تنظیمات تعریف نشده‌اند");
      return res.status(500).json({ error: 'حساب‌های خرید در تنظیمات تعریف نشده‌اند' });
    }

    const markPostedStmt = db.prepare(`UPDATE tblPurchase SET IsPosted = 1 WHERE PurchaseId = ?`);
    let successCount = 0;

    for (const p of purchases) {
      const amount = Number(p.Quantity) * Number(p.UnitPrice);
      if (!amount || isNaN(amount)) {
        console.warn(`⚠️ مبلغ نامعتبر برای PurchaseId ${p.PurchaseId}:`, p);
        continue;
      }

      try {
        const entryId = createAccountingEntry({
          date: p.PurchaseDate,
          docNumber: `PUR-${p.PurchaseId}`,
          description: `خرید ${p.ItemName} از ${p.SupplierName}`,
          sourceTable: 'tblPurchase',
          sourceId: p.PurchaseId,
          entries: [
            {
              AccountCode: debitAcc,
              DebitAmount: amount,
              CreditAmount: 0
            },
            {
              AccountCode: creditAcc,
              DebitAmount: 0,
              CreditAmount: amount,
              SubsidiaryId: p.SupplierNationalCode || null
            }
          ]
        });

        console.log(`✅ سند ثبت شد → EntryId ${entryId} برای PurchaseId ${p.PurchaseId}`);
        markPostedStmt.run(p.PurchaseId);
        successCount++;
      } catch (entryErr) {
        console.error(`❌ خطا در ثبت سند برای PurchaseId ${p.PurchaseId}:`, entryErr.message);
      }
    }

    res.json({
      success: true,
      message: `${successCount} سند حسابداری خرید ثبت شد`,
      total: purchases.length,
      failed: purchases.length - successCount
    });

  } catch (err) {
    console.error('❌ خطای کلی در ثبت سند خرید:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور: ' + err.message });
  }
};
