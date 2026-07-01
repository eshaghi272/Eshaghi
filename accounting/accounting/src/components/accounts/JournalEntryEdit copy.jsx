import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import JalaliDatePicker from "../ui/JalaliDatePicker";
import SelectAccountDrawer from "./SelectAccountDrawer";
import { toGregorian, toJalali } from 'jalaali-js';
import JournalPrint from "../ui/JournalPrint";

export default function JournalEntryEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Stateهای اصلی
  const [documentNumber, setDocumentNumber] = useState("");
  const [entryDate, setEntryDate] = useState(null);
  const [selectedJalaliDate, setSelectedJalaliDate] = useState("");
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState([
    { AccountCode: "", TitleFa: "", DebitAmount: 0, CreditAmount: 0 },
  ]);

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // تبدیل میلادی به شمسی
  const convertGregorianToJalali = (date) => {
    try {
      if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        return null;
      }

      const jalali = toJalali(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate()
      );
      return {
        year: jalali.jy,
        month: jalali.jm,
        day: jalali.jd,
        formatted: `${jalali.jy}/${String(jalali.jm).padStart(2, '0')}/${String(jalali.jd).padStart(2, '0')}`
      };
    } catch (error) {
      console.error("خطا در تبدیل به شمسی:", error);
      return null;
    }
  };

  // هندلر تغییر تاریخ از JalaliDatePicker
  const handleDateChange = (date) => {
    if (date && date instanceof Date && !isNaN(date.getTime())) {
      setEntryDate(date);

      // همچنین تاریخ شمسی را برای نمایش ذخیره کنید
      const jalali = convertGregorianToJalali(date);
      if (jalali) {
        setSelectedJalaliDate(jalali.formatted);
      }
    } else {
      setEntryDate(null);
      setSelectedJalaliDate("");
    }
  };

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

        // تنظیم شماره سند - مهم: شماره سند فعلی را می‌گیریم
        const currentDocNumber = data.DocumentNumber || "";
        console.log("شماره سند فعلی:", currentDocNumber);
        setDocumentNumber(currentDocNumber);

        // تنظیم تاریخ
        if (data.EntryDate) {
          // اطمینان از فرمت صحیح تاریخ
          let date;
          if (data.EntryDate.includes('T')) {
            // اگر تاریخ شامل T است (ISO format)
            date = new Date(data.EntryDate);
          } else {
            // اگر تاریخ ساده است
            date = new Date(data.EntryDate + 'T00:00:00');
          }
          if (!isNaN(date.getTime())) {
            setEntryDate(date);

            // نمایش تاریخ شمسی
            const jalali = convertGregorianToJalali(date);
            if (jalali) {
              setSelectedJalaliDate(jalali.formatted);
            }
          } else {
            console.error("❌ تاریخ نامعتبر:", data.EntryDate);
            // اگر تاریخ نامعتبر بود، امروز را تنظیم کن
            const today = new Date();
            setEntryDate(today);
            const jalaliToday = convertGregorianToJalali(today);
            if (jalaliToday) {
              setSelectedJalaliDate(jalaliToday.formatted);
            }
          }
        } else {
          // اگر تاریخ وجود نداشت، امروز را تنظیم کن
          const today = new Date();
          setEntryDate(today);
          const jalaliToday = convertGregorianToJalali(today);
          if (jalaliToday) {
            setSelectedJalaliDate(jalaliToday.formatted);
          }
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
    // ایجاد یک پنجره جدید برای چاپ
    const printWindow = window.open('', '_blank');

    // محتوای HTML برای چاپ
    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>چاپ سند حسابداری - شماره ${documentNumber}</title>
        <style>
          body {
            font-family: Tahoma, Arial, sans-serif;
            font-size: 12px;
            line-height: 1.6;
            color: #000;
            margin: 20px;
            padding: 0;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
          }
          .header h1 {
            margin: 0;
            font-size: 20px;
            color: #2c3e50;
          }
          .info-section {
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
          }
          .info-item {
            margin-bottom: 10px;
          }
          .info-label {
            font-weight: bold;
            color: #2c3e50;
          }
          .info-value {
            margin-right: 10px;
          }
          .table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          .table th {
            background-color: #f2f2f2;
            border: 1px solid #ddd;
            padding: 8px;
            text-align: center;
            font-weight: bold;
          }
          .table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: right;
          }
          .table tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .totals {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 2px solid #000;
            text-align: left;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
          }
          .balance-status {
            text-align: center;
            margin: 20px 0;
            font-weight: bold;
            font-size: 14px;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 10px;
          }
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            .no-print {
              display: none !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>سند حسابداری</h1>
          <div>تاریخ چاپ: ${new Date().toLocaleDateString('fa-IR')}</div>
        </div>
        
        <div class="info-section">
          <div>
            <div class="info-item">
              <span class="info-label">شماره سند:</span>
              <span class="info-value">${documentNumber}</span>
            </div>
            <div class="info-item">
              <span class="info-label">تاریخ سند:</span>
              <span class="info-value">${selectedJalaliDate || '---'}</span>
            </div>
          </div>
          <div>
            <div class="info-item">
              <span class="info-label">شناسه سند:</span>
              <span class="info-value">${id}</span>
            </div>
            <div class="info-item">
              <span class="info-label">تاریخ میلادی:</span>
              <span class="info-value">${entryDate ? entryDate.toISOString().split('T')[0] : '---'}</span>
            </div>
          </div>
        </div>
        
        <div class="info-item">
          <span class="info-label">شرح سند:</span>
          <span class="info-value">${description || 'بدون شرح'}</span>
        </div>
        
        <table class="table">
          <thead>
            <tr>
              <th width="40">ردیف</th>
              <th>کد حساب</th>
              <th>عنوان حساب</th>
              <th width="100">بدهکار</th>
              <th width="100">بستانکار</th>
            </tr>
          </thead>
          <tbody>
            ${lines.map((line, idx) => `
              <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td>${line.AccountCode || '---'}</td>
                <td>${line.TitleFa || '---'}</td>
                <td style="text-align: left; font-family: monospace;">${Number(line.DebitAmount || 0).toLocaleString('en-US')}</td>
                <td style="text-align: left; font-family: monospace;">${Number(line.CreditAmount || 0).toLocaleString('en-US')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="totals">
          <div class="total-row">
            <span>جمع بدهکار:</span>
            <span style="font-family: monospace;">${totalDebit.toLocaleString('en-US')}</span>
          </div>
          <div class="total-row">
            <span>جمع بستانکار:</span>
            <span style="font-family: monospace;">${totalCredit.toLocaleString('en-US')}</span>
          </div>
        </div>
        
        <div class="balance-status" style="color: ${isBalanced ? '#27ae60' : '#e74c3c'}">
          ${isBalanced ? '✅ سند تراز است' : '❌ سند غیرتراز است'}
        </div>
        
        <div class="footer">
          <div>سیستم حسابداری - چاپ شده در ${new Date().toLocaleString('fa-IR')}</div>
          <div>تعداد ردیف‌ها: ${lines.length} ردیف</div>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() {
              window.close();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    // نوشتن محتوا در پنجره و چاپ
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  // ارسال فرم ویرایش
  const handleSubmit = async () => {
    // مطمئن شویم که documentNumber یک string است
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

    const payload = {
      DocumentNumber: docNumber,
      EntryDate: entryDate.toISOString(),
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

  // دکمه دریافت آخرین شماره سند (برای استفاده اگر لازم شد)
  const handleGetLastDocumentNumber = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/journalentries/last");
      if (res.ok) {
        const data = await res.json();
        if (data.DocumentNumber) {
          // محاسبه شماره بعدی
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

  // دکمه تنظیم تاریخ امروز
  const handleSetToday = () => {
    const today = new Date();
    setEntryDate(today);
    const jalali = convertGregorianToJalali(today);
    if (jalali) {
      setSelectedJalaliDate(jalali.formatted);
    }
    console.log("📅 تاریخ به امروز تغییر کرد:", today);
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
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          بازگشت
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
            <button
              onClick={handlePrint} // تغییر اینجا: از handlePrint استفاده می‌کنیم
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
            >
              🖨️ چاپ سند
            </button>
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

            {/* تکس باکس ساده برای شماره سند */}
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

            {/* کامپوننت JalaliDatePicker با تاریخ قبلی */}
            <JalaliDatePicker
              value={entryDate} // اینجا تاریخ قبلی سند را ارسال می‌کنیم
              onChange={handleDateChange}
            />

            {selectedJalaliDate && (
              <div className="mt-2 text-sm text-gray-600">
                تاریخ شمسی: <span className="font-bold">{selectedJalaliDate}</span>
              </div>
            )}

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