import db from './db.js';

const code = 4;

try {
  const row = db.prepare(`

   SELECT
  transDate,
  transType,
  reference,
  quantity,
  unitPrice,
  quantity * COALESCE(unitPrice, 0) AS totalAmount
FROM (
  SELECT
    PurchaseDate AS transDate,
    'ورود' AS transType,
    'خرید ' || PurchaseId AS reference,
    ItemCode AS itemCode,
    Quantity AS quantity,
    UnitPrice AS unitPrice
  FROM tblPurchase
  WHERE ItemCode = 100004

  UNION ALL

  SELECT
    transDate,
    transType,
    COALESCE(reference, 'خروج بدون سند'),
    itemCode,
    quantity,
    NULL AS unitPrice
  FROM tblStockTransaction
  WHERE transType = 'خروج' AND itemCode = ?
)
ORDER BY transDate, transType DESC;



  `).get(code);

  console.log("✅ نتیجه:", row);
} catch (err) {
  console.error("❌ خطا:", err);
}
