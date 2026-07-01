import { useState } from 'react';
import AccountGroupForm from './AccountGroupForm';

export default function AccountGroupPage() {
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' | 'error'

  const handleSubmit = async (groupData, resetForm) => {
    setMessage('');
    setMessageType('');

    try {
      const res = await fetch('http://127.0.0.1:5000/api/insert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'tblaccount_groups',
          data: groupData
        })
      });

      const result = await res.json();
      if (res.ok) {
        setMessage('✅ گروه حساب با موفقیت ثبت شد');
        setMessageType('success');
        resetForm(); // پاک‌سازی فرم
      } else {
        setMessage('❌ خطا: ' + result.error);
        setMessageType('error');
      }
    } catch (err) {
      console.error('❌ خطا در ثبت گروه حساب:', err);
      setMessage('❌ خطا در ارتباط با سرور');
      setMessageType('error');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">تعریف گروه حساب</h2>

      {message && (
        <div
          className={`p-3 rounded-md text-sm font-medium mb-4 transition-all duration-300 ${
            messageType === 'success'
              ? 'text-green-700 bg-green-100 dark:bg-green-900 dark:text-green-300'
              : 'text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-300'
          }`}
        >
          {message}
        </div>
      )}

      <AccountGroupForm onSubmit={handleSubmit} />
    </div>
  );
}
