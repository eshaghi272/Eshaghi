import { useEffect, useState } from "react";

export default function TabManager() {
  const [tabs, setTabs] = useState([]);
  const [form, setForm] = useState({ id: null, tabLabel: "", routePath: "" });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    fetchTabs();
  }, []);

  const fetchTabs = async () => {
    const res = await fetch("http://localhost:5000/api/layout/tabs");
    const data = await res.json();
    setTabs(data);
  };

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (!form.tabLabel || !form.routePath) return alert("همه فیلدها الزامی هستند");

    const method = form.id ? "PUT" : "POST";
    const url = form.id
      ? `http://localhost:5000/api/layout/tabs/${form.id}`
      : "http://localhost:5000/api/layout/tabs";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      alert(form.id ? "✅ تب ویرایش شد" : "✅ تب ثبت شد");
      setForm({ id: null, tabLabel: "", routePath: "" });
      fetchTabs();
    } else {
      const errText = await res.text();
      alert("❌ خطا: " + errText);
    }
  };

  const handleEdit = (tab) => {
    setForm({ id: tab.id, tabLabel: tab.label, routePath: tab.to });
  };

  const handleDelete = async () => {
    const res = await fetch(`http://localhost:5000/api/layout/tabs/${confirmDeleteId}`, { method: "DELETE" });
    if (res.ok) {
      alert("🗑 تب حذف شد");
      setConfirmDeleteId(null);
      fetchTabs();
    } else {
      const errText = await res.text();
      alert("❌ خطا در حذف: " + errText);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-4">
      <h2 className="text-xl font-bold text-indigo-700">مدیریت تب‌های لایوت</h2>

      <div className="grid grid-cols-2 gap-2">
        <input value={form.tabLabel} onChange={(e) => handleChange("tabLabel", e.target.value)} placeholder="عنوان تب" className="border px-2 py-1" />
        <input value={form.routePath} onChange={(e) => handleChange("routePath", e.target.value)} placeholder="مسیر تب (مثلاً /ledger)" className="border px-2 py-1" />
        <button onClick={handleSubmit} className="bg-indigo-600 text-white px-4 py-2 rounded col-span-2 hover:bg-indigo-700">
          {form.id ? "✏️ ویرایش تب" : "➕ افزودن تب"}
        </button>
      </div>

      <hr />
      <h3 className="font-bold text-gray-700">لیست تب‌های ثبت‌شده</h3>
      <table className="w-full text-sm border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-2 py-1">عنوان</th>
            <th className="border px-2 py-1">مسیر</th>
            <th className="border px-2 py-1">عملیات</th>
          </tr>
        </thead>
        <tbody>
          {tabs.map((tab) => (
            <tr key={tab.id}>
              <td className="border px-2 py-1">{tab.label}</td>
              <td className="border px-2 py-1">{tab.to}</td>
              <td className="border px-2 py-1 flex gap-2">
                <button onClick={() => handleEdit(tab)} className="text-blue-600 text-sm">✏️</button>
                <button onClick={() => setConfirmDeleteId(tab.id)} className="text-red-600 text-sm">🗑</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center">
          <div className="bg-white p-4 rounded shadow-lg space-y-4">
            <p className="text-sm">آیا مطمئن هستید که می‌خواهید این تب را حذف کنید؟</p>
            <div className="flex gap-4 justify-end">
              <button onClick={() => setConfirmDeleteId(null)} className="px-3 py-1 border rounded">لغو</button>
              <button onClick={handleDelete} className="px-3 py-1 bg-red-600 text-white rounded">حذف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
