import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ROLES = [
  { value: 1, label: 'ادمین' },
  { value: 2, label: 'پزشک' },
  { value: 3, label: 'کارمند' },
  { value: 4, label: 'بیمار' },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, error } = useAuth();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    userName: '',
    nationalCode: '',
    phoneNumber: '',
    email: '',
    password: '',
    role: 4
  });

  const [localErr, setLocalErr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const setField = (k) => (e) => {
    const v = e.target.value;
    setForm((s) => ({ ...s, [k]: k === 'role' ? Number(v) : v }));
  };

  const validate = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) return 'نام و نام خانوادگی الزامی است';
    if (!/^[a-zA-Z0-9._-]{3,}$/.test(form.userName)) return 'نام کاربری حداقل ۳ کاراکتر و فقط حروف/عدد/.-_';
    if (!/^\d{10}$/.test(form.nationalCode)) return 'کد ملی باید ۱۰ رقم باشد';
    if (!/^\d{10,11}$/.test(form.phoneNumber)) return 'شماره موبایل نامعتبر است';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'ایمیل نامعتبر است';
    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(form.password)) return 'رمز حداقل ۸ کاراکتر و شامل حرف و عدد';
    if (![1, 2, 3, 4].includes(form.role)) return 'نقش نامعتبر است';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (v) return setLocalErr(v);
    setLocalErr('');
    setSubmitting(true);
    try {
      await register(form);
      navigate('/login');
    } catch (err) {
      setLocalErr(err.message || 'خطا در ثبت‌نام');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="flex justify-center pt-10 px-4" dir="rtl">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 w-full max-w-xl">
        <h2 className="text-2xl font-bold text-center mb-6 text-blue-700 dark:text-blue-300">ثبت‌نام کاربر جدید</h2>

        {(localErr || error) && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{localErr || error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              name="firstName"
              value={form.firstName}
              onChange={setField('firstName')}
              placeholder="نام"
              required
              className={inputClass}
            />
            <input
              type="text"
              name="lastName"
              value={form.lastName}
              onChange={setField('lastName')}
              placeholder="نام خانوادگی"
              required
              className={inputClass}
            />
          </div>

          <div>
            <input
              type="text"
              name="userName"
              value={form.userName}
              onChange={setField('userName')}
              placeholder="نام کاربری"
              required
              className={inputClass}
            />
            <p className="text-xs text-gray-500 mt-1">فقط حروف/عدد/.-_ و حداقل ۳ کاراکتر</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              name="nationalCode"
              value={form.nationalCode}
              onChange={setField('nationalCode')}
              placeholder="کد ملی"
              required
              maxLength={10}
              className={inputClass}
            />
            <input
              type="text"
              name="phoneNumber"
              value={form.phoneNumber}
              onChange={setField('phoneNumber')}
              placeholder="شماره موبایل"
              required
              maxLength={11}
              className={inputClass}
            />
          </div>

          <input
            type="email"
            name="email"
            value={form.email}
            onChange={setField('email')}
            placeholder="ایمیل"
            required
            className={inputClass}
          />

          <div>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={setField('password')}
              placeholder="رمز عبور"
              required
              className={inputClass}
            />
            <p className="text-xs text-gray-500 mt-1">حداقل ۸ کاراکتر، شامل حرف و عدد</p>
          </div>

          <select
            name="role"
            value={form.role}
            onChange={setField('role')}
            required
            className={inputClass}
            hidden
          >
            <option value="">انتخاب نقش</option>
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
          >
            {submitting ? 'در حال ثبت...' : 'ثبت‌نام'}
          </button>

          <p className="text-sm text-center text-gray-600 dark:text-gray-300 mt-2">
            حساب دارید؟ <Link to="/login" className="text-blue-600 hover:underline">ورود</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
