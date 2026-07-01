import express from 'express';
import db from '../db.js';

const router = express.Router();

// 🧾 ثبت فاکتور فروش + خطوط + تراکنش خروج + کاهش موجودی
router.post('/', (req, res) => {
  const {
    customerName,
    customerNationalCode,
    invoiceDate,
    description = '',
    discount = 0,
    lines = [],
    warehouseId = 1,
    factorNo = 0
  } = req.body;

  if (!customerName || !invoiceDate || !Array.isArray(lines) || lines.length === 0) {
    return res.status(400).json({ error: 'اطلاعات فاکتور یا اقلام ناقص است' });
  }

  const transaction = db.transaction(() => {
    const totalAmount = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
    const finalAmount = totalAmount - Number(discount || 0);

    // ثبت فاکتور اصلی
    const insertInvoice = db.prepare(`
      INSERT INTO tblSalesInvoice (
        customerName, customerNationalCode, invoiceDate,
        totalAmount, discount, description, factorNo
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const invoiceResult = insertInvoice.run(
      customerName, customerNationalCode, invoiceDate,
      finalAmount, discount, description, factorNo
    );
    const invoiceId = invoiceResult.lastInsertRowid;

    for (const line of lines) {
      const {
        itemCode, itemName, itemSpec = '', unit = '',
        quantity, unitPrice
      } = line;

      if (!itemCode || !itemName || quantity <= 0 || unitPrice <= 0) {
        throw new Error(`اطلاعات یکی از خطوط فروش نامعتبر است: ${itemCode}`);
      }

      // ثبت خط فاکتور
      db.prepare(`
        INSERT INTO tblSalesLines (
          invoiceId, itemCode, itemName, unit,
          quantity, unitPrice, factorNo
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(invoiceId, itemCode, itemName, unit, quantity, unitPrice, factorNo);

      // ثبت فروش در tblSale
      db.prepare(`
        INSERT INTO tblSale (
          ItemCode, ItemName, ItemSpec,
          CustomerName, CustomerNationalCode,
          Quantity, unitPrice, SaleDate,
          Description, IsPosted, factorNo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        itemCode, itemName, itemSpec,
        customerName, customerNationalCode,
        quantity, unitPrice, invoiceDate,
        `فروش ${itemName} به ${customerName}`, 0, factorNo
      );

      // ثبت تراکنش خروج انبار
      db.prepare(`
        INSERT INTO tblStockTransaction (
          transType, transDate, itemCode,
          warehouseId, quantity, reference,
          description, unitPrice, factorNo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'خروج', invoiceDate, itemCode,
        warehouseId, quantity,
        `فاکتور فروش ${invoiceId}`,
        `خروج کالا بابت فروش ${itemName}`,
        unitPrice, factorNo
      );

      // کاهش موجودی
      const current = db.prepare(`
        SELECT quantity FROM tblInventory
        WHERE itemCode = ? AND warehouseId = ?
      `).get(itemCode, warehouseId);

      if (!current || current.quantity < quantity) {
        throw new Error(`موجودی کافی برای کالا ${itemName} وجود ندارد`);
      }

      const newQty = current.quantity - quantity;
      db.prepare(`
        UPDATE tblInventory
        SET quantity = ?
        WHERE itemCode = ? AND warehouseId = ?
      `).run(newQty, itemCode, warehouseId);
    }

    return invoiceId;
  });

  try {
    const invoiceId = transaction();
    res.json({ success: true, invoiceId });
  } catch (err) {
    console.error('❌ خطا در ثبت فاکتور فروش:', err.message);
    res.status(400).json({ error: err.message });
  }
});

router.get("/last", (req, res) => {
  try {
    const row = db.prepare(`
      SELECT factorNo
      FROM tblSalesInvoice
      ORDER BY invoiceId DESC
      LIMIT 1
    `).get();

    if (row) {
      res.json({ factorNo: parseInt(row.factorNo, 10) });
    } else {
      res.json({ factorNo: 0 });
    }
  } catch (err) {
    console.error("❌ خطا در دریافت آخرین سند:", err.message);
    res.status(500).json({ error: "خطا در دریافت آخرین سند" });
  }
});


export default router;
