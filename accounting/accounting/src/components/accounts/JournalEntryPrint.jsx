import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function JournalEntryPrint() {
  const { id } = useParams();
  const [entry, setEntry] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEntry = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/journalentries/${id}/full`);
        if (!res.ok) throw new Error("سند یافت نشد");
        const data = await res.json();
        setEntry(data);
      } catch (err) {
        console.error("❌", err.message);
        setError("خطا در دریافت سند");
      }
    };

    fetchEntry();
  }, [id]);

  if (error) return <div className="text-red-600">{error}</div>;
  if (!entry) return <div>در حال بارگذاری...</div>;

  const totalDebit = entry.Lines.reduce((sum, l) => sum + Number(l.DebitAmount || 0), 0);
  const totalCredit = entry.Lines.reduce((sum, l) => sum + Number(l.CreditAmount || 0), 0);
  const isBalanced = totalDebit === totalCredit;

  const format = (val) => Number(val || 0).toLocaleString("fa-IR");

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white text-black print:bg-white print:text-black">
      <h2 className="text-xl font-bold text-center mb-4">🧾 سند حسابداری رسمی</h2>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>شماره سند: <strong>{entry.DocumentNumber}</strong></div>
        <div>تاریخ ثبت: <strong>{entry.EntryDate}</strong></div>
        <div>توضیحات: <strong>{entry.Description || "—"}</strong></div>
        <div>وضعیت تراز: <strong>{isBalanced ? "✅ تراز" : "❌ ناتراز"}</strong></div>
      </div>

      <table className="w-full text-sm border border-gray-400">
        <thead className="bg-gray-200">
          <tr>
            <th className="px-2 py-1">ردیف</th>
            <th className="px-2 py-1">کد حساب</th>
            <th className="px-2 py-1">عنوان حساب</th>
            <th className="px-2 py-1 text-right">بدهکار</th>
            <th className="px-2 py-1 text-right">بستانکار</th>
          </tr>
        </thead>
        <tbody>
          {entry.Lines.map((line, idx) => (
            <tr key={idx} className="border-t">
              <td className="px-2 py-1">{idx + 1}</td>
              <td className="px-2 py-1">{line.AccountCode}</td>
              <td className="px-2 py-1">{line.TitleFa}</td>
              <td className="px-2 py-1 text-right">{format(line.DebitAmount)}</td>
              <td className="px-2 py-1 text-right">{format(line.CreditAmount)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-100 font-bold">
          <tr>
            <td colSpan="3" className="px-2 py-1 text-left">جمع کل</td>
            <td className="px-2 py-1 text-right">{format(totalDebit)}</td>
            <td className="px-2 py-1 text-right">{format(totalCredit)}</td>
          </tr>
        </tfoot>
      </table>

      <div className="mt-6 text-center print:hidden">
        <button
          onClick={() => window.print()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          🖨️ چاپ سند
        </button>
      </div>
    </div>
  );
}
