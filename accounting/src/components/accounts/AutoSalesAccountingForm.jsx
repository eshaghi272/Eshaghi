import { useState, useEffect } from "react";

export default function AutoSalesAccountingForm() {
  const [sales, setSales] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);

  const reloadSales = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/sales/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          where: "IsPosted = 0",
          params: []
        })
      });

      if (!res.ok) throw new Error("خطا در واکشی فروش‌ها");

      const data = await res.json();
      setSales(data);
    } catch (err) {
      console.error("❌ خطا در دریافت فروش‌ها:", err);
      alert("❌ خطا در دریافت فروش‌های ثبت‌نشده");
    }
  };

  useEffect(() => {
    reloadSales();
  }, []);

  const toggleSelection = (saleId) => {
    setSelectedIds(prev =>
      prev.includes(saleId)
        ? prev.filter(id => id !== saleId)
        : [...prev, saleId]
    );
  };

  const postSelectedSales = async () => {
    if (selectedIds.length === 0) {
      alert("⚠️ هیچ موردی انتخاب نشده است");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/accounting/generate-sale-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saleIds: selectedIds.map(id => parseInt(id)) })

      });

      const result = await res.json();

      if (!res.ok) {
        alert("❌ خطا در ثبت سند حسابداری: " + (result.error || "خطای نامشخص"));
        return;
      }

      alert(`✅ ${result.message}`);
      setSelectedIds([]);
      await reloadSales();
    } catch (err) {
      console.error("❌ خطا در ارسال درخواست:", err);
      alert("❌ ارتباط با سرور برقرار نشد");
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount) =>
    new Intl.NumberFormat("fa-IR", {
      style: "currency",
      currency: "IRR",
      maximumFractionDigits: 0
    }).format(amount);

  return (
    <div className="p-6 space-y-4 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100">
      <h2 className="text-lg font-bold text-blue-700 dark:text-blue-100">
        📑 صدور سند حسابداری فروش
      </h2>

      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-800 text-right">
            <th className="p-2">✔️</th>
            <th className="p-2">کد کالا</th>
            <th className="p-2">نام کالا</th>
            <th className="p-2">مشتری</th>
            <th className="p-2">مبلغ</th>
            <th className="p-2">تاریخ</th>
          </tr>
        </thead>
        <tbody>
          {sales.map(sale => (
            <tr key={sale.SaleId} className="border-t text-right hover:bg-gray-50 dark:hover:bg-gray-800">
              <td className="p-2">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(sale.SaleId)}
                  onChange={() => toggleSelection(sale.SaleId)}
                />
              </td>
              <td className="p-2">{sale.ItemCode}</td>
              <td className="p-2">{sale.ItemName}</td>
              <td className="p-2">{sale.CustomerName}</td>
              <td className="p-2">
                {formatAmount((sale.Quantity ?? 0) * (sale.UnitPrice ?? 0))}
              </td>
              <td className="p-2">{sale.SaleDate}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        onClick={postSelectedSales}
        disabled={loading}
        className={`px-4 py-2 rounded text-white ${
          loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
        }`}
      >
        {loading ? "در حال ثبت..." : "ثبت سند حسابداری برای موارد انتخاب‌شده"}
      </button>
    </div>
  );
}
