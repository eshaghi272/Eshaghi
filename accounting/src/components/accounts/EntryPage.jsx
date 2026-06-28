import { useEffect, useState } from 'react';
import EntryForm from './EntryForm';

export default function EntryPage() {
  const [detailedLedgers, setDetailedLedgers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/api/list?table=tbldetailed_ledgers')
      .then(res => res.json())
      .then(data => {
        setDetailedLedgers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('❌ خطا در دریافت حساب‌ها:', err);
        setMessage('❌ خطا در دریافت اطلاعات حساب‌ها');
        setMessageType('error');
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (entryData) => {
    setMessage('');
    setMessageType('');
    try {
      const res = await fetch('http://localhost:5000/api/insert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'tblaccounting_entries',
          data: entryData
        })
      });

      const result = await res.json();
      if (res.ok) {
        setMessage('✅ سند با موفقیت ثبت شد');
        setMessageType('success');
      } else {
        setMessage('❌ خطا: ' + result.error);
        setMessageType('error');
      }
    } catch (err) {
      console.error('❌ خطا در ثبت سند:', err);
      setMessage('❌ خطا در ارتباط با سرور');
      setMessageType('error');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">ثبت سند حسابداری</h2>

      {message && (
        <div
          className={`p-3 rounded-md text-sm font-medium transition-all duration-300 ${
            messageType === 'success'
              ? 'text-green-700 bg-green-100 dark:bg-green-900 dark:text-green-300'
              : 'text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-300'
          }`}
        >
          {message}
        </div>
      )}

      {loading ? (
        <p className="text-gray-600 dark:text-gray-300">در حال بارگذاری اطلاعات حساب‌ها...</p>
      ) : (
        <EntryForm detailedLedgers={detailedLedgers} onSubmit={handleSubmit} />
      )}
    </div>
  );
}
