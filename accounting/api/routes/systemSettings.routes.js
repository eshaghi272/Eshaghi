// routes/systemSettings.routes.js
import express from 'express';
import db from '../db.js';

const router = express.Router();
const table = 'tblSystemSettings';
const pk = 'settingKey';

// 📋 دریافت تمام تنظیمات با دسته‌بندی
router.get('/', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT * FROM ${table} 
      ORDER BY 
        CASE 
          WHEN settingKey LIKE 'asset_debit_%' THEN 1
          WHEN settingKey LIKE 'depreciation_expense_%' THEN 2
          WHEN settingKey LIKE 'depreciation_accumulated_%' THEN 3
          WHEN settingKey LIKE 'asset_credit_%' THEN 4
          WHEN settingKey LIKE '%Account' THEN 5
          WHEN settingKey LIKE '%Expense' THEN 6
          WHEN settingKey LIKE '%Payable' THEN 7
          ELSE 8
        END, ${pk}
    `).all();
    
    res.json(rows);
  } catch (err) {
    console.error('❌ خطا در دریافت تنظیمات:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// 📋 دریافت تنظیمات گروه‌بندی شده
router.get('/grouped', (req, res) => {
  try {
    const rows = db.prepare(`SELECT * FROM ${table}`).all();
    
    const grouped = {
      // تنظیمات دارایی ثابت
      assetSettings: rows.filter(row => 
        row.settingKey.includes('asset_') || 
        row.settingKey.includes('depreciation_')
      ),
      
      // تنظیمات حساب‌های خرید و فروش
      transactionSettings: rows.filter(row => 
        row.settingKey.includes('purchase') || 
        row.settingKey.includes('sale') ||
        row.settingKey.includes('pay')
      ),
      
      // تنظیمات حقوق و دستمزد
      salarySettings: rows.filter(row => 
        row.settingKey.includes('salary') ||
        row.settingKey.includes('Expense') && 
        !row.settingKey.includes('depreciation')
      ),
      
      // تنظیمات حساب‌های پرداختنی
      payableSettings: rows.filter(row => 
        row.settingKey.includes('Payable') ||
        row.settingKey.includes('payable')
      ),
      
      // سایر تنظیمات
      otherSettings: rows.filter(row => 
        !row.settingKey.includes('asset_') &&
        !row.settingKey.includes('depreciation_') &&
        !row.settingKey.includes('purchase') &&
        !row.settingKey.includes('sale') &&
        !row.settingKey.includes('pay') &&
        !row.settingKey.includes('salary') &&
        !row.settingKey.includes('Expense') &&
        !row.settingKey.includes('Payable')
      )
    };
    
    res.json(grouped);
  } catch (err) {
    console.error('❌ خطا در دریافت تنظیمات گروه‌بندی شده:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// 📋 دریافت لیست حساب‌ها برای دراپ‌داون
router.get('/accounts/list', (req, res) => {
  try {
    const accounts = db.prepare(`
      SELECT AccountCode, TitleFa, Nature, Type 
      FROM tblAccounts 
      ORDER BY AccountCode
    `).all();
    
    res.json(accounts);
  } catch (err) {
    console.error('❌ خطا در دریافت لیست حساب‌ها:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// 📋 جستجوی حساب‌ها
router.get('/accounts/search', (req, res) => {
  try {
    const { query } = req.query;
    const accounts = db.prepare(`
      SELECT AccountCode, TitleFa, Nature, Type 
      FROM tblAccounts 
      WHERE AccountCode LIKE ? OR TitleFa LIKE ?
      ORDER BY AccountCode
      LIMIT 50
    `).all(`%${query}%`, `%${query}%`);
    
    res.json(accounts);
  } catch (err) {
    console.error('❌ خطا در جستجوی حساب‌ها:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// 📥 دریافت یک تنظیم خاص
router.get('/:key', (req, res) => {
  try {
    const row = db.prepare(`SELECT * FROM ${table} WHERE ${pk} = ?`).get(req.params.key);
    res.json(row || {});
  } catch (err) {
    console.error('❌ خطا در دریافت تنظیم:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// ➕ ثبت تنظیم جدید
router.post('/', (req, res) => {
  try {
    const { settingKey, settingValue, accTitle, description } = req.body;
    
    if (!settingKey) {
      return res.status(400).json({ error: 'کلید تنظیم الزامی است' });
    }
    
    if (!settingValue) {
      return res.status(400).json({ error: 'مقدار تنظیم الزامی است' });
    }
    
    // بررسی وجود کلید تکراری
    const existing = db.prepare(`SELECT settingKey FROM ${table} WHERE ${pk} = ?`).get(settingKey);
    
    if (existing) {
      return res.status(400).json({ error: 'این کلید تنظیم قبلاً ثبت شده است' });
    }
    
    const sql = `INSERT INTO ${table} (${pk}, settingValue, accTitle, description) VALUES (?, ?, ?, ?)`;
    const result = db.prepare(sql).run(settingKey, settingValue, accTitle || '', description || '');
    
    res.json({ 
      success: true, 
      message: 'تنظیم با موفقیت ثبت شد',
      data: { settingKey, settingValue }
    });
  } catch (err) {
    console.error('❌ خطا در ثبت تنظیم:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✏️ به‌روزرسانی تنظیم
router.put('/:key', (req, res) => {
  try {
    const { settingValue, accTitle, description } = req.body;
    
    if (!settingValue) {
      return res.status(400).json({ error: 'مقدار تنظیم الزامی است' });
    }
    
    // بررسی وجود کلید
    const existing = db.prepare(`SELECT settingKey FROM ${table} WHERE ${pk} = ?`).get(req.params.key);
    
    if (!existing) {
      return res.status(404).json({ error: 'تنظیم مورد نظر یافت نشد' });
    }
    
    const sql = `UPDATE ${table} SET settingValue = ?, accTitle = ?, description = ? WHERE ${pk} = ?`;
    const result = db.prepare(sql).run(settingValue, accTitle || '', description || '', req.params.key);
    
    res.json({ 
      success: true, 
      message: 'تنظیم با موفقیت به‌روزرسانی شد',
      changes: result.changes 
    });
  } catch (err) {
    console.error('❌ خطا در به‌روزرسانی تنظیم:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✏️ به‌روزرسانی دسته‌ای تنظیمات
router.put('/', (req, res) => {
  const transaction = db.transaction(() => {
    try {
      const updates = req.body; // آرایه‌ای از تنظیمات برای به‌روزرسانی
      let updatedCount = 0;
      
      const updateStmt = db.prepare(`
        UPDATE ${table} 
        SET settingValue = ?, accTitle = ?, description = ? 
        WHERE ${pk} = ?
      `);
      
      updates.forEach(update => {
        if (update.settingKey && update.settingValue !== undefined) {
          const result = updateStmt.run(
            update.settingValue,
            update.accTitle || '',
            update.description || '',
            update.settingKey
          );
          updatedCount += result.changes;
        }
      });
      
      return { success: true, updatedCount };
    } catch (err) {
      throw err;
    }
  });
  
  try {
    const result = transaction();
    res.json({
      success: true,
      message: `${result.updatedCount} تنظیم با موفقیت به‌روزرسانی شدند`,
      updatedCount: result.updatedCount
    });
  } catch (err) {
    console.error('❌ خطا در به‌روزرسانی دسته‌ای:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🗑️ حذف تنظیم
router.delete('/:key', (req, res) => {
  try {
    const result = db.prepare(`DELETE FROM ${table} WHERE ${pk} = ?`).run(req.params.key);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'تنظیم مورد نظر یافت نشد' });
    }
    
    res.json({ 
      success: true, 
      message: 'تنظیم با موفقیت حذف شد',
      deleted: result.changes 
    });
  } catch (err) {
    console.error('❌ خطا در حذف تنظیم:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// 🔍 جستجوی تنظیمات
router.post('/search', (req, res) => {
  try {
    const { keyword, category } = req.body;
    let query = `SELECT * FROM ${table} WHERE 1=1`;
    const params = [];
    
    if (keyword) {
      query += ` AND (settingKey LIKE ? OR settingValue LIKE ? OR accTitle LIKE ? OR description LIKE ?)`;
      const likeKeyword = `%${keyword}%`;
      params.push(likeKeyword, likeKeyword, likeKeyword, likeKeyword);
    }
    
    if (category) {
      switch(category) {
        case 'asset':
          query += ` AND (settingKey LIKE 'asset_%' OR settingKey LIKE 'depreciation_%')`;
          break;
        case 'transaction':
          query += ` AND (settingKey LIKE '%purchase%' OR settingKey LIKE '%sale%' OR settingKey LIKE '%pay%')`;
          break;
        case 'salary':
          query += ` AND (settingKey LIKE '%salary%' OR settingKey LIKE '%Expense%')`;
          break;
        case 'payable':
          query += ` AND (settingKey LIKE '%Payable%')`;
          break;
      }
    }
    
    query += ` ORDER BY ${pk}`;
    
    const rows = db.prepare(query).all(...params);
    res.json(rows);
  } catch (err) {
    console.error('❌ خطا در جستجوی تنظیمات:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// 🔄 بازنشانی تنظیمات پیش‌فرض
router.post('/reset-defaults', (req, res) => {
  const transaction = db.transaction(() => {
    try {
      // حذف تنظیمات موجود
      db.prepare(`DELETE FROM ${table}`).run();
      
      // درج تنظیمات پیش‌فرض
      const defaults = [
        // حساب‌های خرید و فروش
        ['purchaseDebitAccount', '111502', 'موجودی کالا', 'حساب بدهکار خرید'],
        ['purchaseCreditAccount', '211001', 'حسابهای پرداختنی تجاری', 'حساب بستانکار خرید'],
        ['saleDebitAccount', '111201', 'صندوق', 'حساب بدهکار فروش'],
        ['saleCreditAccount', '411001', 'فروش', 'حساب بستانکار فروش'],
        
        // حساب‌های دارایی ثابت
        ['asset_debit_land', '121001', 'زمین', 'حساب بدهکار خرید زمین'],
        ['asset_debit_building', '121002', 'ساختمان', 'حساب بدهکار خرید ساختمان'],
        ['asset_debit_facility', '121003', 'تاسیسات', 'حساب بدهکار خرید تاسیسات'],
        ['asset_debit_machinery', '121004', 'ماشین آلات', 'حساب بدهکار خرید ماشین آلات'],
        ['asset_debit_vehicle', '121005', 'وسائط نقلیه', 'حساب بدهکار خرید وسائط نقلیه'],
        ['asset_debit_computer', '121006', 'اثاثه و لوازم اداری', 'حساب بدهکار خرید کامپیوتر'],
        ['asset_debit_furniture', '121007', 'اثاثه و لوازم اداری', 'حساب بدهکار خرید اثاثیه'],
        ['asset_debit_software', '121201', 'نرم افزار', 'حساب بدهکار خرید نرم افزار'],
        ['asset_debit_default', '121004', 'ماشین آلات', 'حساب پیش‌فرض خرید دارایی'],
        
        // حساب‌های بستانکار دارایی
        ['asset_credit_cash', '111001', 'صندوق', 'پرداخت نقدی دارایی'],
        ['asset_credit_bank', '111005', 'بانک', 'پرداخت بانکی دارایی'],
        ['asset_credit_payable', '211001', 'حسابهای پرداختنی تجاری', 'خرید نسیه دارایی'],
        ['asset_credit_capital', '311001', 'سرمایه', 'افزایش سرمایه از طریق دارایی'],
        
        // حساب‌های هزینه استهلاک
        ['depreciation_expense_building', '611301', 'هزینه استهلاک ساختمان', ''],
        ['depreciation_expense_facility', '611302', 'هزینه استهلاک تاسیسات', ''],
        ['depreciation_expense_machinery', '611303', 'هزینه استهلاک ماشین آلات', ''],
        ['depreciation_expense_vehicle', '611304', 'هزینه استهلاک وسائط نقلیه', ''],
        ['depreciation_expense_computer', '611305', 'هزینه استهلاک اثاثیه', ''],
        ['depreciation_expense_furniture', '611306', 'هزینه استهلاک اثاثیه', ''],
        
        // حساب‌های استهلاک انباشته
        ['depreciation_accumulated_building', '121101', 'استهلاک انباشته ساختمان', ''],
        ['depreciation_accumulated_facility', '121102', 'استهلاک انباشته تاسیسات', ''],
        ['depreciation_accumulated_machinery', '121103', 'استهلاک انباشته ماشین آلات', ''],
        ['depreciation_accumulated_vehicle', '121104', 'استهلاک انباشته وسائط نقلیه', ''],
        ['depreciation_accumulated_computer', '121105', 'استهلاک انباشته اثاثیه', ''],
        ['depreciation_accumulated_furniture', '121106', 'استهلاک انباشته اثاثیه', ''],
        
        // سایر تنظیمات مهم
        ['depreciationCost', '611303', 'هزینه استهلاک', 'حساب هزینه استهلاک پیش‌فرض'],
        ['depreciationAcum', '121103', 'استهلاک انباشته', 'حساب استهلاک انباشته پیش‌فرض'],
        ['assetCreditAccount', '111001', 'صندوق', 'حساب بستانکار دارایی پیش‌فرض'],
        ['assetPayableAccount', '211001', 'حسابهای پرداختنی تجاری', 'حساب بستانکار دارایی (نسیه)'],
        ['assetCapitalAccount', '311001', 'سرمایه', 'حساب سرمایه برای دارایی'],
      ];
      
      const insertStmt = db.prepare(`
        INSERT INTO ${table} (settingKey, settingValue, accTitle, description) 
        VALUES (?, ?, ?, ?)
      `);
      
      defaults.forEach(([key, value, title, desc]) => {
        insertStmt.run(key, value, title, desc);
      });
      
      return { success: true, inserted: defaults.length };
    } catch (err) {
      throw err;
    }
  });
  
  try {
    const result = transaction();
    res.json({
      success: true,
      message: `تنظیمات پیش‌فرض با موفقیت بازنشانی شدند (${result.inserted} مورد)`
    });
  } catch (err) {
    console.error('❌ خطا در بازنشانی تنظیمات پیش‌فرض:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

export default router;