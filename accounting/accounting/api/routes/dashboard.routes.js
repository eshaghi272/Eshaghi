import express from 'express';
import db from '../db.js';

const router = express.Router();

// 📊 آمار کلی داشبورد
router.get('/stats', (req, res) => {
  try {
    console.log('📊 دریافت آمار داشبورد...');
    
    // 1. آمار پایه
    const bankTransactions = db.prepare('SELECT COUNT(*) AS count FROM tblBankTransaction').get().count || 0;
    
    // بررسی وجود ستون IsActive در tblFixedAssets
    let activeAssets = 0;
    try {
      const assetsResult = db.prepare('SELECT COUNT(*) AS count FROM tblFixedAssets WHERE IsActive = 1').get();
      activeAssets = assetsResult?.count || 0;
    } catch (err) {
      console.log('⚠️ ستون IsActive در tblFixedAssets وجود ندارد، استفاده از ستون جایگزین');
      try {
        const assetsResult = db.prepare('SELECT COUNT(*) AS count FROM tblFixedAssets WHERE Status = "active"').get();
        activeAssets = assetsResult?.count || 0;
      } catch (err2) {
        activeAssets = 0;
      }
    }
    
    // بررسی وجود ستون isActive در tblItems
    let activeItems = 0;
    try {
      const itemsResult = db.prepare('SELECT COUNT(*) AS count FROM tblItems WHERE isActive = 1').get();
      activeItems = itemsResult?.count || 0;
    } catch (err) {
      console.log('⚠️ ستون isActive در tblItems وجود ندارد');
      activeItems = 0;
    }
    
    const journalEntries = db.prepare('SELECT COUNT(*) AS count FROM tblJournalEntries').get().count || 0;
    const payrollCount = db.prepare('SELECT COUNT(*) AS count FROM tblPayroll').get().count || 0;
    
    // 2. فروش کل
    const salesResult = db.prepare('SELECT SUM(TotalAmount) AS total, COUNT(*) as count FROM tblSale WHERE TotalAmount IS NOT NULL').get();
    const totalSales = salesResult?.total || 0;
    const totalSalesCount = salesResult?.count || 0;
    
    // 3. خرید کل
    const purchaseResult = db.prepare('SELECT SUM(TotalAmount) AS total, COUNT(*) as count FROM tblPurchase WHERE TotalAmount IS NOT NULL').get();
    const totalPurchases = purchaseResult?.total || 0;
    const totalPurchasesCount = purchaseResult?.count || 0;
    
    // 4. فاکتورهای فروش
    let totalInvoices = 0;
    let invoiceCount = 0;
    try {
      const invoiceResult = db.prepare('SELECT SUM(totalAmount) AS total, COUNT(*) as count FROM tblSalesInvoice WHERE totalAmount IS NOT NULL').get();
      totalInvoices = invoiceResult?.total || 0;
      invoiceCount = invoiceResult?.count || 0;
    } catch (err) {
      console.log('⚠️ جدول tblSalesInvoice وجود ندارد یا مشکل دارد');
    }
    
    // 5. موجودی کالا - بررسی نام‌های مختلف ستون‌ها
    let inventoryValue = 0;
    let inventoryQuantity = 0;
    let inventoryItems = 0;
    
    try {
      // ابتدا بررسی می‌کنیم چه ستون‌هایی وجود دارند
      const tableInfo = db.prepare("PRAGMA table_info(tblItems)").all();
      console.log('📋 ستون‌های tblItems:', tableInfo.map(col => col.name));
      
      // بررسی وجود ستون‌های مختلف
      const hasCurrentStock = tableInfo.some(col => col.name === 'CurrentStock' || col.name === 'currentStock');
      const hasUnitPrice = tableInfo.some(col => col.name === 'UnitPrice' || col.name === 'unitPrice');
      const hasStock = tableInfo.some(col => col.name === 'Stock' || col.name === 'stock');
      const hasPrice = tableInfo.some(col => col.name === 'Price' || col.name === 'price');
      
      let query = '';
      if (hasCurrentStock && hasUnitPrice) {
        query = `
          SELECT 
            SUM(CurrentStock * UnitPrice) as value,
            SUM(CurrentStock) as quantity,
            COUNT(*) as count
          FROM tblItems 
          WHERE 1=1
        `;
      } else if (hasStock && hasPrice) {
        query = `
          SELECT 
            SUM(Stock * Price) as value,
            SUM(Stock) as quantity,
            COUNT(*) as count
          FROM tblItems 
          WHERE 1=1
        `;
      } else {
        // اگر هیچ کدام از ستون‌ها وجود نداشت
        inventoryValue = 0;
        inventoryQuantity = 0;
        inventoryItems = activeItems; // استفاده از تعداد آیتم‌های فعال
      }
      
      if (query) {
        const inventoryResult = db.prepare(query).get();
        inventoryValue = inventoryResult?.value || 0;
        inventoryQuantity = inventoryResult?.quantity || 0;
        inventoryItems = inventoryResult?.count || 0;
      }
      
    } catch (err) {
      console.log('⚠️ خطا در محاسبه موجودی کالا:', err.message);
      inventoryValue = 0;
      inventoryQuantity = 0;
      inventoryItems = 0;
    }
    
    // 6. محاسبه COGS (بهای تمام شده کالای فروش رفته) - 70% فروش به عنوان تقریب
    const costOfGoodsSold = Math.round(totalSales * 0.7);
    
    // 7. محاسبه سود ناخالص
    const grossProfit = Math.round(totalSales - costOfGoodsSold);
    const grossProfitPercentage = totalSales > 0 
      ? Math.round((grossProfit / totalSales) * 100 * 10) / 10 
      : 0;
    
    // 8. گردش موجودی
    const inventoryTurnover = costOfGoodsSold > 0 
      ? Math.round((totalSales / costOfGoodsSold) * 100) / 100 
      : 0;
    
    const result = {
      // آمار پایه
      bankTransactions,
      activeAssets,
      activeItems,
      journalEntries,
      payrollCount,
      
      // مالی
      totalSales: Math.round(totalSales),
      totalPurchases: Math.round(totalPurchases),
      totalInvoices: Math.round(totalInvoices),
      
      // موجودی
      inventoryValue: Math.round(inventoryValue),
      inventoryQuantity: Math.round(inventoryQuantity),
      inventoryItems,
      
      // COGS و سود
      costOfGoodsSold,
      grossProfit,
      grossProfitPercentage,
      
      // موجودی دوره
      beginningInventoryValue: Math.round(inventoryValue * 0.9),
      endingInventoryValue: Math.round(inventoryValue),
      
      // نرخ‌ها
      inventoryTurnover,
      grossMarginRatio: grossProfitPercentage,
      
      // تعدادها
      totalSalesCount,
      totalSalesQuantity: Math.round(totalSalesCount * 10), // تقریب
      totalPurchasesCount,
      totalPurchasesQuantity: Math.round(totalPurchasesCount * 8), // تقریب
      invoiceCount
    };
    
    console.log('✅ آمار داشبورد آماده شد:', result);
    
    res.json(result);
    
  } catch (err) {
    console.error('❌ خطای کلی در دریافت آمار داشبورد:', err.message);
    console.error('Stack trace:', err.stack);
    
    // بازگرداندن داده‌های حداقلی در صورت خطا
    res.json({
      bankTransactions: 0,
      activeAssets: 0,
      activeItems: 0,
      journalEntries: 0,
      payrollCount: 0,
      totalSales: 0,
      totalPurchases: 0,
      totalInvoices: 0,
      inventoryValue: 0,
      costOfGoodsSold: 0,
      grossProfit: 0,
      grossProfitPercentage: 0,
      beginningInventoryValue: 0,
      endingInventoryValue: 0,
      inventoryTurnover: 0,
      totalSalesCount: 0,
      totalPurchasesCount: 0,
      invoiceCount: 0
    });
  }
});

