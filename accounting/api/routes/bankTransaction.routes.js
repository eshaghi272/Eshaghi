// routes/bankTransaction.routes.js
import express from 'express';
import db from '../db.js';

const router = express.Router();

// تابع برای تولید شماره سند منحصر به فرد
function generateDocumentNumber(prefix = 'TX') {
  try {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${timestamp}-${random}`;
  } catch (error) {
    return `${prefix}-${Date.now()}`;
  }
}

// تابع برای دریافت سال مالی فعال
function getActiveFiscalYearId() {
  try {
    const fiscalYear = db.prepare(`SELECT FiscalYearId FROM tblFiscalYear WHERE IsActive = 1`).get();
    return fiscalYear ? fiscalYear.FiscalYearId : null;
  } catch (error) {
    console.error('خطا در دریافت سال مالی:', error);
    return null;
  }
}

// تابع برای ایجاد سند حسابداری
function createJournalEntry(entryData, linesData) {
  const transaction = db.transaction(() => {
    try {
      const { documentNumber, description, entryDate, sourceTable, sourceId, isAuto = 0 } = entryData;
      
      const fiscalYearId = getActiveFiscalYearId();
      
      // ثبت سند حسابداری
      const entryResult = db.prepare(`
        INSERT INTO tblJournalEntries 
        (DocumentNumber, Description, EntryDate, IsBalanced, SourceTable, SourceId, FiscalYearId, IsAuto)
        VALUES (?, ?, ?, 0, ?, ?, ?, ?)
      `).run(
        documentNumber,
        description,
        entryDate,
        sourceTable,
        sourceId,
        fiscalYearId,
        isAuto
      );
      
      const entryId = entryResult.lastInsertRowid;
      
      // ثبت خطوط سند
      const insertLine = db.prepare(`
        INSERT INTO tblJournalLines 
        (EntryId, AccountCode, DebitAmount, CreditAmount, SubsidiaryId, Description)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      linesData.forEach(line => {
        insertLine.run(
          entryId,
          line.accountCode,
          line.debitAmount || 0,
          line.creditAmount || 0,
          line.subsidiaryId || null,
          line.description || ''
        );
      });
      
      // بررسی بالانس بودن سند
      const totalDebit = linesData.reduce((sum, line) => sum + (line.debitAmount || 0), 0);
      const totalCredit = linesData.reduce((sum, line) => sum + (line.creditAmount || 0), 0);
      
      if (totalDebit === totalCredit) {
        db.prepare(`UPDATE tblJournalEntries SET IsBalanced = 1 WHERE EntryId = ?`).run(entryId);
      }
      
      return { entryId, isBalanced: totalDebit === totalCredit };
    } catch (error) {
      throw error;
    }
  });
  
  return transaction();
}

