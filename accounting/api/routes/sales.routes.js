import express from 'express';
import db from '../db.js';

const router = express.Router();
const table = 'tblSale';
const pk = 'SaleId';

// 📥 دریافت همه فروش‌ها
router.get('/', (req, res) => {
  try {
    const rows = db.prepare(`SELECT * FROM ${table} ORDER BY SaleDate DESC`).all();
    res.json(rows);
  } catch (err) {
    console.error('❌ خطا در دریافت لیست فروش‌ها:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

router.get("/last", (req, res) => {
  try {
    const row = db.prepare(`
      SELECT factorNo
      FROM tblSale
      ORDER BY SaleId DESC
      LIMIT 1
    `).get();

    if (row) {
      res.json({ lastNumber: parseInt(row.factorNo, 10) });
    } else {
      res.json({ lastNumber: 0 });
    }
  } catch (err) {
    console.error("❌ خطا در دریافت آخرین سند:", err.message);
    res.status(500).json({ error: "خطا در دریافت آخرین سند" });
  }
});


router.post('/bulk', (req, res) => {
  const dbTransaction = db.transaction((payload) => {
    const {
      customerName,
      customerNationalCode,
      customerId = null,
      saleDate,
      factorNo = 0,
      description = '',
      warehouseId = 1,
      discount = 0,
      lines
    } = payload;

    if (!customerName || !saleDate || !Array.isArray(lines) || lines.length === 0) {
      throw new Error('اطلاعات مشتری یا لیست فروش ناقص است');
    }

    const totalAmount = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
    const finalAmount = totalAmount - Number(discount || 0);

    // ثبت فاکتور در tblSalesInvoice
    const insertInvoice = db.prepare(`
      INSERT INTO tblSalesInvoice (
        customerName, customerNationalCode, invoiceDate,
        totalAmount, discount, description, factorNo
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const invoiceResult = insertInvoice.run(
      customerName, customerNationalCode, saleDate,
      finalAmount, discount, description, factorNo
    );
    const invoiceId = invoiceResult.lastInsertRowid;

    const saleIds = [];

    for (const line of lines) {
      const {
        itemCode,
        itemName,
        itemSpec = '',
        unit = '',
        quantity,
        unitPrice
      } = line;

      if (!itemCode || !itemName || quantity == null || quantity <= 0 || unitPrice == null || unitPrice <= 0) {
        throw new Error(`اطلاعات یکی از خطوط فروش ناقص یا نامعتبر است: ${itemCode}`);
      }

      // بررسی موجودی قبل از خروج
      const current = db.prepare(`
        SELECT quantity FROM tblInventory
        WHERE itemCode = ? AND warehouseid = ?
      `).get(itemCode, warehouseId);

      if (!current || current.quantity < quantity) {
        throw new Error(`موجودی کافی برای کالا ${itemName} وجود ندارد`);
      }

      // ثبت خط فاکتور در tblSalesLines
      db.prepare(`
        INSERT INTO tblSalesLines (
          invoiceId, itemCode, itemName, unit,
          quantity, unitPrice, factorNo
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(invoiceId, itemCode, itemName, unit, quantity, unitPrice, factorNo);

      // ثبت فروش در tblSale
      const insertSale = db.prepare(`
        INSERT INTO tblSale (
          ItemCode, ItemName, ItemSpec,
          CustomerName, CustomerNationalCode,
          Quantity, unitPrice, SaleDate,
          Description, IsPosted, factorNo, CustomerId
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const saleResult = insertSale.run(
        itemCode, itemName, itemSpec,
        customerName, customerNationalCode,
        quantity, unitPrice, saleDate,
        `فروش ${itemName} به ${customerName}`, 0, factorNo, customerId
      );

      const saleId = saleResult.lastInsertRowid;
      saleIds.push(saleId);

      // ثبت تراکنش خروج انبار
      db.prepare(`
        INSERT INTO tblStockTransaction (
          transType, transDate, itemCode,
          warehouseId, quantity, reference,
          description, unitPrice, factorNo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'خروج', saleDate, itemCode,
        warehouseId, quantity,
        `فاکتور فروش ${invoiceId}`,
        `خروج کالا بابت فروش ${itemName}`,
        unitPrice, factorNo
      );

      // کاهش موجودی
      const newQty = current.quantity - quantity;
      db.prepare(`
        UPDATE tblInventory
        SET quantity = ?
        WHERE itemCode = ? AND warehouseid = ?
      `).run(newQty, itemCode, warehouseId);
    }

    return { invoiceId, saleIds };
  });

  try {
    const result = dbTransaction(req.body);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('❌ خطا در ثبت فروش گروهی:', err.message);
    res.status(400).json({ error: err.message });
  }
});


// 📥 دریافت یک فروش خاص
router.get('/:id', (req, res) => {
  try {
    const row = db.prepare(`SELECT * FROM ${table} WHERE ${pk} = ?`).get(req.params.id);
    res.json(row || {});
  } catch (err) {
    console.error('❌ خطا در دریافت فروش:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// ➕ ثبت فروش جدید
router.post('/', (req, res) => {
  try {
    const {
      ItemCode, ItemName, ItemSpec = '',
      CustomerName, CustomerNationalCode = '',
      Quantity, unitPrice, SaleDate,
      Description = '', IsPosted = 0, factorNo = 0, CustomerId = null
    } = req.body;

    if (!ItemCode || !ItemName || !CustomerName || !Quantity || !unitPrice || !SaleDate) {
      return res.status(400).json({ error: 'اطلاعات فروش ناقص یا نامعتبر است' });
    }

    const sql = `
      INSERT INTO ${table} (
        ItemCode, ItemName, ItemSpec,
        CustomerName, CustomerNationalCode,
        Quantity, unitPrice, SaleDate,
        Description, IsPosted, factorNo, CustomerId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = db.prepare(sql).run(
      ItemCode, ItemName, ItemSpec,
      CustomerName, CustomerNationalCode,
      Quantity, unitPrice, SaleDate,
      Description, IsPosted, factorNo, CustomerId
    );

    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    console.error('❌ خطا در ثبت فروش:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✏️ بروزرسانی فروش
router.put('/:id', (req, res) => {
  try {
    const data = req.body;
    const keys = Object.keys(data);
    const fields = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => data[k]);
    const sql = `UPDATE ${table} SET ${fields} WHERE ${pk} = ?`;
    const result = db.prepare(sql).run(...values, req.params.id);
    res.json({ success: true, changes: result.changes });
  } catch (err) {
    console.error('❌ خطا در بروزرسانی فروش:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🗑️ حذف فروش
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare(`DELETE FROM ${table} WHERE ${pk} = ?`).run(req.params.id);
    res.json({ deleted: result.changes });
  } catch (err) {
    console.error('❌ خطا در حذف فروش:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// 🔍 جستجوی شرطی فروش‌ها
router.post('/search', (req, res) => {
  try {
    const { where, params = [] } = req.body;
    const rows = db.prepare(`SELECT * FROM ${table} WHERE ${where} ORDER BY SaleDate DESC`).all(...params);
    res.json(rows);
  } catch (err) {
    console.error('❌ خطا در جستجوی فروش‌ها:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

export default router;
