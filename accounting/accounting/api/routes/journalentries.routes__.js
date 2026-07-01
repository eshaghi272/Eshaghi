import express from 'express';
import db from '../db.js';

const router = express.Router();

/**
 * 📌 آخرین سند
 * مسیر: GET /api/journalentries/last
 */
router.get('/last', (req, res) => {
  try {
    // کوئری بسیار ساده
    const stmt = db.prepare(`
      SELECT EntryId, DocumentNumber, EntryDate
      FROM tblJournalEntries 
      ORDER BY EntryId DESC 
      LIMIT 1
    `);

    const result = stmt.get();

    // فقط برای دیباگ
    console.log('LAST ENTRY RESULT:', result);

    if (result) {
      res.json(result);
    } else {
      res.json({
        status: 'empty',
        message: 'جدول خالی است یا خطایی در کوئری وجود دارد'
      });
    }

  } catch (error) {
    console.error('LAST ENDPOINT ERROR:', error.message);
    res.status(500).json({
      error: error.message,
      code: error.code
    });
  }
});
/**
 * 📋 لیست اسناد
 * مسیر: GET /api/journalentries
 */
router.get('/', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT EntryId, DocumentNumber, EntryDate, Description, IsBalanced, CreatedAt
      FROM tblJournalEntries
      ORDER BY EntryDate DESC, EntryId DESC
    `).all();

    res.json(rows);
  } catch (err) {
    console.error('❌ خطا در واکشی لیست اسناد:', err.message);
    res.status(500).send('خطای داخلی سرور: ' + err.message);
  }
});

/**
 * 📥 ثبت سند کامل حسابداری
 * مسیر: POST /api/journalentries/full
 */
router.post('/full', (req, res) => {
  const { DocumentNumber, EntryDate, Description, Lines } = req.body;

  if (!DocumentNumber || typeof DocumentNumber !== 'string') {
    return res.status(400).send('شماره سند الزامی است');
  }
  if (!Array.isArray(Lines) || Lines.length === 0) {
    return res.status(400).send('حداقل یک ردیف سند لازم است');
  }

  const totalDebit = Lines.reduce((sum, l) => sum + Number(l.DebitAmount || 0), 0);
  const totalCredit = Lines.reduce((sum, l) => sum + Number(l.CreditAmount || 0), 0);
  const isBalanced = totalDebit === totalCredit;

  try {
    const trx = db.transaction(() => {
      const insertEntry = db.prepare(`
        INSERT INTO tblJournalEntries (
          DocumentNumber, EntryDate, Description, IsBalanced
        ) VALUES (?, ?, ?, ?)
      `);
      const result = insertEntry.run(
        DocumentNumber.trim(),
        EntryDate || new Date().toISOString().slice(0, 10),
        Description?.trim() || null,
        isBalanced ? 1 : 0
      );

      const entryId = result.lastInsertRowid;

      const insertLine = db.prepare(`
        INSERT INTO tblJournalLines (
          EntryId, AccountCode, DebitAmount, CreditAmount
        ) VALUES (?, ?, ?, ?)
      `);

      for (const line of Lines) {
        const { AccountCode, DebitAmount, CreditAmount } = line;
        if (!AccountCode || (Number(DebitAmount) === 0 && Number(CreditAmount) === 0)) continue;
        insertLine.run(entryId, Number(AccountCode), Number(DebitAmount || 0), Number(CreditAmount || 0));
      }

      return entryId;
    });

    const entryId = trx();
    res.status(201).json({ success: true, entryId });
  } catch (err) {
    console.error('❌ خطا در ثبت سند:', err.message);
    res.status(500).send('خطای داخلی سرور: ' + err.message);
  }
});

/**
 * 📄 واکشی سند کامل با ردیف‌ها
 * مسیر: GET /api/journalentries/:id/full
 */
router.get('/:id/full', (req, res) => {
  const entryId = Number(req.params.id);
  if (!entryId) return res.status(400).send('شناسه سند نامعتبر است');

  try {
    const entry = db.prepare(`
      SELECT EntryId, DocumentNumber, EntryDate, Description, IsBalanced
      FROM tblJournalEntries
      WHERE EntryId = ?
    `).get(entryId);

    if (!entry) return res.status(404).send('سند یافت نشد');

    const lines = db.prepare(`
      SELECT l.AccountCode, a.TitleFa, l.DebitAmount, l.CreditAmount
      FROM tblJournalLines l
      JOIN tblAccounts a ON a.AccountCode = l.AccountCode
      WHERE l.EntryId = ?
      ORDER BY l.LineId
    `).all(entryId);

    res.json({ ...entry, Lines: lines });
  } catch (err) {
    console.error('❌ خطا در واکشی سند:', err.message);
    res.status(500).send('خطای داخلی سرور: ' + err.message);
  }
});

/**
 * 🗑 حذف سند
 * مسیر: DELETE /api/journalentries/:id
 */
router.delete('/:id', (req, res) => {
  const entryId = Number(req.params.id);
  if (!entryId) return res.status(400).send('شناسه نامعتبر');

  try {
    const trx = db.transaction(() => {
      db.prepare(`DELETE FROM tblJournalLines WHERE EntryId = ?`).run(entryId);
      db.prepare(`DELETE FROM tblJournalEntries WHERE EntryId = ?`).run(entryId);
    });

    trx();
    res.json({ success: true });
  } catch (err) {
    console.error('❌ خطا در حذف سند:', err.message);
    res.status(500).send('خطای داخلی سرور: ' + err.message);
  }
});

/**
 * ✏️ ویرایش سند
 * مسیر: PUT /api/journalentries/:id
 */
router.put('/:id', (req, res) => {
  const entryId = Number(req.params.id);
  const { DocumentNumber, EntryDate, Description, Lines } = req.body;

  if (!entryId || !DocumentNumber || !Array.isArray(Lines) || Lines.length === 0) {
    return res.status(400).send('اطلاعات ناقص یا نامعتبر');
  }

  const totalDebit = Lines.reduce((sum, l) => sum + Number(l.DebitAmount || 0), 0);
  const totalCredit = Lines.reduce((sum, l) => sum + Number(l.CreditAmount || 0), 0);
  const isBalanced = totalDebit === totalCredit;

  try {
    const trx = db.transaction(() => {
      db.prepare(`
        UPDATE tblJournalEntries
        SET DocumentNumber = ?, EntryDate = ?, Description = ?, IsBalanced = ?
        WHERE EntryId = ?
      `).run(
        DocumentNumber.trim(),
        EntryDate || new Date().toISOString().slice(0, 10),
        Description?.trim() || null,
        isBalanced ? 1 : 0,
        entryId
      );

      db.prepare(`DELETE FROM tblJournalLines WHERE EntryId = ?`).run(entryId);

      const insertLine = db.prepare(`
        INSERT INTO tblJournalLines (EntryId, AccountCode, DebitAmount, CreditAmount)
        VALUES (?, ?, ?, ?)
      `);

      for (const line of Lines) {
        if (!line.AccountCode || (Number(line.DebitAmount) === 0 && Number(line.CreditAmount) === 0)) continue;
        insertLine.run(entryId, Number(line.AccountCode), Number(line.DebitAmount || 0), Number(line.CreditAmount || 0));
      }
    });

    trx();
    res.json({ success: true });
  } catch (err) {
    console.error('❌ خطا در ویرایش سند:', err.message);
    res.status(500).send('خطای داخلی سرور: ' + err.message);
  }
});

export default router;
