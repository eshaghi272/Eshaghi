import React from 'react';
import { 
  CheckCircle, 
  Home, 
  Calendar, 
  Download, 
  FileText,
  DollarSign,
  Clock,
  AlertCircle
} from 'lucide-react';

const formatCurrency = (value) => {
  if (value === undefined || value === null || isNaN(value)) return '۰ ریال';
  const absoluteValue = Math.abs(Math.round(value));
  return new Intl.NumberFormat('fa-IR').format(absoluteValue) + ' ریال';
};

const Step5OpeningResult = ({ 
  sourceYear,
  targetYear,
  openingResult,
  error,
  onBack,
  onComplete
}) => {
  
  // ✅ استخراج مقادیر از openingResult با پشتیبانی از ساختارهای مختلف
  const getDocumentNumber = () => {
    if (!openingResult) return '---';
    return openingResult.documentNumber || openingResult.DocumentNumber || `OPN-${targetYear}`;
  };
  
  const getEntryId = () => {
    if (!openingResult) return '---';
    return openingResult.openingEntryId || openingResult.EntryId || openingResult.entryId || '---';
  };
  
  const getTotalDebit = () => {
    if (!openingResult) return 0;
    if (openingResult.totals?.debit !== undefined) return openingResult.totals.debit;
    if (openingResult.totalDebit !== undefined) return openingResult.totalDebit;
    return 0;
  };
  
  const getTotalCredit = () => {
    if (!openingResult) return 0;
    if (openingResult.totals?.credit !== undefined) return openingResult.totals.credit;
    if (openingResult.totalCredit !== undefined) return openingResult.totalCredit;
    return 0;
  };
  
  const getIsBalanced = () => {
    if (!openingResult) return true;
    if (openingResult.totals?.isBalanced !== undefined) return openingResult.totals.isBalanced;
    if (openingResult.isBalanced !== undefined) return openingResult.isBalanced;
    const debit = getTotalDebit();
    const credit = getTotalCredit();
    return Math.abs(debit - credit) < 0.01;
  };
  
  const getAccountsCount = () => {
    if (!openingResult) return 0;
    if (openingResult.accountsSummary?.total !== undefined) return openingResult.accountsSummary.total;
    if (openingResult.accountsCount !== undefined) return openingResult.accountsCount;
    return 0;
  };
  
  const getMessage = () => {
    if (!openingResult) return `سال مالی ${targetYear} با موفقیت افتتاح شد`;
    return openingResult.message || openingResult.Message || `سند افتتاحیه سال مالی ${targetYear} با موفقیت ایجاد شد`;
  };
  
  // ✅ محاسبه مقادیر
  const documentNumber = getDocumentNumber();
  const entryId = getEntryId();
  const totalDebit = getTotalDebit();
  const totalCredit = getTotalCredit();
  const isBalanced = getIsBalanced();
  const accountsCount = getAccountsCount();
  const message = getMessage();
  
  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-green-100 p-3 rounded-full">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">✅ فرآیند افتتاح با موفقیت انجام شد</h2>
          <p className="text-gray-600">
            سال مالی {targetYear} با موفقیت افتتاح و آماده استفاده است
          </p>
        </div>
      </div>
      
      {openingResult ? (
        <>
          {/* کارت نتیجه */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-green-800">✅ عملیات موفق</h3>
                <p className="text-green-700 mt-1">{message}</p>
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
                  <div className="text-sm font-medium text-blue-800">سند افتتاحیه</div>
                  <div className="text-2xl font-bold text-blue-900">
                    #{entryId}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">شماره سند:</span>
                  <span className="font-medium font-mono">{documentNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">تاریخ ایجاد:</span>
                  <span className="font-medium">{new Date().toLocaleDateString('fa-IR')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">تعداد آرکال:</span>
                  <span className="font-medium">{accountsCount} مورد</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-purple-800">مانده انتقالی</div>
                  <div className="text-2xl font-bold text-purple-900">
                    {formatCurrency(totalDebit)}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">مجموع بدهکار:</span>
                  <span className="font-bold text-blue-700">
                    {formatCurrency(totalDebit)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">مجموع بستانکار:</span>
                  <span className="font-bold text-green-700">
                    {formatCurrency(totalCredit)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-gray-600">وضعیت سند:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isBalanced
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {isBalanced ? '✅ متوازن' : '❌ نامتوازن'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* خلاصه نهایی */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-bold text-blue-800 mb-4">📊 خلاصه نهایی فرآیند افتتاح</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border border-blue-100">
                <div className="text-sm text-gray-600 mb-1">سال مبدا</div>
                <div className="text-lg font-bold text-gray-900">{sourceYear}</div>
                <div className="text-xs text-gray-500 mt-1">بسته شده</div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-blue-100">
                <div className="text-sm text-gray-600 mb-1">سال هدف</div>
                <div className="text-lg font-bold text-amber-700">{targetYear}</div>
                <div className="text-xs text-amber-600 mt-1">فعال</div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-blue-100">
                <div className="text-sm text-gray-600 mb-1">حساب‌های منتقل شده</div>
                <div className="text-lg font-bold text-gray-900">{accountsCount}</div>
                <div className="text-xs text-gray-500 mt-1">حساب دائمی</div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-blue-100">
                <div className="text-sm text-gray-600 mb-1">وضعیت سال جدید</div>
                <div className="text-lg font-bold text-green-700">فعال</div>
                <div className="text-xs text-green-600 mt-1">آماده ثبت سند</div>
              </div>
            </div>
          </div>
          
          {/* دکمه‌های پایانی */}
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <button
              onClick={onBack}
              className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl font-medium transition-colors"
            >
              <Home className="w-5 h-5" />
              بازگشت به صفحه اصلی
            </button>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => window.print()}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
              >
                <Download className="w-5 h-5" />
                چاپ گزارش افتتاح
              </button>
              
              <button
                onClick={onComplete}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors"
              >
                <Calendar className="w-5 h-5" />
                ورود به سال مالی {targetYear}
              </button>
            </div>
          </div>
        </>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="font-bold text-red-800">خطا در فرآیند افتتاح</h3>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={onBack}
            className="mt-4 flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
          >
            بازگشت و تلاش مجدد
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

export default Step5OpeningResult;