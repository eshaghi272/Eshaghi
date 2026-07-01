import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import JournalPrint from "../ui/JournalPrint"; // ایمپورت کامپوننت چاپ
import ExportButtons from '../ui/ExportButtons';

export default function JournalEntryList() {
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedEntryForPrint, setSelectedEntryForPrint] = useState(null);
  const [entryDetails, setEntryDetails] = useState(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        setLoading(true);
        const res = await fetch("http://localhost:5000/api/journalentries");
        if (!res.ok) throw new Error("خطا در دریافت لیست اسناد");
        const data = await res.json();
        setEntries(data);
      } catch (err) {
        console.error("❌", err.message);
        setError("خطا در دریافت لیست اسناد");
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, []);

  // تابع برای دریافت جزئیات کامل یک سند
  const fetchEntryDetails = async (entryId) => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/journalentries/${entryId}/full`);
      if (!res.ok) throw new Error("خطا در دریافت جزئیات سند");
      const data = await res.json();
      return data;
    } catch (err) {
      console.error("❌ خطا در دریافت جزئیات:", err.message);
      alert("خطا در دریافت جزئیات سند");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // تابع هندلر چاپ - دریافت جزئیات و نمایش کامپوننت چاپ
  const handlePrint = async (entryId) => {
    const details = await fetchEntryDetails(entryId);
    if (details) {
      setEntryDetails(details);
      setShowPrintPreview(true);
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString("fa-IR");

  const handleDelete = async (entryId) => {
    const confirmed = window.confirm("آیا مطمئن هستید که می‌خواهید این سند را حذف کنید؟");
    if (!confirmed) return;

    try {
      const res = await fetch(`http://localhost:5000/api/journalentries/${entryId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("✅ سند حذف شد");
        setEntries((prev) => prev.filter((e) => e.EntryId !== entryId));
        // اگر سند در حال چاپ حذف شد، حالت چاپ را پاک کن
        if (selectedEntryForPrint === entryId) {
          setSelectedEntryForPrint(null);
          setEntryDetails(null);
          setShowPrintPreview(false);
        }
      } else {
        alert("❌ خطا در حذف سند");
      }
    } catch (err) {
      console.error("❌ خطای شبکه:", err.message);
      alert("❌ خطای شبکه یا سرور");
    }
  };

  const filteredEntries = entries.filter((e) =>
    [e.DocumentNumber, e.Description, formatDate(e.EntryDate)]
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // تابع برای بستن پنجره چاپ
  const handleClosePrintPreview = () => {
    setShowPrintPreview(false);
    setEntryDetails(null);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-green-700">📋 لیست اسناد حسابداری</h2>
        <ExportButtons
          data={filteredEntries}
          filename="اسناد_حسابداری"
          title="گزارش اسناد حسابداری"
          columns={[
            { header: 'شماره سند', accessor: 'DocumentNumber', width: 15 },
            { header: 'تاریخ', accessor: 'EntryDate', format: (value) => new Date(value).toLocaleDateString('fa-IR') },
            { header: 'توضیحات', accessor: 'Description', width: 40 },
            { header: 'وضعیت تراز', accessor: 'IsBalanced', format: (value) => value ? '✅ تراز' : '❌ غیرتراز' }
          ]}
        />
      </div>

      {showPrintPreview && entryDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold">پیش نمایش چاپ سند شماره {entryDetails.DocumentNumber}</h3>
              <button
                onClick={handleClosePrintPreview}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                بستن
              </button>
            </div>
            <div className="p-4">
              <JournalPrint
                documentNumber={entryDetails.DocumentNumber}
                entryDate={entryDetails.EntryDate}
                selectedJalaliDate={entryDetails.JalaliDate || formatDate(entryDetails.EntryDate)}
                description={entryDetails.Description}
                lines={entryDetails.Lines || []}
                totalDebit={entryDetails.Lines?.reduce((sum, l) => sum + Number(l.DebitAmount || 0), 0) || 0}
                totalCredit={entryDetails.Lines?.reduce((sum, l) => sum + Number(l.CreditAmount || 0), 0) || 0}
                isBalanced={entryDetails.IsBalanced}
                id={entryDetails.EntryId}
              />
            </div>
          </div>
        </div>
      )}

      <div className="mb-4">
        <input
          type="text"
          placeholder="🔍 جستجو بر اساس شماره، توضیحات یا تاریخ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border px-3 py-2 w-full rounded"
        />
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="text-blue-600">در حال بارگذاری...</div>
        </div>
      )}

      {error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <table className="w-full text-sm border border-gray-300 dark:border-gray-700">
          <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100">
            <tr>
              <th className="px-3 py-2">شماره سند</th>
              <th className="px-3 py-2">تاریخ</th>
              <th className="px-3 py-2">توضیحات</th>
              <th className="px-3 py-2">تراز</th>
              <th className="px-3 py-2 text-center">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.map((e) => (
              <tr key={e.EntryId} className="border-t hover:bg-gray-50 dark:hover:bg-gray-900">
                <td className="px-3 py-2">{e.DocumentNumber}</td>
                <td className="px-3 py-2">{e.EntryDate}</td>
                <td className="px-3 py-2">{e.Description || "—"}</td>
                <td className="px-3 py-2">{e.IsBalanced ? "✅" : "❌"}</td>
                <td className="px-3 py-2 text-center space-x-1 rtl:space-x-reverse">
                  <button
                    onClick={() => handlePrint(e.EntryId)}
                    className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 hover:bg-blue-200 px-2 py-1 rounded text-xs"
                  >
                    🖨️ چاپ
                  </button>
                  <button
                    onClick={() => navigate(`/journalentries/${e.EntryId}/edit`)}
                    className="inline-flex items-center gap-1 bg-green-100 text-green-700 hover:bg-green-200 px-2 py-1 rounded text-xs"
                  >
                    ✏️ ویرایش
                  </button>
                  <button
                    onClick={() => handleDelete(e.EntryId)}
                    className="inline-flex items-center gap-1 bg-red-100 text-red-700 hover:bg-red-200 px-2 py-1 rounded text-xs"
                  >
                    🗑️ حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {filteredEntries.length === 0 && !loading && !error && (
        <div className="text-center py-8 text-gray-500">
          هیچ سندی یافت نشد
        </div>
      )}
    </div>
  );
}