import db from '../db.js';

// تشخیص کلید اصلی هر جدول به‌صورت ایمن و قابل توسعه
export function getPrimaryKey(table) {
  const normalized = table?.trim().toLowerCase();

  const map = {
    "tblacc": "accCode",
    "tblaccountgroups": "GroupCode",
    "tblaccounts": "AccountCode",
    "tblcontactmessages": "id",
    "tblinventory": "id",
    "tblitemgroup": "groupId",
    "tblitems": "id",
    "tbljournalentries": "EntryId",
    "tbljournallines": "LineId",
    "tblpersons": "id",
    "tblstocktransaction": "transId",
    "tblusergroups": "id",
    "tbluserroles": "id",
    "tblusers": "id",
    "tbluser_permissions": "userid",
    "tblwarehouse": "id",
    "tblpurchase": "PurchaseId",
    "tblsalesinvoice": "invoiceId",
    "tblsaleslines": "lineId",
    "tblsale": "SaleId"
  };

  return map[normalized] || "id";
}

// گرفتن همه رکوردها
export const getAllRecords = (req, res) => {
  const { table } = req.params;
  if (!table) return res.status(400).json({ error: 'نام جدول ارسال نشده است' });

  try {
    const stmt = db.prepare(`SELECT * FROM ${table}`);
    const rows = stmt.all();
    res.json(rows);
  } catch (err) {
    console.error('❌ خطا در دریافت لیست:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
};

// گرفتن یک رکورد خاص
export const getRecord = (req, res) => {
  const { table, id } = req.params;
  if (!table || !id) return res.status(400).json({ error: 'پارامترهای ناقص' });

  const pk = getPrimaryKey(table);

  try {
    const stmt = db.prepare(`SELECT * FROM ${table} WHERE ${pk} = ?`);
    const row = stmt.get(id);
    res.json(row || {});
  } catch (err) {
    console.error('❌ خطا در دریافت رکورد:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
};

// ثبت داده جدید
export const insertRecord = (req, res) => {
  const { table } = req.params;
  const data = req.body;

  if (!table || !data || typeof data !== "object") {
    return res.status(400).json({ error: "پارامترهای ناقص یا داده نامعتبر" });
  }

  try {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => "?").join(", ");
    const sql = `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${placeholders})`;

    const stmt = db.prepare(sql);
    const result = stmt.run(...values);
    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    console.error("❌ خطا در درج داده:", err.message);
    res.status(500).json({ error: err.message || "خطای داخلی سرور" });
  }
};

// بروزرسانی داده
export const updateRecord = (req, res) => {
  const { table, id } = req.params;
  const data = req.body;

  if (!table || !id || !data || typeof data !== "object") {
    return res.status(400).json({ error: "پارامترهای ناقص یا داده نامعتبر" });
  }

  try {
    const pkInfo = db.prepare(`PRAGMA table_info(${table})`).all();
    const pkField = pkInfo.find((col) => col.pk === 1)?.name;

    if (!pkField) {
      return res.status(400).json({ error: `کلید اصلی برای جدول ${table} یافت نشد` });
    }

    const keys = Object.keys(data).filter((k) => data[k] !== undefined);
    if (keys.length === 0) {
      return res.status(400).json({ error: "هیچ فیلدی برای بروزرسانی ارسال نشده است" });
    }

    const fields = keys.map((key) => `${key} = ?`).join(", ");
    const values = keys.map((key) => data[key]);

    const sql = `UPDATE ${table} SET ${fields} WHERE ${pkField} = ?`;
    const stmt = db.prepare(sql);
    const result = stmt.run(...values, id);

    res.json({ success: true, changes: result.changes });
  } catch (err) {
    console.error("❌ خطا در بروزرسانی:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// حذف داده
export const deleteRecord = (req, res) => {
  const { table, id } = req.params;
  if (!table || !id) {
    return res.status(400).json({ error: "پارامترهای ناقص" });
  }

  const pk = getPrimaryKey(table);

  try {
    const stmt = db.prepare(`DELETE FROM ${table} WHERE ${pk} = ?`);
    const result = stmt.run(id);
    res.json({ deleted: result.changes });
  } catch (err) {
    console.error('❌ خطا در حذف:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
};

// جستجوی شرطی
export const searchRecords = (req, res) => {
  const { table } = req.params;
  const { where, params } = req.body;

  if (!table || !where) return res.status(400).json({ error: 'پارامترهای ناقص' });

  try {
    const stmt = db.prepare(`SELECT * FROM ${table} WHERE ${where}`);
    const rows = stmt.all(...(params || []));
    res.json(rows);
  } catch (err) {
    console.error('❌ خطا در جستجو:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
};

// گرفتن آخرین قیمت خرید برای یک کالا
export const getLatestPurchasePrice = (req, res) => {
  console.log("✅ کنترلر قیمت کالا اجرا شد");

  const code = Number(req.params.itemCode);
  if (isNaN(code)) {
    console.log("❌ کد کالا نامعتبر:", req.params.itemCode);
    return res.status(400).json({ error: "کد کالا نامعتبر است" });
  }

  try {
    const row = db.prepare(`
      SELECT unitPrice
      FROM tblPurchase
      WHERE ItemCode = ?
        AND Quantity > 0
      ORDER BY PurchaseDate DESC
      LIMIT 1
    `).get(code);

    console.log(`📦 درخواست قیمت برای کالا: ${code}`);
    console.log("📦 نتیجه کامل:", row);

    const unitPrice = row?.unitPrice ?? row?.unitPrice;
    if (unitPrice == null) {
      return res.status(404).json({ error: "قیمت برای این کالا یافت نشد" });
    }

    res.json({ unitPrice });
  } catch (err) {
    console.error("❌ خطا در دریافت قیمت خرید:", err);
    res.status(500).json({ error: "خطای داخلی سرور" });
  }
};


export const getKardex = (req, res) => {
  const { itemCode } = req.params;

  if (!itemCode || isNaN(itemCode)) {
    return res.status(400).json({ error: "کد کالا معتبر نیست" });
  }

  try {
    const query = `
      SELECT
        transDate,
        transType,
        reference,
        quantity,
        unitPrice,
        description
      FROM tblStockTransaction
      WHERE itemCode = ?
      ORDER BY transDate, transType DESC, transId;
    `;

    const rows = db.prepare(query).all(itemCode);

    let balance = 0;
    const result = rows.map(row => {
  const isEntry = row.transType === "ورود";
  balance += isEntry ? row.quantity : -row.quantity;

  const amount = row.unitPrice ? row.quantity * row.unitPrice : null;

  return {
    تاریخ: row.transDate,
    وارده: isEntry ? row.quantity : null,
    صادره: !isEntry ? row.quantity : null,
    سند: row.reference,
    مقدار: row.quantity,
    مبلغ: row.unitPrice,
    توضیح: row.description,
    مبلغ: amount,
    مانده: balance
  };
});

    res.json(result);
  } catch (err) {
    console.error("❌ خطا در واکشی کاردکس:", err);
    res.status(500).json({ error: "خطا در واکشی کاردکس کالا" });
  }
};

export const submitSaleTransaction = (req, res) => {
  const {
    itemCode,
    itemName,
    itemSpec = "",
    customerName,
    customerNationalCode,
    quantity,
    unitPrice,
    saleDate,
    description,
    invoiceId = null,
    warehouseId = 1
  } = req.body;

  // اعتبارسنجی اولیه
  if (
    !itemCode || !itemName || !customerName ||
    !quantity || isNaN(quantity) ||
    !unitPrice || isNaN(unitPrice) ||
    !saleDate
  ) {
    return res.status(400).json({ error: "اطلاعات فروش ناقص یا نامعتبر است" });
  }

  try {
    const trx = db.transaction(() => {
      // ✅ ثبت در tblSale
      const saleStmt = db.prepare(`
        INSERT INTO tblSale (
          ItemCode, ItemName, ItemSpec,
          CustomerName, CustomerNationalCode,
          Quantity, UnitPrice, SaleDate, Description
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const saleResult = saleStmt.run(
        itemCode, itemName, itemSpec,
        customerName, customerNationalCode,
        quantity, unitPrice, saleDate, description
      );

      const saleId = saleResult.lastInsertRowid;

      // ✅ ثبت در tblStockTransaction با UnitPrice صحیح
      const stockStmt = db.prepare(`
        INSERT INTO tblStockTransaction (
          transType, transDate, itemCode,
          warehouseId, quantity, reference, description, UnitPrice
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stockStmt.run(
        "خروج", saleDate, itemCode,
        warehouseId, quantity,
        invoiceId ? `فاکتور فروش ${invoiceId}` : `فروش ${saleId}`,
        `خروج کالا بابت فروش ${itemName}`,
        unitPrice // ✅ مقدار صحیح برای ستون UnitPrice
      );

      // ✅ ثبت در tblSalesLines اگر invoiceId موجود باشد
      if (invoiceId) {
        const lineStmt = db.prepare(`
          INSERT INTO tblSalesLines (
            invoiceId, itemCode, itemName, unit,
            quantity, UnitPrice
          ) VALUES (?, ?, ?, ?, ?, ?)
        `);

        lineStmt.run(
          invoiceId, itemCode, itemName, "عدد", quantity, unitPrice
        );
      }
    });

    trx(); // اجرای تراکنش

    res.json({ success: true, message: "✅ فروش با موفقیت ثبت شد" });
  } catch (err) {
    console.error("❌ خطا در ثبت فروش:", err);
    res.status(500).json({ error: "خطا در ثبت فروش" });
  }
};

export const submitFullInvoice = (req, res) => {
  const { invoice, lines } = req.body;

  // اعتبارسنجی اولیه
  if (!invoice || !Array.isArray(lines) || lines.length === 0) {
    return res.status(400).json({ error: "اطلاعات فاکتور یا اقلام ناقص است" });
  }

  try {
    const trx = db.transaction(() => {
      // ✅ ثبت فاکتور در tblSalesInvoice با اطلاعات اولین قلم
      const firstLine = lines[0];
      const invoiceStmt = db.prepare(`
        INSERT INTO tblSalesInvoice (
          customerName, customerNationalCode, invoiceDate,
          totalAmount, discount, description,
          unit, itemCode, itemName, itemSpec, quantity, unitPrice
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const invoiceResult = invoiceStmt.run(
        invoice.customerName,
        invoice.customerNationalCode,
        invoice.invoiceDate,
        invoice.totalAmount,
        invoice.discount,
        invoice.description,
        firstLine.unit || "",
        firstLine.itemCode,
        firstLine.itemName,
        firstLine.itemSpec || "",
        firstLine.quantity,
        firstLine.unitPrice
      );

      const invoiceId = invoiceResult.lastInsertRowid;

      // ✅ ثبت اقلام فروش و تراکنش انبار برای هر قلم
      const saleStmt = db.prepare(`
        INSERT INTO tblSale (
          ItemCode, ItemName, ItemSpec,
          CustomerName, CustomerNationalCode,
          Quantity, unitPrice, SaleDate, Description
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const stockStmt = db.prepare(`
        INSERT INTO tblStockTransaction (
          transType, transDate, itemCode,
          warehouseId, quantity, reference, description, unitPrice
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const line of lines) {
        // اعتبارسنجی قیمت
        if (!line.unitPrice || isNaN(line.unitPrice)) {
          throw new Error(`قیمت کالا ${line.itemName} نامعتبر است`);
        }

        // ثبت در tblSale
        saleStmt.run(
          line.itemCode,
          line.itemName,
          line.itemSpec || "",
          invoice.customerName,
          invoice.customerNationalCode,
          line.quantity,
          line.unitPrice,
          invoice.invoiceDate,
          `فروش ${line.itemName} به ${invoice.customerName}`
        );

        // ثبت در tblStockTransaction با unitPrice
        stockStmt.run(
          "خروج",
          invoice.invoiceDate,
          line.itemCode,
          1,
          line.quantity,
          `فاکتور فروش ${invoiceId}`,
          `خروج کالا بابت فروش ${line.itemName}`,
          line.unitPrice // ✅ این خط اصلاح شد
        );
      }
    });

    trx(); // اجرای تراکنش

    res.json({ success: true, message: "✅ فاکتور و فروش با موفقیت ثبت شد", invoiceId });
  } catch (err) {
    console.error("❌ خطا در ثبت فاکتور کامل:", err);
    res.status(500).json({ error: "خطا در ثبت فاکتور کامل" });
  }
};

/**
 * صدور سند حسابداری برای لیست فروش‌ها
 * @param {number[]} saleIds - لیست شناسه‌های فروش
 * @returns {object} نتیجه عملیات
 */
export function generateSaleEntries(saleIds = []) {
  if (!Array.isArray(saleIds) || saleIds.length === 0) {
    return { success: false, error: "لیست فروش‌ها خالی است" };
  }

  try {
    const trx = db.transaction(() => {
      for (const saleId of saleIds) {
        const sale = db.prepare("SELECT * FROM tblSale WHERE SaleId = ?").get(saleId);
        if (!sale || sale.IsPosted) continue;

        const total = sale.Quantity * sale.unitPrice;

        // ثبت سند اصلی
        const entry = db.prepare(`
          INSERT INTO tblJournalEntries (DocumentNumber, Description, EntryDate, IsBalanced)
          VALUES (?, ?, ?, ?)
        `).run(
          `SALE-${saleId}`,
          `سند فروش کالا ${sale.ItemName} به ${sale.CustomerName}`,
          sale.SaleDate,
          1
        );

        const entryId = entry.lastInsertRowid;

        // بدهکار: حساب دریافتنی (مثلاً 1101)
        db.prepare(`
          INSERT INTO tblJournalLines (EntryId, AccountCode, DebitAmount, CreditAmount)
          VALUES (?, ?, ?, ?)
        `).run(entryId, 1101, total, 0);

        // بستانکار: درآمد فروش (مثلاً 4101)
        db.prepare(`
          INSERT INTO tblJournalLines (EntryId, AccountCode, DebitAmount, CreditAmount)
          VALUES (?, ?, ?, ?)
        `).run(entryId, 4101, 0, total);

        // علامت‌گذاری فروش به عنوان ثبت‌شده
        db.prepare("UPDATE tblSale SET IsPosted = 1 WHERE SaleId = ?").run(saleId);
      }
    });

    trx();
    return { success: true, message: "سند حسابداری برای فروش‌ها ثبت شد" };
  } catch (err) {
    console.error("❌ خطا در صدور سند حسابداری:", err);
    return { success: false, error: "خطا در ثبت سند حسابداری" };
  }
}
