import express from 'express';
import db from '../db.js';

const router = express.Router();

// 📋 لیست دارایی‌ها
router.get('/', (req, res) => {
  try {
    const rows = db.prepare(`SELECT * FROM tblFixedAssets ORDER BY AssetId DESC`).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ➕ ثبت دارایی ثابت جدید
router.post('/', (req, res) => {
  try {
    const {
      AssetCode,
      TitleFa,
      Quantity,
      PurchaseDate,
      PurchaseCost,
      UsefulLife,
      SalvageValue,
      DepreciationMethod
    } = req.body;

    const stmt = db.prepare(`
      INSERT INTO tblFixedAssets
      (AssetCode, TitleFa, Quantity, PurchaseDate, PurchaseCost, UsefulLife, SalvageValue, DepreciationMethod)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      AssetCode,
      TitleFa,
      Quantity,
      PurchaseDate,
      PurchaseCost,
      UsefulLife,
      SalvageValue,
      DepreciationMethod
    );

    res.json({ success: true, AssetId: result.lastInsertRowid });
  } catch (err) {
    console.error("❌ خطا در ثبت دارایی:", err.message);
    res.status(500).json({ error: 'خطای داخلی سرور: ' + err.message });
  }
});

// ✏️ ویرایش دارایی ثابت
router.put('/:assetId', (req, res) => {
  try {
    const { assetId } = req.params;
    const {
      AssetCode,
      TitleFa,
      Quantity,
      PurchaseDate,
      PurchaseCost,
      UsefulLife,
      SalvageValue,
      DepreciationMethod
    } = req.body;

    const stmt = db.prepare(`
      UPDATE tblFixedAssets
      SET AssetCode = ?, TitleFa = ?, Quantity=?, PurchaseDate = ?, PurchaseCost = ?, UsefulLife = ?, SalvageValue = ?, DepreciationMethod = ?
      WHERE AssetId = ?
    `);

    const result = stmt.run(
      AssetCode,
      TitleFa,
      Quantity,
      PurchaseDate,
      PurchaseCost,
      UsefulLife,
      SalvageValue,
      DepreciationMethod,
      assetId
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: "دارایی یافت نشد" });
    }

    res.json({ success: true, AssetId: assetId });
  } catch (err) {
    console.error("❌ خطا در ویرایش دارایی:", err.message);
    res.status(500).json({ error: 'خطای داخلی سرور: ' + err.message });
  }
});

// 🗑️ حذف دارایی ثابت
router.delete('/:assetId', (req, res) => {
  try {
    const { assetId } = req.params;

    const stmt = db.prepare(`DELETE FROM tblFixedAssets WHERE AssetId = ?`);
    const result = stmt.run(assetId);

    if (result.changes === 0) {
      return res.status(404).json({ error: "دارایی یافت نشد" });
    }

    res.json({ success: true, AssetId: assetId });
  } catch (err) {
    console.error("❌ خطا در حذف دارایی:", err.message);
    res.status(500).json({ error: 'خطای داخلی سرور: ' + err.message });
  }
});

// ➕ ثبت محاسبه استهلاک برای یک دارایی
router.post('/:assetId/depreciation', (req, res) => {
  try {
    const { assetId } = req.params;
    const { Period } = req.body;

    const asset = db.prepare(`SELECT * FROM tblFixedAssets WHERE AssetId = ?`).get(assetId);
    if (!asset) return res.status(404).json({ error: "دارایی یافت نشد" });

    const depExpense = (asset.PurchaseCost - asset.SalvageValue) / asset.UsefulLife;

    const prev = db.prepare(`
      SELECT SUM(DepAmount) AS AccDep FROM tblDepreciationEntries WHERE AssetId = ?
    `).get(assetId);

    const accumulated = (prev?.AccDep || 0) + depExpense;
    const netBookValue = asset.PurchaseCost - accumulated;

    const stmt = db.prepare(`
      INSERT INTO tblDepreciationEntries (AssetId, Period, DepAmount, AccumulatedDep, NetBookValue)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(assetId, Period, depExpense, accumulated, netBookValue);

    res.json({
      success: true,
      AssetId: assetId,
      Period,
      DepAmount: depExpense,
      AccumulatedDep: accumulated,
      NetBookValue: netBookValue
    });
  } catch (err) {
    console.error("❌ خطا در ثبت استهلاک:", err.message);
    res.status(500).json({ error: 'خطای داخلی سرور: ' + err.message });
  }
});


// ثبت محاسبه استهلاک برای یک دارایی
router.post('/:assetId/depreciation', (req, res) => {
  try {
    const { assetId } = req.params;
    const { Period } = req.body; // مثلاً "1405-01"

    // دریافت اطلاعات دارایی
    const asset = db.prepare(`SELECT * FROM tblFixedAssets WHERE AssetId = ?`).get(assetId);
    if (!asset) return res.status(404).json({ error: "دارایی یافت نشد" });

    // محاسبه استهلاک (روش خط مستقیم)
    const depExpense = (asset.PurchaseCost - asset.SalvageValue) / asset.UsefulLife;

    // جمع استهلاک‌های قبلی
    const prev = db.prepare(`SELECT SUM(DepAmount) AS AccDep FROM tblDepreciationEntries WHERE AssetId = ?`).get(assetId);
    const accumulated = (prev?.AccDep || 0) + depExpense;

    // ارزش دفتری خالص
    const netBookValue = asset.PurchaseCost - accumulated;

    // ذخیره در جدول استهلاک
    const stmt = db.prepare(`
      INSERT INTO tblDepreciationEntries (AssetId, Period, DepAmount, AccumulatedDep, NetBookValue)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(assetId, Period, depExpense, accumulated, netBookValue);

    res.json({
      success: true,
      AssetId: assetId,
      Period,
      DepAmount: depExpense,
      AccumulatedDep: accumulated,
      NetBookValue: netBookValue
    });
  } catch (err) {
    console.error("❌ خطا در ثبت استهلاک:", err.message);
    res.status(500).json({ error: 'خطای داخلی سرور: ' + err.message });
  }
});

// ثبت دارایی و سند حسابداری
router.post("/fixedassets", (req, res) => {
  try {
    const {
      AssetCode, TitleFa, PurchaseDate,
      Quantity, PurchaseCost, UsefulLife,
      SalvageValue, DepreciationMethod,
      payType // 'cash' | 'payable' | 'capital'
    } = req.body;

    // ذخیره دارایی
    const result = db.prepare(`
      INSERT INTO tblFixedAssets
      (AssetCode, TitleFa, PurchaseDate, Quantity, PurchaseCost, UsefulLife, SalvageValue, DepreciationMethod)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      AssetCode, TitleFa, PurchaseDate, Quantity,
      PurchaseCost, UsefulLife, SalvageValue, DepreciationMethod
    );

    const assetId = result.lastInsertRowid;

    // انتخاب حساب بستانکار
    const getSetting = db.prepare(`SELECT settingValue FROM tblSystemSettings WHERE settingKey = ?`);
    let creditAcc;
    if (payType === "cash") creditAcc = getSetting.get("assetCreditAccount")?.settingValue;
    else if (payType === "payable") creditAcc = getSetting.get("assetPayableAccount")?.settingValue;
    else if (payType === "capital") creditAcc = getSetting.get("assetCapitalAccount")?.settingValue;

    if (!creditAcc) throw new Error("حساب بستانکار برای خرید دارایی تعریف نشده است");

    // صدور سند حسابداری
    const docNumber = `ASSET-${assetId}-${Date.now()}`;
    const description = `ثبت خرید دارایی ثابت ${TitleFa}`;

    const entryInfo = db.prepare(`
      INSERT INTO tblJournalEntries (DocumentNumber, Description, EntryDate, SourceTable, SourceId, IsBalanced)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(docNumber, description, PurchaseDate, "tblFixedAssets", assetId, 1);

    const entryId = entryInfo.lastInsertRowid;

    const insertLine = db.prepare(`
      INSERT INTO tblJournalLines (EntryId, AccountCode, DebitAmount, CreditAmount, SubsidiaryId)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertLine.run(entryId, AssetCode, PurchaseCost, 0, null);   // بدهکار
    insertLine.run(entryId, creditAcc, 0, PurchaseCost, null);   // بستانکار

    res.json({ success: true, assetId, entryId, message: "دارایی و سند حسابداری ثبت شد" });
  } catch (err) {
    console.error("❌ خطا در ثبت دارایی:", err.message);
    res.status(500).json({ error: "خطای داخلی سرور: " + err.message });
  }
});

// صدور سند خرید دارایی مجدد
router.post("/fixedassets/:id/generate-entry", (req, res) => {
  const assetId = req.params.id;
  const asset = db.prepare("SELECT * FROM tblFixedAssets WHERE AssetId=?").get(assetId);
  if (!asset) return res.status(404).json({ error: "دارایی یافت نشد" });

  const docNumber = `ENTRY-${assetId}-${Date.now()}`;
  const description = `صدور سند خرید برای دارایی ${asset.TitleFa}`;

  const entryInfo = db.prepare(`
    INSERT INTO tblJournalEntries (DocumentNumber, Description, EntryDate, SourceTable, SourceId, IsBalanced)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(docNumber, description, asset.PurchaseDate, "tblFixedAssets", assetId, 1);

  res.json({ success: true, entryId: entryInfo.lastInsertRowid, message: "سند خرید صادر شد" });
});

// صدور سند استهلاک
router.post("/fixedassets/:id/generate-depreciation", (req, res) => {
  const assetId = req.params.id;
  const asset = db.prepare("SELECT * FROM tblFixedAssets WHERE AssetId=?").get(assetId);
  if (!asset) return res.status(404).json({ error: "دارایی یافت نشد" });

  const annualDep = (asset.PurchaseCost - asset.SalvageValue) / asset.UsefulLife;

  const docNumber = `DEP-${assetId}-${Date.now()}`;
  const description = `ثبت استهلاک دارایی ${asset.TitleFa}`;

  const entryInfo = db.prepare(`
    INSERT INTO tblJournalEntries (DocumentNumber, Description, EntryDate, SourceTable, SourceId, IsBalanced)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(docNumber, description, new Date().toISOString().slice(0,10), "tblFixedAssets", assetId, 1);

  res.json({ success: true, entryId: entryInfo.lastInsertRowid, depreciation: annualDep, message: "سند استهلاک صادر شد" });
});



export default router;
