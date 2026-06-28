import { useState, useEffect } from "react";

export default function JournalBook() {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/journal")
      .then((res) => res.json())
      .then(setEntries)
      .catch((err) => console.error("❌ خطا در دریافت دفتر روزنامه:", err));
  }, []);

  return (
    <div className="p-6 bg-white dark:bg-gray-800 shadow-md">
      <h2 className="text-xl font-bold text-purple-700 dark:text-purple-200 mb-4">
        📑 دفتر روزنامه
      </h2>

      {entries.length === 0 ? (
        <p className="text-gray-500">هیچ سندی ثبت نشده است</p>
      ) : (
        <table className="w-full text-sm border border-gray-300 dark:border-gray-700">
          <thead className="bg-gray-200 dark:bg-gray-700">
            <tr>
              <th className="px-2 py-1">شماره سند</th>
              <th className="px-2 py-1">تاریخ</th>
              <th className="px-2 py-1">شرح</th>
              <th className="px-2 py-1">کد حساب</th>
              <th className="px-2 py-1">بدهکار</th>
              <th className="px-2 py-1">بستانکار</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.LineId} className="border-t hover:bg-gray-50 dark:hover:bg-gray-900">
                <td className="px-2 py-1">{entry.DocumentNumber}</td>
                <td className="px-2 py-1">{entry.EntryDate}</td>
                <td className="px-2 py-1">{entry.Description}</td>
                <td className="px-2 py-1">{entry.AccountCode}</td>
                <td className="px-2 py-1 text-green-700 font-bold">
                  {entry.DebitAmount > 0 ? entry.DebitAmount.toLocaleString("fa-IR") : ""}
                </td>
                <td className="px-2 py-1 text-red-700 font-bold">
                  {entry.CreditAmount > 0 ? entry.CreditAmount.toLocaleString("fa-IR") : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
