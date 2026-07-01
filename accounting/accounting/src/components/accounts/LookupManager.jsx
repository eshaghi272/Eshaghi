import { useEffect, useState } from "react";

export default function LookupManager() {
  const [groupKey, setGroupKey] = useState("paymentPurpose");
  const [valueKey, setValueKey] = useState("");
  const [labelFa, setLabelFa] = useState("");
  const [accountCode, setAccountCode] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [lookupList, setLookupList] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/lookup/accounts")
      .then((res) => res.json())
      .then(setAccounts);

    fetch(`http://localhost:5000/api/lookup/${groupKey}`)
      .then((res) => res.json())
      .then(setLookupList);
  }, [groupKey]);

  const handleSubmit = async () => {
    if (!groupKey || !valueKey || !labelFa || !accountCode) {
      alert("لطفاً همه فیلدها را پر کنید");
      return;
    }

    const payload = { groupKey, valueKey, labelFa, accountCode };

    const res = await fetch("http://localhost:5000/api/lookup/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      alert("✅ گزینه جدید ثبت شد");
      setValueKey(""); setLabelFa(""); setAccountCode("");
      const updated = await fetch(`http://localhost:5000/api/lookup/${groupKey}`).then(r => r.json());
      setLookupList(updated);
    } else {
      const errText = await res.text();
      alert("❌ خطا: " + errText);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto space-y-4">
      <h2 className="text-lg font-bold text-indigo-700">مدیریت گزینه‌های {groupKey}</h2>

      <input value={valueKey} onChange={(e) => setValueKey(e.target.value)} placeholder="شناسه داخلی (valueKey)" className="border px-2 py-1 w-full" />
      <input value={labelFa} onChange={(e) => setLabelFa(e.target.value)} placeholder="عنوان فارسی (labelFa)" className="border px-2 py-1 w-full" />

      <select value={accountCode} onChange={(e) => setAccountCode(e.target.value)} className="border px-2 py-1 w-full">
        <option value="">انتخاب حساب مرتبط...</option>
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>{a.label}</option>
        ))}
      </select>

      <button onClick={handleSubmit} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
        ➕ افزودن گزینه
      </button>

      <hr />
      <h3 className="font-bold text-gray-700">لیست گزینه‌های ثبت‌شده</h3>
      <ul className="list-disc pl-5 text-sm">
        {lookupList.map((item, i) => (
          <li key={i}>{item.label} ({item.value}) → حساب {item.accountCode}</li>
        ))}
      </ul>
    </div>
  );
}
