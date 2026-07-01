import db from '../db.js';

export const insertFullJournalEntry = (req, res) => {
  const { DocumentNumber, EntryDate, Description, Lines } = req.body;

  if (!DocumentNumber || !EntryDate || !Array.isArray(Lines) || Lines.length === 0) {
    return res.status(400).json({ error: 'اطلاعات سند ناقص یا نامعتبر است' });
  }

  if (typeof EntryDate !== "string" || EntryDate.length < 8) {
    return res.status(400).json({ error: "فرمت تاریخ نامعتبر است" });
  }

  const toSafeNumber = (val) => {
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  };

  const totalDebit = Lines.reduce((sum, l) => sum + toSafeNumber(l.DebitAmount), 0);
  const totalCredit = Lines.reduce((sum, l) => sum + toSafeNumber(l.CreditAmount), 0);
  const isBalanced = totalDebit === totalCredit ? 1 : 0;

  try {
    const insertEntryStmt = db.prepare(`
      INSERT INTO tblJournalEntries (DocumentNumber, EntryDate, Description, IsBalanced)
      VALUES (?, ?, ?, ?)
    `);

    const insertLineStmt = db.prepare(`
      INSERT INTO tblJournalLines (EntryId, AccountCode, DebitAmount, CreditAmount)
      VALUES (?, ?, ?, ?)
    `);

    const accountCheckStmt = db.prepare(`SELECT 1 FROM tblAccounts WHERE AccountCode = ?`);

    const transaction = db.transaction(() => {
      const entryResult = insertEntryStmt.run(DocumentNumber.trim(), EntryDate, Description?.trim() || '', isBalanced);
      const entryId = entryResult.lastInsertRowid;

      for (const line of Lines) {
        if (!accountCheckStmt.get(line.AccountCode)) {
          throw new Error(`کد حساب ${line.AccountCode} یافت نشد`);
        }

        insertLineStmt.run(
          entryId,
          line.AccountCode,
          toSafeNumber(line.DebitAmount),
          toSafeNumber(line.CreditAmount)
        );
      }

      return entryId;
    });

    const entryId = transaction();
    res.json({ success: true, entryId });
  } catch (err) {
    console.error('❌ خطا در ثبت سند:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
};

export const getJournalReport = (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT 
        e.EntryId,
        e.DocumentNumber,
        e.EntryDate,
        e.Description,
        e.IsBalanced,
        SUM(l.DebitAmount) AS TotalDebit,
        SUM(l.CreditAmount) AS TotalCredit
      FROM tblJournalEntries e
      JOIN tblJournalLines l ON l.EntryId = e.EntryId
      GROUP BY e.EntryId
      ORDER BY e.EntryDate DESC
    `).all();

    res.json(rows);
  } catch (err) {
    console.error("❌ خطا در گزارش:", err.message);
    res.status(500).json({ error: "خطای داخلی سرور" });
  }
};
