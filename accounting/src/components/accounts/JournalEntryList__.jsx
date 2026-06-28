import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function JournalEntryList() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState(null);
  const [lines, setLines] = useState([]);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchEntry = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/journalentries/${id}/full`);
        if (!res.ok) throw new Error("سند یافت نشد");
        const data = await res.json();
        setEntry({
          DocumentNumber: data.DocumentNumber,
          EntryDate: data.EntryDate,
          Description: data.Description || "",
        });
        setLines(data.Lines);
      } catch (err) {
        console.error("❌", err.message);
        setError("خطا در دریافت سند");
      }
    };

    fetchEntry();
  }, [id]);

  const handleLineChange = (idx, field, value) => {
    setLines((prev) =>
      prev.map((line, i) => (i === idx ? { ...line, [field]: value } : line))
    );
  };

  const handleAddLine = () => {
    setLines((prev) => [
      ...prev,
      { AccountCode: "", TitleFa: "", DebitAmount: 0, CreditAmount: 0 },
    ]);
  };

  const handleDeleteLine = (idx) => {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  };

  const totalDebit = lines.reduce((sum, l) => sum + Number(l.DebitAmount || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + Number(l.CreditAmount || 0), 0);
  const isBalanced = totalDebit === totalCredit;

  const handleSubmit = async () => {
    if (!entry.DocumentNumber.trim()) {
      alert("شماره سند الزامی است");
      return;
    }
    if (lines.length === 0) {
      alert("حداقل یک ردیف سند لازم است");
      return;
    }
    if (!isBalanced) {
      alert("سند تراز نیست");
      return;
    }

    const payload = {
      DocumentNumber: entry.DocumentNumber.trim(),
      EntryDate: entry.EntryDate,
      Description: entry.Description.trim(),
      Lines: lines
        .filter(
          (l) =>
            l.AccountCode &&
            (Number(l.DebitAmount) !== 0 || Number(l.CreditAmount) !== 0)
        )
        .map((l) => ({
          AccountCode: l.AccountCode,
          DebitAmount: Number(l.DebitAmount || 0),
          CreditAmount: Number(l.CreditAmount || 0),
        })),
    };

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
        const errText = await res.text();
        console.error("❌ خطا در ویرایش:", errText);
        alert("❌ خطا در ویرایش سند");
      }
    } catch (err) {
      console.error("❌ خطای شبکه:", err.message);
      alert("❌ خطای شبکه یا سرور");
    }
  };

  const filteredLines = lines.filter(
    (line) =>
      line.TitleFa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(line.AccountCode).includes(searchTerm)
  );

  if (error) return <div className="text-red-600">{error}</div>;
  if (!entry) return <div>در حال بارگذاری...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-xl font-bold text-green-700 mb-4">✏️ ویرایش سند حسابداری</h2>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          شماره سند:
          <input
            type="text"
            value={entry.DocumentNumber}
            onChange={(e) => setEntry({ ...entry, DocumentNumber: e.target.value })}
            className="border px-2 py-1 w-full"
          />
        </div>
        <div>
          تاریخ:
          <input
            type="date"
            value={entry.EntryDate}
            onChange={(e) => setEntry({ ...entry, EntryDate: e.target.value })}
            className="border px-2 py-1 w-full"
          />
        </div>
        <div className="col-span-2">
          توضیحات:
          <textarea
            value={entry.Description}
            onChange={(e) => setEntry({ ...entry, Description: e.target.value })}
            className="border px-2 py-1 w-full"
          />
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="🔍 جستجو در ردیف‌ها بر اساس عنوان یا کد حساب..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border px-3 py-2 w-full rounded"
        />
      </div>

      <table className="w-full text-sm border border-gray-300 mb-4">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-2 py-1">کد حساب</th>
            <th className="px-2 py-1">عنوان</th>
            <th className="px-2 py-1">بدهکار</th>
            <th className="px-2 py-1">بستانکار</th>
            <th className="px-2 py-1">🗑️</th>
          </tr>
        </thead>
        <tbody>
          {filteredLines.map((line, idx) => (
            <tr key={idx} className="border-t">
              <td>
                <input
                  type="number"
                  value={line.AccountCode}
                  onChange={(e) => handleLineChange(idx, "AccountCode", e.target.value)}
                  className="border px-2 py-1 w-full"
                />
              </td>
              <td>
                <input
                  type="text"
                  value={line.TitleFa}
                  onChange={(e) => handleLineChange(idx, "TitleFa", e.target.value)}
                  className="border px-2 py-1 w-full"
                />
              </td>
              <td>
                <input
                  type="number"
                  value={line.DebitAmount}
                  onChange={(e) => handleLineChange(idx, "DebitAmount", e.target.value)}
                  className="border px-2 py-1 w-full text-right"
                />
              </td>
              <td>
                <input
                  type="number"
                  value={line.CreditAmount}
                  onChange={(e) => handleLineChange(idx, "CreditAmount", e.target.value)}
                  className="border px-2 py-1 w-full text-right"
                />
              </td>
              <td>
                <button
                  onClick={() => handleDeleteLine(idx)}
                  className="text-red-600 hover:underline"
                >
                  حذف
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-between items-center mb-6">
        <button
          onClick={handleAddLine}
          className="bg-gray-100 text-gray-800 px-3 py-1 rounded hover:bg-gray-200"
        >
          ➕ افزودن ردیف
        </button>
        <div className="text-sm font-bold">
          جمع بدهکار: {totalDebit.toLocaleString("fa-IR")} | جمع بستانکار: {totalCredit.toLocaleString("fa-IR")} | وضعیت: {isBalanced ? "✅ تراز" : "❌ ناتراز"}
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleSubmit}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          💾 ذخیره تغییرات
        </button>
        <button
          onClick={() => navigate(`/journalentries/${id}/print`)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          🖨️ چاپ سند
        </button>
      </div>
    </div>
  );
}
