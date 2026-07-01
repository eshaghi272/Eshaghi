import express from 'express';
import db from '../db.js';
import { getAccountSetting } from '../utils/accounting.js';
import { createAccountingEntry } from '../services/accounting.service.js';

const router = express.Router();

/**
 * 📌 ثبت سند حسابداری برای فروش‌های انتخاب‌شده
 * مسیر: POST /api/accounting/generate-sale-entries
 */
router.post('/generate-sale-entries', (req, res) => {
  const { saleIds } = req.body;

  if (!Array.isArray(saleIds) || saleIds.length === 0) {
    return res.status(400).json({ error: 'هیچ شناسه فروشی ارسال نشده است' });
  }

  try {
    const placeholders = saleIds.map(() => '?').join(',');
    const getSalesStmt = db.prepare(`
      SELECT SaleId, ItemCode, ItemName, CustomerName, CustomerNationalCode,
             Quantity, UnitPrice, SaleDate
      FROM tblSale
      WHERE SaleId IN (${placeholders})
    `);
    const sales = getSalesStmt.all(...saleIds);

    const debitAcc = getAccountSetting('saleDebitAccount');
    const creditAcc = getAccountSetting('saleCreditAccount');

    if (!debitAcc || !creditAcc) {
      return res.status(500).json({ error: 'حساب‌های فروش در تنظیمات تعریف نشده‌اند' });
    }

    // بررسی وجود حساب‌ها در tblAccounts
    const accExistsStmt = db.prepare(`SELECT 1 FROM tblAccounts WHERE AccountCode = ?`);
    if (!accExistsStmt.get(debitAcc)) {
      return res.status(500).json({ error: `کد حساب بدهکار ${debitAcc} در سیستم تعریف نشده است` });
    }
    if (!accExistsStmt.get(creditAcc)) {
      return res.status(500).json({ error: `کد حساب بستانکار ${creditAcc} در سیستم تعریف نشده است` });
    }

    const markPostedStmt = db.prepare(`UPDATE tblSale SET IsPosted = 1 WHERE SaleId = ?`);
    let postedCount = 0;
    let failedCount = 0;
    const failedSales = [];

    const processSale = db.transaction((sale) => {
      const quantity = Number(sale.Quantity);
      const unitPrice = Number(sale.UnitPrice);
      const amount = quantity * unitPrice;

      if (isNaN(quantity) || isNaN(unitPrice) || amount <= 0) {
        throw new Error('مبلغ نامعتبر');
      }

      const entryId = createAccountingEntry({
        date: sale.SaleDate,
        docNumber: `${sale.SaleId}`,
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
      return entryId;
    });

    for (const sale of sales) {
      try {
        const entryId = processSale(sale);
        console.log(`✅ EntryId ${entryId} ثبت شد برای SaleId ${sale.SaleId}`);
        postedCount++;
      } catch (err) {
        console.warn(`⚠️ SaleId ${sale.SaleId} رد شد: ${err.message}`);
        failedSales.push({ SaleId: sale.SaleId, reason: err.message });
        failedCount++;
      }
    }

    res.json({
      success: true,
      message: `${postedCount} سند حسابداری ثبت شد`,
      total: sales.length,
      posted: postedCount,
      failed: failedCount,
      failedDetails: failedSales
    });

  } catch (err) {
    console.error('❌ خطای کلی:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور: ' + err.message });
  }
});

/**
 * 📌 ثبت سند اتوماتیک برای خریدهای ثبت‌نشده
 * مسیر: POST /api/accounting/auto-post-purchases
 */
router.post('/generate-purchase-entries', (req, res) => {
  const { purchaseIds } = req.body;

  if (!Array.isArray(purchaseIds) || purchaseIds.length === 0) {
    return res.status(400).json({ error: 'هیچ شناسه خریدی ارسال نشده است' });
  }

  try {
    const placeholders = purchaseIds.map(() => '?').join(',');
    const getPurchasesStmt = db.prepare(`
      SELECT PurchaseId, ItemCode, ItemName, SupplierName, SupplierNationalCode,
             Quantity, UnitPrice, PurchaseDate
      FROM tblPurchase
      WHERE PurchaseId IN (${placeholders})
    `);
    const purchases = getPurchasesStmt.all(...purchaseIds);

    if (purchases.length === 0) {
      return res.status(404).json({ error: 'هیچ خریدی با شناسه‌های ارسال‌شده یافت نشد' });
    }

    const debitAcc = getAccountSetting('purchaseDebitAccount');
    const creditAcc = getAccountSetting('purchaseCreditAccount');

    if (!debitAcc || !creditAcc) {
      return res.status(500).json({ error: 'حساب‌های خرید در تنظیمات تعریف نشده‌اند' });
    }

    const markPostedStmt = db.prepare(`UPDATE tblPurchase SET IsPosted = 1 WHERE PurchaseId = ?`);
    let postedCount = 0;
    let failedCount = 0;
    const failedPurchases = [];

    const processPurchase = db.transaction((purchase) => {
      const quantity = Number(purchase.Quantity);
      const unitPrice = Number(purchase.UnitPrice);
      const amount = quantity * unitPrice;

      if (isNaN(quantity) || isNaN(unitPrice) || amount <= 0) {
        throw new Error('مبلغ نامعتبر');
      }

      const entryId = createAccountingEntry({
        date: purchase.PurchaseDate,
        docNumber: `${purchase.PurchaseId}`,
        description: `خرید ${purchase.ItemName} از ${purchase.SupplierName}`,
        sourceTable: 'tblPurchase',
        sourceId: purchase.PurchaseId,
        entries: [
          {
            AccountCode: debitAcc,
            DebitAmount: amount,
            CreditAmount: 0,
            SubsidiaryId: purchase.SupplierNationalCode || null
          },
          {
            AccountCode: creditAcc,
            DebitAmount: 0,
            CreditAmount: amount
          }
        ]
      });

      markPostedStmt.run(purchase.PurchaseId);
      return entryId;
    });

    for (const purchase of purchases) {
      try {
        const entryId = processPurchase(purchase);
        postedCount++;
      } catch (err) {
        failedPurchases.push({ PurchaseId: purchase.PurchaseId, reason: err.message });
        failedCount++;
      }
    }

    res.json({
      success: true,
      message: `${postedCount} سند حسابداری خرید ثبت شد`,
      total: purchases.length,
      posted: postedCount,
      failed: failedCount,
      failedDetails: failedPurchases
    });

  } catch (err) {
    res.status(500).json({ error: 'خطای داخلی سرور: ' + err.message });
  }
});



router.post('/generate-bank-entries', (req, res) => {
  const { transactions, DocumentNumber, Description } = req.body;

  if (!Array.isArray(transactions) || transactions.length === 0) {
    return res.status(400).json({ error: 'هیچ تراکنشی ارسال نشده است' });
  }

  try {
    // دریافت آخرین شماره سند از جدول tblJournalEntries
    const getLastDocNumber = db.prepare(`
      SELECT DocumentNumber 
      FROM tblJournalEntries 
      ORDER BY CAST(DocumentNumber AS INTEGER) DESC 
      LIMIT 1
    `);
    
    const lastDoc = getLastDocNumber.get();
    let docNumber;
    
    if (DocumentNumber && DocumentNumber.trim()) {
      // اگر شماره سند از frontend ارسال شده، از آن استفاده کن
      docNumber = DocumentNumber;
    } else if (lastDoc && lastDoc.DocumentNumber) {
      // تولید شماره سند جدید از آخرین شماره +1
      const currentNum = parseInt(lastDoc.DocumentNumber);
      if (!isNaN(currentNum)) {
        const nextNumber = currentNum + 1;
        docNumber = nextNumber.toString().padStart(5, '0');
      } else {
        // اگر شماره سند عددی نبود، از 1 شروع کن
        docNumber = '00001';
      }
    } else {
      // اگر هیچ سندی وجود نداشت، از 1 شروع کن
      docNumber = '00001';
    }

    const getBankStmt = db.prepare(`
      SELECT id, bankName, accountNumber
      FROM tblBankAccounts
      WHERE id = ?
    `);

    const accExistsStmt = db.prepare(`
      SELECT 1 FROM tblAccounts WHERE AccountCode = ?
    `);

    const getSetting = db.prepare(`
      SELECT settingValue FROM tblSystemSettings WHERE settingKey = ?
    `);

    const insertBankTransaction = db.prepare(`
      INSERT INTO tblBankTransaction (
        bankName, accountNumber, transDate, transType, amount, reference, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const failedItems = [];
    let postedCount = 0;
    let failedCount = 0;

    const processTransaction = db.transaction((tx) => {
      const { type, bankId, amount, date, description, subsidiaryId } = tx;

      if (!['deposit', 'withdraw'].includes(type)) throw new Error('نوع عملیات باید deposit یا withdraw باشد');
      if (!bankId || !amount || amount <= 0 || !date) throw new Error('اطلاعات ناقص یا مبلغ نامعتبر');

      const bank = getBankStmt.get(bankId);
      if (!bank) throw new Error('بانک یافت نشد');

      const bankSubsidiaryCode = bank.accountNumber;
      const bankMainAccount = '111005';

      if (!accExistsStmt.get(bankMainAccount)) throw new Error(`کد حساب اصلی بانک ${bankMainAccount} تعریف نشده`);

      const debitAcc = getSetting.get('payDebitAccount')?.settingValue;
      const creditAcc = getSetting.get('payCreditAccount')?.settingValue;

      if (!debitAcc || !creditAcc) throw new Error('تنظیمات حساب‌های پرداخت بانکی در سیستم تعریف نشده‌اند');
      if (!accExistsStmt.get(debitAcc)) throw new Error(`کد حساب بدهکار ${debitAcc} تعریف نشده`);
      if (!accExistsStmt.get(creditAcc)) throw new Error(`کد حساب بستانکار ${creditAcc} تعریف نشده`);

      const isDeposit = type === 'deposit';
      
      // تولید شرح سند فارسی
      const persianDescription = Description || 
        (isDeposit 
          ? `واریز به حساب بانک ${bank.bankName}`
          : `برداشت از حساب بانک ${bank.bankName}`);

      const entryId = createAccountingEntry({
        date,
        docNumber: docNumber,
        description: persianDescription,
        sourceTable: 'tblBankAccounts',
        sourceId: bankId,
        entries: isDeposit
          ? [
              {
                AccountCode: bankMainAccount,
                DebitAmount: amount,
                CreditAmount: 0,
                SubsidiaryId: bankSubsidiaryCode
              },
              {
                AccountCode: creditAcc,
                DebitAmount: 0,
                CreditAmount: amount,
                SubsidiaryId: subsidiaryId || null
              }
            ]
          : [
              {
                AccountCode: debitAcc,
                DebitAmount: amount,
                CreditAmount: 0,
                SubsidiaryId: subsidiaryId || null
              },
              {
                AccountCode: bankMainAccount,
                DebitAmount: 0,
                CreditAmount: amount,
                SubsidiaryId: bankSubsidiaryCode
              }
            ]
      });

      // ثبت تراکنش بانکی در tblBankTransaction
      insertBankTransaction.run(
        bank.bankName,
        bank.accountNumber,
        date,
        isDeposit ? 'واریز' : 'برداشت',
        amount,
        docNumber,
        description || ''
      );

      return entryId;
    });

    for (const tx of transactions) {
      try {
        const entryId = processTransaction(tx);
        console.log(`✅ EntryId ${entryId} ثبت شد برای بانک ${tx.bankId}`);
        postedCount++;
      } catch (err) {
        console.warn(`⚠️ بانک ${tx.bankId} رد شد: ${err.message}`);
        failedItems.push({ bankId: tx.bankId, reason: err.message });
        failedCount++;
      }
    }

    res.json({
      success: true,
      message: `${postedCount} سند و تراکنش بانکی ثبت شد`,
      documentNumber: docNumber,
      total: transactions.length,
      posted: postedCount,
      failed: failedCount,
      failedDetails: failedItems
    });

  } catch (err) {
    console.error('❌ خطای کلی:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور: ' + err.message });
  }
});

// بقیه کدها بدون تغییر...
// 📌 مسیر دریافت لیست بابت پرداخت
router.get('/api/payment-purpose', (req, res) => {
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

// صدور سند حسابداری استهلاک
router.post('/generate-depreciation-entries', (req, res) => {
  const { assetIds, period } = req.body;

  if (!Array.isArray(assetIds) || assetIds.length === 0) {
    return res.status(400).json({ error: 'هیچ دارایی انتخاب نشده است' });
  }

  try {
    const getAssetStmt = db.prepare(`
      SELECT AssetId, TitleFa, PurchaseCost, SalvageValue, UsefulLife
      FROM tblFixedAssets
      WHERE AssetId = ?
    `);

    const getSetting = db.prepare(`
      SELECT settingValue FROM tblSystemSettings WHERE settingKey = ?
    `);

    const insertEntry = db.prepare(`
      INSERT INTO tblJournalEntries (DocumentNumber, Description, EntryDate, SourceTable, SourceId, IsBalanced)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertLine = db.prepare(`
      INSERT INTO tblJournalLines (EntryId, AccountCode, DebitAmount, CreditAmount, SubsidiaryId)
      VALUES (?, ?, ?, ?, ?)
    `);

    const depCostAccount = getSetting.get('depreciationCost')?.settingValue;   // 611303
    const depAcumAccount = getSetting.get('depreciationAcum')?.settingValue;  // 121103

    if (!depCostAccount || !depAcumAccount) {
      return res.status(400).json({ error: 'تنظیمات حساب‌های استهلاک تعریف نشده‌اند' });
    }

    const failedItems = [];
    let postedCount = 0;

    const processDep = db.transaction((assetId) => {
      const asset = getAssetStmt.get(assetId);
      if (!asset) throw new Error('دارایی یافت نشد');

      const depExpense = (asset.PurchaseCost - asset.SalvageValue) / asset.UsefulLife;

      const docNumber = `DEP-${asset.AssetId}-${Date.now()}`;
      const description = `ثبت استهلاک دارایی ${asset.TitleFa}`;

      // 1️⃣ ثبت هدر سند
      const entryInfo = insertEntry.run(docNumber, description, period, 'tblFixedAssets', asset.AssetId, 1);
      const entryId = entryInfo.lastInsertRowid;

      // 2️⃣ ثبت جزئیات سند
      insertLine.run(entryId, depCostAccount, depExpense, 0, null);   // بدهکار هزینه استهلاک
      insertLine.run(entryId, depAcumAccount, 0, depExpense, null);   // بستانکار استهلاک انباشته

      return entryId;
    });

    for (const assetId of assetIds) {
      try {
        const entryId = processDep(assetId);
        console.log(`✅ EntryId ${entryId} ثبت شد برای دارایی ${assetId}`);
        postedCount++;
      } catch (err) {
        console.warn(`⚠️ دارایی ${assetId} رد شد: ${err.message}`);
        failedItems.push({ assetId, reason: err.message });
      }
    }

    res.json({
      success: true,
      message: `${postedCount} سند استهلاک ثبت شد`,
      total: assetIds.length,
      posted: postedCount,
      failed: failedItems.length,
      failedDetails: failedItems
    });

  } catch (err) {
    console.error('❌ خطای کلی:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور: ' + err.message });
  }
});

// 📑 دفتر روزنامه
// import express from "express";
// import db from "../db.js";

// const router = express.Router();

// دفتر روزنامه
router.get("/journal", (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT e.EntryId, e.DocumentNumber, e.EntryDate, e.Description,
             l.LineId, l.AccountCode, a.TitleFa AS AccountName,
             l.DebitAmount, l.CreditAmount
      FROM tblJournalEntries e
      JOIN tblJournalLines l ON e.EntryId = l.EntryId
      LEFT JOIN tblAccounts a ON l.AccountCode = a.AccountCode
      ORDER BY e.EntryDate, e.EntryId, l.LineId
    `).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// دفتر گروه
// 📒 دفتر گروه
// 📒 دفتر گروه (تجمیع بدهکار/بستانکار در سطح گروه)
router.get("/group-ledger", (req, res) => {
  try {
    const rows = db.prepare(`
      WITH RECURSIVE
      tree AS (
        -- گروه‌ها (ریشه‌ها با TopCode=0)
        SELECT 
          a.AccountCode      AS NodeCode,
          a.TitleFa          AS NodeTitle,
          a.TopCode          AS NodeTop,
          a.AccountCode      AS RootGroupCode,
          a.TitleFa          AS RootGroupTitle
        FROM tblAccounts a
        WHERE a.TopCode = 0

        UNION ALL

        -- فرزندان هر گروه تا انتهای درخت
        SELECT
          c.AccountCode      AS NodeCode,
          c.TitleFa          AS NodeTitle,
          c.TopCode          AS NodeTop,
          t.RootGroupCode    AS RootGroupCode,
          t.RootGroupTitle   AS RootGroupTitle
        FROM tblAccounts c
        JOIN tree t ON c.TopCode = t.NodeCode
      )

      SELECT
        t.RootGroupCode                  AS GroupCode,
        t.RootGroupTitle                 AS GroupName,
        IFNULL(SUM(l.DebitAmount), 0)   AS TotalDebit,
        IFNULL(SUM(l.CreditAmount), 0)  AS TotalCredit
      FROM tree t
      LEFT JOIN tblJournalLines l ON l.AccountCode = t.NodeCode
      GROUP BY t.RootGroupCode, t.RootGroupTitle
      ORDER BY t.RootGroupCode
    `).all();

    // محاسبه مانده
    rows.forEach(r => {
      r.Balance = (r.TotalDebit || 0) - (r.TotalCredit || 0);
    });

    res.json(rows);
  } catch (err) {
    console.error("❌ خطا در دفتر گروه:", err.message);
    res.status(500).json({ error: "خطای داخلی سرور: " + err.message });
  }
});

// 📒 دفتر کل
router.get("/general-ledger", (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT 
        SUBSTR(l.AccountCode,1,4) AS GeneralCode,   -- کد چهاررقمی دفتر کل
        g.TitleFa AS GeneralName,                   -- نام حساب کل
        SUM(l.DebitAmount) AS TotalDebit,
        SUM(l.CreditAmount) AS TotalCredit,
        SUM(l.DebitAmount - l.CreditAmount) AS Balance
      FROM tblJournalLines l
      JOIN tblAccounts a ON l.AccountCode = a.AccountCode
      JOIN tblAccounts g ON g.AccountCode = SUBSTR(l.AccountCode,1,4) -- اتصال به حساب کل
      GROUP BY GeneralCode, GeneralName
      ORDER BY GeneralCode
    `).all();

    res.json(rows);
  } catch (err) {
    console.error("❌ خطا در دفتر کل:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// دفتر معین
router.get("/subsidiary-ledger", (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT l.AccountCode, a.TitleFa AS AccountName, l.SubsidiaryId,
             SUM(l.DebitAmount) AS TotalDebit,
             SUM(l.CreditAmount) AS TotalCredit
      FROM tblJournalLines l
      JOIN tblAccounts a ON l.AccountCode = a.AccountCode
      GROUP BY l.AccountCode, a.TitleFa, l.SubsidiaryId
      ORDER BY l.AccountCode, l.SubsidiaryId
    `).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

