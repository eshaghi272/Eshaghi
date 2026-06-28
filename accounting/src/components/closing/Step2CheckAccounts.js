import React from 'react';
import { 
  FileText, 
  ChevronRight, 
  ChevronLeft, 
  AlertCircle, 
  RefreshCw,
  Calendar,
  Shield 
} from 'lucide-react';

const formatCurrency = (value) => {
  if (value === undefined || value === null || isNaN(value)) return '۰ ریال';
  const absoluteValue = Math.abs(Math.round(value));
  return new Intl.NumberFormat('fa-IR').format(absoluteValue) + ' ریال';
};

const Step2CheckAccounts = ({ 
  loading, 
  error, 
  selectedYear, 
  fiscalYears, 
  temporaryAccounts, 
  totals, // دریافت totals از props
  capitalAccount, 
  onBack, 
  onNext, 
  onRetry 
}) => {
  const formatPersianDate = (dateString) => {
    if (!dateString) return '';
    if (typeof dateString === 'string' && dateString.includes('/')) {
      return dateString;
    }
    return dateString;
  };

  // تبدیل Type به فارسی
  const getPersianType = (type) => {
    switch(type) {
      case 'Incomes': return 'درآمد';
      case 'OperatingCost':
      case 'NonOperatingCost':
      case 'COSP': return 'هزینه';
      default: return type;
    }
  };

  // بررسی اینکه آیا حساب درآمد است
  const isIncomeAccount = (account) => {
    return account.Type === 'Incomes';
  };

  // بررسی اینکه آیا حساب هزینه است
  const isExpenseAccount = (account) => {
    return account.Type === 'OperatingCost' || 
           account.Type === 'NonOperatingCost' || 
           account.Type === 'COSP';
  };

  // محاسبه مجموع مانده بستانکار از API یا محلی
  const getTotalCreditBalance = () => {
    if (totals && totals.totalCreditBalance !== undefined) {
      return totals.totalCreditBalance;
    }
    // محاسبه محلی اگر totals وجود نداشت
    return temporaryAccounts
      .filter(acc => isIncomeAccount(acc) && acc.balanceSide === 'بستانکار')
      .reduce((sum, acc) => sum + (acc.balance || 0), 0);
  };

  // محاسبه مجموع مانده بدهکار از API یا محلی
  const getTotalDebitBalance = () => {
    if (totals && totals.totalDebitBalance !== undefined) {
      return totals.totalDebitBalance;
    }
    // محاسبه محلی اگر totals وجود نداشت
    return temporaryAccounts
      .filter(acc => isExpenseAccount(acc) && acc.balanceSide === 'بدهکار')
      .reduce((sum, acc) => sum + (acc.balance || 0), 0);
  };

  // محاسبه تعداد حساب درآمد و هزینه
  const getAccountCounts = () => {
    const incomeCount = temporaryAccounts.filter(isIncomeAccount).length;
    const expenseCount = temporaryAccounts.filter(isExpenseAccount).length;
    return { incomeCount, expenseCount };
  };

  const { incomeCount, expenseCount } = getAccountCounts();

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-green-100 p-3 rounded-full">
          <FileText className="w-8 h-8 text-green-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">بررسی حساب‌های موقت</h2>
          <p className="text-gray-600">بررسی و تأیید حساب‌های موقت سال {selectedYear}</p>
        </div>
      </div>
      
      {loading ? (
        <div className="py-12 text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">در حال بررسی حساب‌های موقت...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="font-bold text-red-800">خطا در بررسی</h3>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={onRetry}
            className="mt-4 flex items-center gap-2 text-red-600 hover:text-red-800 font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            تلاش مجدد
          </button>
        </div>
      ) : (
        <>
          {/* کارت خلاصه */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-blue-800">سال مالی</div>
                  <div className="text-2xl font-bold text-blue-900">
                    {selectedYear}
                  </div>
                </div>
              </div>
              <div className="text-sm text-blue-700">
                {formatPersianDate(fiscalYears.find(y => y.YearCode === selectedYear)?.StartDate)} تا{' '}
                {formatPersianDate(fiscalYears.find(y => y.YearCode === selectedYear)?.EndDate)}
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-100 p-2 rounded-lg">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-green-800">حساب‌های موقت</div>
                  <div className="text-2xl font-bold text-green-900">
                    {temporaryAccounts.length}
                  </div>
                </div>
              </div>
              <div className="text-sm text-green-700">
                {incomeCount} درآمد، {expenseCount} هزینه
              </div>
            </div>
            
            <div className={`border rounded-xl p-6 ${
              capitalAccount ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${
                  capitalAccount ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  <Shield className={`w-6 h-6 ${
                    capitalAccount ? 'text-green-600' : 'text-red-600'
                  }`} />
                </div>
                <div>
                  <div className={`text-sm font-medium ${
                    capitalAccount ? 'text-green-800' : 'text-red-800'
                  }`}>
                    حساب سرمایه
                  </div>
                  <div className={`text-2xl font-bold ${
                    capitalAccount ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {capitalAccount ? 'موجود' : 'یافت نشد'}
                  </div>
                </div>
              </div>
              <div className={`text-sm ${
                capitalAccount ? 'text-green-700' : 'text-red-700'
              }`}>
                {capitalAccount 
                  ? `${capitalAccount.AccountCode} - ${capitalAccount.TitleFa}`
                  : 'حساب سرمایه برای انتقال سود/زیان نیاز است'
                }
              </div>
            </div>
          </div>
          
          {/* جدول حساب‌های موقت */}
          {temporaryAccounts.length > 0 ? (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">حساب‌های موقت دارای مانده</h3>
                <span className="text-sm text-gray-600">
                  {temporaryAccounts.filter(acc => (acc.balance || 0) > 0.01).length} حساب دارای مانده
                </span>
              </div>
              
              <div className="overflow-x-auto border border-gray-200 rounded-xl">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-4 text-right text-sm font-medium text-gray-500">کد حساب</th>
                      <th className="p-4 text-right text-sm font-medium text-gray-500">نام حساب</th>
                      <th className="p-4 text-right text-sm font-medium text-gray-500">نوع</th>
                      <th className="p-4 text-right text-sm font-medium text-gray-500">طبیعت</th>
                      <th className="p-4 text-right text-sm font-medium text-gray-500">مانده نهایی</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {temporaryAccounts
                      .filter(account => (account.balance || 0) > 0.01)
                      .slice(0, 10)
                      .map((account, index) => (
                        <tr key={`${account.AccountCode}-${index}`} className="hover:bg-gray-50">
                          <td className="p-4">
                            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                              {account.AccountCode || '-'}
                            </span>
                          </td>
                          <td className="p-4 font-medium text-gray-900">
                            {account.TitleFa || 'نامشخص'}
                          </td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              isIncomeAccount(account)
                                ? 'bg-green-100 text-green-800'
                                : isExpenseAccount(account)
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {getPersianType(account.Type)}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              account.Nature === 'بستانکار'
                                ? 'bg-blue-100 text-blue-800'
                                : account.Nature === 'بدهكار'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {account.Nature || 'نامشخص'}
                            </span>
                          </td>
                          <td className="p-4 text-left">
                            <span className={`font-medium ${
                              account.balanceSide === 'بستانکار'
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}>
                              {account.balanceDisplay || formatCurrency(account.balance || 0)}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {temporaryAccounts.filter(acc => (acc.balance || 0) > 0.01).length > 10 && (
                  <div className="p-4 text-center border-t border-gray-200">
                    <span className="text-sm text-gray-600">
                      و {temporaryAccounts.filter(acc => (acc.balance || 0) > 0.01).length - 10} حساب دیگر...
                    </span>
                  </div>
                )}
              </div>
              
              {/* خلاصه مانده‌ها */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-green-800 mb-2">حساب‌های درآمد</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-green-600">مجموع مانده بستانکار:</span>
                    <span className="font-bold text-green-700">
                      {formatCurrency(getTotalCreditBalance())}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-green-600">
                    {temporaryAccounts.filter(acc => isIncomeAccount(acc) && acc.balanceSide === 'بستانکار').length} حساب
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-red-800 mb-2">حساب‌های هزینه</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-red-600">مجموع مانده بدهکار:</span>
                    <span className="font-bold text-red-700">
                      {formatCurrency(getTotalDebitBalance())}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-red-600">
                    {temporaryAccounts.filter(acc => isExpenseAccount(acc) && acc.balanceSide === 'بدهکار').length} حساب
                  </div>
                </div>
              </div>

              {/* اطلاعات اضافی از API */}
              {totals && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">اطلاعات اضافی از سرور:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-blue-600">کل حساب‌ها: </span>
                      <span className="font-medium">{totals.totalAccounts || temporaryAccounts.length}</span>
                    </div>
                    <div>
                      <span className="text-blue-600">حساب درآمد: </span>
                      <span className="font-medium">{totals.incomeAccounts || incomeCount}</span>
                    </div>
                    <div>
                      <span className="text-blue-600">حساب هزینه: </span>
                      <span className="font-medium">{totals.expenseAccounts || expenseCount}</span>
                    </div>
                    <div>
                      <span className="text-blue-600">حساب‌های دارای مانده: </span>
                      <span className="font-medium">{totals.accountsWithBalance || temporaryAccounts.filter(acc => (acc.balance || 0) > 0.01).length}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
                <div>
                  <h3 className="font-bold text-yellow-800">حساب موقتی یافت نشد</h3>
                  <p className="text-yellow-700 mt-1">
                    هیچ حساب درآمد یا هزینه‌ای با مانده برای سال {selectedYear} یافت نشد.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* دکمه‌های ناوبری */}
          <div className="flex justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl font-medium transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
              مرحله قبل
            </button>
            <button
              onClick={onNext}
              disabled={!capitalAccount || temporaryAccounts.length === 0}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${
                !capitalAccount || temporaryAccounts.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              محاسبه سود و زیان
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Step2CheckAccounts;