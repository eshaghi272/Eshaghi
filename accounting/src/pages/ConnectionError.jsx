// pages/ConnectionError.jsx
import React from 'react';

const ConnectionError = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"></path>
              </svg>
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">
            خطا در اتصال به سرور
          </h2>
          
          <p className="text-gray-600 text-center mb-6">
            امکان اتصال به سرور وجود ندارد. لطفاً از روشن بودن سرور اطمینان حاصل کنید.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-2">راه‌حل‌های پیشنهادی:</p>
            <ul className="text-sm text-gray-500 space-y-2">
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full ml-2"></span>
                بررسی کنید که سرور بک‌اند در حال اجرا باشد
              </li>
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full ml-2"></span>
                آدرس سرور را بررسی کنید: <span className="font-mono bg-gray-200 px-2 py-0.5 rounded">http://localhost:5000</span>
              </li>
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full ml-2"></span>
                صفحه را پس از روشن کردن سرور رفرش کنید
              </li>
            </ul>
          </div>
          
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
          >
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            تلاش مجدد
          </button>
        </div>
        
        <div className="bg-gray-100 px-8 py-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            پس از راه‌اندازی سرور، روی دکمه بالا کلیک کنید
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConnectionError;