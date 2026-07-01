import db from '../db.js';

/**
 * ثبت سند حسابداری عمومی با بررسی تعادل و اعتبار خطوط
 * @param {Object} options
 * @param {string} options.date - تاریخ سند (YYYY-MM-DD)
 * @param {string} options.docNumber - شماره سند
 * @param {string} options.description - شرح سند
 * @param {Array} options.entries - آرایه خطوط سند
 * @param {string} [options.sourceTable] - نام جدول منشأ (مثلاً tblSale)
 * @param {number} [options.sourceId] - شناسه رکورد منشأ (مثلاً SaleId)
 * @returns {number} entryId - شناسه سند ثبت‌شده
 */
export function createAccountingEntry({ date, docNumber, description, entries, sourceTable, sourceId }) {
  // اعتبارسنجی اولیه
  if (!date || !Array.isArray(entries) || entries.length === 0) {
    throw new Error('❌ اطلاعات سند ناقص یا نامعتبر است');
  }

  // بررسی اعتبار هر خط سند
  for (const line of entries) {
    if (!line.AccountCode || (!line.DebitAmount && !line.CreditAmount)) {
      throw new Error('❌ خط سند نامعتبر است: باید کد حساب و یکی از مبلغ بدهکار یا بستانکار مشخص باشد');
    }
  }

  // بررسی وجود کد حساب در tblAccounts
  const accExistsStmt = db.prepare(`SELECT 1 FROM tblAccounts WHERE AccountCode = ?`);
  for (const line of entries) {
    if (!accExistsStmt.get(line.AccountCode)) {
      throw new Error(`❌ کد حساب ${line.AccountCode} در سیستم تعریف نشده است`);
    }
  }

  // آماده‌سازی دستورات SQL
  const insertEntryStmt = db.prepare(`
    INSERT INTO tblJournalEntries (EntryDate, DocumentNumber, Description, IsBalanced, SourceTable, SourceId, CreatedAt)
    VALUES (?, ?, ?, ?, ?, ?, DATETIME('now'))
  `);

  const insertLineStmt = db.prepare(`
    INSERT INTO tblJournalLines (EntryId, AccountCode, DebitAmount, CreditAmount, SubsidiaryId)
    VALUES (?, ?, ?, ?, ?)
  `);

  // اجرای تراکنش ثبت سند
  const transaction = db.transaction(() => {
    let totalDebit = 0;
    let totalCredit = 0;

    const entryResult = insertEntryStmt.run(
      date,
      docNumber || '',
      description || '',
      0, // مقدار اولیه IsBalanced
      sourceTable || null,
      sourceId || null
    );
    const entryId = entryResult.lastInsertRowid;

    for (const line of entries) {
      const debit = Number(line.DebitAmount || 0);
      const credit = Number(line.CreditAmount || 0);
      totalDebit += debit;
      totalCredit += credit;

      insertLineStmt.run(
        entryId,
        line.AccountCode,
        debit,
        credit,
        line.SubsidiaryId || null
      );
    }

    const isBalanced = totalDebit === totalCredit ? 1 : 0;
    db.prepare(`UPDATE tblJournalEntries SET IsBalanced = ? WHERE EntryId = ?`).run(isBalanced, entryId);

    console.log(`📘 سند حسابداری ثبت شد → EntryId: ${entryId} | بدهکار: ${totalDebit} | بستانکار: ${totalCredit} | تعادل: ${isBalanced ? '✅' : '❌'}`);

    return entryId;
  });

  return transaction();
}