// ثبت تراکنش بانکی
router.post('/', async (req, res) => {
  try {
    const {
      bankName, accountNumber, transDate, transType,
      amount, reference, description, accountCode, subsidiaryId
    } = req.body;

    // اعتبارسنجی داده‌های ورودی
    if (!bankName || !transDate || !transType || !amount) {
      return res.status(400).json({ error: "اطلاعات ضروری وارد نشده است" });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: "مبلغ باید بزرگتر از صفر باشد" });
    }

    const trx = db.transaction(() => {
      try {
        // 1. ثبت تراکنش بانکی
        const { lastInsertRowid: transId } = db.prepare(`
          INSERT INTO tblBankTransaction 
          (bankName, accountNumber, transDate, transType, amount, reference, description, CreatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).run(bankName, accountNumber, transDate, transType, amount, reference, description);

        // 2. تعریف حساب‌ها بر اساس نوع تراکنش
        let debitAccount, creditAccount;
        const docNumber = reference || generateDocumentNumber();

        if (transType === 'واریز') {
          // دریافت پول: بدهکار به بانک، بستانکار به حساب درآمد
          debitAccount = accountCode || '1001'; // حساب بانک
          creditAccount = '4001'; // حساب درآمد
        } else if (transType === 'برداشت') {
          // پرداخت پول: بدهکار به حساب هزینه، بستانکار به بانک
          debitAccount = accountCode || '5001'; // حساب هزینه
          creditAccount = '1001'; // حساب بانک
        } else {
          throw new Error("نوع تراکنش نامعتبر است");
        }

        // 3. ایجاد سند حسابداری
        const entryData = {
          documentNumber: docNumber,
          description: description || `تراکنش بانکی ${transType}`,
          entryDate: transDate,
          sourceTable: 'tblBankTransaction',
          sourceId: transId,
          isAuto: 1
        };

        const linesData = [
          {
            accountCode: debitAccount,
            debitAmount: amount,
            creditAmount: 0,
            subsidiaryId: subsidiaryId || null,
            description: description || `${transType} بانکی`
          },
          {
            accountCode: creditAccount,
            debitAmount: 0,
            creditAmount: amount,
            subsidiaryId: subsidiaryId || null,
            description: description || `${transType} بانکی`
          }
        ];

        const { entryId, isBalanced } = createJournalEntry(entryData, linesData);

        // 4. به‌روزرسانی مرجع تراکنش بانکی با شماره سند
        if (!reference) {
          db.prepare(`UPDATE tblBankTransaction SET reference = ? WHERE id = ?`)
            .run(docNumber, transId);
        }

        res.json({ 
          success: true, 
          transactionId: transId, 
          journalEntryId: entryId,
          documentNumber: docNumber,
          isBalanced: isBalanced
        });
      } catch (error) {
        throw error;
      }
    });

    trx();
    
  } catch (err) {
    console.error("❌ خطا در ثبت تراکنش بانکی:", err.message);
    res.status(500).json({ 
      error: "خطا در ثبت تراکنش بانکی", 
      details: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
});

// دریافت لیست تراکنش‌های بانکی
router.get('/', (req, res) => {
  try {
    const { startDate, endDate, bankName, transType } = req.query;
    
    let query = `
      SELECT bt.*, je.DocumentNumber as journalDocNumber
      FROM tblBankTransaction bt
      LEFT JOIN tblJournalEntries je ON je.SourceId = bt.id AND je.SourceTable = 'tblBankTransaction'
      WHERE 1=1
    `;
    
    const params = [];
    
    if (startDate) {
      query += ` AND bt.transDate >= ?`;
      params.push(startDate);
    }
    
    if (endDate) {
      query += ` AND bt.transDate <= ?`;
      params.push(endDate);
    }
    
    if (bankName) {
      query += ` AND bt.bankName LIKE ?`;
      params.push(`%${bankName}%`);
    }
    
    if (transType) {
      query += ` AND bt.transType = ?`;
      params.push(transType);
    }
    
    query += ` ORDER BY bt.transDate DESC, bt.CreatedAt DESC`;
    
    const rows = db.prepare(query).all(...params);
    res.json(rows);
  } catch (err) {
    console.error("❌ خطا در دریافت تراکنش‌ها:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// دریافت یک تراکنش خاص
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const transaction = db.prepare(`
      SELECT bt.*, je.EntryId as journalEntryId, je.DocumentNumber as journalDocNumber
      FROM tblBankTransaction bt
      LEFT JOIN tblJournalEntries je ON je.SourceId = bt.id AND je.SourceTable = 'tblBankTransaction'
      WHERE bt.id = ?
    `).get(id);
    
    if (!transaction) {
      return res.status(404).json({ error: "تراکنش یافت نشد" });
    }
    
    // دریافت جزئیات سند حسابداری
    if (transaction.journalEntryId) {
      const journalLines = db.prepare(`
        SELECT jl.*, cha.AccountName
        FROM tblJournalLines jl
        LEFT JOIN tblChartOfAccounts cha ON cha.AccountCode = jl.AccountCode
        WHERE jl.EntryId = ?
      `).all(transaction.journalEntryId);
      
      transaction.journalLines = journalLines;
    }
    
    res.json(transaction);
  } catch (err) {
    console.error("❌ خطا در دریافت تراکنش:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// حذف تراکنش بانکی
router.delete('/:id', (req, res) => {
  const trx = db.transaction(() => {
    try {
      const { id } = req.params;
      
      // یافتن سند حسابداری مرتبط
      const journalEntry = db.prepare(`
        SELECT EntryId FROM tblJournalEntries 
        WHERE SourceId = ? AND SourceTable = 'tblBankTransaction'
      `).get(id);
      
      // حذف خطوط سند حسابداری
      if (journalEntry) {
        db.prepare(`DELETE FROM tblJournalLines WHERE EntryId = ?`).run(journalEntry.EntryId);
        db.prepare(`DELETE FROM tblJournalEntries WHERE EntryId = ?`).run(journalEntry.EntryId);
      }
      
      // حذف تراکنش بانکی
      const result = db.prepare(`DELETE FROM tblBankTransaction WHERE id = ?`).run(id);
      
      if (result.changes === 0) {
        throw new Error("تراکنش یافت نشد");
      }
      
      res.json({ 
        success: true, 
        message: "تراکنش و سند حسابداری مرتبط با موفقیت حذف شدند" 
      });
    } catch (error) {
      throw error;
    }
  });
  
  try {
    trx();
  } catch (err) {
    console.error("❌ خطا در حذف تراکنش:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// به‌روزرسانی تراکنش بانکی
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const {
      bankName, accountNumber, transDate, transType,
      amount, reference, description, accountCode, subsidiaryId
    } = req.body;

    // بررسی وجود تراکنش
    const existingTransaction = db.prepare(`SELECT * FROM tblBankTransaction WHERE id = ?`).get(id);
    if (!existingTransaction) {
      return res.status(404).json({ error: "تراکنش یافت نشد" });
    }

    const trx = db.transaction(() => {
      try {
        // به‌روزرسانی تراکنش
        db.prepare(`
          UPDATE tblBankTransaction 
          SET bankName = ?, accountNumber = ?, transDate = ?, transType = ?, 
              amount = ?, reference = ?, description = ?, UpdatedAt = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(
          bankName || existingTransaction.bankName,
          accountNumber || existingTransaction.accountNumber,
          transDate || existingTransaction.transDate,
          transType || existingTransaction.transType,
          amount || existingTransaction.amount,
          reference || existingTransaction.reference,
          description || existingTransaction.description,
          id
        );

        // اگر سند حسابداری وجود دارد، آن را نیز به‌روزرسانی کنیم
        const journalEntry = db.prepare(`
          SELECT EntryId FROM tblJournalEntries 
          WHERE SourceId = ? AND SourceTable = 'tblBankTransaction'
        `).get(id);

        if (journalEntry) {
          // حذف خطوط قبلی
          db.prepare(`DELETE FROM tblJournalLines WHERE EntryId = ?`).run(journalEntry.EntryId);
          
          // تعریف حساب‌های جدید
          let debitAccount, creditAccount;
          
          if (transType || existingTransaction.transType === 'واریز') {
            const effectiveType = transType || existingTransaction.transType;
            const effectiveAmount = amount || existingTransaction.amount;
            
            if (effectiveType === 'واریز') {
              debitAccount = accountCode || existingTransaction.accountCode || '1001';
              creditAccount = '4001';
            } else {
              debitAccount = accountCode || existingTransaction.accountCode || '5001';
              creditAccount = '1001';
            }
            
            // ایجاد خطوط جدید
            db.prepare(`
              INSERT INTO tblJournalLines (EntryId, AccountCode, DebitAmount, CreditAmount, SubsidiaryId, Description)
              VALUES (?, ?, ?, ?, ?, ?)
            `).run(
              journalEntry.EntryId,
              debitAccount,
              effectiveType === 'واریز' ? effectiveAmount : 0,
              effectiveType === 'برداشت' ? effectiveAmount : 0,
              subsidiaryId || null,
              description || `ویرایش شده: ${effectiveType} بانکی`
            );
            
            db.prepare(`
              INSERT INTO tblJournalLines (EntryId, AccountCode, DebitAmount, CreditAmount, SubsidiaryId, Description)
              VALUES (?, ?, ?, ?, ?, ?)
            `).run(
              journalEntry.EntryId,
              creditAccount,
              effectiveType === 'برداشت' ? effectiveAmount : 0,
              effectiveType === 'واریز' ? effectiveAmount : 0,
              subsidiaryId || null,
              description || `ویرایش شده: ${effectiveType} بانکی`
            );
            
            // بررسی بالانس
            const lines = db.prepare(`SELECT * FROM tblJournalLines WHERE EntryId = ?`).all(journalEntry.EntryId);
            const totalDebit = lines.reduce((sum, line) => sum + line.DebitAmount, 0);
            const totalCredit = lines.reduce((sum, line) => sum + line.CreditAmount, 0);
            
            db.prepare(`UPDATE tblJournalEntries SET IsBalanced = ? WHERE EntryId = ?`)
              .run(totalDebit === totalCredit ? 1 : 0, journalEntry.EntryId);
          }
        }

        res.json({ 
          success: true, 
          message: "تراکنش با موفقیت به‌روزرسانی شد" 
        });
      } catch (error) {
        throw error;
      }
    });

    trx();
    
  } catch (err) {
    console.error("❌ خطا در به‌روزرسانی تراکنش:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;