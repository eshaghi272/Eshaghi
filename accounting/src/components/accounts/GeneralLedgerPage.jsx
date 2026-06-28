import { useEffect, useState } from 'react';
import GeneralLedgerForm from './GeneralLedgerForm';

export default function GeneralLedgerPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' | 'error'

  // گرفتن لیست گروه‌های حساب از API
  useEffect(() => {
    fetch('http://localhost:5000/api/list?table=accountgroups')
      .then(res => res.json())
      .then(data => {
        setGroups(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('❌ خطا در دریافت گروه‌ها:', err);
        setMessage('❌ خطا در دریافت گروه‌های حساب');
        setMessageType('error');
        setLoading(false);
      });
  }, []);

  // ثبت حساب کل جدید
  const handleSubmit = async (ledgerData, resetForm) => {
    setMessage('');
    setMessageType('');
    try {
      const res = await fetch('http://localhost:5000/api/insert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'tblgeneral_ledgers',
          data: ledgerData
        })
      });

      const result = await res.json();
      if (res.ok) {
        setMessage('✅ حساب کل با موفقیت ثبت شد');
        setMessageType('success');
        resetForm(); // پاک‌سازی فرم
      } else {
        setMessage('❌ خطا: ' + result.error);
        setMessageType('error');
      }
    } catch (err) {
      console.error('❌ خطا در ثبت حساب کل:', err);
      setMessage('❌ خطا در ارتباط با سرور');
      setMessageType('error');
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 space-y-6">
      <h2 className="text-xl font-bold text-gray-800 dark:text-white">تعریف حساب کل</h2>

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
        <p className="text-gray-600 dark:text-gray-300">در حال بارگذاری گروه‌های حساب...</p>
      ) : (
        <GeneralLedgerForm groups={groups} onSubmit={handleSubmit} />
      )}
    </div>
  );
}
