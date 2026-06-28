import { useEffect, useState } from "react";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import DocumentNumberInput from "../ui/DocumentNumberInput";

export default function BankTransactionTable() {
  const [banks, setBanks] = useState([]);
  const [persons, setPersons] = useState([]);
  const [purposes, setPurposes] = useState([]);
  const [documentNumber, setDocumentNumber] = useState("");
  const [rows, setRows] = useState([
    { type: "withdraw", bankId: "", subsidiaryId: "", amount: "", date: "", purpose: "", description: "" }
  ]);

  useEffect(() => {
    fetch("http://localhost:5000/api/bankaccounts").then(res => res.json()).then(setBanks);
    fetch("http://localhost:5000/api/persons").then(res => res.json()).then(setPersons);
    fetch("http://localhost:5000/api/lookup/paymentpurpose").then(res => res.json()).then(setPurposes);
    
    // دریافت آخرین شماره سند هنگام لود شدن
    fetchLastDocumentNumber();
  }, []);

  // دریافت آخرین شماره سند
  const fetchLastDocumentNumber = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/journalentries/last");
      if (res.ok) {
        const data = await res.json();
        if (data.DocumentNumber) {
          const currentNum = parseInt(data.DocumentNumber);
          if (!isNaN(currentNum)) {
            const nextNumber = currentNum + 1;
            setDocumentNumber(nextNumber.toString().padStart(5, '0'));
          }
        }
      }
    } catch (err) {
      console.error("خطا در دریافت آخرین شماره سند:", err);
    }
  };

  // هندلر تغییر شماره سند
  const handleDocumentNumberChange = (value) => {
    const stringValue = String(value || "");
    setDocumentNumber(stringValue);
  };

  // هندلر برای تولید شماره سند جدید
  const handleTriggerNewDoc = (suggestedNumber) => {
    const stringValue = String(suggestedNumber || "");
    setDocumentNumber(stringValue);
    
    // ریست ردیف‌ها
    const today = new Date();
    const todayPersian = today.toLocaleDateString('fa-IR');
    setRows([{ 
      type: "withdraw", 
      bankId: "", 
      subsidiaryId: "", 
      amount: "", 
      date: todayPersian, 
      purpose: "", 
      description: "" 
    }]);
  };

  const updateRow = (index, field, value) => {
    const updated = [...rows];
    updated[index][field] = value;
    setRows(updated);
  };

  const addRow = () => {
    // تاریخ امروز به شمسی
    const today = new Date();
    const todayPersian = today.toLocaleDateString('fa-IR');
    
    setRows([...rows, { 
      type: "withdraw", 
      bankId: "", 
      subsidiaryId: "", 
      amount: "", 
      date: todayPersian, 
      purpose: "", 
      description: "" 
    }]);
  };

  const removeRow = (index) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  // تابع برای مدیریت تغییر تاریخ در DatePicker
  const handleDateChange = (index, date) => {
    if (date) {
      // تبدیل تاریخ شمسی به رشته
      const persianDateString = date.format("YYYY/MM/DD");
      updateRow(index, "date", persianDateString);
    } else {
      updateRow(index, "date", "");
    }
  };

  const handleSubmit = async () => {
    // اعتبارسنجی شماره سند
    if (!documentNumber.trim()) {
      alert("شماره سند را وارد کنید");
      return;
    }

    const validRows = rows.filter(r => r.bankId && r.subsidiaryId && r.amount);
    if (validRows.length === 0) return alert("هیچ ردیف معتبری وارد نشده");

    const description = `پرداخت بانکی شماره ${documentNumber} `;

    const payload = { 
      DocumentNumber: documentNumber,
      Description: description,
      transactions: validRows.map(r => ({ 
        ...r, 
        bankId: Number(r.bankId), 
        subsidiaryId: Number(r.subsidiaryId), 
        amount: Number(r.amount),
        // اضافه کردن description به هر تراکنش
        description: r.description || description
      })) 
    };

    console.log("📤 ارسال داده‌ها:", payload);

    const res = await fetch("http://localhost:5000/api/accounting/generate-bank-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      alert("✅ ثبت شد");
      
      // تولید شماره سند جدید برای سند بعدی
      try {
        const currentNum = parseInt(documentNumber);
        if (!isNaN(currentNum)) {
          const nextNumber = currentNum + 1;
          setDocumentNumber(nextNumber.toString().padStart(5, '0'));
        }
      } catch (e) {
        console.log("خطا در محاسبه شماره سند بعدی:", e);
      }
      
      // ریست فرم - فقط ردیف اول با تاریخ امروز
      const today = new Date();
      const todayPersian = today.toLocaleDateString('fa-IR');
      setRows([{ 
        type: "withdraw", 
        bankId: "", 
        subsidiaryId: "", 
        amount: "", 
        date: todayPersian, 
        purpose: "", 
        description: "" 
      }]);
    } else {
      const errText = await res.text();
      alert("❌ خطا: " + errText);
    }
  };

  return (
    <div className="p-4 space-y-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-blue-700 dark:text-blue-400">ثبت چند پرداخت بانکی</h2>
        
        {/* بخش اطلاعات کلی سند */}
        <div className="w-64">
          <DocumentNumberInput
            apiUrl="http://localhost:5000/api/journalentries/last"
            value={documentNumber}
            onChange={handleDocumentNumberChange}
            triggerNewDoc={handleTriggerNewDoc}
            className=""
            placeholder="مثال: 00001"
          />
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-left">
            شماره سند بعدی از آخرین سند محاسبه می‌شود
          </div>
        </div>
      </div>

      {/* ردیف‌های تراکنش */}
      <div className="space-y-4">
        {rows.map((row, i) => (
          <div key={i} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 shadow-sm">
            {/* سطر اول: اطلاعات اصلی */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-500 dark:text-gray-400">نوع تراکنش</label>
                <select 
                  value={row.type} 
                  onChange={e => updateRow(i, "type", e.target.value)} 
                  className="w-full border px-3 py-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm"
                >
                  <option value="deposit">واریز</option>
                  <option value="withdraw">برداشت</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-500 dark:text-gray-400">تاریخ</label>
                <DatePicker
                  calendar={persian}
                  locale={persian_fa}
                  value={row.date}
                  onChange={(date) => handleDateChange(i, date)}
                  format="YYYY/MM/DD"
                  inputClass="w-full border px-3 py-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm"
                  containerClassName="w-full"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-500 dark:text-gray-400">مبلغ (ریال)</label>
                <input 
                  type="number" 
                  placeholder="مبلغ را وارد کنید" 
                  value={row.amount} 
                  onChange={e => updateRow(i, "amount", e.target.value)} 
                  className="w-full border px-3 py-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm" 
                />
              </div>
            </div>

            {/* سطر دوم: انتخاب‌ها */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-500 dark:text-gray-400">بانک</label>
                <select 
                  value={row.bankId} 
                  onChange={e => updateRow(i, "bankId", e.target.value)} 
                  className="w-full border px-3 py-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm"
                >
                  <option value="">انتخاب بانک...</option>
                  {banks.map(b => <option key={b.id} value={b.id}>{b.bankName} - {b.accountNumber}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-500 dark:text-gray-400">طرف حساب</label>
                <select 
                  value={row.subsidiaryId} 
                  onChange={e => updateRow(i, "subsidiaryId", e.target.value)} 
                  className="w-full border px-3 py-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm"
                >
                  <option value="">انتخاب طرف حساب...</option>
                  {persons.map(p => <option key={p.id} value={p.nationalCode}>{p.firstName} {p.lastName}({p.nationalCode})</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-500 dark:text-gray-400">بابت پرداخت</label>
                <select 
                  value={row.purpose} 
                  onChange={e => updateRow(i, "purpose", e.target.value)} 
                  className="w-full border px-3 py-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm"
                >
                  <option value="">انتخاب بابت پرداخت...</option>
                  {purposes.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
            </div>

            {/* سطر سوم: توضیحات و دکمه حذف */}
            <div className="flex gap-4 items-end">
              <div className="flex-1 space-y-1">
                <label className="text-xs text-gray-500 dark:text-gray-400">توضیحات (اختیاری)</label>
                <textarea 
                  placeholder="توضیحات اضافی را وارد کنید..." 
                  value={row.description} 
                  onChange={e => updateRow(i, "description", e.target.value)} 
                  className="w-full border px-3 py-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm" 
                  rows="2"
                />
              </div>

              <button 
                onClick={() => removeRow(i)} 
                className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-2 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-sm border border-red-200 dark:border-red-800 flex items-center gap-2 h-11"
              >
                <span>🗑</span>
                <span>حذف</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* دکمه‌های پایین */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          تعداد ردیف‌ها: <span className="font-bold">{rows.length}</span>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={addRow} 
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-lg transition-colors text-sm font-medium flex items-center gap-2 shadow-sm"
          >
            <span className="text-lg">+</span>
            افزودن ردیف جدید
          </button>
          
          <button 
            onClick={handleSubmit} 
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white px-6 py-2.5 rounded-lg transition-colors text-sm font-medium flex items-center gap-2 shadow-sm"
          >
            <span>💾</span>
            ثبت همه تراکنش‌ها
          </button>
        </div>
      </div>
    </div>
  );
}