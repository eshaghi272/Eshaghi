import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function RecoverPage() {
  const [nationalCode, setNationalCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRecover = async () => {
    setMessage('');
    setError('');

    const code = nationalCode.trim();
    if (!/^\d{10}$/.test(code)) {
      setError('کد ملی باید دقیقاً ۱۰ رقم باشد');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/auth/recover-password', {
        nationalCode: code
      });

      if (res.data.success) {
        const password = res.data.password;
        setMessage(`رمز عبور جدید: ${password}`);
        setTimeout(() => navigate('/login'), 4000);
      } else {
        setError(res.data.message || 'کاربر یافت نشد');
      }
    } catch (err) {
      console.error('❌ خطا در بازیابی رمز:', err);
      setError('خطا در ارسال درخواست بازیابی');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const pass = message.replace('رمز عبور جدید: ', '');
    navigator.clipboard.writeText(pass);
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white dark:bg-gray-800 p-6 rounded shadow" dir="rtl">
      <h2 className="text-xl font-bold mb-4 text-blue-700">بازیابی رمز عبور</h2>

      {message && (
        <div className="bg-green-100 text-green-700 p-3 rounded mb-4 flex justify-between items-center">
          <span>{message}</span>
          <button
            type="button"
            onClick={handleCopy}
            className="text-green-700 hover:text-green-900"
            title="کپی رمز"
          >
            📋
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); handleRecover(); }} className="space-y-4">
        <input
          type="text"
          name="nationalCode"
          value={nationalCode}
          onChange={(e) => setNationalCode(e.target.value)}
          placeholder="کد ملی"
          maxLength={10}
          className="w-full border rounded px-3 py-2 text-right"
        />
        <button
          type="submit"
          disabled={loading || !!message}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? 'در حال ارسال...' : 'ارسال رمز جدید'}
        </button>
      </form>
    </div>
  );
}
