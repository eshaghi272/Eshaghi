import express from 'express';
import db from '../db.js';
import { getAccountSetting } from '../utils/accounting.js';
import { createAccountingEntry } from '../services/accounting.service.js';

const router = express.Router();

// تابع کمکی برای تولید شماره سند جدید
const getNextDocumentNumber = () => {
  try {
    // دریافت آخرین شماره سند از جدول tblJournalEntries
    const getLastDocNumber = db.prepare(`
      SELECT DocumentNumber 
      FROM tblJournalEntries 
      WHERE CAST(DocumentNumber AS INTEGER) IS NOT NULL
      ORDER BY CAST(DocumentNumber AS INTEGER) DESC 
      LIMIT 1
    `);
    
    const lastDoc = getLastDocNumber.get();
    let nextNumber;
    
    if (lastDoc && lastDoc.DocumentNumber) {
      // تولید شماره سند جدید از آخرین شماره +1
      const currentNum = parseInt(lastDoc.DocumentNumber);
      if (!isNaN(currentNum)) {
        nextNumber = currentNum + 1;
      } else {
        // اگر شماره سند عددی نبود، از 1 شروع کن
        nextNumber = 1;
      }
    } else {
      // اگر هیچ سندی وجود نداشت، از 1 شروع کن
      nextNumber = 1;
    }
    
    return nextNumber.toString().padStart(5, '0');
  } catch (err) {
    console.error('❌ خطا در تولید شماره سند:', err.message);
    // در صورت خطا، شماره سند پیش‌فرض
    return '00001';
  }
};

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

    const processSale = db.transaction((sale, docNumber) => {
      const quantity = Number(sale.Quantity);
      const unitPrice = Number(sale.UnitPrice);
      const amount = quantity * unitPrice;

      if (isNaN(quantity) || isNaN(unitPrice) || amount <= 0) {
        throw new Error('مبلغ نامعتبر');
      }

      const entryId = createAccountingEntry({
        date: sale.SaleDate,
        docNumber: docNumber,
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
        // تولید شماره سند جدید برای هر سند فروش
        const docNumber = getNextDocumentNumber();
        const entryId = processSale(sale, docNumber);
        console.log(`✅ EntryId ${entryId} ثبت شد برای SaleId ${sale.SaleId} با شماره سند ${docNumber}`);
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
 * مسیر: POST /api/accounting/generate-purchase-entries
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

    const processPurchase = db.transaction((purchase, docNumber) => {
      const quantity = Number(purchase.Quantity);
      const unitPrice = Number(purchase.UnitPrice);
      const amount = quantity * unitPrice;

      if (isNaN(quantity) || isNaN(unitPrice) || amount <= 0) {
        throw new Error('مبلغ نامعتبر');
      }

      const entryId = createAccountingEntry({
        date: purchase.PurchaseDate,
        docNumber: docNumber,
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
        // تولید شماره سند جدید برای هر سند خرید
        const docNumber = getNextDocumentNumber();
        const entryId = processPurchase(purchase, docNumber);
        console.log(`✅ EntryId ${entryId} ثبت شد برای PurchaseId ${purchase.PurchaseId} با شماره سند ${docNumber}`);
        postedCount++;
      } catch (err) {
        console.warn(`⚠️ PurchaseId ${purchase.PurchaseId} رد شد: ${err.message}`);
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

/**
 * 📌 ثبت سند حسابداری برای واریز یا برداشت بانکی + ثبت تراکنش در tblBankTransaction
 * مسیر: POST /api/accounting/generate-bank-entries
 */
router.post('/generate-bank-entries', (req, res) => {
  const { transactions, Description } = req.body;

  if (!Array.isArray(transactions) || transactions.length === 0) {
    return res.status(400).json({ error: 'هیچ تراکنشی ارسال نشده است' });
  }

  try {
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

    const processTransaction = db.transaction((tx, docNumber) => {
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
        // تولید شماره سند جدید برای هر تراکنش بانکی
        const docNumber = getNextDocumentNumber();
        const entryId = processTransaction(tx, docNumber);
        console.log(`✅ EntryId ${entryId} ثبت شد برای بانک ${tx.bankId} با شماره سند ${docNumber}`);
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
// 📉 صدور سند استهلاک گروهی
router.post('/generate-depreciation-entries', (req, res) => {
  const { assetIds, period } = req.body;

  if (!Array.isArray(assetIds) || assetIds.length === 0) {
    return res.status(400).json({ error: 'هیچ دارایی انتخاب نشده است' });
  }

  // توابع کمکی که در fixedAssets.routes.js تعریف شده‌اند را اینجا نیز تعریف می‌کنیم
  // تابع کمکی برای تولید شماره سند سریال بدون پیشوند
  function generateDocumentNumber() {
    try {
      // دریافت همه شماره سندها
      const allDocs = db.prepare(`
        SELECT DocumentNumber 
        FROM tblJournalEntries 
        WHERE DocumentNumber IS NOT NULL 
          AND DocumentNumber != ''
        ORDER BY EntryId DESC
        LIMIT 200
      `).all();
      
      let maxNumber = 999; // یک عدد کمتر از 1000 تا شماره بعدی 1000 شود
      
      for (const doc of allDocs) {
        if (doc.DocumentNumber) {
          // بررسی اینکه آیا فقط عدد است
          const docNum = doc.DocumentNumber.trim();
          if (/^\d+$/.test(docNum)) {
            const num = parseInt(docNum, 10);
            if (!isNaN(num) && num > maxNumber) {
              maxNumber = num;
            }
          }
        }
      }
      
      const nextNumber = maxNumber + 1;
      return nextNumber.toString(); // فقط عدد به صورت رشته
      
    } catch (error) {
      console.error('خطا در تولید شماره سند:', error);
      
      // روش جایگزین
      try {
        // تلاش برای پیدا کردن آخرین شماره با استفاده از ID
        const lastEntry = db.prepare(`
          SELECT DocumentNumber 
          FROM tblJournalEntries 
          ORDER BY EntryId DESC 
          LIMIT 1
        `).get();
        
        if (lastEntry && lastEntry.DocumentNumber) {
          const lastDocNum = lastEntry.DocumentNumber;
          // استخراج اعداد از رشته
          const matches = lastDocNum.match(/\d+/g);
          if (matches && matches.length > 0) {
            // بزرگترین عدد موجود در رشته را پیدا کن
            const numbers = matches.map(match => parseInt(match, 10));
            const maxNum = Math.max(...numbers.filter(n => !isNaN(n)));
            if (maxNum > 0) {
              return (maxNum + 1).toString();
            }
          }
        }
        
        // اگر هیچ روشی کار نکرد، از 1000 شروع کن
        return '10000';
        
      } catch (fallbackError) {
        // console.error('خطا در روش جایگزین تولید شماره سند:', fallbackError);
        // // در نهایت از تایم استمپ استفاده می‌کنیم
        // const timestamp = Date.now().toString();
        // return timestamp.slice(-8); // 8 رقم آخر
      }
    }
  }
  
  // تابع برای دریافت حساب از تنظیمات
  function getSetting(key, defaultValue = null) {
    try {
      const result = db.prepare(`SELECT settingValue FROM tblSystemSettings WHERE settingKey = ?`).get(key);
      return result ? result.settingValue : defaultValue;
    } catch (error) {
      console.error(`خطا در دریافت تنظیم ${key}:`, error);
      return defaultValue;
    }
  }

  // تابع برای دریافت حساب هزینه استهلاک
  function getDepreciationExpenseAccountByType(assetType) {
    const key = `depreciation_expense_${assetType}`;
    const account = getSetting(key);
    if (!account) {
      return getSetting('depreciationCost', '611303'); // پیش‌فرض: هزینه استهلاک ماشین آلات
    }
    return account;
  }

  // تابع برای دریافت حساب استهلاک انباشته
  function getDepreciationAccountByType(assetType) {
    const key = `depreciation_accumulated_${assetType}`;
    const account = getSetting(key);
    if (!account) {
      return getSetting('depreciationAcum', '121103'); // پیش‌فرض: استهلاک انباشته ماشین آلات
    }
    return account;
  }

  // تابع برای ایجاد سند حسابداری با TypeDoc
  function createJournalEntry(entryData, linesData) {
    const transaction = db.transaction(() => {
      try {
        const { 
          documentNumber, 
          description, 
          entryDate, 
          sourceTable, 
          sourceId, 
          isAuto = 0, 
          typeDoc = 'Fa'  // مقدار پیش‌فرض 'Fa' برای نوع سند
        } = entryData;
        
        // دریافت سال مالی فعال
        const fiscalYear = db.prepare(`SELECT FiscalYearId FROM tblFiscalYear WHERE IsActive = 1`).get();
        const fiscalYearId = fiscalYear ? fiscalYear.FiscalYearId : null;
        
        // ثبت سند حسابداری با فیلد TypeDoc
        const entryResult = db.prepare(`
          INSERT INTO tblJournalEntries 
          (DocumentNumber, Description, EntryDate, SourceTable, SourceId, 
           IsBalanced, FiscalYearId, IsAuto, TypeDoc)
          VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?)
        `).run(
          documentNumber,
          description,
          entryDate,
          sourceTable,
          sourceId,
          fiscalYearId,
          isAuto,
          typeDoc  // ذخیره فیلد Fa در TypeDoc
        );
        
        const entryId = entryResult.lastInsertRowid;
        
        // ثبت خطوط سند
        const insertLine = db.prepare(`
          INSERT INTO tblJournalLines 
          (EntryId, AccountCode, DebitAmount, CreditAmount, SubsidiaryId)
          VALUES (?, ?, ?, ?, ?)
        `);
        
        linesData.forEach(line => {
          insertLine.run(
            entryId,
            line.accountCode,
            line.debitAmount || 0,
            line.creditAmount || 0,
            line.subsidiaryId || null,
            
          );
        });
        
        // بررسی بالانس بودن سند
        const totalDebit = linesData.reduce((sum, line) => sum + (line.debitAmount || 0), 0);
        const totalCredit = linesData.reduce((sum, line) => sum + (line.creditAmount || 0), 0);
        
        if (totalDebit === totalCredit) {
          db.prepare(`UPDATE tblJournalEntries SET IsBalanced = 1 WHERE EntryId = ?`).run(entryId);
        }
        
        return { entryId, isBalanced: totalDebit === totalCredit };
      } catch (error) {
        throw error;
      }
    });
    
    return transaction();
  }

  try {
    const failedItems = [];
    let postedCount = 0;

    // برای هر دارایی یک سند استهلاک ایجاد می‌کنیم
    for (const assetId of assetIds) {
      try {
        // دریافت اطلاعات دارایی
        const asset = db.prepare(`
          SELECT fa.*,
                 ((fa.PurchaseCost - fa.SalvageValue) / fa.UsefulLife) as AnnualDepreciation
          FROM tblFixedAssets fa
          WHERE fa.AssetId = ?
        `).get(assetId);
        
        if (!asset) {
          failedItems.push({ assetId, reason: "دارایی یافت نشد" });
          continue;
        }

        // دریافت حساب‌های استهلاک
        const debitAcc = getDepreciationExpenseAccountByType(asset.AssetType || 'machinery');
        const creditAcc = getDepreciationAccountByType(asset.AssetType || 'machinery');

        if (!debitAcc || !creditAcc) {
          failedItems.push({ assetId, reason: "حساب‌های استهلاک در تنظیمات تعریف نشده‌اند" });
          continue;
        }

        // محاسبه استهلاک سالانه و ماهانه
        const annualDepreciation = asset.AnnualDepreciation || 
                                  (asset.PurchaseCost - asset.SalvageValue) / asset.UsefulLife;
        const monthlyDepreciation = annualDepreciation / 12;

        // ایجاد سند حسابداری
        const docNumber = generateDocumentNumber();
        const description = `ثبت استهلاک دارایی ${asset.TitleFa} - دوره ${period}`;
        
        // تاریخ سند: اول ماه دوره انتخابی (فرض بر این که period به صورت 'YYYY-MM' است)
        const entryDate = period + '۰۱'; // به صورت 'YYYY-MM-DD'

        const entryData = {
          documentNumber: docNumber,
          description,
          entryDate: entryDate,
          sourceTable: 'tblFixedAssets',
          sourceId: assetId,
          isAuto: 1,
          typeDoc: 'DEP'
        };

        const linesData = [
          {
            accountCode: debitAcc,
            debitAmount: monthlyDepreciation,
            creditAmount: 0,
            description: `هزینه استهلاک ${asset.TitleFa} - دوره ${period}`
          },
          {
            accountCode: creditAcc,
            debitAmount: 0,
            creditAmount: monthlyDepreciation,
            description: `استهلاک انباشته ${asset.TitleFa} - دوره ${period}`
          }
        ];

        const { entryId, isBalanced } = createJournalEntry(entryData, linesData);
        console.log(`✅ سند ${docNumber} (ورودی ${entryId}) برای دارایی ${assetId} ثبت شد.`);
        postedCount++;
      } catch (err) {
        console.error(`❌ خطا در ثبت سند برای دارایی ${assetId}:`, err.message);
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

// 📒 دفتر گروه
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