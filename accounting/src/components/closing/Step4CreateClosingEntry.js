import React from 'react';
import { 
  Lock, 
  AlertCircle, 
  ChevronRight, 
  RefreshCw,
  Download,
  CheckCircle,
  XCircle 
} from 'lucide-react';

const formatCurrency = (value) => {
  if (value === undefined || value === null || isNaN(value)) return '۰ ریال';
  const absoluteValue = Math.abs(Math.round(value));
  return new Intl.NumberFormat('fa-IR').format(absoluteValue) + ' ریال';
};

const Step4CreateClosingEntry = ({ 
  selectedYear, 
  capitalAccount, 
  profitLoss, 
  calculatedAccounts, 
  isClosing, 
  error, 
  onBack, 
  onCloseAccounts 
}) => {
  // محاسبه آمار
  const revenueAccounts = calculatedAccounts.filter(acc => acc.Type === 'درآمد');
  const expenseAccounts = calculatedAccounts.filter(acc => acc.Type === 'هزینه');
  const totalAmount = calculatedAccounts.reduce((sum, acc) => sum + (acc.calculatedAmount || 0), 0);
  
  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-red-100 p-3 rounded-full">
          <Lock className="w-8 h-8 text-red-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">ایجاد سند اختتامیه</h2>
          <p className="text-gray-600">بستن حساب‌های موقت و انتقال سود/زیان به حساب سرمایه</p>
        </div>
      </div>
      
      {/* نمایش خطا با جزئیات بیشتر */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <XCircle className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-bold text-red-800 mb-2">خطا در عملیات</h3>
              <p className="text-red-700 whitespace-pre-line">{error}</p>
              
              {/* راهنمایی برای رفع خطا */}
              <div className="mt-4 p-4 bg-red-100/50 rounded-lg border border-red-200">
                <h4 className="font-medium text-red-800 mb-2">🔍 راهنمایی:</h4>
                <ul className="text-sm text-red-700 space-y-1 list-disc mr-5">
                  <li>اطمینان حاصل کنید که سال مالی {selectedYear} قبلاً بسته نشده باشد</li>
                  <li>حساب سرمایه ({capitalAccount?.AccountCode}) باید فعال باشد</li>
                  <li>اتصال به سرور را بررسی کنید</li>
                  <li>صفحه را مجدداً بارگذاری کرده و دوباره تلاش کنید</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* هشدار مهم - فقط اگر خطایی وجود نداشته باشد */}
      {!error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-yellow-800">⚠️ توجه مهم</h3>
              <p className="text-yellow-700 mt-1">
                این عملیات غیرقابل بازگشت است. پس از تأیید، حساب‌های موقت بسته شده و سند اختتامیه ایجاد می‌شود.
              </p>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-yellow-600" />
                  <span className="text-yellow-700">بدهکار شدن حساب‌های درآمد</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-yellow-600" />
                  <span className="text-yellow-700">بستانکار شدن حساب‌های هزینه</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-yellow-600" />
                  <span className="text-yellow-700">انتقال سود/زیان به سرمایه</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* خلاصه عملیات */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4">📋 خلاصه عملیات بستن</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">سال مالی</div>
            <div className="font-bold text-gray-800 text-lg">{selectedYear}</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">حساب‌های قابل بستن</div>
            <div className="font-bold text-gray-800 text-lg">{calculatedAccounts.length} حساب</div>
            <div className="text-xs text-gray-500 mt-1">
              {revenueAccounts.length} درآمد • {expenseAccounts.length} هزینه
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">مبلغ کل عملیات</div>
            <div className="font-bold text-blue-600 text-lg">{formatCurrency(totalAmount)}</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">حساب سرمایه مقصد</div>
            <div className="font-bold text-gray-800 text-lg truncate" title={capitalAccount?.TitleFa}>
              {capitalAccount?.AccountCode}
            </div>
            <div className="text-xs text-gray-500 mt-1 truncate">{capitalAccount?.TitleFa}</div>
          </div>
        </div>
        
        {/* جزئیات سود/زیان */}
        {profitLoss && (
          <div className={`p-4 rounded-lg border ${
            profitLoss.isProfit 
              ? 'bg-green-50 border-green-200' 
              : profitLoss.isLoss 
                ? 'bg-red-50 border-red-200' 
                : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-700">سود/زیان خالص:</span>
                <span className={`mr-2 text-lg font-bold ${
                  profitLoss.isProfit ? 'text-green-600' : profitLoss.isLoss ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {formatCurrency(profitLoss.absoluteValue || profitLoss.netProfitLoss || 0)}
                </span>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                profitLoss.isProfit 
                  ? 'bg-green-100 text-green-800' 
                  : profitLoss.isLoss 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-gray-100 text-gray-800'
              }`}>
                {profitLoss.isProfit ? '💰 سود' : profitLoss.isLoss ? '💸 زیان' : '⚖️ صفر'}
              </span>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              {profitLoss.isProfit 
                ? `مبلغ ${formatCurrency(profitLoss.absoluteValue)} به حساب سرمایه بستانکار می‌شود`
                : profitLoss.isLoss
                  ? `مبلغ ${formatCurrency(profitLoss.absoluteValue)} از حساب سرمایه بدهکار می‌شود`
                  : 'سود و زیان صفر است، نیازی به انتقال نیست'
              }
            </div>
          </div>
        )}
      </div>
      
      {/* دکمه‌های عملیات */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <button
          onClick={onBack}
          disabled={isClosing}
          className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-5 h-5" />
          مرحله قبل
        </button>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => window.print()}
            disabled={isClosing}
            className="flex items-center justify-center gap-2 px-6 py-3 border border-blue-300 text-blue-600 hover:bg-blue-50 rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            <Download className="w-5 h-5" />
            چاپ گزارش
          </button>
          
          <button
            onClick={onCloseAccounts}
            disabled={isClosing || !capitalAccount || calculatedAccounts.length === 0}
            className={`flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-medium transition-all ${
              isClosing || !capitalAccount || calculatedAccounts.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            {isClosing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                در حال بستن حساب‌ها...
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                تأیید و بستن حساب‌ها
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* نمایش وضعیت غیرفعال بودن دکمه */}
      {!isClosing && !error && (
        <div className="mt-4 text-sm text-gray-500 text-center">
          {!capitalAccount && '⚠️ حساب سرمایه یافت نشد'}
          {capitalAccount && calculatedAccounts.length === 0 && '⚠️ هیچ حسابی برای بستن وجود ندارد'}
        </div>
      )}
    </div>
  );
};

export default Step4CreateClosingEntry;