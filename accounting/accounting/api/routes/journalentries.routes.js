import express from 'express';
import db from '../db.js';

const router = express.Router();

// ==================== ROUTEهای خاص (باید اول بیایند) ====================

/**
 * 📌 آخرین سند
 * مسیر: GET /api/journalentries/last
 * توضیح: آخرین سند ثبت شده را برمی‌گرداند
 */
router.get("/last", (req, res) => {
  try {
    const row = db.prepare(`
      SELECT DocumentNumber
      FROM tblJournalEntries
      ORDER BY EntryId DESC
      LIMIT 1
    `).get();

    if (row) {
      res.json({ lastNumber: parseInt(row.DocumentNumber, 10) });
    } else {
      res.json({ lastNumber: 0 });
    }
  } catch (err) {
    console.error("❌ خطا در دریافت آخرین سند:", err.message);
    res.status(500).json({ error: "خطا در دریافت آخرین سند" });
  }
});

// ==================== ROUTEهای عمومی ====================

/**
 * 📊 گزارش اسناد
 * مسیر: GET /api/journalentries/report
 * توضیح: گزارش کامل اسناد با مجموع بدهکار و بستانکار
 */
router.get('/report', (req, res) => {
  console.log('📊 درخواست گزارش اسناد');

  try {
    const rows = db.prepare(`
      SELECT 
        je.EntryId,
        je.DocumentNumber,
        je.EntryDate,
        je.Description,
        je.IsBalanced,
        je.CreatedAt,
        COALESCE(SUM(jl.DebitAmount), 0) as TotalDebit,
        COALESCE(SUM(jl.CreditAmount), 0) as TotalCredit,
        COUNT(jl.LineId) as LineCount
      FROM tblJournalEntries je
      LEFT JOIN tblJournalLines jl ON je.EntryId = jl.EntryId
      GROUP BY je.EntryId, je.DocumentNumber, je.EntryDate, je.Description, je.IsBalanced, je.CreatedAt
      ORDER BY je.EntryId DESC
    `).all();

    // فرمت‌دهی داده‌ها
    const formattedRows = rows.map(row => ({
      EntryId: row.EntryId,
      DocumentNumber: row.DocumentNumber,
      EntryDate: row.EntryDate,
      Description: row.Description || null,
      IsBalanced: Boolean(row.IsBalanced),
      CreatedAt: row.CreatedAt,
      TotalDebit: parseFloat(row.TotalDebit).toFixed(2),
      TotalCredit: parseFloat(row.TotalCredit).toFixed(2),
      LineCount: row.LineCount
    }));

    console.log(`✅ گزارش ${formattedRows.length} سند ارسال شد`);
    res.json(formattedRows);
  } catch (err) {
    console.error('❌ خطا در واکشی گزارش:', err.message);
    res.status(500).json({
      error: 'خطای داخلی سرور در دریافت گزارش',
      details: err.message
    });
  }
});

/**
 * 📊 گزارش فیلتر شده اسناد
 * مسیر: GET /api/journalentries/report/filtered
 * توضیح: گزارش اسناد با فیلترهای اختیاری
 */
