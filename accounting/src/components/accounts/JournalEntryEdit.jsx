import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SelectAccountDrawer from "./SelectAccountDrawer";
import JournalPrint from "../ui/JournalPrint";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

export default function JournalEntryEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Stateهای اصلی
  const [documentNumber, setDocumentNumber] = useState("");
  const [entryDate, setEntryDate] = useState(null);
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState([
    { AccountCode: "", TitleFa: "", DebitAmount: 0, CreditAmount: 0 },
  ]);

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // هندلر تغییر شماره سند
  const handleDocumentNumberChange = (e) => {
    setDocumentNumber(e.target.value);
  };

  // دریافت اطلاعات سند
  useEffect(() => {
    const fetchEntry = async () => {
      try {
        setLoading(true);
        console.log(`📥 در حال دریافت سند با شناسه ${id}...`);

        const res = await fetch(`http://localhost:5000/api/journalentries/${id}/full`);

        if (!res.ok) {
          throw new Error(`خطا در دریافت سند: ${res.status}`);
        }

        const data = await res.json();
        console.log("📥 داده‌های دریافتی سند:", data);

        // تنظیم شماره سند
        const currentDocNumber = data.DocumentNumber || "";
        console.log("شماره سند فعلی:", currentDocNumber);
        setDocumentNumber(currentDocNumber);

        // تنظیم تاریخ - دریافت مستقیم تاریخ شمسی از سرور
        if (data.EntryDate) {
          // تاریخ دریافتی از سرور به صورت شمسی است (مثل 1404/10/30)
          setEntryDate(data.EntryDate);
          console.log("تاریخ دریافتی (شمسی):", data.EntryDate);
        } else {
          // اگر تاریخ وجود نداشت، تاریخ امروز به شمسی را تنظیم کن
          const today = new Date();
          const todayPersian = today.toLocaleDateString('fa-IR');
          setEntryDate(todayPersian);
        }

        // تنظیم شرح
        setDescription(data.Description || "");

        // تنظیم ردیف‌ها
        if (data.Lines && Array.isArray(data.Lines)) {
          const formattedLines = data.Lines.map(line => ({
            AccountCode: line.AccountCode || "",
            TitleFa: line.TitleFa || "",
            DebitAmount: line.DebitAmount || 0,
            CreditAmount: line.CreditAmount || 0
          }));
          setLines(formattedLines);
          console.log(`📝 ${formattedLines.length} ردیف بارگذاری شد`);
        }

      } catch (err) {
        console.error("❌ خطا در دریافت سند:", err.message);
        setError("خطا در دریافت اطلاعات سند");
      } finally {
        setLoading(false);
      }
    };

    fetchEntry();
  }, [id]);

  // هندلر تغییر تاریخ از DatePicker
  const handleDateChange = (date) => {
    if (date) {
      // تاریخ شمسی را از DatePicker دریافت می‌کنیم
      const persianDateString = date.format("YYYY/MM/DD");
      console.log("تاریخ انتخاب شده (شمسی):", persianDateString);
      setEntryDate(persianDateString);
    } else {
      // اگر تاریخ پاک شد، تاریخ امروز را تنظیم کن
      const today = new Date();
      const todayPersian = today.toLocaleDateString('fa-IR');
      setEntryDate(todayPersian);
    }
  };

  // هندلر تغییرات ردیف‌ها
  const handleChange = (idx, field, value) => {
    setLines((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l))
    );
  };

  // باز کردن دراور انتخاب حساب
  const handleOpenDrawer = (idx) => {
    setSelectedIdx(idx);
    setDrawerVisible(true);
  };

  // انتخاب حساب از دراور
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

  // جستجوی خودکار حساب با کد
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

  // اضافه کردن ردیف جدید
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

  // حذف ردیف
  const handleDeleteLine = (idx) => {
    if (lines.length > 1) {
      setLines((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  // محاسبه جمع‌ها و تراز
  const totalDebit = lines.reduce((sum, l) => sum + Number(l.DebitAmount || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + Number(l.CreditAmount || 0), 0);
  const isBalanced = totalDebit === totalCredit;

  // تابع چاپ سند
  const handlePrint = () => {
    const printContent = document.getElementById("journal-entry-content");
    const originalContents = document.body.innerHTML;

    document.body.innerHTML = printContent.innerHTML;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  // ارسال فرم ویرایش
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
    // اگر entryDate یک آبجکت از DatePicker باشد، آن را به رشته تبدیل می‌کنیم
    if (typeof entryDate === 'object' && entryDate.format) {
      formattedDate = entryDate.format("YYYY/MM/DD");
    }

    const payload = {
      DocumentNumber: docNumber,
      EntryDate: formattedDate, // ارسال تاریخ به صورت شمسی
      Description: String(description || "").trim(),
      Lines: lines
        .filter((l) => l.AccountCode && (Number(l.DebitAmount) !== 0 || Number(l.CreditAmount) !== 0))
        .map((l) => ({
          AccountCode: l.AccountCode,
          DebitAmount: Number(l.DebitAmount || 0),
          CreditAmount: Number(l.CreditAmount || 0),
        })),
    };

    console.log("📤 ارسال برای ویرایش:", payload);

    try {
      const res = await fetch(`http://localhost:5000/api/journalentries/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert("✅ سند با موفقیت ویرایش شد");
        navigate("/journalentries");
      } else {
        const errorText = await res.text();
        console.error("❌ خطا در ویرایش:", errorText);
        let errorMessage = "خطا در ویرایش سند";
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

  // دکمه بازگشت
  const handleBack = () => {
    navigate("/journalentries");
  };

  // دکمه دریافت آخرین شماره سند
  const handleGetLastDocumentNumber = async () => {
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

  // حالت لودینگ
  if (loading) {
    return (
      <div className="p-5 text-center">
        <div className="text-lg text-blue-600">در حال بارگذاری سند...</div>
      </div>
    );
  }

  // حالت خطا
  if (error) {
    return (
      <div className="p-5">
        <div className="text-red-600 mb-4">❌ {error}</div>
        <button
          onClick={handleBack}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 text-sm"
        >
          ← بازگشت
        </button>
      </div>
    );
  }

  return (
    <div>
      <div id="journal-entry-content" className="p-5 rtl text-right">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-green-700">✏️ ویرایش سند حسابداری</h2>
          <div className="flex gap-2">
            <button
              onClick={handleBack}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 text-sm"
            >
              ← بازگشت
            </button>
            
            <JournalPrint
              documentNumber={documentNumber}
              entryDate={entryDate}
              description={description}
              lines={lines.filter(l => l.AccountCode && (Number(l.DebitAmount) !== 0 || Number(l.CreditAmount) !== 0))}
              totalDebit={totalDebit}
              totalCredit={totalCredit}
              isBalanced={isBalanced}
              id={id}
            />
          </div>
        </div>

        {/* اطلاعات کلی سند */}
        <div className="flex flex-row-reverse gap-4 mb-6 bg-gray-50 p-4 rounded-lg">
          <div className="w-48">
            <div className="flex justify-between items-center mb-1">
              <label className="font-medium">شماره سند:</label>
              <button
                type="button"
                onClick={handleGetLastDocumentNumber}
                className="text-xs text-blue-600 hover:text-blue-800"
                title="دریافت آخرین شماره سند"
              >
                🔄
              </button>
            </div>

            <input
              type="text"
              value={documentNumber}
              onChange={handleDocumentNumberChange}
              className="border border-gray-300 rounded px-3 py-2 w-full focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
              placeholder="مثال: 00001"
            />

            <div className="text-xs text-gray-500 mt-1">
              شماره سند فعلی: <span className="font-bold">{documentNumber}</span>
            </div>
          </div>

          <div className="flex-1">
            <label className="block mb-1 font-medium">تاریخ سند:</label>
            <DatePicker
              value={entryDate}
              onChange={handleDateChange}
              format="YYYY/MM/DD"
              calendar={persian}
              locale={persian_fa}
              calendarPosition="bottom-right"
              inputClass="w-full p-2 border rounded bg-white text-gray-800"
              containerClassName="w-full"
              required
            />
            <div className="text-xs text-gray-500 mt-1">
              تاریخ شمسی: <span className="font-bold">{entryDate || '---'}</span>
            </div>
          </div>
        </div>

        {/* شرح سند */}
        <div className="mb-6">
          <label className="block mb-1 font-medium">شرح سند:</label>
          <textarea
            rows={1}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
            placeholder="شرح کامل سند..."
          />
        </div>

        {/* جدول ردیف‌ها */}
        <div className="mb-6">
          <div className="overflow-x-auto">
            <table className="w-full border border-collapse rtl text-right min-w-[800px]">
              <thead className="bg-gray-100 font-bold">
                <tr>
                  <th className="border px-3 py-2 w-12">ردیف</th>
                  <th className="border px-3 py-2 min-w-[300px]">حساب</th>
                  <th className="border px-3 py-2 w-40">بدهکار</th>
                  <th className="border px-3 py-2 w-40">بستانکار</th>
                  <th className="border px-3 py-2 w-24">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="border px-3 py-2 text-center">{idx + 1}</td>
                    <td className="border px-3 py-2">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleOpenDrawer(idx)}
                          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 whitespace-nowrap"
                        >
                          انتخاب حساب
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
                          className="border border-gray-300 rounded px-2 py-1 w-24 text-center focus:ring-1 focus:ring-blue-300"
                          placeholder="کد حساب"
                        />

                        <div className="flex-grow min-w-0">
                          <div className={`truncate ${line.TitleFa ? 'text-green-600 font-medium' : 'text-gray-500 italic'}`}>
                            {line.TitleFa?.trim() || "--- عنوان حساب ---"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="border px-3 py-2">
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
                        className="border border-gray-300 rounded px-2 py-1 w-full text-left text-sm focus:ring-1 focus:ring-blue-300"
                        dir="ltr"
                      />
                    </td>
                    <td className="border px-3 py-2">
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
                        className="border border-gray-300 rounded px-2 py-1 w-full text-left text-sm focus:ring-1 focus:ring-blue-300"
                        dir="ltr"
                      />
                    </td>
                    <td className="border px-3 py-2">
                      <div className="flex gap-1 justify-center">
                        <button
                          type="button"
                          onClick={() => handleAddLine(idx)}
                          className="bg-green-500 text-white px-2 py-1 rounded text-sm hover:bg-green-600"
                          title="افزودن ردیف بعدی"
                        >
                          ➕
                        </button>
                        {lines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteLine(idx)}
                            className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                            title="حذف این ردیف"
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
          </div>
        </div>

        {/* جمع و وضعیت تراز */}
        <div className="flex justify-between items-center mb-6 px-4 py-3 border-t border-b font-bold bg-gray-50 rounded-lg">
          <div className="text-sm">
            <span className="text-gray-600">جمع بدهکار: </span>
            <span className="text-red-600">{totalDebit.toLocaleString('en-US')}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-600">جمع بستانکار: </span>
            <span className="text-blue-600">{totalCredit.toLocaleString('en-US')}</span>
          </div>
          <div className={`text-sm ${isBalanced ? "text-green-600" : "text-red-600"}`}>
            {isBalanced ? "✅ سند تراز است" : "❌ سند غیرتراز است"}
          </div>
        </div>

        {/* دکمه‌های عمل */}
        <div className="flex justify-between items-center">
          <button
            onClick={handleBack}
            className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 font-medium"
          >
            انصراف
          </button>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                if (window.confirm("آیا از حذف این سند اطمینان دارید؟")) {
                  fetch(`http://localhost:5000/api/journalentries/${id}`, {
                    method: "DELETE",
                  })
                    .then(res => {
                      if (res.ok) {
                        alert("✅ سند با موفقیت حذف شد");
                        navigate("/journalentries");
                      } else {
                        alert("❌ خطا در حذف سند");
                      }
                    })
                    .catch(err => {
                      console.error("خطا در حذف:", err);
                      alert("❌ خطای شبکه در حذف سند");
                    });
                }
              }}
              className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600 font-medium"
            >
              حذف سند
            </button>

            <button
              type="button"
              disabled={!isBalanced || !entryDate || !documentNumber.trim()}
              onClick={handleSubmit}
              className={`px-6 py-2 rounded font-medium ${isBalanced && entryDate && documentNumber.trim()
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-gray-400 text-gray-200 cursor-not-allowed"
                }`}
            >
              💾 ذخیره تغییرات
            </button>
          </div>
        </div>
      </div>

      <SelectAccountDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        onSelect={handleAccountSelected}
      />
    </div>
  );
}