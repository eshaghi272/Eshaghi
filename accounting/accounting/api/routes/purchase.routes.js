import express from 'express';
import db from '../db.js';

const router = express.Router();
const table = 'tblPurchase';
const pk = 'PurchaseId';

// 📥 دریافت همه خریدها
router.get('/', (req, res) => {
  try {
    const rows = db.prepare(`SELECT * FROM ${table} ORDER BY PurchaseDate DESC`).all();
    res.json(rows);
  } catch (err) {
    console.error('❌ خطا در دریافت لیست خریدها:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// 📥 دریافت یک خرید خاص
router.get('/:id', (req, res) => {
  try {
    const row = db.prepare(`SELECT * FROM ${table} WHERE ${pk} = ?`).get(req.params.id);
    res.json(row || {});
  } catch (err) {
    console.error('❌ خطا در دریافت خرید:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

router.post('/', (req, res) => {
  try {
    const {
      ItemCode,
      ItemName,
      ItemSpec = '',
      SupplierName,
      SupplierNationalCode = '',
      Quantity,
      unitPrice,
      PurchaseDate,
      Description = '',
      IsPosted = 0,
      factorNo = 0
    } = req.body;

    // اعتبارسنجی اولیه
    if (
      !ItemCode || !ItemName || !SupplierName || !PurchaseDate ||
      Quantity == null || unitPrice == null
    ) {
      return res.status(400).json({ error: 'اطلاعات خرید ناقص یا نامعتبر است' });
    }

    // ثبت در دیتابیس
    const sql = `
      INSERT INTO ${table} (
        ItemCode, ItemName, ItemSpec,
        SupplierName, SupplierNationalCode,
        Quantity, unitPrice, PurchaseDate,
        Description, IsPosted, factorNo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = db.prepare(sql).run(
      ItemCode, ItemName, ItemSpec,
      SupplierName, SupplierNationalCode,
      Quantity, unitPrice, PurchaseDate,
      Description, IsPosted, factorNo
    );

    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    console.error('❌ خطا در ثبت خرید:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});




router.post('/full', (req, res) => {
  const dbTransaction = db.transaction((data) => {
    const {
      itemCode,
      itemName,
      itemSpec = '',
      supplierName,
      supplierNationalCode = '',
      quantity,
      unitPrice,
      purchaseDate,
      description = '',
      isPosted = 0,
      factorNo = 0,
      warehouseId = 1
    } = data;

    // اعتبارسنجی دقیق
    if (!itemCode) throw new Error('کد کالا ارسال نشده');
    if (!itemName) throw new Error('نام کالا ارسال نشده');
    if (!supplierName) throw new Error('نام فروشنده ارسال نشده');
    if (!purchaseDate) throw new Error('تاریخ خرید ارسال نشده');
    if (quantity == null || quantity <= 0) throw new Error('تعداد نامعتبر است');
    if (unitPrice == null || unitPrice <= 0) throw new Error('قیمت واحد نامعتبر است');

    // ثبت خرید
    const insertPurchase = db.prepare(`
      INSERT INTO tblPurchase (
        ItemCode, ItemName, ItemSpec,
        SupplierName, SupplierNationalCode,
        Quantity, unitPrice, PurchaseDate,
        Description, IsPosted, factorNo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const purchaseResult = insertPurchase.run(
      itemCode, itemName, itemSpec,
      supplierName, supplierNationalCode,
      quantity, unitPrice, purchaseDate,
      description, isPosted, factorNo
    );

    const purchaseId = purchaseResult.lastInsertRowid;

    // ثبت تراکنش انبار
    const insertStock = db.prepare(`
      INSERT INTO tblStockTransaction (
        transType, transDate, itemCode,
        warehouseId, quantity, reference,
        description, unitPrice, factorNo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertStock.run(
      'ورود', purchaseDate, itemCode,
      warehouseId, quantity,
      `رسید خرید ${purchaseId}`,
      `ورود کالا بابت خرید ${itemName}`,
      unitPrice, factorNo
    );

    // افزایش موجودی
    const current = db.prepare(`
      SELECT quantity FROM tblInventory
      WHERE itemCode = ? AND warehouseId = ?
    `).get(itemCode, warehouseId);

    if (current) {
      const newQty = current.quantity + quantity;
      db.prepare(`
        UPDATE tblInventory
        SET quantity = ?
        WHERE itemCode = ? AND warehouseId = ?
      `).run(newQty, itemCode, warehouseId);
    } else {
      db.prepare(`
        INSERT INTO tblInventory (itemCode, warehouseId, quantity)
        VALUES (?, ?, ?)
      `).run(itemCode, warehouseId, quantity);
    }

    return purchaseId;
  });

  try {
    const id = dbTransaction(req.body);
    res.json({ success: true, purchaseId: id });
  } catch (err) {
    console.error('❌ خطا در ثبت خرید کامل:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// 📦 دریافت آخرین قیمت خرید کالا بر اساس itemCode
router.get('/:itemCode', (req, res) => {
  const itemCode = Number(req.params.itemCode);
  if (!itemCode) return res.status(400).json({ error: 'کد کالا نامعتبر است' });

  try {
    const row = db.prepare(`
      SELECT unitPrice
      FROM tblPurchase
      WHERE itemCode = ?
      ORDER BY PurchaseDate DESC, PurchaseId DESC
      LIMIT 1
    `).get(itemCode);

    if (!row) return res.status(404).json({ error: 'قیمت برای این کالا یافت نشد' });

    res.json({ unitPrice: row.unitPrice });
  } catch (err) {
    console.error('❌ خطا در دریافت قیمت کالا:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// ✏️ بروزرسانی خرید



router.put('/:id', (req, res) => {
  try {
    const data = { ...req.body };
    delete data[pk]; // جلوگیری از بروزرسانی کلید اصلی

    const keys = Object.keys(data);
    if (keys.length === 0) {
      return res.status(400).json({ error: 'هیچ فیلدی برای بروزرسانی ارسال نشده' });
    }

    const fields = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => data[k]);

    const sql = `UPDATE ${table} SET ${fields} WHERE ${pk} = ?`;
    const result = db.prepare(sql).run(...values, req.params.id);

    res.json({ success: true, changes: result.changes });
  } catch (err) {
    console.error('❌ خطا در بروزرسانی خرید:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// 🗑️ حذف خرید
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare(`DELETE FROM ${table} WHERE ${pk} = ?`).run(req.params.id);
    res.json({ success: true, deleted: result.changes });
  } catch (err) {
    console.error('❌ خطا در حذف خرید:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// 🔍 جستجوی شرطی خریدها
router.post('/search', (req, res) => {
  try {
    const { where, params = [] } = req.body;

    if (!where || typeof where !== 'string') {
      return res.status(400).json({ error: 'عبارت شرطی معتبر نیست' });
    }

    const rows = db.prepare(`SELECT * FROM ${table} WHERE ${where} ORDER BY PurchaseDate DESC`).all(...params);
    res.json(rows);
  } catch (err) {
    console.error('❌ خطا در جستجوی خریدها:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

export default router;
