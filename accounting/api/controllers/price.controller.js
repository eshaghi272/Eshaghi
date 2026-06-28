import db from "../db.js";

export function getLatestPurchasePrice(req, res) {
  console.log("✅ کنترلر قیمت کالا اجرا شد");

  const code = Number(req.params.itemCode);
  if (isNaN(code)) {
    console.log("❌ کد کالا نامعتبر:", req.params.itemCode);
    return res.status(400).json({ error: "کد کالا نامعتبر است" });
  }

  try {
    const row = db.prepare(`
      SELECT UnitPrice
      FROM tblPurchase
      WHERE ItemCode = ?
        AND Quantity > 0
      ORDER BY PurchaseDate DESC
      LIMIT 1
    `).get(code);

    console.log(`📦 درخواست قیمت برای کالا: ${code}`);
    console.log("📦 نتیجه کامل:", row);

    const unitPrice = row?.UnitPrice ?? row?.unitprice;
    if (unitPrice == null) {
      return res.status(404).json({ error: "قیمت برای این کالا یافت نشد" });
    }

    res.json({ unitPrice });
  } catch (err) {
    console.error("❌ خطا در دریافت قیمت خرید:", err);
    res.status(500).json({ error: "خطای داخلی سرور" });
  }
}
