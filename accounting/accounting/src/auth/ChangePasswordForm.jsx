import { useState } from 'react';
import axios from 'axios';

export default function ChangePasswordForm() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!oldPassword || !newPassword || !confirmPassword) {
      return setError('لطفاً تمام فیلدها را پر کنید');
    }

    if (newPassword.length < 6) {
      return setError('رمز جدید باید حداقل ۶ کاراکتر باشد');
    }

    if (newPassword !== confirmPassword) {
      return setError('رمز جدید و تکرار آن یکسان نیستند');
    }

    try {
      const res = await axios.post('/api/auth/change-password', {
        oldPassword,
        newPassword
      });

      if (res.data.success) {
        setSuccess('رمز با موفقیت تغییر یافت');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(res.data.message || 'خطا در تغییر رمز');
      }
    } catch (err) {
      setError('خطا در ارتباط با سرور');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-10 bg-white dark:bg-gray-800 p-6 rounded shadow" dir="rtl">
      <h2 className="text-xl font-bold mb-4 text-blue-700">تغییر رمز عبور</h2>

      <input
        type="password"
        placeholder="رمز فعلی"
        value={oldPassword}
        onChange={(e) => setOldPassword(e.target.value)}
        className="w-full border rounded px-3 py-2 mb-4 text-right"
      />

      <input
        type="password"
        placeholder="رمز جدید"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        className="w-full border rounded px-3 py-2 mb-4 text-right"
      />

      <input
        type="password"
        placeholder="تکرار رمز جدید"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        className="w-full border rounded px-3 py-2 mb-4 text-right"
      />

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{success}</div>}

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
      >
        ذخیره تغییرات
      </button>
    </form>
  );
}
