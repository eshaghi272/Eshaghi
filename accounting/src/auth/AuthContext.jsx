// مسیر: client/src/auth/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// گرفتن اطلاعات کامل کاربر فعلی از بک‌اند
// async function getCurrentUser() {
//   const res = await axios.get('http://localhost:5000/api/users/me', {
//     withCredentials: true
//   });
//   return res.data.user;
// }
async function getCurrentUser() {
  const res = await axios.get('http://localhost:5000/api/users/me', {
    withCredentials: true
  });

  const rawUser = res.data.user;

  // اگر نقش بیمار بود، patientId را از جدول بیماران واکشی کن
  if (rawUser.role === 2 && rawUser.nationalCode) {
    try {
      const userRes = await axios.get(
        `http://localhost:5000/api/users/by-national-code/${rawUser.nationalCode}`
      );
      rawUser.userId = userRes.data?.user?.id ?? null;
    } catch {
      rawUser.patientId = null;
    }
  }

  return rawUser;
}

// ساخت آبجکت نهایی کاربر با تمام شناسه‌ها و اطلاعات نمایشی
function buildUserObject(rawUser) {
  return {
    userId: rawUser.id,
       role: rawUser.role,
    nationalCode: rawUser.nationalCode,
    firstName: rawUser.firstName ?? '',
    lastName: rawUser.lastName ?? '',
    userName: rawUser.nationalCode // 👈 نام کاربری پیش‌فرض بر اساس کد ملی
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // بارگذاری اولیه اطلاعات کاربر
  useEffect(() => {
    async function loadUser() {
      try {
        const current = await getCurrentUser();
        const finalUser = buildUserObject(current);
        setUser(finalUser);
        console.log('✅ کاربر وارد شده:', finalUser);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  // ورود با کد ملی و رمز عبور
  async function login({ nationalCode, password }) {
    try {
      await axios.post(
        'http://localhost:5000/api/users/login',
        { nationalCode: String(nationalCode || '').trim(), password },
        { withCredentials: true }
      );

      const current = await getCurrentUser();
      const finalUser = buildUserObject(current);
      setUser(finalUser);
      return finalUser;
    } catch (err) {
      const msg = err.response?.data?.message || 'ورود ناموفق بود';
      setUser(null);
      setError(msg);
      throw new Error(msg);
    }
  }

  // ثبت‌نام کاربر جدید
  async function register(payload) {
    try {
      await axios.post(
        'http://localhost:5000/api/users/register',
        payload,
        { withCredentials: true }
      );
    } catch (err) {
      const msg = err.response?.data?.message || 'خطا در ثبت‌نام';
      setError(msg);
      throw new Error(msg);
    }
  }

  // خروج از حساب کاربری
  async function logout() {
    try {
      await axios.post(
        'http://localhost:5000/api/users/logout',
        {},
        { withCredentials: true }
      );
    } finally {
      setUser(null);
      setError('');
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, error, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// هوک سفارشی برای استفاده از کانتکس
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth باید داخل AuthProvider استفاده شود');
  }
  return context;
}