router.get('/report/filtered', (req, res) => {
  const { startDate, endDate, isBalanced, search } = req.query;
  console.log('🔍 درخواست گزارش فیلتر شده:', { startDate, endDate, isBalanced, search });

  try {
    let query = `
      SELECT 
        je.EntryId,
        je.DocumentNumber,
        je.EntryDate,
        je.Description,
        je.IsBalanced,
        je.CreatedAt,
        COALESCE(SUM(jl.DebitAmount), 0) as TotalDebit,
        COALESCE(SUM(jl.CreditAmount), 0) as TotalCredit,
        COUNT(jl.LineId) as LineCount
      FROM tblJournalEntries je
      LEFT JOIN tblJournalLines jl ON je.EntryId = jl.EntryId
      WHERE 1=1
    `;

    const params = [];

    // فیلتر تاریخ شروع
    if (startDate) {
      query += ' AND je.EntryDate >= ?';
      params.push(startDate);
    }

    // فیلتر تاریخ پایان
    if (endDate) {
      query += ' AND je.EntryDate <= ?';
      params.push(endDate);
    }

    // فیلتر وضعیت تراز
    if (isBalanced !== undefined) {
      query += ' AND je.IsBalanced = ?';
      params.push(isBalanced === 'true' ? 1 : 0);
    }

    // فیلتر جستجو
    if (search) {
      query += ' AND (je.DocumentNumber LIKE ? OR je.Description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' GROUP BY je.EntryId, je.DocumentNumber, je.EntryDate, je.Description, je.IsBalanced, je.CreatedAt';
    query += ' ORDER BY je.EntryId DESC';

    const rows = db.prepare(query).all(...params);

    const formattedRows = rows.map(row => ({
      EntryId: row.EntryId,
      DocumentNumber: row.DocumentNumber,
      EntryDate: row.EntryDate,
      Description: row.Description || null,
      IsBalanced: Boolean(row.IsBalanced),
      CreatedAt: row.CreatedAt,
      TotalDebit: parseFloat(row.TotalDebit).toFixed(2),
      TotalCredit: parseFloat(row.TotalCredit).toFixed(2),
      LineCount: row.LineCount,
      Difference: Math.abs(
        parseFloat(row.TotalDebit) - parseFloat(row.TotalCredit)
      ).toFixed(2)
    }));

    console.log(`✅ گزارش فیلتر شده ${formattedRows.length} سند ارسال شد`);
    res.json({
      count: formattedRows.length,
      filters: { startDate, endDate, isBalanced, search },
      data: formattedRows
    });
  } catch (err) {
    console.error('❌ خطا در واکشی گزارش فیلتر شده:', err.message);
    res.status(500).json({
      error: 'خطای داخلی سرور در دریافت گزارش فیلتر شده',
      details: err.message
    });
  }
});

/**
 * 📊 آمار کلی اسناد
 * مسیر: GET /api/journalentries/report/summary
 * توضیح: آمار کلی و خلاصه اسناد
 */
router.get('/report/summary', (req, res) => {
  console.log('📈 درخواست آمار کلی اسناد');

  try {
    const summary = db.prepare(`
      SELECT 
        COUNT(*) as TotalEntries,
        SUM(CASE WHEN IsBalanced = 1 THEN 1 ELSE 0 END) as BalancedEntries,
        SUM(CASE WHEN IsBalanced = 0 THEN 1 ELSE 0 END) as UnbalancedEntries,
        (
          SELECT COALESCE(SUM(DebitAmount), 0)
          FROM tblJournalLines
        ) as TotalDebit,
        (
          SELECT COALESCE(SUM(CreditAmount), 0)
          FROM tblJournalLines
        ) as TotalCredit,
        MIN(EntryDate) as FirstEntryDate,
        MAX(EntryDate) as LastEntryDate
      FROM tblJournalEntries
    `).get();

    const result = {
      TotalEntries: summary.TotalEntries || 0,
      BalancedEntries: summary.BalancedEntries || 0,
      UnbalancedEntries: summary.UnbalancedEntries || 0,
      BalancePercentage: summary.TotalEntries > 0
        ? ((summary.BalancedEntries / summary.TotalEntries) * 100).toFixed(1)
        : '0.0',
      TotalDebit: parseFloat(summary.TotalDebit || 0).toFixed(2),
      TotalCredit: parseFloat(summary.TotalCredit || 0).toFixed(2),
      TotalDifference: Math.abs(
        parseFloat(summary.TotalDebit || 0) - parseFloat(summary.TotalCredit || 0)
      ).toFixed(2),
      FirstEntryDate: summary.FirstEntryDate,
      LastEntryDate: summary.LastEntryDate
    };

    console.log('✅ آمار کلی ارسال شد');
    res.json(result);
  } catch (err) {
    console.error('❌ خطا در واکشی آمار کلی:', err.message);
    res.status(500).json({
      error: 'خطای داخلی سرور در دریافت آمار کلی',
      details: err.message
    });
  }
});

/**
 * 📊 گزارش ماهانه اسناد
 * مسیر: GET /api/journalentries/report/monthly
 * توضیح: گزارش آماری به تفکیک ماه
 */
router.get('/report/monthly', (req, res) => {
  console.log('📅 درخواست گزارش ماهانه اسناد');

  try {
    const rows = db.prepare(`
      SELECT 
        strftime('%Y-%m', EntryDate) as Month,
        COUNT(*) as EntryCount,
        SUM(CASE WHEN IsBalanced = 1 THEN 1 ELSE 0 END) as BalancedCount
      FROM tblJournalEntries
      WHERE EntryDate IS NOT NULL
      GROUP BY strftime('%Y-%m', EntryDate)
      ORDER BY Month DESC
    `).all();

    const formattedRows = rows.map(row => ({
      Month: row.Month,
      EntryCount: row.EntryCount,
      BalancedCount: row.BalancedCount,
      UnbalancedCount: row.EntryCount - row.BalancedCount,
      BalancedPercentage: row.EntryCount > 0
        ? ((row.BalancedCount / row.EntryCount) * 100).toFixed(1)
        : '0.0'
    }));

    console.log(`✅ گزارش ماهانه ${formattedRows.length} ماه ارسال شد`);
    res.json(formattedRows);
  } catch (err) {
    console.error('❌ خطا در واکشی گزارش ماهانه:', err.message);
    res.status(500).json({
      error: 'خطای داخلی سرور در دریافت گزارش ماهانه',
      details: err.message
    });
  }
});

/**
 * 📋 لیست تمام اسناد
 * مسیر: GET /api/journalentries
 * توضیح: لیست تمام اسناد با اطلاعات خلاصه
 */
router.get('/', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT 
        EntryId, 
        DocumentNumber, 
        EntryDate, 
        Description, 
        IsBalanced, 
        CreatedAt
      FROM tblJournalEntries
      ORDER BY EntryId DESC
    `).all();

    // تبدیل IsBalanced به boolean
    const formattedRows = rows.map(row => ({
      ...row,
      IsBalanced: Boolean(row.IsBalanced)
    }));

    res.json(formattedRows);
  } catch (err) {
    console.error('❌ خطا در واکشی لیست اسناد:', err.message);
    res.status(500).json({
      error: 'خطای داخلی سرور',
      details: err.message
    });
  }
});

/**
 * 📥 ثبت سند کامل
 * مسیر: POST /api/journalentries/full
 * توضیح: ثبت سند حسابداری با تمام ردیف‌ها
 */
router.post('/full', (req, res) => {
  console.log('📥 درخواست ثبت سند جدید:', req.body);

  const { DocumentNumber, EntryDate, Description, Lines } = req.body;

  // اعتبارسنجی
  if (!DocumentNumber || typeof DocumentNumber !== 'string' || DocumentNumber.trim() === '') {
    return res.status(400).json({ error: 'شماره سند الزامی است' });
  }

  if (!Array.isArray(Lines) || Lines.length === 0) {
    return res.status(400).json({ error: 'حداقل یک ردیف سند لازم است' });
  }

  // محاسبه تراز
  const totalDebit = Lines.reduce((sum, l) => sum + Number(l.DebitAmount || 0), 0);
  const totalCredit = Lines.reduce((sum, l) => sum + Number(l.CreditAmount || 0), 0);
  const isBalanced = totalDebit === totalCredit;

  if (!isBalanced) {
    return res.status(400).json({
      error: 'سند تراز نیست',
      details: { totalDebit, totalCredit }
    });
  }

  try {
    const trx = db.transaction(() => {
      // بررسی شماره سند تکراری
      const existing = db.prepare(`
        SELECT EntryId FROM tblJournalEntries 
        WHERE DocumentNumber = ?
      `).get(DocumentNumber.trim());

      if (existing) {
        throw new Error(`شماره سند ${DocumentNumber} قبلاً ثبت شده است`);
      }

      // ثبت سند اصلی
      const insertEntry = db.prepare(`
        INSERT INTO tblJournalEntries (
          DocumentNumber, 
          EntryDate, 
          Description, 
          IsBalanced
        ) VALUES (?, ?, ?, ?)
      `);

      const result = insertEntry.run(
        DocumentNumber.trim(),
        EntryDate || new Date().toISOString(),
        Description?.trim() || null,
        isBalanced ? 1 : 0
      );

      const entryId = result.lastInsertRowid;
      console.log(`🆔 سند با شناسه ${entryId} ثبت شد`);

      // ثبت ردیف‌ها
      const insertLine = db.prepare(`
        INSERT INTO tblJournalLines (
          EntryId, 
          AccountCode, 
          DebitAmount, 
          CreditAmount
        ) VALUES (?, ?, ?, ?)
      `);

      let lineCount = 0;
      for (const line of Lines) {
        const { AccountCode, DebitAmount, CreditAmount } = line;

        // رد کردن ردیف‌های خالی
        if (!AccountCode || (Number(DebitAmount) === 0 && Number(CreditAmount) === 0)) {
          continue;
        }

        // بررسی وجود حساب
        const accountExists = db.prepare(`
          SELECT AccountCode FROM tblAccounts WHERE AccountCode = ?
        `).get(AccountCode);

        if (!accountExists) {
          throw new Error(`حساب با کد ${AccountCode} وجود ندارد`);
        }

        insertLine.run(
          entryId,
          Number(AccountCode),
          Number(DebitAmount || 0),
          Number(CreditAmount || 0)
        );
        lineCount++;
      }

      console.log(`✅ ${lineCount} ردیف ثبت شد`);
      return { entryId, lineCount };
    });

    const { entryId } = trx();

    res.status(201).json({
      success: true,
      entryId,
      message: 'سند با موفقیت ثبت شد'
    });

  } catch (err) {
    console.error('❌ خطا در ثبت سند:', err.message);

    if (err.message.includes('شماره سند') || err.message.includes('حساب با کد')) {
      return res.status(400).json({ error: err.message });
    }

    res.status(500).json({
      error: 'خطای داخلی سرور در ثبت سند',
      details: err.message
    });
  }
});

/**
 * 📄 دریافت سند کامل با ردیف‌ها
 * مسیر: GET /api/journalentries/:id/full
 * توضیح: دریافت کامل اطلاعات یک سند با تمام ردیف‌ها
 */
router.get('/:id/full', (req, res) => {
  const entryId = Number(req.params.id);

  console.log(`📄 درخواست سند کامل شناسه ${entryId}`);

  if (!entryId || isNaN(entryId)) {
    return res.status(400).json({ error: 'شناسه سند نامعتبر است' });
  }

  try {
    // دریافت اطلاعات سند
    const entry = db.prepare(`
      SELECT 
        EntryId, 
        DocumentNumber, 
        EntryDate, 
        Description, 
        IsBalanced
      FROM tblJournalEntries
      WHERE EntryId = ?
    `).get(entryId);

    if (!entry) {
      return res.status(404).json({ error: 'سند یافت نشد' });
    }

    // دریافت ردیف‌های سند
    const lines = db.prepare(`
      SELECT 
        l.AccountCode, 
        COALESCE(a.TitleFa, 'حساب نامشخص') as TitleFa, 
        l.DebitAmount, 
        l.CreditAmount
      FROM tblJournalLines l
      LEFT JOIN tblAccounts a ON a.AccountCode = l.AccountCode
      WHERE l.EntryId = ?
      ORDER BY l.LineId
    `).all(entryId);

    const formattedEntry = {
      ...entry,
      IsBalanced: Boolean(entry.IsBalanced),
      Lines: lines
    };

    res.json(formattedEntry);
  } catch (err) {
    console.error('❌ خطا در واکشی سند:', err.message);
    res.status(500).json({
      error: 'خطای داخلی سرور',
      details: err.message
    });
  }
});

/**
 * 🗑 حذف سند
 * مسیر: DELETE /api/journalentries/:id
 * توضیح: حذف کامل یک سند با تمام ردیف‌های آن
 */
router.delete('/:id', (req, res) => {
  const entryId = Number(req.params.id);

  console.log(`🗑 درخواست حذف سند شناسه ${entryId}`);

  if (!entryId || isNaN(entryId)) {
    return res.status(400).json({ error: 'شناسه نامعتبر' });
  }

  try {
    // بررسی وجود سند
    const entryExists = db.prepare(`
      SELECT EntryId FROM tblJournalEntries WHERE EntryId = ?
    `).get(entryId);

    if (!entryExists) {
      return res.status(404).json({ error: 'سند یافت نشد' });
    }

    const trx = db.transaction(() => {
      // حذف ردیف‌ها
      db.prepare(`DELETE FROM tblJournalLines WHERE EntryId = ?`).run(entryId);
      // حذف سند اصلی
      db.prepare(`DELETE FROM tblJournalEntries WHERE EntryId = ?`).run(entryId);
    });

    trx();

    console.log(`✅ سند ${entryId} حذف شد`);

    res.json({
      success: true,
      message: 'سند با موفقیت حذف شد'
    });
  } catch (err) {
    console.error('❌ خطا در حذف سند:', err.message);
    res.status(500).json({
      error: 'خطای داخلی سرور در حذف سند',
      details: err.message
    });
  }
});

/**
 * ✏️ ویرایش سند
 * مسیر: PUT /api/journalentries/:id
 * توضیح: ویرایش کامل اطلاعات یک سند
 */
router.put('/:id', (req, res) => {
  const entryId = Number(req.params.id);
  const { DocumentNumber, EntryDate, Description, Lines } = req.body;

  console.log(`✏️ درخواست ویرایش سند ${entryId}`, { DocumentNumber });

  if (!entryId || isNaN(entryId)) {
    return res.status(400).json({ error: 'شناسه سند نامعتبر است' });
  }

  if (!DocumentNumber || typeof DocumentNumber !== 'string' || DocumentNumber.trim() === '') {
    return res.status(400).json({ error: 'شماره سند الزامی است' });
  }

  if (!Array.isArray(Lines) || Lines.length === 0) {
    return res.status(400).json({ error: 'حداقل یک ردیف سند لازم است' });
  }

  // محاسبه تراز
  const totalDebit = Lines.reduce((sum, l) => sum + Number(l.DebitAmount || 0), 0);
  const totalCredit = Lines.reduce((sum, l) => sum + Number(l.CreditAmount || 0), 0);
  const isBalanced = totalDebit === totalCredit;

  if (!isBalanced) {
    return res.status(400).json({
      error: 'سند تراز نیست',
      details: { totalDebit, totalCredit }
    });
  }

  try {
    const trx = db.transaction(() => {
      // بررسی وجود سند
      const entryExists = db.prepare(`
        SELECT EntryId FROM tblJournalEntries WHERE EntryId = ?
      `).get(entryId);

      if (!entryExists) {
        throw new Error('سند مورد نظر یافت نشد');
      }

      // بررسی تکراری نبودن شماره سند (به جز خود سند)
      const duplicate = db.prepare(`
        SELECT EntryId FROM tblJournalEntries 
        WHERE DocumentNumber = ? AND EntryId != ?
      `).get(DocumentNumber.trim(), entryId);

      if (duplicate) {
        throw new Error(`شماره سند ${DocumentNumber} قبلاً برای سند دیگری ثبت شده است`);
      }

      // به‌روزرسانی سند اصلی
      db.prepare(`
        UPDATE tblJournalEntries
        SET 
          DocumentNumber = ?, 
          EntryDate = ?, 
          Description = ?, 
          IsBalanced = ?
        WHERE EntryId = ?
      `).run(
        DocumentNumber.trim(),
        EntryDate || new Date().toISOString(),
        Description?.trim() || null,
        isBalanced ? 1 : 0,
        entryId
      );

      // حذف ردیف‌های قبلی
      db.prepare(`DELETE FROM tblJournalLines WHERE EntryId = ?`).run(entryId);

      // درج ردیف‌های جدید
      const insertLine = db.prepare(`
        INSERT INTO tblJournalLines (
          EntryId, 
          AccountCode, 
          DebitAmount, 
          CreditAmount
        ) VALUES (?, ?, ?, ?)
      `);

      for (const line of Lines) {
        if (!line.AccountCode || (Number(line.DebitAmount) === 0 && Number(line.CreditAmount) === 0)) {
          continue;
        }

        // بررسی وجود حساب
        const accountExists = db.prepare(`
          SELECT AccountCode FROM tblAccounts WHERE AccountCode = ?
        `).get(line.AccountCode);

        if (!accountExists) {
          throw new Error(`حساب با کد ${line.AccountCode} وجود ندارد`);
        }

        insertLine.run(
          entryId,
          Number(line.AccountCode),
          Number(line.DebitAmount || 0),
          Number(line.CreditAmount || 0)
        );
      }
    });

    trx();

    console.log(`✅ سند ${entryId} ویرایش شد`);

    res.json({
      success: true,
      message: 'سند با موفقیت ویرایش شد'
    });
  } catch (err) {
    console.error('❌ خطا در ویرایش سند:', err.message);

    if (err.message.includes('یافت نشد') || err.message.includes('ثبت شده') || err.message.includes('حساب با کد')) {
      return res.status(400).json({ error: err.message });
    }

    res.status(500).json({
      error: 'خطای داخلی سرور در ویرایش سند',
      details: err.message
    });
  }
});

export default router;