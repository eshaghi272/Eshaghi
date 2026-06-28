import { useEffect, useState } from "react";
import ExportButtons from "../ui/ExportButtons";

export default function JournalReportPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError("");

      console.log("🔍 در حال دریافت گزارش از API...");
      const res = await fetch("http://localhost:5000/api/journalentries/report", {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors' // برای CORS
      });

      console.log("📊 وضعیت پاسخ:", res.status, res.statusText);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ خطای HTTP:", res.status, errorText);
        throw new Error(`خطا در دریافت گزارش: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      console.log("✅ داده دریافتی:", data);

      if (!Array.isArray(data)) {
        console.warn("⚠️ داده دریافتی آرایه نیست:", typeof data, data);
        throw new Error("فرمت داده دریافتی نامعتبر است");
      }

      setEntries(data);
      setError("");
    } catch (err) {
      console.error("❌ خطا در دریافت گزارش:", err.message);
      setError(`خطا در دریافت گزارش: ${err.message}`);
      setEntries([]);

      // اگر خطای شبکه بود، پیشنهاد دوباره بده
      if (err.message.includes('Failed to fetch') || err.message.includes('Network')) {
        setError("خطای شبکه. لطفاً اتصال اینترنت و سرور را بررسی کنید.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [retryCount]); // زمانی که retryCount تغییر کند، دوباره فراخوانی می‌شود

  // تابع برای دوباره تلاش کردن
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  // تابع برای بررسی دستی سرور
  const checkServer = async () => {
    try {
      console.log("🔍 در حال بررسی سرور...");
      const testRes = await fetch("http://localhost:5000/api/health", {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (testRes.ok) {
        const health = await testRes.json();
        alert(`✅ سرور در حال اجراست\nوضعیت: ${health.status || 'OK'}`);
      } else {
        alert(`⚠️ سرور پاسخ می‌دهد اما وضعیت: ${testRes.status}`);
      }
    } catch (err) {
      alert(`❌ سرور پاسخ نمی‌دهد:\n${err.message}`);
    }
  };

  // تابع فرمت تاریخ
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('fa-IR');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-100">📊 گزارش جامع اسناد حسابداری</h2>
          <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
            نمایش کلیه اسناد ثبت شده در سیستم
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
         
          <ExportButtons
            data={entries}
            filename="گزارش_اسناد_حسابداری"
            title="گزارش جامع اسناد حسابداری"
            columns={[
              { header: 'شماره سند', accessor: 'DocumentNumber' },
              { header: 'تاریخ', accessor: 'EntryDate', format: formatDate },
              { header: 'شرح سند', accessor: 'Description', format: (val) => val || "-" },
              { header: 'وضعیت تراز', accessor: 'IsBalanced', format: (val) => val ? "✅ تراز" : "❌ غیرتراز" },
              { header: 'جمع بدهکار', accessor: 'TotalDebit', format: (val) => Number(val || 0).toLocaleString('fa-IR') },
              { header: 'جمع بستانکار', accessor: 'TotalCredit', format: (val) => Number(val || 0).toLocaleString('fa-IR') }
            ]}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">خطا!</strong>
          <span className="block sm:inline"> {error}</span>
          <div className="mt-2">
            <button
              onClick={handleRetry}
              className="bg-red-100 hover:bg-red-200 text-red-800 font-bold py-1 px-3 rounded text-sm"
            >
              تلاش مجدد
            </button>
            <button
              onClick={checkServer}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-1 px-3 rounded text-sm mr-2"
            >
              بررسی سرور
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <div className="text-gray-600 dark:text-gray-300">در حال بارگذاری گزارش...</div>
          <div className="text-gray-500 text-sm mt-2">لطفاً شکیبا باشید</div>
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-4xl mb-4">📭</div>
          <div className="text-gray-600 dark:text-gray-300 text-lg mb-2">هیچ سندی ثبت نشده است</div>
          <div className="text-gray-500 text-sm">با ثبت سند جدید، گزارش در اینجا نمایش داده می‌شود</div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
              <div className="text-blue-700 dark:text-blue-300 text-sm font-medium">تعداد کل اسناد</div>
              <div className="text-2xl font-bold text-blue-800 dark:text-blue-100 mt-1">{entries.length.toLocaleString('fa-IR')}</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
              <div className="text-green-700 dark:text-green-300 text-sm font-medium">اسناد تراز</div>
              <div className="text-2xl font-bold text-green-800 dark:text-green-100 mt-1">
                {entries.filter(e => e.IsBalanced).length.toLocaleString('fa-IR')}
              </div>
            </div>
            <div className="bg-red-50 dark:bg-red-900 p-4 rounded-lg">
              <div className="text-red-700 dark:text-red-300 text-sm font-medium">اسناد غیرتراز</div>
              <div className="text-2xl font-bold text-red-800 dark:text-red-100 mt-1">
                {entries.filter(e => !e.IsBalanced).length.toLocaleString('fa-IR')}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
            <table className="min-w-full text-sm text-right">
              <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                <tr>
                  <th className="px-4 py-3 font-medium border-b">ردیف</th>
                  <th className="px-4 py-3 font-medium border-b">شماره سند</th>
                  <th className="px-4 py-3 font-medium border-b">تاریخ ثبت</th>
                  <th className="px-4 py-3 font-medium border-b">شرح سند</th>
                  <th className="px-4 py-3 font-medium border-b">وضعیت تراز</th>
                  <th className="px-4 py-3 font-medium border-b text-blue-600 dark:text-blue-300">جمع بدهکار</th>
                  <th className="px-4 py-3 font-medium border-b text-red-600 dark:text-red-300">جمع بستانکار</th>
                  <th className="px-4 py-3 font-medium border-b">اختلاف</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e, index) => {
                  const totalDebit = Number(e.TotalDebit || 0);
                  const totalCredit = Number(e.TotalCredit || 0);
                  const difference = Math.abs(totalDebit - totalCredit);

                  return (
                    <tr
                      key={e.EntryId}
                      className={`border-b hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${!e.IsBalanced ? 'bg-red-50 dark:bg-red-900/20' : ''
                        }`}
                    >
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                        {(index + 1).toLocaleString('fa-IR')}
                      </td>
                      <td className="px-4 py-3 font-medium">{e.DocumentNumber}</td>
                      <td className="px-4 py-3">{formatDate(e.EntryDate)}</td>
                      <td className="px-4 py-3 max-w-xs truncate" title={e.Description || "-"}>
                        {e.Description || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${e.IsBalanced
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                          {e.IsBalanced ? "✅ تراز" : "❌ غیرتراز"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-blue-700 dark:text-blue-300">
                        {totalDebit.toLocaleString('fa-IR')}
                      </td>
                      <td className="px-4 py-3 font-medium text-red-700 dark:text-red-300">
                        {totalCredit.toLocaleString('fa-IR')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${e.IsBalanced
                            ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}>
                          {difference.toLocaleString('fa-IR')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 dark:bg-gray-700 font-bold">
                <tr>
                  <td colSpan="5" className="px-4 py-3 text-right">جمع کل:</td>
                  <td className="px-4 py-3 text-blue-700 dark:text-blue-300">
                    {entries.reduce((sum, e) => sum + Number(e.TotalDebit || 0), 0).toLocaleString('fa-IR')}
                  </td>
                  <td className="px-4 py-3 text-red-700 dark:text-red-300">
                    {entries.reduce((sum, e) => sum + Number(e.TotalCredit || 0), 0).toLocaleString('fa-IR')}
                  </td>
                  <td className="px-4 py-3">
                    {Math.abs(
                      entries.reduce((sum, e) => sum + Number(e.TotalDebit || 0), 0) -
                      entries.reduce((sum, e) => sum + Number(e.TotalCredit || 0), 0)
                    ).toLocaleString('fa-IR')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  );
}