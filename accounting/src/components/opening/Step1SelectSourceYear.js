import React from 'react';
import { Calendar, ChevronRight, ChevronLeft, AlertCircle } from 'lucide-react';

const Step1SelectSourceYear = ({ 
  fiscalYears, 
  selectedYear, 
  setSelectedYear, 
  onBack, 
  onNext,
  loading,
  error
}) => {
  // فقط سال‌های بسته شده را نمایش بده
  const closedYears = fiscalYears.filter(year => year.IsActive === 0);
  
  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-amber-100 p-3 rounded-full">
          <Calendar className="w-8 h-8 text-amber-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">انتخاب سال مالی مبدا</h2>
          <p className="text-gray-600">
            سال مالی بسته شده‌ای که می‌خواهید مانده آن به سال جدید منتقل شود را انتخاب کنید
          </p>
        </div>
      </div>
      
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}
      
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-4">
          سال مالی بسته شده
        </label>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">در حال بارگذاری سال‌های مالی...</p>
          </div>
        ) : closedYears.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
            <Calendar className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-yellow-800 mb-2">هیچ سال مالی بسته شده‌ای یافت نشد</h3>
            <p className="text-yellow-700">
              ابتدا باید یک سال مالی را ببندید تا بتوانید سال جدید را افتتاح کنید.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {closedYears.map((year) => (
              <button
                key={year.YearCode}
                onClick={() => setSelectedYear(year.YearCode)}
                className={`p-5 border-2 rounded-xl text-right transition-all ${
                  selectedYear === year.YearCode
                    ? 'border-amber-500 bg-amber-50 shadow-md'
                    : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded-full">
                    بسته شده
                  </span>
                  <span className="font-bold text-xl">{year.YearCode}</span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>شروع: {year.StartDate}</div>
                  <div>پایان: {year.EndDate}</div>
                  <div className="text-xs mt-2 text-amber-600">
                    {year.EntryCount || 0} سند در سال
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
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
          disabled={!selectedYear || closedYears.length === 0}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${
            !selectedYear || closedYears.length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-amber-600 hover:bg-amber-700 text-white'
          }`}
        >
          مرحله بعد
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Step1SelectSourceYear;