import { useState } from "react";

export default function PaymentReceiptForm() {
  const [type, setType] = useState("receive");
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    person: "",
    amount: "",
    method: "cash",
    description: "",
    accountCode: "",
  });

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
  const payload = {
    ReceiptType: type, // 'receive' یا 'pay'
    ReceiptDate: form.date,
    PersonCode: form.person,
    AccountCode: form.accountCode,
    Amount: Number(form.amount),
    Method: form.method,
    Description: form.description,
  };

  try {
    const res = await fetch("http://localhost:5000/api/receipts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      alert("✅ دریافت/پرداخت ثبت شد و سند حسابداری صادر شد");
    } else {
      alert("❌ خطا در ثبت");
    }
  } catch (err) {
    console.error("❌", err.message);
    alert("❌ خطای شبکه");
  }
};

  return (
    <div className="p-6 max-w-xl mx-auto space-y-4">
      <h2 className="text-lg font-bold text-green-700">فرم ثبت دریافت / پرداخت</h2>

      <div className="flex gap-4">
        <label>
          <input type="radio" value="receive" checked={type === "receive"} onChange={() => setType("receive")} />
          دریافت
        </label>
        <label>
          <input type="radio" value="pay" checked={type === "pay"} onChange={() => setType("pay")} />
          پرداخت
        </label>
      </div>

      <input type="date" value={form.date} onChange={(e) => handleChange("date", e.target.value)} className="border px-2 py-1 w-full" />
      <input type="text" placeholder="👤 طرف حساب (کد حساب)" value={form.person} onChange={(e) => handleChange("person", e.target.value)} className="border px-2 py-1 w-full" />
      <input type="number" placeholder="💰 مبلغ" value={form.amount} onChange={(e) => handleChange("amount", e.target.value)} className="border px-2 py-1 w-full" />
      <select value={form.method} onChange={(e) => handleChange("method", e.target.value)} className="border px-2 py-1 w-full">
        <option value="cash">نقدی</option>
        <option value="card">کارت</option>
        <option value="cheque">چک</option>
        <option value="transfer">حواله</option>
      </select>
      <input type="text" placeholder="🏦 حساب بانکی / صندوق (کد حساب)" value={form.accountCode} onChange={(e) => handleChange("accountCode", e.target.value)} className="border px-2 py-1 w-full" />
      <textarea placeholder="📝 توضیحات" value={form.description} onChange={(e) => handleChange("description", e.target.value)} className="border px-2 py-1 w-full" />

      <button onClick={handleSubmit} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
        💾 ثبت و صدور سند
      </button>
    </div>
  );
}
