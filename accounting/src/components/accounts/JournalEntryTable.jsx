import React from "react";

const JournalEntryTable = ({ lines, handleChange, handleCodeEntered, handleOpenDrawer, handleAddLine, handleSubmit }) => {
  const totalDebit = lines.reduce((sum, line) => sum + Number(line.DebitAmount || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + Number(line.CreditAmount || 0), 0);
  const isBalanced = totalDebit === totalCredit;

  return (
    <>
      <table className="w-full border border-collapse rtl text-right">
        <thead className="bg-gray-100 font-bold">
          <tr>
            <th className="border px-2 py-1">#</th>
            <th className="border px-2 py-1">حساب</th>
            <th className="border px-2 py-1">بدهکار</th>
            <th className="border px-2 py-1">بستانکار</th>
            <th className="border px-2 py-1">عملیات</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line, idx) => (
            <tr key={idx}>
              <td className="border px-2 py-1">{idx + 1}</td>
              <td className="border px-2 py-1">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={line.AccountCode}
                    onChange={(e) => handleChange(idx, "AccountCode", e.target.value.replace(/^0+(?=\d)/, ''))}
                    onBlur={(e) => handleCodeEntered(idx, e.target.value)}
                    className="border rounded px-2 py-1 w-24"
                  />
                  <span className="font-bold">{line.TitleFa?.trim() || "—"}</span>
                  <button
                    type="button"
                    onClick={() => handleOpenDrawer(idx)}
                    className="bg-blue-500 text-white px-2 py-1 rounded"
                  >
                    انتخاب
                  </button>
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
                    e.target.value = Number(e.target.value || 0).toLocaleString('en-US');
                  }}
                  className="border rounded px-2 py-1 w-full text-left"
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
                    e.target.value = Number(e.target.value || 0).toLocaleString('en-US');
                  }}
                  className="border rounded px-2 py-1 w-full text-left"
                  dir="ltr"
                />
              </td>
              <td className="border px-2 py-1">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddLine(idx)}
                    className="bg-green-500 text-white px-2 py-1 rounded"
                  >
                    ➕
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-between items-center mt-4 px-2 py-2 border-t font-bold bg-gray-50">
        <div>جمع بدهکار: {totalDebit.toLocaleString('en-US')}</div>
        <div>جمع بستانکار: {totalCredit.toLocaleString('en-US')}</div>
        <div className={isBalanced ? "text-green-600" : "text-red-600"}>
          {isBalanced ? "✅ تراز" : "❌ غیرتراز"}
        </div>
      </div>

      <div className="mt-4 text-left">
        <button
          type="button"
          disabled={!isBalanced}
          onClick={handleSubmit}
          className={`px-4 py-2 rounded text-white ${isBalanced ? "bg-blue-600" : "bg-gray-400 cursor-not-allowed"}`}
        >
          💾 ثبت سند
        </button>
      </div>
    </>
  );
};

export default JournalEntryTable;
