import React from 'react';
import { Calendar, ChevronRight, ChevronLeft } from 'lucide-react';

const Step1SelectYear = ({ 
  fiscalYears, 
  selectedYear, 
  setSelectedYear, 
  onBack, 
  onNext 
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-blue-100 p-3 rounded-full">
          <Calendar className="w-8 h-8 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">انتخاب سال مالی</h2>
          <p className="text-gray-600">سال مالی مورد نظر برای بستن حساب‌ها را انتخاب کنید</p>
        </div>
      </div>
      
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-4">
          سال مالی
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fiscalYears.map((year) => (
            <button
              key={year.YearCode}
              onClick={() => setSelectedYear(year.YearCode)}
              className={`p-4 border-2 rounded-xl text-right transition-all ${
                selectedYear === year.YearCode
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm px-2 py-1 rounded-full ${
                  year.IsActive === 1 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {year.IsActive === 1 ? 'فعال' : 'غیرفعال'}
                </span>
                <span className="font-bold text-lg">{year.YearCode}</span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <div>شروع: {year.StartDate}</div>
                <div>پایان: {year.EndDate}</div>
                <div className="text-xs">تعداد اسناد: {year.EntryCount || 0}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl font-medium transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
          بازگشت
        </button>
        <button
          onClick={onNext}
          disabled={!selectedYear}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${
            !selectedYear
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          مرحله بعد
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Step1SelectYear;