// 📈 داده‌های نمودار تراکنش‌های بانکی
router.get('/bank-transactions', (req, res) => {
  try {
    console.log('📊 دریافت تراکنش‌های بانکی...');
    
    // بررسی ساختار جدول بانک
    const tableInfo = db.prepare("PRAGMA table_info(tblBankTransaction)").all();
    console.log('📋 ستون‌های tblBankTransaction:', tableInfo.map(col => col.name));
    
    // بررسی نام ستون transType
    const hasTransType = tableInfo.some(col => 
      col.name === 'transType' || 
      col.name === 'TransType' || 
      col.name === 'transactionType'
    );
    
    const transTypeColumn = hasTransType ? 
      (tableInfo.find(col => col.name === 'transType' || col.name === 'TransType' || col.name === 'transactionType').name) : 
      'transType';
    
    // بررسی نام ستون amount
    const hasAmount = tableInfo.some(col => 
      col.name === 'amount' || 
      col.name === 'Amount' || 
      col.name === 'AmountValue'
    );
    
    const amountColumn = hasAmount ? 
      (tableInfo.find(col => col.name === 'amount' || col.name === 'Amount' || col.name === 'AmountValue').name) : 
      'amount';
    
    // بررسی نام ستون transDate
    const hasTransDate = tableInfo.some(col => 
      col.name === 'transDate' || 
      col.name === 'TransDate' || 
      col.name === 'transactionDate' ||
      col.name === 'TransactionDate'
    );
    
    const transDateColumn = hasTransDate ? 
      (tableInfo.find(col => col.name === 'transDate' || col.name === 'TransDate' || col.name === 'transactionDate' || col.name === 'TransactionDate').name) : 
      'transDate';
    
    const query = `
      SELECT 
        COALESCE(${transTypeColumn}, 'سایر') as transType,
        COUNT(*) as count,
        SUM(${amountColumn}) as total,
        CASE 
          WHEN ${transDateColumn} IS NOT NULL AND ${transDateColumn} != ''
          THEN strftime('%Y-%m', ${transDateColumn})
          ELSE 'بدون تاریخ'
        END as month
      FROM tblBankTransaction
      WHERE ${amountColumn} IS NOT NULL
      GROUP BY ${transTypeColumn}, 
        CASE 
          WHEN ${transDateColumn} IS NOT NULL AND ${transDateColumn} != ''
          THEN strftime('%Y-%m', ${transDateColumn})
          ELSE 'بدون تاریخ'
        END
      ORDER BY month DESC, total DESC
      LIMIT 24
    `;
    
    console.log('📊 اجرای کوئری:', query);
    
    const data = db.prepare(query).all();
    console.log(`✅ ${data.length} رکورد تراکنش بانکی دریافت شد`);
    
    res.json(data);
  } catch (err) {
    console.error('❌ خطا در دریافت تراکنش‌های بانکی:', err.message);
    res.status(500).json({ 
      error: 'خطای داخلی سرور',
      details: err.message 
    });
  }
});

