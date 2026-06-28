// 📁 مسیر فایل: /controllers/insertAutoRecord.js

import db from '../db.js';
import { getAccountSetting } from '../utils/accounting.js'; // اگر در فایل جداگانه ذخیره کردی

// ثبت داده جدید + سند اتوماتیک برای تراکنش انبار
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

    // ثبت سند اتوماتیک برای تراکنش انبار
    if (table.toLowerCase() === 'tblstocktransaction') {
      try {
        const transId = result.lastInsertRowid;
        const { transType, description, quantity, unitPrice, transDate } = data;
        const totalAmount = quantity * unitPrice;
        const docNumber = `STK-${transId}`;

        const debitAcc = transType === 'ورود'
          ? getAccountSetting('stockEntryDebitAccount')
          : getAccountSetting('stockExitDebitAccount');

        const creditAcc = transType === 'ورود'
          ? getAccountSetting('stockEntryCreditAccount')
          : getAccountSetting('stockExitCreditAccount');

        if (!debitAcc || !creditAcc) {
          console.warn('⚠️ حساب‌های تنظیم نشده برای سند اتوماتیک');
          res.json({ id: transId, warning: 'حساب‌های سند اتوماتیک تنظیم نشده‌اند' });
          return;
        }

        const insertEntry = db.prepare(`
          INSERT INTO tblJournalEntries (DocumentNumber, Description, EntryDate, IsBalanced)
          VALUES (?, ?, ?, 1)
        `);
        const entryResult = insertEntry.run(docNumber, `ثبت خودکار ${transType} کالا - ${description}`, transDate);
        const entryId = entryResult.lastInsertRowid;

        const insertLine = db.prepare(`
          INSERT INTO tblJournalLines (EntryId, AccountCode, DebitAmount, CreditAmount)
          VALUES (?, ?, ?, ?)
        `);
        insertLine.run(entryId, debitAcc, totalAmount, 0);
        insertLine.run(entryId, creditAcc, 0, totalAmount);

        res.json({ id: transId, journalId: entryId });
        return;
      } catch (err) {
        console.error("❌ خطا در ثبت سند اتوماتیک:", err.message);
        res.status(500).json({ error: "ثبت تراکنش انجام شد ولی ثبت سند حسابداری با خطا مواجه شد" });
        return;
      }
    }

    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    console.error("❌ خطا در درج داده:", err.message);
    res.status(500).json({ error: err.message || "خطای داخلی سرور" });
  }
};
