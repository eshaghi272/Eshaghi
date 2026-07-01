import { useEffect, useState } from "react";

export default function LookupAdminPanel() {
    const [groupKey, setGroupKey] = useState("paymentPurpose");
    const [lookupList, setLookupList] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [form, setForm] = useState({ id: null, valueKey: "", labelFa: "", accountCode: "" });
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    useEffect(() => {
        fetch(`http://localhost:5000/api/lookup/${groupKey}`).then(res => res.json()).then(setLookupList);
        fetch("http://localhost:5000/api/lookup/accounts").then(res => res.json()).then(setAccounts);
    }, [groupKey]);

    const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const handleSubmit = async () => {
        if (!form.valueKey || !form.labelFa || !form.accountCode) return alert("همه فیلدها الزامی هستند");

        const method = form.id ? "PUT" : "POST";
        const url = form.id
            ? `http://localhost:5000/api/lookup/update/${form.id}`
            : "http://localhost:5000/api/lookup/add";

        const payload = { groupKey, ...form };

        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (res.ok) {
            alert(form.id ? "✅ گزینه ویرایش شد" : "✅ گزینه ثبت شد");
            setForm({ id: null, valueKey: "", labelFa: "", accountCode: "" });
            const updated = await fetch(`http://localhost:5000/api/lookup/${groupKey}`).then(r => r.json());
            setLookupList(updated);
        } else {
            const errText = await res.text();
            alert("❌ خطا: " + errText);
        }
    };

    const handleEdit = (item) => {
        setForm({ id: item.id, valueKey: item.value, labelFa: item.label, accountCode: item.accountCode });
    };

    const confirmDelete = (id) => setConfirmDeleteId(id);

    const handleDelete = async () => {
        const res = await fetch(`http://localhost:5000/api/lookup/delete/${confirmDeleteId}`, { method: "DELETE" });
        if (res.ok) {
            alert("🗑 گزینه حذف شد");
            setConfirmDeleteId(null);
            const updated = await fetch(`http://localhost:5000/api/lookup/${groupKey}`).then(r => r.json());
            setLookupList(updated);
        } else {
            const errText = await res.text();
            alert("❌ خطا در حذف: " + errText);
        }
    };

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-4">
            <h2 className="text-xl font-bold text-indigo-700">مدیریت گزینه‌های گروهی</h2>

            <select value={groupKey} onChange={(e) => setGroupKey(e.target.value)} className="border px-2 py-1 w-full">
                <option value="paymentPurpose">بابت پرداخت</option>
                <option value="incomeType">نوع درآمد</option>
                <option value="expenseType">نوع هزینه</option>
                <option value="fundType">نوع سرمایه</option>
                <option value="payType">نوع دریافت</option>
                <option value="reciveType">نوع رسید</option>
                <option value="otherType">نوع سایر</option>
                {/* گروه‌های دیگر قابل افزودن */}
            </select>

            <div className="grid grid-cols-2 gap-2">
                <input value={form.valueKey} onChange={(e) => handleChange("valueKey", e.target.value)} placeholder="شناسه داخلی" className="border px-2 py-1" />
                <input value={form.labelFa} onChange={(e) => handleChange("labelFa", e.target.value)} placeholder="عنوان فارسی" className="border px-2 py-1" />
                <select value={form.accountCode} onChange={(e) => handleChange("accountCode", e.target.value)} className="border px-2 py-1 col-span-2">
                    <option value="">انتخاب حساب مرتبط...</option>
                    {accounts.map((a) => (
                        <option key={a.id} value={a.id}>{a.label}</option> // label = AccountCode - TitleFa
                    ))}
                </select>

                <button onClick={handleSubmit} className="bg-indigo-600 text-white px-4 py-2 rounded col-span-2 hover:bg-indigo-700">
                    {form.id ? "✏️ ویرایش گزینه" : "➕ افزودن گزینه"}
                </button>
            </div>

            <hr />
            <h3 className="font-bold text-gray-700">لیست گزینه‌های ثبت‌شده</h3>
            <table className="w-full text-sm border">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border px-2 py-1">شناسه</th>
                        <th className="border px-2 py-1">عنوان</th>
                        <th className="border px-2 py-1">حساب</th>
                        <th className="border px-2 py-1">عملیات</th>
                    </tr>
                </thead>
                <tbody>
                    {lookupList.map((item) => (
                        <tr key={item.id}>
                            <td className="border px-2 py-1">{item.value}</td>
                            <td className="border px-2 py-1">{item.label}</td>
                            <td className="border px-2 py-1">{item.accountCode}</td>
                            <td className="border px-2 py-1 flex gap-2">
                                <button onClick={() => handleEdit(item)} className="text-blue-600 text-sm">✏️</button>
                                <button onClick={() => confirmDelete(item.id)} className="text-red-600 text-sm">🗑</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {confirmDeleteId && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                    <div className="bg-white p-4 rounded shadow-lg space-y-4">
                        <p className="text-sm">آیا مطمئن هستید که می‌خواهید این گزینه را حذف کنید؟</p>
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
