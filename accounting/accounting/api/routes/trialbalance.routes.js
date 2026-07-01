import express from 'express';
import db from '../db.js';

const router = express.Router();

/**
 * 📊 تراز آزمایشی ساده
 * مسیر: GET /api/trialbalance
 */
router.get('/', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT
        a.AccountCode,
        a.TopCode,
        a.TitleFa,
        a.Type,
        a.Nature,
        IFNULL(SUM(j.DebitAmount), 0) AS TotalDebit,
        IFNULL(SUM(j.CreditAmount), 0) AS TotalCredit
      FROM tblAccounts a
      LEFT JOIN tblJournalLines j ON j.AccountCode = a.AccountCode
      GROUP BY a.AccountCode
      ORDER BY a.AccountCode
    `).all();

    res.json(rows);
  } catch (err) {
    console.error("❌ خطا در تولید تراز آزمایشی:", err.message);
    res.status(500).json({ error: 'خطای داخلی سرور: ' + err.message });
  }
});

/**
 * 📊 تراز آزمایشی چندسطحی با ساختار درختی
 * مسیر: GET /api/trialbalance/tree
 */
router.get('/tree', (req, res) => {
  try {
    const accounts = db.prepare(`
      SELECT
        a.AccountCode,
        a.TopCode,
        a.TitleFa,
        a.Type,
        a.Nature,
        IFNULL(SUM(j.DebitAmount), 0) AS TotalDebit,
        IFNULL(SUM(j.CreditAmount), 0) AS TotalCredit
      FROM tblAccounts a
      LEFT JOIN tblJournalLines j ON j.AccountCode = a.AccountCode
      GROUP BY a.AccountCode
      ORDER BY a.AccountCode
    `).all();

    const map = new Map();

    // ساخت نودها
    accounts.forEach(acc => {
      map.set(acc.AccountCode, {
        TitleFa: acc.TitleFa,
        AccountCode: acc.AccountCode,
        TopCode: acc.TopCode,
        TotalDebit: acc.TotalDebit || 0,
        TotalCredit: acc.TotalCredit || 0,
        Balance: (acc.TotalDebit || 0) - (acc.TotalCredit || 0),
        children: []
      });
    });

    // اتصال فرزندان به والد
    const roots = [];
    accounts.forEach(acc => {
      const node = map.get(acc.AccountCode);
      if (acc.TopCode && map.has(acc.TopCode)) {
        map.get(acc.TopCode).children.push(node);
      } else {
        roots.push(node);
      }
    });

    // تابع بازگشتی برای جمع فرزندان
    const aggregate = (node) => {
      if (!node.children || node.children.length === 0) return node;
      let debitSum = node.TotalDebit;
      let creditSum = node.TotalCredit;
      node.children.forEach(child => {
        const aggChild = aggregate(child);
        debitSum += aggChild.TotalDebit;
        creditSum += aggChild.TotalCredit;
      });
      node.TotalDebit = debitSum;
      node.TotalCredit = creditSum;
      node.Balance = debitSum - creditSum;
      return node;
    };

    const aggregatedRoots = roots.map(root => aggregate(root));

    res.json(aggregatedRoots);
  } catch (err) {
    console.error("❌ خطا در تولید تراز درختی:", err.message);
    res.status(500).json({ error: 'خطای داخلی سرور: ' + err.message });
  }
});

/**
 * 📜 اسناد حسابداری
 * مسیر: GET /api/trialbalance/journals
 */
router.get('/journals', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT 
        e.EntryId,
        e.DocumentNumber,
        e.Description,
        e.EntryDate,
        SUM(l.DebitAmount) AS Debit,
        SUM(l.CreditAmount) AS Credit,
        SUM(l.DebitAmount - l.CreditAmount) AS Balance
      FROM tblJournalEntries e
      LEFT JOIN tblJournalLines l ON l.EntryId = e.EntryId
      GROUP BY e.EntryId, e.DocumentNumber, e.Description, e.EntryDate
      ORDER BY e.EntryDate DESC
    `).all();

    res.json(rows);
  } catch (err) {
    console.error("❌ خطا در دریافت اسناد حسابداری:", err.message);
    res.status(500).json({ error: 'خطای داخلی سرور: ' + err.message });
  }
});

// لیست اسناد مربوط به یک حساب معین
router.get('/journals/:accountCode', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT e.EntryId, e.DocumentNumber, e.Description, e.EntryDate,
             SUM(l.DebitAmount) AS Debit, SUM(l.CreditAmount) AS Credit
      FROM tblJournalEntries e
      JOIN tblJournalLines l ON l.EntryId = e.EntryId
      WHERE l.AccountCode = ?
      GROUP BY e.EntryId, e.DocumentNumber, e.Description, e.EntryDate
      ORDER BY e.EntryDate DESC
    `).all(req.params.accountCode);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// جزئیات یک سند خاص
router.get('/journal/:entryId', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT l.LineId, l.AccountCode, a.TitleFa,
             l.DebitAmount, l.CreditAmount
      FROM tblJournalLines l
      JOIN tblAccounts a ON a.AccountCode = l.AccountCode
      WHERE l.EntryId = ?
    `).all(req.params.entryId);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


export default router;
