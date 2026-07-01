import { useState } from 'react';

export default function EntryForm({ detailedLedgers = [], onSubmit = () => {} }) {
  const [date, setDate] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [description, setDescription] = useState('');
  const [rows, setRows] = useState([{ accountCode: '', accountName: '', debit: '', credit: '' }]);
  const [error, setError] = useState('');

  const handleRowChange = (index, field, value) => {
    const updated = [...rows];
    updated[index][field] = value;

    if (field === 'accountCode') {
      const match = detailedLedgers.find(d => String(d.code) === String(value));
      updated[index]['accountName'] = match ? match.name : '';
    }

    setRows(updated);
  };

  const addRow = () => {
    setRows([...rows, { accountCode: '', accountName: '', debit: '', credit: '' }]);
  };

  const totalDebit = rows.reduce((sum, r) => sum + (Number(r.debit) || 0), 0);
  const totalCredit = rows.reduce((sum, r) => sum + (Number(r.credit) || 0), 0);
  const isBalanced = totalDebit === totalCredit;

  const handleSubmit = e => {
    e.preventDefault();
    setError('');

    if (!date.trim()) return setError('تاریخ الزامی است');
    const validRows = rows.filter(r => r.accountCode && (Number(r.debit) > 0 || Number(r.credit) > 0));
    if (validRows.length === 0) return setError('هیچ سطر معتبر وارد نشده است');

    const payload = {
      date: date.trim(),
      docNumber: docNumber.trim(),
      description: description.trim(),
      entries: validRows.map(r => ({
        account_code: r.accountCode,
        debit: Number(r.debit) || 0,
        credit: Number(r.credit) || 0
      }))
    };

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <input type="text" value={date} onChange={e => setDate(e.target.value)} placeholder="تاریخ" className="border p-2 rounded" />
        <input type="text" value={docNumber} onChange={e => setDocNumber(e.target.value)} placeholder="شماره سند" className="border p-2 rounded" />
        <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="شرح کلی" className="border p-2 rounded" />
      </div>

      {rows.map((row, index) => (
        <div key={index} className="grid grid-cols-4 gap-4">
          <input type="text" value={row.accountCode} onChange={e => handleRowChange(index, 'accountCode', e.target.value)} placeholder="کد حساب" className="border p-2 rounded" />
          <input type="text" value={row.accountName} readOnly placeholder="نام حساب" className="border p-2 rounded bg-gray-100" />
          <input type="number" value={row.debit} onChange={e => handleRowChange(index, 'debit', e.target.value)} placeholder="بدهکار" className="border p-2 rounded" />
          <input type="number" value={row.credit} onChange={e => handleRowChange(index, 'credit', e.target.value)} placeholder="بستانکار" className="border p-2 rounded" />
        </div>
      ))}

      <button type="button" onClick={addRow} className="px-4 py-2 bg-green-600 text-white rounded">+ افزودن سطر</button>

      <div className="text-sm mt-4">
        <p>جمع بدهکار: {totalDebit.toLocaleString()}</p>
        <p>جمع بستانکار: {totalCredit.toLocaleString()}</p>
        <p className={isBalanced ? 'text-green-600' : 'text-red-600'}>
          {isBalanced ? '✅ سند بالانس است' : '❌ سند بالانس نیست'}
        </p>
      </div>

      {error && <div className="text-red-600 mt-2">{error}</div>}

      <div className="text-end">
        <button type="submit" className="mt-4 px-6 py-2 bg-blue-600 text-white rounded">ثبت سند</button>
      </div>
    </form>
  );
}
