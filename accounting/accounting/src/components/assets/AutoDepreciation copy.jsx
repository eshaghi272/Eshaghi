import { useState, useEffect } from "react";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

export default function AutoDepreciation() {
  const [assets, setAssets] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [period, setPeriod] = useState("");
  const [loading, setLoading] = useState(false);

  const reloadAssets = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/fixedassets");
      if (!res.ok) throw new Error("خطا در واکشی دارایی‌ها");
      const data = await res.json();
      setAssets(data);
    } catch (err) {
      console.error("❌ خطا در دریافت دارایی‌ها:", err);
      alert("❌ خطا در دریافت لیست دارایی‌ها");
    }
  };

  useEffect(() => {
    reloadAssets();
  }, []);

  const toggleSelection = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === assets.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(assets.map(a => a.AssetId));
    }
  };

  const postDepEntries = async () => {
    if (selectedIds.length === 0 || !period) {
      alert("⚠️ لطفاً دارایی و دوره را انتخاب کنید");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/accounting/generate-depreciation-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetIds: selectedIds, period })
      });

      const result = await res.json();

      if (!res.ok) {
        alert("❌ خطا در ثبت سند استهلاک: " + (result.error || "خطای نامشخص"));
        return;
      }

      alert(`✅ ${result.message}`);
      setSelectedIds([]);
      await reloadAssets();
    } catch (err) {
      console.error("❌ خطا در ارسال درخواست:", err);
      alert("❌ ارتباط با سرور برقرار نشد");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-4 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-blue-700 dark:text-blue-100">
          📑 صدور سند حسابداری استهلاک
        </h2>
      </div>

      {/* انتخاب همه */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={selectedIds.length === assets.length && assets.length > 0}
          onChange={toggleAll}
        />
        <label className="text-sm font-medium">انتخاب همه دارایی‌ها</label>
      </div>

      {/* لیست دارایی‌ها */}
      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-800 text-right">
            <th className="p-2">✔️</th>
            <th className="p-2">کد</th>
            <th className="p-2">نام</th>
            <th className="p-2">تعداد</th>
            <th className="p-2">بها</th>
            <th className="p-2">عمر مفید</th>
            <th className="p-2">اسقاط</th>
            <th className="p-2">روش</th>
          </tr>
        </thead>
        <tbody>
          {assets.map(a => (
            <tr key={a.AssetId} className="border-t text-right hover:bg-gray-50 dark:hover:bg-gray-800">
              <td className="p-2">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(a.AssetId)}
                  onChange={() => toggleSelection(a.AssetId)}
                />
              </td>
              <td className="p-2">{a.AssetCode}</td>
              <td className="p-2">{a.TitleFa}</td>
              <td className="p-2">{a.Quantity}</td>
              <td className="p-2">{a.PurchaseCost}</td>
              <td className="p-2">{a.UsefulLife}</td>
              <td className="p-2">{a.SalvageValue}</td>
              <td className="p-2">{a.DepreciationMethod}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* انتخاب دوره با دیت‌پیکر شمسی */}
      <div className="flex items-center space-x-2">
        <label className="w-32 text-sm font-medium">دوره:</label>
        <DatePicker
          calendar={persian}
          locale={persian_fa}
          value={period}
          onChange={(date) => setPeriod(date.format("YYYY-MM"))}
          inputClass="border rounded px-3 py-2 w-full"
          placeholder="انتخاب تاریخ شمسی"
        />
      </div>

      <button
        onClick={postDepEntries}
        disabled={loading}
        className={`px-4 py-2 rounded text-white ${
          loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
        }`}
      >
        {loading ? "در حال ثبت..." : "ثبت سند حسابداری استهلاک برای موارد انتخاب‌شده"}
      </button>
    </div>
  );
}