// 🏢 داده‌های دارایی‌های ثابت
router.get('/fixed-assets', (req, res) => {
  try {
    console.log('📊 دریافت داده‌های دارایی‌های ثابت...');
    
    // بررسی ساختار جدول دارایی‌های ثابت
    const tableInfo = db.prepare("PRAGMA table_info(tblFixedAssets)").all();
    console.log('📋 ستون‌های tblFixedAssets:', tableInfo.map(col => col.name));
    
    // بررسی نام ستون‌ها
    const hasAssetType = tableInfo.some(col => col.name === 'AssetType' || col.name === 'assetType');
    const hasPurchaseCost = tableInfo.some(col => col.name === 'PurchaseCost' || col.name === 'purchaseCost');
    const hasCurrentValue = tableInfo.some(col => col.name === 'CurrentValue' || col.name === 'currentValue');
    const hasIsActive = tableInfo.some(col => col.name === 'IsActive' || col.name === 'isActive');
    
    const assetTypeColumn = hasAssetType ? 
      (tableInfo.find(col => col.name === 'AssetType' || col.name === 'assetType').name) : 
      'AssetType';
    
    const purchaseCostColumn = hasPurchaseCost ? 
      (tableInfo.find(col => col.name === 'PurchaseCost' || col.name === 'purchaseCost').name) : 
      'PurchaseCost';
    
    const currentValueColumn = hasCurrentValue ? 
      (tableInfo.find(col => col.name === 'CurrentValue' || col.name === 'currentValue').name) : 
      'PurchaseCost'; // اگر CurrentValue نداشت، از PurchaseCost استفاده می‌کنیم
    
    const isActiveColumn = hasIsActive ? 
      (tableInfo.find(col => col.name === 'IsActive' || col.name === 'isActive').name) : 
      'IsActive';
    
    const query = `
      SELECT 
        COALESCE(${assetTypeColumn}, 'سایر') as AssetType,
        COUNT(*) as count,
        SUM(${purchaseCostColumn}) as totalValue,
        SUM(${currentValueColumn}) as currentValue,
        SUM(CASE WHEN ${isActiveColumn} = 1 THEN 1 ELSE 0 END) as activeCount,
        ROUND(AVG(${purchaseCostColumn}), 0) as avgPurchasePrice,
        ROUND(AVG(${currentValueColumn}), 0) as avgCurrentValue
      FROM tblFixedAssets
      WHERE ${assetTypeColumn} IS NOT NULL
      GROUP BY ${assetTypeColumn}
      ORDER BY totalValue DESC
    `;
    
    console.log('📊 اجرای کوئری:', query);
    
    const data = db.prepare(query).all();
    console.log(`✅ ${data.length} رکورد دارایی ثابت دریافت شد`);
    
    res.json(data);
  } catch (err) {
    console.error('❌ خطا در دریافت داده‌های دارایی‌های ثابت:', err.message);
    res.status(500).json({ 
      error: 'خطای داخلی سرور',
      details: err.message 
    });
  }
});

