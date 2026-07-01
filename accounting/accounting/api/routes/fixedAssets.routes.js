// routes/fixedAssets.routes.js
import express from 'express';
import db from '../db.js';

const router = express.Router();

// 📋 لیست دارایی‌ها با اطلاعات حساب‌ها
router.get('/', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT 
        fa.*,
        fa.DebitAccount,
        fa.CreditAccount,
        (fa.PurchaseCost * fa.Quantity) as TotalCost,
        ((fa.PurchaseCost - fa.SalvageValue) / fa.UsefulLife) as AnnualDepreciation
      FROM tblFixedAssets fa
      ORDER BY fa.AssetId DESC
    `).all();
    
    // تبدیل تاریخ‌ها به فرمت مناسب
    const formattedRows = rows.map(row => ({
      ...row,
      PurchaseDate: row.PurchaseDate ? formatDateForDisplay(row.PurchaseDate) : '',
      CreatedAt: row.CreatedAt ? formatDateForDisplay(row.CreatedAt) : ''
    }));
    
    res.json(formattedRows);
  } catch (err) {
    console.error('❌ خطا در دریافت دارایی‌ها:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🔍 دریافت یک دارایی خاص
router.get('/:id', (req, res) => {
  try {
    const assetId = req.params.id;
    const row = db.prepare(`
      SELECT 
        fa.*,
        fa.DebitAccount,
        fa.CreditAccount
      FROM tblFixedAssets fa
      WHERE fa.AssetId = ?
    `).get(assetId);
    
    if (!row) {
      return res.status(404).json({ error: "دارایی یافت نشد" });
    }
    
    // دریافت اسناد حسابداری مرتبط
    const journalEntries = db.prepare(`
      SELECT je.* 
      FROM tblJournalEntries je
      WHERE je.SourceTable = 'tblFixedAssets' AND je.SourceId = ?
      ORDER BY je.EntryDate DESC
    `).all(assetId);
    
    res.json({
      ...row,
      journalEntries,
      PurchaseDate: row.PurchaseDate ? formatDateForDisplay(row.PurchaseDate) : ''
    });
  } catch (err) {
    console.error('❌ خطا در دریافت دارایی:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// تابع کمکی برای فرمت تاریخ
function formatDateForDisplay(dateStr) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  } catch (error) {
    return dateStr;
  }
}

// تابع کمکی برای تولید شماره سند سریال بدون پیشوند
// تابع کمکی برای تولید شماره سند سریال بدون پیشوند
function generateDocumentNumber() {
  try {
    // فقط آخرین رکورد را بررسی کن
    const lastEntry = db.prepare(`
      SELECT DocumentNumber 
      FROM tblJournalEntries 
      ORDER BY EntryId DESC 
      LIMIT 1
    `).get();
    
    let nextNumber = 10000; // شماره شروع
    
    if (lastEntry && lastEntry.DocumentNumber) {
      // استخراج اعداد از رشته
      const numbers = lastEntry.DocumentNumber.match(/\d+/g);
      if (numbers && numbers.length > 0) {
        // بزرگترین عدد را بگیر
        const nums = numbers.map(n => parseInt(n)).filter(n => !isNaN(n));
        if (nums.length > 0) {
          const maxNum = Math.max(...nums);
          if (maxNum >= 10000) {
            nextNumber = maxNum + 1;
          }
        }
      }
    }
    
    return nextNumber.toString();
    
  } catch (error) {
    console.error('خطا در تولید شماره سند:', error);
    return '10000';
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

// تابع برای دریافت حساب بدهکار بر اساس نوع دارایی
function getAssetAccountByType(assetType) {
  const key = `asset_debit_${assetType}`;
  const account = getSetting(key);
  if (!account) {
    return getSetting('asset_debit_default', '121004'); // پیش‌فرض: ماشین آلات
  }
  return account;
}

// تابع برای دریافت حساب بستانکار بر اساس روش پرداخت
function getCreditAccountByPaymentMethod(paymentMethod) {
  const key = `asset_credit_${paymentMethod}`;
  const account = getSetting(key);
  if (!account) {
    return getSetting('asset_credit_payable', '211001'); // پیش‌فرض: حسابهای پرداختنی تجاری
  }
  return account;
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

// ➕ ثبت دارایی ثابت جدید + سند حسابداری
router.post('/', (req, res) => {
  const transaction = db.transaction(() => {
    try {
      const {
        AssetCode, TitleFa, Quantity, PurchaseDate,
        PurchaseCost, UsefulLife, SalvageValue,
        DepreciationMethod, AssetType = 'machinery',
        PaymentMethod = 'payable'
      } = req.body;

      // اعتبارسنجی داده‌های ورودی
      if (!AssetCode || !TitleFa || !PurchaseDate || Quantity <= 0 || PurchaseCost <= 0) {
        throw new Error("اطلاعات ضروری وارد نشده است");
      }

      // محاسبه حساب‌ها از تنظیمات
      const debitAcc = getAssetAccountByType(AssetType);
      const creditAcc = getCreditAccountByPaymentMethod(PaymentMethod);
      
      if (!debitAcc || !creditAcc) {
        throw new Error("حساب‌های خرید دارایی در تنظیمات تعریف نشده‌اند");
      }

      const totalCost = PurchaseCost * Quantity;
      
      // 1. ذخیره دارایی
      const result = db.prepare(`
        INSERT INTO tblFixedAssets
        (AssetCode, TitleFa, Quantity, PurchaseDate, PurchaseCost, 
         UsefulLife, SalvageValue, DepreciationMethod, AssetType,
         PaymentMethod, DebitAccount, CreditAccount, CreatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        AssetCode, TitleFa, Quantity, PurchaseDate, PurchaseCost,
        UsefulLife, SalvageValue, DepreciationMethod, AssetType,
        PaymentMethod, debitAcc, creditAcc
      );

      const assetId = result.lastInsertRowid;

      // 2. ایجاد سند حسابداری
      const docNumber = generateDocumentNumber();
      const description = `ثبت خرید دارایی ثابت ${TitleFa}`;

      const entryData = {
        documentNumber: docNumber,
        description,
        entryDate: PurchaseDate,
        sourceTable: 'tblFixedAssets',
        sourceId: assetId,
        isAuto: 1,
        typeDoc: 'FA'  // نوع سند: Fa
      };

      const linesData = [
        {
          accountCode: debitAcc,
          debitAmount: totalCost,
          creditAmount: 0,
          description: `خرید ${TitleFa} - ${AssetType}`
        },
        {
          accountCode: creditAcc,
          debitAmount: 0,
          creditAmount: totalCost,
          description: `خرید ${TitleFa} - ${PaymentMethod}`
        }
      ];

      const { entryId, isBalanced } = createJournalEntry(entryData, linesData);

      return { 
        success: true, 
        assetId, 
        entryId, 
        documentNumber: docNumber,
        debitAccount: debitAcc,
        creditAccount: creditAcc,
        totalCost: totalCost,
        typeDoc: 'Fa',
        isBalanced: isBalanced
      };
    } catch (err) {
      console.error('❌ خطا در ثبت دارایی:', err.message);
      throw err;
    }
  });

  try {
    const result = transaction();
    res.json({ 
      ...result,
      message: "دارایی و سند حسابداری با موفقیت ثبت شدند" 
    });
  } catch (err) {
    res.status(500).json({ 
      error: "خطا در ثبت دارایی", 
      details: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
});

// 🔄 صدور سند خرید مجدد
router.post('/:id/generate-entry', (req, res) => {
  const transaction = db.transaction(() => {
    try {
      const assetId = req.params.id;
      const asset = db.prepare(`
        SELECT fa.*, 
               (fa.PurchaseCost * fa.Quantity) as TotalCost
        FROM tblFixedAssets fa
        WHERE fa.AssetId = ?
      `).get(assetId);
      
      if (!asset) {
        throw new Error("دارایی یافت نشد");
      }

      // استفاده از حساب‌های ذخیره شده در دارایی
      const debitAcc = asset.DebitAccount || getAssetAccountByType(asset.AssetType || 'machinery');
      const creditAcc = asset.CreditAccount || getCreditAccountByPaymentMethod(asset.PaymentMethod || 'payable');

      if (!debitAcc || !creditAcc) {
        throw new Error("حساب‌های خرید دارایی تعریف نشده‌اند");
      }

      // ایجاد سند حسابداری
      const docNumber = generateDocumentNumber();
      const description = `صدور مجدد سند خرید دارایی ${asset.TitleFa}`;

      const entryData = {
        documentNumber: docNumber,
        description,
        entryDate: new Date().toISOString().slice(0, 10),
        sourceTable: 'tblFixedAssets',
        sourceId: assetId,
        isAuto: 1,
        typeDoc: 'Fa'  // نوع سند: Fa
      };

      const linesData = [
        {
          accountCode: debitAcc,
          debitAmount: asset.TotalCost || asset.PurchaseCost * asset.Quantity,
          creditAmount: 0,
          description: `خرید مجدد ${asset.TitleFa}`
        },
        {
          accountCode: creditAcc,
          debitAmount: 0,
          creditAmount: asset.TotalCost || asset.PurchaseCost * asset.Quantity,
          description: `خرید مجدد ${asset.TitleFa}`
        }
      ];

      const { entryId, isBalanced } = createJournalEntry(entryData, linesData);

      return { 
        success: true, 
        entryId, 
        documentNumber: docNumber,
        assetId: assetId,
        typeDoc: 'FA',
        isBalanced: isBalanced
      };
    } catch (err) {
      throw err;
    }
  });

  try {
    const result = transaction();
    res.json({ 
      ...result,
      message: "سند خرید مجدد با موفقیت صادر شد" 
    });
  } catch (err) {
    console.error("❌ خطا در صدور سند خرید:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 📉 صدور سند استهلاک
// در روت generate-depreciation، تغییرات زیر را اعمال کنید:

// 📉 صدور سند استهلاک (نسخه بهبودیافته)
router.post('/:id/generate-depreciation', (req, res) => {
  const transaction = db.transaction(() => {
    try {
      const assetId = req.params.id;
      const { period, periodType, depreciationAmount, description, quantity = 1 } = req.body;
      
      // اعتبارسنجی ورودی‌ها
      if (!period) {
        throw new Error("دوره استهلاک مشخص نشده است");
      }
      
      // دریافت اطلاعات دارایی
      const asset = db.prepare(`
        SELECT fa.*
        FROM tblFixedAssets fa
        WHERE fa.AssetId = ?
      `).get(assetId);
      
      if (!asset) {
        throw new Error("دارایی یافت نشد");
      }

      // دریافت حساب‌های استهلاک از تنظیمات
      const debitAcc = getDepreciationExpenseAccountByType(asset.AssetType || 'machinery');
      const creditAcc = getDepreciationAccountByType(asset.AssetType || 'machinery');

      if (!debitAcc || !creditAcc) {
        throw new Error("حساب‌های استهلاک در تنظیمات تعریف نشده‌اند");
      }

      // محاسبه استهلاک
      let depAmount = depreciationAmount;
      
      // اگر depreciationAmount ارسال نشده، خودمان محاسبه کنیم
      if (!depAmount || depAmount <= 0) {
        const annualDepreciation = (asset.PurchaseCost - (asset.SalvageValue || 0)) / asset.UsefulLife;
        
        if (periodType === 'monthly') {
          depAmount = annualDepreciation / 12;
        } else {
          depAmount = annualDepreciation;
        }
        
        // ضرب در تعداد
        depAmount = depAmount * (quantity || asset.Quantity || 1);
      }
      
      // بررسی که استهلاک مثبت باشد
      if (depAmount <= 0) {
        throw new Error("مبلغ استهلاک معتبر نیست");
      }

      // ایجاد سند حسابداری
      const docNumber = generateDocumentNumber();
      const entryDescription = description || 
        `استهلاک ${periodType === 'monthly' ? 'ماهانه' : 'سالانه'} دارایی ${asset.TitleFa} - دوره ${period}`;
      
      // تبدیل تاریخ دوره به فرمت مناسب
      let entryDate = period;
      if (entryDate && entryDate.length === 7) { // اگر YYYY-MM باشد
        entryDate = `${entryDate}-01`;
      }

      const entryData = {
        documentNumber: docNumber,
        description: entryDescription,
        entryDate: entryDate || new Date().toISOString().slice(0, 10),
        sourceTable: 'tblFixedAssets',
        sourceId: assetId,
        isAuto: 1,
        typeDoc: 'FA'
      };

      const linesData = [
        {
          accountCode: debitAcc,
          debitAmount: depAmount,
          creditAmount: 0,
          description: `هزینه استهلاک ${asset.TitleFa} - ${period}`
        },
        {
          accountCode: creditAcc,
          debitAmount: 0,
          creditAmount: depAmount,
          description: `استهلاک انباشته ${asset.TitleFa} - ${period}`
        }
      ];

      const { entryId, isBalanced } = createJournalEntry(entryData, linesData);

      // ثبت لاگ استهلاک برای پیگیری
      try {
        db.prepare(`
          INSERT INTO tblDepreciationLogs 
          (AssetId, EntryId, Period, PeriodType, Amount, CreatedAt)
          VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).run(assetId, entryId, period, periodType || 'monthly', depAmount);
      } catch (logError) {
        console.warn("⚠️ خطا در ثبت لاگ استهلاک:", logError.message);
        // ادامه می‌دهیم حتی اگر ثبت لاگ با خطا مواجه شد
      }

      return { 
        success: true, 
        entryId, 
        documentNumber: docNumber,
        assetId: assetId,
        assetCode: asset.AssetCode,
        depreciationAmount: depAmount,
        period: period,
        periodType: periodType,
        typeDoc: 'FA',
        isBalanced: isBalanced
      };
    } catch (err) {
      throw err;
    }
  });

  try {
    const result = transaction();
    res.json({ 
      ...result,
      message: `سند استهلاک با موفقیت صادر شد. مبلغ: ${result.depreciationAmount.toLocaleString('fa-IR')} ریال`
    });
  } catch (err) {
    console.error("❌ خطا در صدور سند استهلاک:", err.message);
    res.status(500).json({ 
      error: "خطا در صدور سند استهلاک", 
      details: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
});

// 📊 ثبت گروهی استهلاک
router.post('/batch/generate-depreciation', (req, res) => {
  const transaction = db.transaction(() => {
    try {
      const { assetIds, period, periodType, entries } = req.body;
      
      if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
        throw new Error("لیست دارایی‌ها معتبر نیست");
      }
      
      if (!period) {
        throw new Error("دوره مشخص نشده است");
      }
      
      const results = [];
      const errors = [];
      
      // برای هر دارایی سند استهلاک ایجاد می‌کنیم
      for (const assetId of assetIds) {
        try {
          // یافتن اطلاعات مربوط به این دارایی از entries
          const assetEntry = entries?.find(e => e.assetId == assetId);
          
          if (!assetEntry) {
            errors.push({ assetId, error: "اطلاعات استهلاک یافت نشد" });
            continue;
          }
          
          // درخواست به روت generate-depreciation شبیه‌سازی می‌شود
          const asset = db.prepare(`
            SELECT fa.*
            FROM tblFixedAssets fa
            WHERE fa.AssetId = ?
          `).get(assetId);
          
          if (!asset) {
            errors.push({ assetId, error: "دارایی یافت نشد" });
            continue;
          }
          
          // دریافت حساب‌های استهلاک
          const debitAcc = getDepreciationExpenseAccountByType(asset.AssetType || 'machinery');
          const creditAcc = getDepreciationAccountByType(asset.AssetType || 'machinery');
          
          if (!debitAcc || !creditAcc) {
            errors.push({ assetId, assetCode: asset.AssetCode, error: "حساب‌های استهلاک تعریف نشده" });
            continue;
          }
          
          // محاسبه یا استفاده از مبلغ ارسالی
          const depAmount = assetEntry.depreciationAmount || 
            ((asset.PurchaseCost - (asset.SalvageValue || 0)) / asset.UsefulLife) * 
            (periodType === 'monthly' ? 1/12 : 1) * 
            (assetEntry.quantity || asset.Quantity || 1);
          
          // ایجاد سند
          const docNumber = generateDocumentNumber();
          const description = assetEntry.description || 
            `استهلاک ${periodType === 'monthly' ? 'ماهانه' : 'سالانه'} ${asset.TitleFa} - دوره ${period}`;
          
          const entryDate = period.length === 7 ? `${period}-01` : period;
          
          const entryData = {
            documentNumber: docNumber,
            description,
            entryDate: entryDate , // || new Date().toISOString().slice(0, 10),
            sourceTable: 'tblFixedAssets',
            sourceId: assetId,
            isAuto: 1,
            typeDoc: 'FA'
          };
          
          const linesData = [
            {
              accountCode: debitAcc,
              debitAmount: depAmount,
              creditAmount: 0,
              description: `هزینه استهلاک ${asset.TitleFa}`
            },
            {
              accountCode: creditAcc,
              debitAmount: 0,
              creditAmount: depAmount,
              description: `استهلاک انباشته ${asset.TitleFa}`
            }
          ];
          
          const { entryId, isBalanced } = createJournalEntry(entryData, linesData);
          
          results.push({
            assetId,
            assetCode: asset.AssetCode,
            entryId,
            documentNumber: docNumber,
            depreciationAmount: depAmount,
            success: true
          });
          
        } catch (err) {
          errors.push({ 
            assetId, 
            error: err.message 
          });
        }
      }
      
      return {
        success: true,
        total: assetIds.length,
        successful: results.length,
        failed: errors.length,
        results,
        errors
      };
      
    } catch (err) {
      throw err;
    }
  });
  
  try {
    const result = transaction();
    res.json(result);
  } catch (err) {
    console.error("❌ خطا در ثبت گروهی استهلاک:", err.message);
    res.status(500).json({ 
      error: "خطا در ثبت گروهی استهلاک", 
      details: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
});

// 📝 به‌روزرسانی دارایی
router.put('/:id', (req, res) => {
  const transaction = db.transaction(() => {
    try {
      const assetId = req.params.id;
      const {
        AssetCode, TitleFa, Quantity, PurchaseDate,
        PurchaseCost, UsefulLife, SalvageValue,
        DepreciationMethod, AssetType = 'machinery',
        PaymentMethod = 'payable'
      } = req.body;

      // بررسی وجود دارایی
      const existingAsset = db.prepare(`SELECT * FROM tblFixedAssets WHERE AssetId = ?`).get(assetId);
      if (!existingAsset) {
        throw new Error("دارایی یافت نشد");
      }

      // محاسبه حساب‌های جدید
      const debitAcc = getAssetAccountByType(AssetType);
      const creditAcc = getCreditAccountByPaymentMethod(PaymentMethod);

      const result = db.prepare(`
        UPDATE tblFixedAssets 
        SET AssetCode = ?, TitleFa = ?, Quantity = ?, PurchaseDate = ?,
            PurchaseCost = ?, UsefulLife = ?, SalvageValue = ?, 
            DepreciationMethod = ?, AssetType = ?, PaymentMethod = ?,
            DebitAccount = ?, CreditAccount = ?, UpdatedAt = CURRENT_TIMESTAMP
        WHERE AssetId = ?
      `).run(
        AssetCode, TitleFa, Quantity, PurchaseDate,
        PurchaseCost, UsefulLife, SalvageValue,
        DepreciationMethod, AssetType, PaymentMethod,
        debitAcc, creditAcc,
        assetId
      );

      if (result.changes === 0) {
        throw new Error("به‌روزرسانی انجام نشد");
      }

      return { 
        success: true, 
        assetId: assetId,
        changes: result.changes
      };
    } catch (err) {
      throw err;
    }
  });

  try {
    const result = transaction();
    res.json({ 
      ...result,
      message: "دارایی با موفقیت به‌روزرسانی شد" 
    });
  } catch (err) {
    console.error("❌ خطا در به‌روزرسانی دارایی:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🗑️ حذف دارایی
router.delete('/:id', (req, res) => {
  const transaction = db.transaction(() => {
    try {
      const assetId = req.params.id;
      
      // بررسی وجود دارایی
      const asset = db.prepare("SELECT * FROM tblFixedAssets WHERE AssetId = ?").get(assetId);
      if (!asset) {
        throw new Error("دارایی یافت نشد");
      }

      // حذف اسناد حسابداری مرتبط
      const journalEntries = db.prepare(`
        SELECT EntryId FROM tblJournalEntries 
        WHERE SourceTable = 'tblFixedAssets' AND SourceId = ?
      `).all(assetId);

      journalEntries.forEach(entry => {
        db.prepare(`DELETE FROM tblJournalLines WHERE EntryId = ?`).run(entry.EntryId);
        db.prepare(`DELETE FROM tblJournalEntries WHERE EntryId = ?`).run(entry.EntryId);
      });

      // حذف دارایی
      const result = db.prepare("DELETE FROM tblFixedAssets WHERE AssetId = ?").run(assetId);

      return { 
        success: true, 
        assetId: assetId,
        deletedEntries: journalEntries.length
      };
    } catch (err) {
      throw err;
    }
  });

  try {
    const result = transaction();
    res.json({ 
      ...result,
      message: "دارایی و اسناد مرتبط با موفقیت حذف شدند" 
    });
  } catch (err) {
    console.error("❌ خطا در حذف دارایی:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 📊 گزارشات و آمار
router.get('/reports/summary', (req, res) => {
  try {
    const summary = db.prepare(`
      SELECT 
        COUNT(*) as totalAssets,
        SUM(PurchaseCost * Quantity) as totalValue,
        SUM((PurchaseCost - SalvageValue) / UsefulLife) as totalAnnualDepreciation,
        AssetType,
        COUNT(*) as countByType
      FROM tblFixedAssets 
      GROUP BY AssetType
    `).all();

    const depreciationSummary = db.prepare(`
      SELECT 
        SUM(CASE WHEN je.SourceTable = 'tblFixedAssets' AND jl.AccountCode LIKE '6%' THEN jl.DebitAmount ELSE 0 END) as totalDepreciationExpense,
        SUM(CASE WHEN je.SourceTable = 'tblFixedAssets' AND jl.AccountCode LIKE '12%' THEN jl.CreditAmount ELSE 0 END) as totalAccumulatedDepreciation
      FROM tblJournalEntries je
      JOIN tblJournalLines jl ON je.EntryId = jl.EntryId
      WHERE je.SourceTable = 'tblFixedAssets'
    `).get();

    // گزارش اسناد با TypeDoc = 'Fa'
    const faDocs = db.prepare(`
      SELECT 
        COUNT(*) as totalFaDocuments,
        SUM(TotalDebit) as totalFaAmount
      FROM (
        SELECT 
          je.EntryId,
          SUM(jl.DebitAmount) as TotalDebit,
          SUM(jl.CreditAmount) as TotalCredit
        FROM tblJournalEntries je
        JOIN tblJournalLines jl ON je.EntryId = jl.EntryId
        WHERE je.TypeDoc = 'FA' AND je.SourceTable = 'tblFixedAssets'
        GROUP BY je.EntryId
      )
    `).get();

    res.json({
      summary,
      depreciation: depreciationSummary,
      faDocuments: faDocs,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ خطا در دریافت گزارشات:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;