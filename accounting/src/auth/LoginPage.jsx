import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import axios from 'axios';

export default function LoginPage() {
  const nav = useNavigate();
  const { login, error } = useAuth();

  const [nationalCode, setNationalCode] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('');
  const [localErr, setLocalErr] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCheckNationalCode = async () => {
    setLocalErr('');
    if (!/^\d{10}$/.test(nationalCode)) {
      setLocalErr('کد ملی باید ۱۰ رقم باشد');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/users/check-national-code', { nationalCode });
      if (res.data.exists) {
        setRole(res.data.role);
        setStep(2);
      } else {
        nav('/register');
      }
    } catch {
      setLocalErr('خطا در بررسی کد ملی');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLocalErr('');
    setLoading(true);
    try {
      await login({ nationalCode, password, role });
      nav('/');
    } catch (err) {
      setLocalErr(err.message || 'ورود ناموفق بود');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600";

  return (
    <div className="max-w-md mx-auto mt-16 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg" dir="rtl">
      <h2 className="text-2xl font-bold mb-6 text-blue-700 text-center">ورود به سامانه</h2>

      {(localErr || error) && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 shadow-sm text-right">
          {localErr || error}
        </div>
      )}

      {step === 1 && (
        <form onSubmit={(e) => { e.preventDefault(); handleCheckNationalCode(); }} className="space-y-4">
          <input
            type="text"
            name="nationalCode"
            value={nationalCode}
            onChange={(e) => setNationalCode(e.target.value)}
            placeholder="کد ملی"
            className={inputClass}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'در حال بررسی...' : 'ادامه'}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="رمز عبور"
            className={inputClass}
            autoComplete="current-password"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition disabled:opacity-50"
          >
            {loading ? 'در حال ورود...' : 'ورود'}
          </button>
          <p className="text-sm text-gray-600 text-right">
            رمز عبور را فراموش کرده‌اید؟{' '}
            <Link to="/recover" className="text-blue-600 hover:underline">بازیابی رمز</Link>
          </p>
        </form>
      )}
    </div>
  );
}
