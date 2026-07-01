// pages/About.jsx
import React from 'react';

const About = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* هدر صفحه */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            درباره ما
          </h1>
          <div className="w-24 h-1 bg-blue-600 mx-auto mb-6"></div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            سیستم جامع حسابداری انلاین و مدیریت  راهکاری هوشمند برای مدیریت مالی و اداری کسب و کار شما 
          </p>
        </div>

        {/* معرفی کلی */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-12">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 md:p-12">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
              حسابداری انلاین
              </h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
              حسابداری انلاین یک نرم‌افزار جامع مدیریت و حسابداری است که ویژه کسب و کار شما چه کوچک و چه بزرگ طراحی و پیاده‌سازی شده است. این سیستم با هدف یکپارچه‌سازی فرآیندهای مالی، اداری، بستری امن و کارآمد برای مدیریت روزانه کسب و کار شما را فراهم می‌آورد.
              </p>
              <p className="text-gray-600 leading-relaxed">
                تیم توسعه‌دهنده حسابداری انلاین با سال‌ها تجربه در حوزه نرم‌افزارهای مالی و  سعی داشته است تا نیازهای واقعی   را شناسایی و در قالب یک نرم‌افزار کاربرپسند و قدرتمند پیاده‌سازی نماید.
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-8 md:p-12 flex items-center">
              <div className="text-white">
                <div className="mb-6">
                  <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-2">شعار ما</h3>
                <p className="text-xl opacity-90">"سلامت مالی، سلامت کاری"</p>
              </div>
            </div>
          </div>
        </div>

        {/* ویژگی‌ها و قابلیت‌ها */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">حسابداری یکپارچه</h3>
            <p className="text-gray-600">
              مدیریت کامل رویدادهای مالی شامل دریافت‌ها، پرداخت‌ها، تنخواه‌گردان، اموال و استهلاک، انبارداری و حسابداری حقوق و دستمزد
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">مدیریت پرسنل</h3>
            <p className="text-gray-600">
              مدیریت اطلاعات پرسنلی، حضور و غیاب، محاسبه خودکار اضافه‌کاری، حق‌جذب، حق‌مسئولیت و سایر مزایا و کسورات
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">گزارشات تحلیلی</h3>
            <p className="text-gray-600">
              ارائه بیش از ۵۰ نوع گزارش مدیریتی و تحلیلی شامل صورت‌های مالی، گزارش‌های عملکرد، نمودارهای تحلیلی و داشبوردهای مدیریتی
            </p>
          </div>
        </div>

        {/* ماژول‌های اصلی */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">
            ماژول‌های اصلی سیستم
          </h2>
          
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center p-4">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-blue-600">۱</span>
              </div>
              <h4 className="font-semibold text-gray-800">حسابداری مالی</h4>
            </div>
            
            <div className="text-center p-4">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-green-600">۲</span>
              </div>
              <h4 className="font-semibold text-gray-800">حقوق و دستمزد</h4>
            </div>
            
            <div className="text-center p-4">
              <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-yellow-600">۳</span>
              </div>
              <h4 className="font-semibold text-gray-800">اموال و استهلاک</h4>
            </div>
            
            <div className="text-center p-4">
              <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-purple-600">۴</span>
              </div>
              <h4 className="font-semibold text-gray-800">انبارداری</h4>
            </div>
          </div>
        </div>

        {/* مزایا */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">مزایای حسابداری انلاین</h3>
            <ul className="space-y-3">
              <li className="flex items-center">
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>رابط کاربری ساده و روان</span>
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>گزارش‌های لحظه‌ای و دقیق</span>
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>پشتیبانی ۲۴ ساعته</span>
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>به‌روزرسانی مستمر</span>
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>امنیت بالا با رمزنگاری اطلاعات</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">تماس با ما</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-gray-500 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                </svg>
                <span>تلفن پشتیبانی: 09112582972-</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-gray-500 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
                <span>ایمیل: eshaghi272@gmail.com</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-gray-500 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                <span>آدرس: ساری خیابان سلمان فارس خیابان شهید نصوحی ساختمان امیر سروش</span>
              </div>
            </div>
          </div>
        </div>

        {/* تیم توسعه */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">تیم توسعه‌دهنده</h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            تیم ما متشکل از متخصصان با تجربه در حوزه‌های حسابداری، مدیریت و فناوری اطلاعات است که با همکاری یکدیگر، سیستمی جامع و کارآمد را برای کسب و کار  کشور طراحی و پیاده‌سازی کرده‌اند.
          </p>
          <div className="text-sm text-gray-500">
            © ۱۴۰۳ حسابداری انلاین - تمامی حقوق محفوظ است
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;