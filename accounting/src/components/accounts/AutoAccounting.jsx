import { useState, useEffect } from "react";

export default function AutoAccounting() {
  const [mode, setMode] = useState("sale"); // 'sale' or 'purchase'
  const [records, setRecords] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);

  const reloadRecords = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/${mode}s/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          where: "IsPosted = 0",
          params: []
        })
      });

      if (!res.ok) throw new Error("خطا در واکشی اطلاعات");

      const data = await res.json();
      setRecords(data);
    } catch (err) {
      console.error("❌ خطا در دریافت اطلاعات:", err);
      alert("❌ خطا در دریافت موارد ثبت‌نشده");
    }
  };

  useEffect(() => {
    reloadRecords();
  }, [mode]);

  const toggleSelection = (id) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const postSelectedEntries = async () => {
    if (selectedIds.length === 0) {
      alert("⚠️ هیچ موردی انتخاب نشده است");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`http://localhost:5000/api/accounting/generate-${mode}-entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [`${mode}Ids`]: selectedIds.map(id => parseInt(id)) })
      });

      const result = await res.json();

      if (!res.ok) {
        alert("❌ خطا در ثبت سند حسابداری: " + (result.error || "خطای نامشخص"));
        return;
      }

      alert(`✅ ${result.message}`);
      setSelectedIds([]);
      await reloadRecords();
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
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-blue-700 dark:text-blue-100">
          📑 صدور سند حسابداری {mode === "sale" ? "فروش" : "خرید"}
        </h2>
        <button
        onClick={postSelectedEntries}
        disabled={loading}
        className={`px-4 py-2 rounded text-white ${
          loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
        }`}
      >
        {loading ? "در حال ثبت..." : "ثبت سند حسابداری برای موارد انتخاب‌شده"}
      </button>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          className="px-2 py-1 border rounded bg-white dark:bg-gray-800 text-sm"
        >
          <option value="sale">فروش</option>
          <option value="purchase">خرید</option>
        </select>
      </div>

      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-800 text-right">
            <th className="p-2">✔️</th>
            <th className="p-2">کد کالا</th>
            <th className="p-2">نام کالا</th>
            <th className="p-2">{mode === "sale" ? "مشتری" : "تأمین‌کننده"}</th>
            <th className="p-2">مبلغ</th>
            <th className="p-2">تاریخ</th>
          </tr>
        </thead>
        <tbody>
          {records.map(record => (
            <tr key={record[`${mode === "sale" ? "SaleId" : "PurchaseId"}`]} className="border-t text-right hover:bg-gray-50 dark:hover:bg-gray-800">
              <td className="p-2">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(record[`${mode === "sale" ? "SaleId" : "PurchaseId"}`])}
                  onChange={() => toggleSelection(record[`${mode === "sale" ? "SaleId" : "PurchaseId"}`])}
                />
              </td>
              <td className="p-2">{record.ItemCode}</td>
              <td className="p-2">{record.ItemName}</td>
              <td className="p-2">{mode === "sale" ? record.CustomerName : record.SupplierName}</td>
              <td className="p-2">
                {formatAmount((record.Quantity ?? 0) * (record.UnitPrice ?? 0))}
              </td>
              <td className="p-2">{mode === "sale" ? record.SaleDate : record.PurchaseDate}</td>
            </tr>
          ))}
        </tbody>
      </table>

     
    </div>
  );
}