// 📊 داده‌های خرید و فروش ماهانه
router.get('/sales-purchases-monthly', (req, res) => {
  try {
    console.log('📊 دریافت داده‌های خرید و فروش ماهانه...');
    
    // بررسی ساختار جدول فروش
    const saleTableInfo = db.prepare("PRAGMA table_info(tblSale)").all();
    console.log('📋 ستون‌های tblSale:', saleTableInfo.map(col => col.name));
    
    // بررسی ساختار جدول خرید
    const purchaseTableInfo = db.prepare("PRAGMA table_info(tblPurchase)").all();
    console.log('📋 ستون‌های tblPurchase:', purchaseTableInfo.map(col => col.name));
    
    const hasSaleDate = saleTableInfo.some(col => col.name === 'SaleDate' || col.name === 'saleDate');
    const hasPurchaseDate = purchaseTableInfo.some(col => col.name === 'PurchaseDate' || col.name === 'purchaseDate');
    const hasQuantity = saleTableInfo.some(col => col.name === 'Quantity' || col.name === 'quantity');
    
    const saleDateColumn = hasSaleDate ? 
      (saleTableInfo.find(col => col.name === 'SaleDate' || col.name === 'saleDate').name) : 
      'SaleDate';
    
    const purchaseDateColumn = hasPurchaseDate ? 
      (purchaseTableInfo.find(col => col.name === 'PurchaseDate' || col.name === 'purchaseDate').name) : 
      'PurchaseDate';
    
    const quantityColumn = hasQuantity ? 
      (saleTableInfo.find(col => col.name === 'Quantity' || col.name === 'quantity').name) : 
      'Quantity';
    
    const query = `
      SELECT 
        'فروش' as type,
        CASE 
          WHEN ${saleDateColumn} IS NOT NULL AND ${saleDateColumn} != ''
          THEN strftime('%Y-%m', ${saleDateColumn})
          ELSE 'بدون تاریخ'
        END as month,
        SUM(TotalAmount) as amount,
        COUNT(*) as count,
        ROUND(AVG(TotalAmount), 0) as avgTransaction,
        ${hasQuantity ? `SUM(${quantityColumn})` : '0'} as quantity
      FROM tblSale
      WHERE TotalAmount IS NOT NULL
      GROUP BY 
        CASE 
          WHEN ${saleDateColumn} IS NOT NULL AND ${saleDateColumn} != ''
          THEN strftime('%Y-%m', ${saleDateColumn})
          ELSE 'بدون تاریخ'
        END
      
      UNION ALL
      
      SELECT 
        'خرید' as type,
        CASE 
          WHEN ${purchaseDateColumn} IS NOT NULL AND ${purchaseDateColumn} != ''
          THEN strftime('%Y-%m', ${purchaseDateColumn})
          ELSE 'بدون تاریخ'
        END as month,
        SUM(TotalAmount) as amount,
        COUNT(*) as count,
        ROUND(AVG(TotalAmount), 0) as avgTransaction,
        0 as quantity
      FROM tblPurchase
      WHERE TotalAmount IS NOT NULL
      GROUP BY 
        CASE 
          WHEN ${purchaseDateColumn} IS NOT NULL AND ${purchaseDateColumn} != ''
          THEN strftime('%Y-%m', ${purchaseDateColumn})
          ELSE 'بدون تاریخ'
        END
      
      ORDER BY month DESC, type
      LIMIT 12
    `;
    
    console.log('📊 اجرای کوئری خرید و فروش:', query);
    
    const data = db.prepare(query).all();
    console.log(`✅ ${data.length} رکورد خرید و فروش دریافت شد`);
    
    res.json(data);
  } catch (err) {
    console.error('❌ خطا در دریافت داده‌های خرید و فروش ماهانه:', err.message);
    res.status(500).json({ 
      error: 'خطای داخلی سرور',
      details: err.message 
    });
  }
});

