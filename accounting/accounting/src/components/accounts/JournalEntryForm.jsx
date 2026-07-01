import React, { useState, useEffect } from "react";
import SelectAccountDrawer from "./SelectAccountDrawer";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import DocumentNumberInput from "../ui/DocumentNumberInput";

function JournalEntryForm() {
  const [documentNumber, setDocumentNumber] = useState("");
  const [entryDate, setEntryDate] = useState(null);
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState([
    { AccountCode: "", TitleFa: "", DebitAmount: 0, CreditAmount: 0 },
  ]);

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(null);

  // تنظیم تاریخ امروز به صورت شمسی هنگام لود شدن کامپوننت
  useEffect(() => {
    const today = new Date();
    // تبدیل تاریخ امروز به شمسی
    const todayPersian = new Date(today);
    const todayString = todayPersian.toLocaleDateString('fa-IR');
    setEntryDate(todayString);
  }, []);
  
  const handleDocumentNumberChange = (value) => {
    const stringValue = String(value || "");
    setDocumentNumber(stringValue);
  };

  // هندلر تغییر تاریخ - دریافت رشته تاریخ شمسی
  const handleDateChange = (date) => {
    if (date) {
      // date یک آبجکت از react-multi-date-picker است
      // باید آن را به رشته تاریخ شمسی تبدیل کنیم
      const persianDateString = date.format("YYYY/MM/DD");
      setEntryDate(persianDateString);
    } else {
      setEntryDate(null);
    }
  };

  // هندلر برای تولید شماره سند جدید
  const handleTriggerNewDoc = (suggestedNumber) => {
    const stringValue = String(suggestedNumber || "");
    setDocumentNumber(stringValue);
    setDescription("");
    setLines([{ AccountCode: "", TitleFa: "", DebitAmount: 0, CreditAmount: 0 }]);
  };

  // هندلر سایر توابع
  const handleChange = (idx, field, value) => {
    setLines((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l))
    );
  };

  const handleOpenDrawer = (idx) => {
    setSelectedIdx(idx);
    setDrawerVisible(true);
  };

  const handleAccountSelected = (account) => {
    if (selectedIdx !== null) {
      setLines((prev) =>
        prev.map((l, i) =>
          i === selectedIdx
            ? { ...l, AccountCode: account.AccountCode, TitleFa: account.TitleFa }
            : l
        )
      );
    }
    setDrawerVisible(false);
    setSelectedIdx(null);
  };

  const handleAccountCodeEntered = async (idx, code) => {
    if (!code) return;

    try {
      const res = await fetch(`http://localhost:5000/api/accounts/${code}`);
      if (res.ok) {
        const acc = await res.json();
        if (acc?.AccountCode && acc?.TitleFa) {
          setLines((prev) =>
            prev.map((l, i) =>
              i === idx
                ? {
                  ...l,
                  AccountCode: acc.AccountCode,
                  TitleFa: acc.TitleFa,
                  DebitAmount: l.DebitAmount || 0,
                  CreditAmount: l.CreditAmount || 0
                }
                : l
            )
          );
        } else {
          setLines((prev) =>
            prev.map((l, i) =>
              i === idx
                ? { ...l, AccountCode: code, TitleFa: "" }
                : l
            )
          );
        }
      } else {
        setLines((prev) =>
          prev.map((l, i) =>
            i === idx
              ? { ...l, AccountCode: code, TitleFa: "" }
              : l
          )
        );
      }
    } catch (err) {
      console.error("❌ خطا در دریافت حساب:", err);
      setLines((prev) =>
        prev.map((l, i) =>
          i === idx
            ? { ...l, AccountCode: code, TitleFa: "" }
            : l
        )
      );
    }
  };

  const handleAddLine = (idx) => {
    setLines((prev) => {
      const newLines = [...prev];
      newLines.splice(idx + 1, 0, {
        AccountCode: "",
        TitleFa: "",
        DebitAmount: 0,
        CreditAmount: 0,
      });
      return newLines;
    });
  };

  const handleDeleteLine = (idx) => {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  };

  const totalDebit = lines.reduce((sum, l) => sum + Number(l.DebitAmount || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + Number(l.CreditAmount || 0), 0);
  const isBalanced = totalDebit === totalCredit;

  const handleSubmit = async () => {
    const docNumber = String(documentNumber || "").trim();

    if (!docNumber) {
      alert("شماره سند را وارد کنید");
      return;
    }

    if (!entryDate) {
      alert("تاریخ سند را انتخاب کنید");
      return;
    }

    if (lines.length === 0) {
      alert("حداقل یک ردیف سند لازم است");
      return;
    }

    if (!isBalanced) {
      alert("سند تراز نیست. جمع بدهکار و بستانکار برابر نیست");
      return;
    }

    // اطمینان از فرمت صحیح تاریخ شمسی
    let formattedDate = entryDate;
    if (typeof entryDate === 'object') {
      // اگر entryDate یک آبجکت DatePicker است
      formattedDate = entryDate.format ? entryDate.format("YYYY/MM/DD") : entryDate.toString();
    }

    const entry = {
      DocumentNumber: docNumber,
      EntryDate: formattedDate,
      Description: String(description || "").trim(),
      Lines: lines
        .filter((l) => l.AccountCode && (Number(l.DebitAmount) !== 0 || Number(l.CreditAmount) !== 0))
        .map((l) => ({
          AccountCode: l.AccountCode,
          DebitAmount: Number(l.DebitAmount || 0),
          CreditAmount: Number(l.CreditAmount || 0),
        })),
    };

    try {
      const res = await fetch("http://localhost:5000/api/journalentries/full", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });

      if (res.ok) {
        const result = await res.json();
        alert("✅ سند با موفقیت ثبت شد");
        // شماره سند بعدی را پیشنهاد بده
        if (result.entryId) {
          try {
            const currentNum = parseInt(docNumber);
            if (!isNaN(currentNum)) {
              const nextNumber = currentNum + 1;
              setDocumentNumber(nextNumber.toString().padStart(5, '0'));
            }
          } catch (e) {
            console.log("خطا در محاسبه شماره سند بعدی:", e);
          }
        }
        setDescription("");
        // ریست فرم
        setLines([{ AccountCode: "", TitleFa: "", DebitAmount: 0, CreditAmount: 0 }]);
      } else {
        const errorText = await res.text();
        console.error("❌ خطا در ثبت:", errorText);
        let errorMessage = "خطا در ثبت سند";
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error) {
            errorMessage = errorJson.error;
          }
        } catch (e) {
          if (errorText) {
            errorMessage = errorText;
          }
        }
        alert(`❌ ${errorMessage}`);
      }
    } catch (err) {
      console.error("❌ خطای شبکه:", err);
      alert("❌ خطای شبکه یا سرور");
    }
  };

  const getDocumentNumberValue = () => {
    if (typeof documentNumber === 'string') {
      return documentNumber;
    } else if (typeof documentNumber === 'number') {
      return documentNumber.toString();
    } else if (documentNumber && typeof documentNumber.toString === 'function') {
      return documentNumber.toString();
    }
    return "";
  };

  const docNumberValue = getDocumentNumberValue();

  return (
    <div className="p-5 rtl text-right">
      <h3 className="text-xl font-bold mb-4">🧾 ثبت سند </h3>

      <div className="flex gap-4 mb-4 items-start">
        {/* ستون شرح سند (بزرگ‌تر) */}
        <div className="flex-[3]">
          <label className="block mb-1">شرح سند:</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="شرح مختصر سند"
          />
        </div>
        
        {/* ستون تاریخ */}
        <div>
          <label className="block mb-1 text-gray-700">تاریخ سند:</label>
          <DatePicker
            calendar={persian}
            locale={persian_fa}
            value={entryDate}
            onChange={handleDateChange}
            format="YYYY/MM/DD"
            inputClass="w-full p-2 border rounded"
            containerClassName="w-40"
          />
        </div>

        {/* ستون شماره سند (کوچک‌تر) */}
        <div className="flex-[1]">
          <DocumentNumberInput
            apiUrl="http://localhost:5000/api/journalentries/last"
            value={docNumberValue}
            onChange={handleDocumentNumberChange}
            triggerNewDoc={handleTriggerNewDoc}
            className="border rounded px-3 py-2 w-full"
            placeholder="مثال: 00001"
          />
        </div>
      </div>

      {/* جدول ردیف‌ها */}
      <table className="w-full border border-collapse rtl text-right">
        <thead className="bg-gray-100 font-bold">
          <tr>
            <th className="border px-2 py-1 w-12">ردیف</th>
            <th className="border px-2 py-1">حساب</th>
            <th className="border px-2 py-1 w-40">بدهکار</th>
            <th className="border px-2 py-1 w-40">بستانکار</th>
            <th className="border px-2 py-1 w-24">عملیات</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line, idx) => (
            <tr key={idx}>
              <td className="border px-2 py-1 text-center">{idx + 1}</td>
              <td className="border px-2 py-1">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleOpenDrawer(idx)}
                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                  >
                    انتخاب
                  </button>

                  <input
                    type="text"
                    value={line.AccountCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/^0+(?=\d)/, '');
                      handleChange(idx, "AccountCode", value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAccountCodeEntered(idx, line.AccountCode);
                      }
                    }}
                    onBlur={(e) => {
                      if (line.AccountCode && !line.TitleFa) {
                        handleAccountCodeEntered(idx, line.AccountCode);
                      }
                    }}
                    className="border rounded px-2 py-1 w-24 text-center"
                    placeholder="کد"
                  />

                  <div className="flex-grow min-w-0">
                    <div className={`truncate ${line.TitleFa ? 'text-green-600' : 'text-gray-500'}`}>
                      {line.TitleFa?.trim() || "عنوان حساب"}
                    </div>
                  </div>
                </div>
              </td>
              <td className="border px-2 py-1">
                <input
                  type="text"
                  inputMode="numeric"
                  value={Number(line.DebitAmount || 0).toLocaleString('en-US')}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^\d]/g, '');
                    handleChange(idx, "DebitAmount", raw);
                  }}
                  onFocus={(e) => {
                    e.target.value = line.DebitAmount || '';
                  }}
                  onBlur={(e) => {
                    const formatted = Number(e.target.value || 0).toLocaleString('en-US');
                    e.target.value = formatted;
                  }}
                  className="border rounded px-2 py-1 w-full text-left text-sm"
                  dir="ltr"
                />
              </td>
              <td className="border px-2 py-1">
                <input
                  type="text"
                  inputMode="numeric"
                  value={Number(line.CreditAmount || 0).toLocaleString('en-US')}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^\d]/g, '');
                    handleChange(idx, "CreditAmount", raw);
                  }}
                  onFocus={(e) => {
                    e.target.value = line.CreditAmount || '';
                  }}
                  onBlur={(e) => {
                    const formatted = Number(e.target.value || 0).toLocaleString('en-US');
                    e.target.value = formatted;
                  }}
                  className="border rounded px-2 py-1 w-full text-left text-sm"
                  dir="ltr"
                />
              </td>
              <td className="border px-2 py-1">
                <div className="flex gap-1 justify-center">
                  <button
                    type="button"
                    onClick={() => handleAddLine(idx)}
                    className="bg-green-500 text-white px-2 py-1 rounded text-sm"
                  >
                    ➕
                  </button>
                  {lines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteLine(idx)}
                      className="bg-red-500 text-white px-2 py-1 rounded text-sm"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* جمع و وضعیت تراز */}
      <div className="flex justify-between items-center mt-4 px-2 py-2 border-t font-bold bg-gray-50">
        <div className="text-sm">جمع بدهکار: {totalDebit.toLocaleString('en-US')}</div>
        <div className="text-sm">جمع بستانکار: {totalCredit.toLocaleString('en-US')}</div>
        <div className={isBalanced ? "text-green-600 text-sm" : "text-red-600 text-sm"}>
          {isBalanced ? "✅ تراز" : "❌ غیرتراز"}
        </div>
      </div>

      {/* دکمه ثبت */}
      <div className="mt-4 text-left">
        <button
          type="button"
          disabled={!isBalanced || !entryDate || !docNumberValue.trim()}
          onClick={handleSubmit}
          className={`px-4 py-2 rounded text-white font-bold ${isBalanced && entryDate && docNumberValue.trim()
              ? "bg-purple-600 hover:bg-purple-700"
              : "bg-gray-400 cursor-not-allowed"
            }`}
        >
          ثبت سند
        </button>
      </div>

      <SelectAccountDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        onSelect={handleAccountSelected}
      />
    </div>
  );
}

export default JournalEntryForm;