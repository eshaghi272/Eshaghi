import { useState, useEffect } from "react";

export default function PostedPurchases() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadPostedPurchases = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/purchases/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          where: "IsPosted = 1",
          params: []
        })
      });

      if (!res.ok) throw new Error("خطا در واکشی خریدهای ثبت‌شده");

      const data = await res.json();
      setPurchases(data);
    } catch (err) {
      console.error("❌ خطا در دریافت خریدها:", err);
      alert("❌ خطا در دریافت خریدهای ثبت‌شده");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPostedPurchases();
  }, []);

  const formatAmount = (amount) =>
    new Intl.NumberFormat("fa-IR", {
      style: "currency",
      currency: "IRR",
      maximumFractionDigits: 0
    }).format(amount);

  return (
    <div className="p-6 space-y-4 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100">
      <h2 className="text-lg font-bold text-green-700 dark:text-green-100">
        📋 گزارش خریدهای ثبت‌شده
      </h2>

      {loading ? (
        <div>در حال بارگذاری...</div>
      ) : (
        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800 text-right">
              <th className="p-2">کد کالا</th>
              <th className="p-2">نام کالا</th>
              <th className="p-2">تأمین‌کننده</th>
              <th className="p-2">مبلغ</th>
              <th className="p-2">تاریخ</th>
              <th className="p-2">شرح</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map(p => (
              <tr key={p.PurchaseId} className="border-t text-right hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="p-2">{p.ItemCode}</td>
                <td className="p-2">{p.ItemName}</td>
                <td className="p-2">{p.SupplierName}</td>
                <td className="p-2">{formatAmount((p.Quantity ?? 0) * (p.UnitPrice ?? 0))}</td>
                <td className="p-2">{p.PurchaseDate}</td>
                <td className="p-2">{p.Description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