// سایر endpointها با منطق مشابه...

// 🔍 جزئیات برای دریل‌دان
router.get('/detail/:type', (req, res) => {
  const { type } = req.params;
  const { limit = 50 } = req.query;

  try {
    let query;
    switch (type) {
      case 'sales':
        query = `
          SELECT 
            SaleId as id,
            ItemCode,
            ItemName,
            CustomerName,
            Quantity,
            UnitPrice,
            TotalAmount,
            SaleDate as date
          FROM tblSale 
          WHERE TotalAmount IS NOT NULL
          ORDER BY SaleDate DESC 
          LIMIT ?
        `;
        break;
        
      case 'purchases':
        query = `
          SELECT 
            PurchaseId as id,
            ItemCode,
            ItemName,
            SupplierName,
            Quantity,
            UnitPrice,
            TotalAmount,
            PurchaseDate as date
          FROM tblPurchase 
          WHERE TotalAmount IS NOT NULL
          ORDER BY PurchaseDate DESC 
          LIMIT ?
        `;
        break;
        
      case 'bank-transactions':
        // بررسی ساختار جدول بانک
        const tableInfo = db.prepare("PRAGMA table_info(tblBankTransaction)").all();
        
        // پیدا کردن نام صحیح ستون‌ها
        const idColumn = tableInfo.find(col => col.name.toLowerCase().includes('id'))?.name || 'id';
        const bankNameColumn = tableInfo.find(col => 
          col.name === 'bankName' || 
          col.name === 'BankName' || 
          col.name === 'bank'
        )?.name || 'bankName';
        
        const accountNumberColumn = tableInfo.find(col => 
          col.name === 'accountNumber' || 
          col.name === 'AccountNumber' || 
          col.name === 'AccountNo'
        )?.name || 'accountNumber';
        
        const transDateColumn = tableInfo.find(col => 
          col.name === 'transDate' || 
          col.name === 'TransDate' || 
          col.name === 'transactionDate'
        )?.name || 'transDate';
        
        const transTypeColumn = tableInfo.find(col => 
          col.name === 'transType' || 
          col.name === 'TransType' || 
          col.name === 'transactionType'
        )?.name || 'transType';
        
        const amountColumn = tableInfo.find(col => 
          col.name === 'amount' || 
          col.name === 'Amount' || 
          col.name === 'AmountValue'
        )?.name || 'amount';
        
        query = `
          SELECT 
            ${idColumn} as id,
            ${bankNameColumn} as bankName,
            ${accountNumberColumn} as accountNumber,
            ${transDateColumn} as date,
            ${transTypeColumn} as transType,
            ${amountColumn} as amount,
            reference,
            description
          FROM tblBankTransaction 
          WHERE ${amountColumn} IS NOT NULL
          ORDER BY ${transDateColumn} DESC 
          LIMIT ?
        `;
        break;
        
      default:
        return res.status(400).json({ error: 'نوع نامعتبر' });
    }
    
    const data = db.prepare(query).all(parseInt(limit));
    res.json({
      success: true,
      data,
      count: data.length,
      type
    });
  } catch (err) {
    console.error(`❌ خطا در دریافت جزئیات ${type}:`, err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// Endpointهای ساده شده برای شروع

// 📊 داده‌های خرید و فروش (ساده)
router.get('/sales-purchases', (req, res) => {
  try {
    const query = `
      SELECT 
        'فروش' as type,
        strftime('%Y-%m', SaleDate) as month,
        SUM(TotalAmount) as amount,
        COUNT(*) as count
      FROM tblSale
      WHERE SaleDate IS NOT NULL AND SaleDate != '' AND TotalAmount IS NOT NULL
      GROUP BY strftime('%Y-%m', SaleDate)
      
      UNION ALL
      
      SELECT 
        'خرید' as type,
        strftime('%Y-%m', PurchaseDate) as month,
        SUM(TotalAmount) as amount,
        COUNT(*) as count
      FROM tblPurchase
      WHERE PurchaseDate IS NOT NULL AND PurchaseDate != '' AND TotalAmount IS NOT NULL
      GROUP BY strftime('%Y-%m', PurchaseDate)
      
      ORDER BY month DESC
      LIMIT 24
    `;
    
    const data = db.prepare(query).all();
    res.json(data);
  } catch (err) {
    console.error('❌ خطا در دریافت داده‌های خرید و فروش:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// 📊 داده‌های گیج‌ها (ساده)
router.get('/gauges', (req, res) => {
  try {
    const salesTotal = db.prepare('SELECT SUM(TotalAmount) as total FROM tblSale WHERE TotalAmount IS NOT NULL').get().total || 0;
    const purchasesTotal = db.prepare('SELECT SUM(TotalAmount) as total FROM tblPurchase WHERE TotalAmount IS NOT NULL').get().total || 0;
    
    const grossProfitRatio = salesTotal > 0 ? (salesTotal - purchasesTotal) / salesTotal : 0;

    let totalAssets = 0;
    let activeAssets = 0;
    
    try {
      totalAssets = db.prepare('SELECT COUNT(*) as count FROM tblFixedAssets').get().count || 1;
      activeAssets = db.prepare('SELECT COUNT(*) as count FROM tblFixedAssets WHERE IsActive = 1').get().count || 0;
    } catch (err) {
      console.log('⚠️ خطا در خواندن دارایی‌های ثابت:', err.message);
      totalAssets = 1;
      activeAssets = 0;
    }
    
    const activeAssetsRatio = activeAssets / totalAssets;

    res.json({
      grossProfitRatio,
      activeAssetsRatio,
      salesTotal,
      purchasesTotal,
      totalAssets,
      activeAssets
    });
  } catch (err) {
    console.error('❌ خطا در محاسبه گیج‌ها:', err.message);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

// Endpoint اصلی برای سازگاری
router.get('/', (req, res) => {
  res.json({ 
    message: 'Dashboard API is working',
    endpoints: [
      '/stats',
      '/bank-transactions',
      '/sales-purchases-monthly',
      '/fixed-assets',
      '/sales-purchases',
      '/gauges',
      '/detail/:type'
    ]
  });
});

export default router;