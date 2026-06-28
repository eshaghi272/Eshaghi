import express from 'express';
import db from '../db.js';

const router = express.Router();

router.post('/', (req, res) => {
  const {
    ReceiptType, // 'receive' یا 'pay'
    ReceiptDate,
    PersonCode,
    AccountCode,
    Amount,
    Method,
    Description,
  } = req.body;

  if (!ReceiptType || !ReceiptDate || !PersonCode || !AccountCode || !Amount) {
    return res.status(400).send("اطلاعات ناقص");
  }

  const db = req.db; // فرض بر اینه که اتصال SQLite از قبل هست

  try {
    const trx = db.transaction(() => {
      // ثبت در tblReceipts
      const insertReceipt = db.prepare(`
        INSERT INTO tblReceipts (
          ReceiptType, ReceiptDate, PersonCode, AccountCode,
          Amount, Method, Description
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const result = insertReceipt.run(
        ReceiptType,
        ReceiptDate,
        PersonCode,
        AccountCode,
        Amount,
        Method,
        Description || null
      );

      const receiptId = result.lastInsertRowid;

      // ساخت سند حسابداری
      const entryDescription = Description || `ثبت ${ReceiptType === 'receive' ? 'دریافت' : 'پرداخت'} از ${PersonCode}`;
      const isReceive = ReceiptType === 'receive';

      const insertEntry = db.prepare(`
        INSERT INTO tblJournalEntries (DocumentNumber, EntryDate, Description, IsBalanced)
        VALUES (?, ?, ?, ?)
      `);

      const entryResult = insertEntry.run(
        `RCPT-${receiptId}`,
        ReceiptDate,
        entryDescription,
        1 // چون همیشه دو طرف برابرند
      );

      const entryId = entryResult.lastInsertRowid;

      const insertLine = db.prepare(`
        INSERT INTO tblJournalLines (EntryId, AccountCode, DebitAmount, CreditAmount)
        VALUES (?, ?, ?, ?)
      `);

      if (isReceive) {
        insertLine.run(entryId, AccountCode, Amount, 0); // بدهکار: بانک
        insertLine.run(entryId, PersonCode, 0, Amount);   // بستانکار: شخص
      } else {
        insertLine.run(entryId, PersonCode, Amount, 0);   // بدهکار: شخص
        insertLine.run(entryId, AccountCode, 0, Amount);  // بستانکار: بانک
      }

      // اتصال سند به رسید
      db.prepare(`UPDATE tblReceipts SET JournalEntryId = ? WHERE ReceiptId = ?`)
        .run(entryId, receiptId);
    });

    trx();
    res.json({ success: true });
  } catch (err) {
    console.error("❌ خطا در ثبت رسید و سند:", err.message);
    res.status(500).send("خطای داخلی سرور");
  }
});




export default router;
