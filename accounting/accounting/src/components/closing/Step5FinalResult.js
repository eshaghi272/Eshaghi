import React from 'react';
import { 
  CheckCircle, 
  AlertCircle, 
  Home, 
  Calendar, 
  Download, 
  Clock,
  FileText,
  DollarSign 
} from 'lucide-react';

const formatCurrency = (value) => {
  if (value === undefined || value === null || isNaN(value)) return '۰ ریال';
  const absoluteValue = Math.abs(Math.round(value));
  return new Intl.NumberFormat('fa-IR').format(absoluteValue) + ' ریال';
};

const Step5FinalResult = ({ 
  selectedYear, 
  closingResult, 
  error, 
  onBack, 
  onOpenNewYear 
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-green-100 p-3 rounded-full">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">عملیات با موفقیت انجام شد</h2>
          <p className="text-gray-600">حساب‌های موقت سال {selectedYear} بسته شدند</p>
        </div>
      </div>
      
      {closingResult ? (
        <>
          {/* کارت نتیجه */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-green-800">✅ عملیات موفق</h3>
                <p className="text-green-700 mt-1">{closingResult.message}</p>
              </div>
            </div>
          </div>
          
          {/* جزئیات نتیجه */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-blue-800">سند اختتامیه</div>
                  <div className="text-2xl font-bold text-blue-900">
                    #{closingResult.closingEntryId}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">سال مالی:</span>
                  <span className="font-medium">{closingResult.fiscalYear}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">تاریخ ایجاد:</span>
                  <span className="font-medium">{new Date().toLocaleDateString('fa-IR')}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-purple-800">انتقال به حساب سرمایه</div>
                  <div className="text-2xl font-bold text-purple-900">
                    {closingResult.capitalAccount?.code}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">نام حساب:</span>
                  <span className="font-medium">{closingResult.capitalAccount?.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">مبلغ انتقال:</span>
                  <span className={`font-bold ${
                    closingResult.isProfit ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(closingResult.absoluteProfitLoss)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* خلاصه نهایی */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-bold text-blue-800 mb-4">خلاصه نهایی عملیات</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border border-blue-100">
                <div className="text-sm text-gray-600 mb-1">حساب درآمد بسته شده</div>
                <div className="text-lg font-bold text-green-600">
                  {closingResult.revenueAccounts?.count || 0}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-blue-100">
                <div className="text-sm text-gray-600 mb-1">حساب هزینه بسته شده</div>
                <div className="text-lg font-bold text-red-600">
                  {closingResult.expenseAccounts?.count || 0}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-blue-100">
                <div className="text-sm text-gray-600 mb-1">مبلغ کل عملیات</div>
                <div className="text-lg font-bold text-blue-600">
                  {formatCurrency((closingResult.totals?.debit || 0) + (closingResult.totals?.credit || 0))}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-blue-100">
                <div className="text-sm text-gray-600 mb-1">وضعیت سند</div>
                <div className={`text-lg font-bold ${
                  closingResult.totals?.isBalanced ? 'text-green-600' : 'text-red-600'
                }`}>
                  {closingResult.totals?.isBalanced ? 'متوازن' : 'نامتوازن'}
                </div>
              </div>
            </div>
          </div>
          
          {/* دکمه‌های پایانی */}
          <div className="flex justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl font-medium transition-colors"
            >
              <Home className="w-5 h-5" />
              بازگشت به صفحه اصلی
            </button>
            
            <div className="flex gap-3">
              <button
                onClick={onOpenNewYear}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors"
              >
                <Calendar className="w-5 h-5" />
                افتتاح سال جدید
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
              >
                <Download className="w-5 h-5" />
                چاپ نتیجه
              </button>
            </div>
          </div>
        </>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="font-bold text-red-800">خطا در عملیات</h3>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={onBack}
            className="mt-4 flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
          >
            بازگشت به مرحله قبل
          </button>
        </div>
      ) : (
        <div className="text-center py-12">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">در انتظار نتیجه عملیات...</p>
        </div>
      )}
    </div>
  );
};

export default Step5FinalResult;