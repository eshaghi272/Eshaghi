import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import ImageUploader from './ImageUploader';

const steps = ['اطلاعات هویتی', 'تماس و نقش', 'آدرس و تصویر'];

export default function StaffProfileForm() {
  const { user } = useAuth();
  const userId = user?.userId;

  const [form, setForm] = useState(null);
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;

    axios.get(`http://localhost:5000/api/users/users/${userId}`)
      .then((res) => {
        const raw = res.data.user ?? res.data;
        if (!raw || !raw.id) {
          setError('کاربر یافت نشد');
          return;
        }

        const clean = {
          ...raw,
          id: raw.id ?? userId,
          firstName: raw.firstName ?? '',
          lastName: raw.lastName ?? '',
          nationalCode: raw.nationalCode ?? '',
          phoneNumber: raw.phoneNumber ?? '',
          email: raw.email ?? '',
          role: raw.role ?? '',
          address: raw.address ?? '',
          imageUrl: raw.imageUrl ?? ''
        };
        setForm(clean);
      })
      .catch(() => setError('خطا در دریافت اطلاعات کاربر'));
  }, [userId]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setMessage('');
    setError('');
    setLoading(true);
    try {
      const res = await axios.put(
        `http://localhost:5000/api/users/complete-profile/${form.id}`,
        form
      );
      if (res.data.success) {
        setMessage('اطلاعات با موفقیت ثبت شد');
      } else {
        setError('ثبت اطلاعات ناموفق بود');
      }
    } catch {
      setError('خطا در ارسال اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600";

  const renderStepFields = () => {
    if (!form) return null;

    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <input type="text" name="firstName" value={form.firstName} onChange={handleChange} placeholder="نام" className={inputClass} />
            <input type="text" name="lastName" value={form.lastName} onChange={handleChange} placeholder="نام خانوادگی" className={inputClass} />
            <input type="text" name="nationalCode" value={form.nationalCode} onChange={handleChange} placeholder="کد ملی" className={inputClass} />
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <input type="text" name="phoneNumber" value={form.phoneNumber} onChange={handleChange} placeholder="شماره تلفن" className={inputClass} />
            <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="ایمیل" className={inputClass} />
            <select name="role" value={form.role} onChange={handleChange} className={inputClass}>
              <option value="">انتخاب نقش</option>
              <option value={1}>ادمین</option>
              <option value={2}>پزشک</option>
              <option value={3}>پرسنل درمانی</option>
              <option value={4}>بیمار</option>
            </select>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <input type="text" name="address" value={form.address} onChange={handleChange} placeholder="آدرس" className={inputClass} />
            <input type="text" name="imageUrl" value={form.imageUrl} onChange={handleChange} placeholder="لینک تصویر" className={inputClass} />
            <ImageUploader imageUrl={form.imageUrl} onChange={(url) => setForm({ ...form, imageUrl: url })} />
          </div>
        );
      default:
        return null;
    }
  };

  if (error) {
    return (
      <div className="text-center mt-10 text-red-600 font-semibold" dir="rtl">
        {error}
      </div>
    );
  }

  if (!form) {
    return (
      <div className="text-center mt-10" dir="rtl">
        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600 font-medium">در حال بارگذاری اطلاعات کاربر...</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 mt-10" dir="rtl">
      <div className="flex justify-between mb-6">
        {steps.map((label, index) => (
          <div
            key={index}
            className={`flex-1 text-center py-2 rounded-full text-sm font-semibold transition-all duration-300
              ${step === index ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            {label}
          </div>
        ))}
      </div>

      {message && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 shadow-sm">
          {message}
        </div>
      )}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 shadow-sm">
          {error}
        </div>
      )}

      {renderStepFields()}

      <div className="flex justify-between mt-6">
        <button
          disabled={step === 0}
          onClick={() => setStep(step - 1)}
          className="px-4 py-2 border border-gray-400 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition"
        >
          مرحله قبل
        </button>
        {step < steps.length - 1 ? (
          <button
            onClick={() => setStep(step + 1)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            مرحله بعد
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition"
          >
            {loading ? 'در حال ارسال...' : 'ثبت اطلاعات'}
          </button>
        )}
      </div>
    </div>
  );
}
