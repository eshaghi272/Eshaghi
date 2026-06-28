import db from '../db.js';
import { createAccountingEntry } from '../services/accounting.service.js';
import { getAccountSetting } from '../utils/accounting.js';

export const submitFullSalesInvoice = (req, res) => {
  const { invoice, lines } = req.body;

  if (!invoice || !Array.isArray(lines) || lines.length === 0) {
    return res.status(400).json({ error: "اطلاعات فاکتور یا اقلام ناقص است" });
  }

  try {
    const trx = db.transaction(() => {
      const warehouseId = invoice.warehouseId || 1;
      const factorNo = invoice.factorNo || `F-${Date.now()}`;
      let totalAmount = 0;

      // ثبت فاکتور در tblSalesInvoice
      const invoiceStmt = db.prepare(`
        INSERT INTO tblSalesInvoice (
          customerName, customerNationalCode, customerType,
          invoiceDate, totalAmount, discount, description, factorNo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const invoiceResult = invoiceStmt.run(
        invoice.customerName,
        invoice.customerNationalCode,
        invoice.customerType || null,
        invoice.invoiceDate,
        0, // مقدار اولیه، بعداً آپدیت می‌شود
        invoice.discount || 0,
        invoice.description || '',
        factorNo
      );

      const invoiceId = invoiceResult.lastInsertRowid;

      const lineStmt = db.prepare(`
        INSERT INTO tblSalesLines (
          invoiceId, itemCode, itemName, itemSpec, unit,
          quantity, unitPrice
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const saleStmt = db.prepare(`
        INSERT INTO tblSale (
          ItemCode, ItemName, ItemSpec,
          CustomerName, CustomerNationalCode,
          Quantity, UnitPrice, SaleDate, Description,
          IsPosted, factorNo, CustomerId
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const stockStmt = db.prepare(`
        INSERT INTO tblStockTransaction (
          transType, transDate, itemCode, warehouseId,
          quantity, reference, description, unitPrice, factorNo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const line of lines) {
        const amount = Number(line.quantity) * Number(line.unitPrice);
        totalAmount += amount;

        // ثبت خط فاکتور
        lineStmt.run(
          invoiceId,
          line.itemCode,
          line.itemName,
          line.itemSpec || '',
          line.unit || 'عدد',
          line.quantity,
          line.unitPrice
        );

        // ثبت فروش
        saleStmt.run(
          line.itemCode,
          line.itemName,
          line.itemSpec || '',
          invoice.customerName,
          invoice.customerNationalCode,
          line.quantity,
          line.unitPrice,
          invoice.invoiceDate,
          `فروش ${line.itemName} به ${invoice.customerName}`,
          1, // IsPosted
          factorNo,
          invoice.customerId || null
        );

        // ثبت تراکنش انبار
        stockStmt.run(
          'خروج',
          invoice.invoiceDate,
          line.itemCode,
          warehouseId,
          line.quantity,
          `فاکتور فروش ${invoiceId}`,
          `خروج کالا بابت فروش ${line.itemName}`,
          line.unitPrice,
          factorNo
        );
      }

      // آپدیت مبلغ کل فاکتور
      db.prepare(`UPDATE tblSalesInvoice SET totalAmount = ? WHERE invoiceId = ?`)
        .run(totalAmount, invoiceId);

      // صدور سند حسابداری
      const debitAcc = getAccountSetting('saleDebitAccount');
      const creditAcc = getAccountSetting('saleCreditAccount');

      if (!debitAcc || !creditAcc) {
        throw new Error('حساب‌های فروش در تنظیمات تعریف نشده‌اند');
      }

      const finalAmount = totalAmount - Number(invoice.discount || 0);

      createAccountingEntry({
        date: invoice.invoiceDate,
        docNumber: `INV-${invoiceId}`,
        description: `فاکتور فروش به ${invoice.customerName}`,
        sourceTable: 'tblSalesInvoice',
        sourceId: invoiceId,
        entries: [
          {
            AccountCode: debitAcc,
            DebitAmount: finalAmount,
            CreditAmount: 0,
            SubsidiaryId: invoice.customerNationalCode || null
          },
          {
            AccountCode: creditAcc,
            DebitAmount: 0,
            CreditAmount: finalAmount
          }
        ]
      });

      return invoiceId;
    });

    const invoiceId = trx();
    res.json({ success: true, message: "✅ فاکتور فروش ثبت شد", invoiceId });
  } catch (err) {
    console.error("❌ خطا در ثبت فاکتور فروش:", err.message);
    res.status(500).json({ error: "خطا در ثبت فاکتور فروش: " + err.message });
  }
};
