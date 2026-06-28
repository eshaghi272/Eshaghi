import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  ChevronRight, 
  ChevronLeft, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Shield,
  RefreshCw,
  FileText,
  AlertCircle,
  Loader2,
  XCircle,
  Info
} from 'lucide-react';

const formatCurrency = (value) => {
  if (value === undefined || value === null || isNaN(value)) return '۰ ریال';
  const absoluteValue = Math.abs(Math.round(value));
  return new Intl.NumberFormat('fa-IR').format(absoluteValue) + ' ریال';
};

const Step3CalculateProfitLoss = ({ 
  profitLoss, 
  calculatedAccounts = [], 
  capitalAccount, 
  selectedYear,
  fiscalYearInfo,
  temporaryAccounts = [],
  onBack, 
  onNext, 
  onCalculate,
  isLoading = false,
  calculationError = null
}) => {
  const [localData, setLocalData] = useState(null);
  
  // وقتی داده از والد می‌آید
  useEffect(() => {
    if (profitLoss && calculatedAccounts.length > 0) {
      console.log('📊 دریافت داده از والد در مرحله ۳');
      setLocalData({
        profitLoss,
        accounts: calculatedAccounts
      });
    }
  }, [profitLoss, calculatedAccounts]);
  
  const handleCalculateClick = () => {
    console.log('📊 دکمه محاسبه مجدد کلیک شد');
    if (onCalculate && typeof onCalculate === 'function') {
      onCalculate();
    }
  };
  
  const handleNextClick = () => {
    console.log('➡️ دکمه ادامه برای بستن حساب‌ها کلیک شد');
    
    // بررسی وجود داده
    if (localData?.accounts?.length > 0 || calculatedAccounts.length > 0) {
      if (onNext && typeof onNext === 'function') {
        onNext();
      }
    } else {
      alert('لطفاً ابتدا سود و زیان را محاسبه کنید');
    }
  };
  
  const handleBackClick = () => {
    console.log('↩️ دکمه مرحله قبل کلیک شد');
    if (onBack && typeof onBack === 'function') {
      onBack();
    }
  };
  
  // نمایش خطا
  if (calculationError) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center py-12">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-gray-800 mb-4">خطا در محاسبه</h3>
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-2xl mx-auto mb-8">
            <div className="text-red-800 font-medium mb-2">مشکل در محاسبه سود و زیان:</div>
            <div className="text-red-600">{calculationError}</div>
          </div>
          <div className="flex justify-center gap-4">
            <button
              onClick={handleBackClick}
              className="flex items-center gap-2 px-8 py-3 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl font-medium"
            >
              <ChevronRight className="w-5 h-5" />
              بازگشت
            </button>
            <button
              onClick={handleCalculateClick}
              className="flex items-center gap-2 px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium"
            >
              <RefreshCw className="w-5 h-5" />
              تلاش مجدد
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // اگر داده‌ای وجود ندارد یا در حال بارگذاری است
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center py-16">
          <Loader2 className="w-16 h-16 text-purple-600 animate-spin mx-auto mb-6" />
          <h3 className="text-xl font-bold text-gray-800 mb-3">در حال محاسبه سود و زیان...</h3>
          <p className="text-gray-600">لطفاً چند لحظه صبر کنید</p>
        </div>
      </div>
    );
  }
  
  // اگر محاسبه انجام نشده
  if (!localData && calculatedAccounts.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center py-12">
          <div className="relative inline-block mb-8">
            <div className="w-32 h-32 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center shadow-inner">
              <Calculator className="w-16 h-16 text-purple-600" />
            </div>
          </div>
          
          <h3 className="text-2xl font-bold text-gray-800 mb-4">آماده محاسبه</h3>
          <p className="text-gray-600 max-w-lg mx-auto mb-8 text-lg leading-relaxed">
            برای محاسبه دقیق سود و زیان سال مالی {selectedYear} و تعیین حساب‌های قابل بستن،
            روی دکمه زیر کلیک کنید
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={handleCalculateClick}
              className="px-10 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl hover:scale-105"
            >
              <Calculator className="w-6 h-6" />
              محاسبه سود و زیان
            </button>
            
            <button
              onClick={handleBackClick}
              className="px-8 py-4 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl font-medium transition-colors"
            >
              بازگشت به مرحله قبل
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // نمایش داده‌های محاسبه شده
  const displayData = localData || {
    profitLoss: profitLoss || {
      totalRevenue: 0,
      totalExpense: 0,
      netProfitLoss: 0,
      isProfit: false,
      isLoss: false,
      absoluteValue: 0,
      revenueAccounts: 0,
      expenseAccounts: 0
    },
    accounts: calculatedAccounts
  };
  
  const revenueAccounts = displayData.accounts.filter(acc => acc.Type === 'درآمد');
  const expenseAccounts = displayData.accounts.filter(acc => acc.Type === 'هزینه');
  const totalAmount = displayData.accounts.reduce((sum, acc) => sum + (acc.calculatedAmount || 0), 0);
  
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      {/* هدر */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-green-500 p-3 rounded-xl">
            <Calculator className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">مرحله ۳: محاسبه سود و زیان</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-gray-600">سال مالی {selectedYear}</span>
              {fiscalYearInfo && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="text-sm text-gray-500">
                    {fiscalYearInfo.StartDate} تا {fiscalYearInfo.EndDate}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        
        {displayData.profitLoss && (
          <div className={`px-4 py-2 rounded-full font-medium border ${
            displayData.profitLoss.isProfit
              ? 'bg-green-100 text-green-800 border-green-300'
              : displayData.profitLoss.isLoss
              ? 'bg-red-100 text-red-800 border-red-300'
              : 'bg-gray-100 text-gray-800 border-gray-300'
          }`}>
            {displayData.profitLoss.isProfit ? (
              <span className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                سودده
              </span>
            ) : displayData.profitLoss.isLoss ? (
              <span className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                زیان‌ده
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                متعادل
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* کارت‌های نتایج */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* درآمد */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-2.5 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-sm font-medium text-green-800">مجموع درآمدها</div>
              <div className="text-2xl font-bold text-green-900">
                {formatCurrency(displayData.profitLoss.totalRevenue)}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-green-100">
            <span className="text-sm text-green-700">
              {revenueAccounts.length} حساب
            </span>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              بستانکار
            </span>
          </div>
        </div>
        
        {/* هزینه */}
        <div className="bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-gradient-to-r from-red-500 to-rose-500 p-2.5 rounded-lg">
              <TrendingDown className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-sm font-medium text-red-800">مجموع هزینه‌ها</div>
              <div className="text-2xl font-bold text-red-900">
                {formatCurrency(displayData.profitLoss.totalExpense)}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-red-100">
            <span className="text-sm text-red-700">
              {expenseAccounts.length} حساب
            </span>
            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
              بدهکار
            </span>
          </div>
        </div>
        
        {/* سود/زیان */}
        <div className={`border-2 rounded-2xl p-6 ${
          displayData.profitLoss.isProfit
            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
            : displayData.profitLoss.isLoss
            ? 'bg-gradient-to-br from-red-50 to-rose-50 border-red-300'
            : 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-300'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2.5 rounded-lg ${
              displayData.profitLoss.isProfit
                ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                : displayData.profitLoss.isLoss
                ? 'bg-gradient-to-r from-red-500 to-rose-500'
                : 'bg-gradient-to-r from-gray-500 to-slate-500'
            }`}>
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className={`text-sm font-medium ${
                displayData.profitLoss.isProfit ? 'text-green-800' : 
                displayData.profitLoss.isLoss ? 'text-red-800' : 'text-gray-800'
              }`}>
                سود/زیان خالص
              </div>
              <div className={`text-2xl font-bold ${
                displayData.profitLoss.isProfit ? 'text-green-900' : 
                displayData.profitLoss.isLoss ? 'text-red-900' : 'text-gray-900'
              }`}>
                {formatCurrency(displayData.profitLoss.netProfitLoss)}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t">
            <span className={`font-medium ${
              displayData.profitLoss.isProfit ? 'text-green-700' : 
              displayData.profitLoss.isLoss ? 'text-red-700' : 'text-gray-700'
            }`}>
              {displayData.profitLoss.isProfit ? 'سود خالص' : 
               displayData.profitLoss.isLoss ? 'زیان خالص' : 'بدون سود/زیان'}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              displayData.profitLoss.isProfit ? 'bg-green-100 text-green-800' : 
              displayData.profitLoss.isLoss ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {displayData.profitLoss.isProfit ? 'بستانکار' : 
               displayData.profitLoss.isLoss ? 'بدهکار' : 'متوازن'}
            </span>
          </div>
        </div>
      </div>
      
      {/* جدول حساب‌ها */}
      {displayData.accounts.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-2 rounded-lg">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">حساب‌های قابل بستن</h3>
                <p className="text-gray-600 mt-1">
                  {displayData.accounts.length} حساب با مانده قابل بستن شناسایی شد
                </p>
              </div>
            </div>
            <button
              onClick={handleCalculateClick}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              محاسبه مجدد
            </button>
          </div>
          
          <div className="overflow-hidden border border-gray-200 rounded-xl">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-4 text-right text-sm font-semibold text-gray-700">کد حساب</th>
                    <th className="p-4 text-right text-sm font-semibold text-gray-700">نام حساب</th>
                    <th className="p-4 text-right text-sm font-semibold text-gray-700">نوع</th>
                    <th className="p-4 text-right text-sm font-semibold text-gray-700">مانده حساب</th>
                    <th className="p-4 text-right text-sm font-semibold text-gray-700">عملیات بستن</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {displayData.accounts.map((account, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <span className="font-mono text-sm bg-gray-100 px-3 py-1.5 rounded-lg">
                          {account.AccountCode}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-gray-900">
                        {account.TitleFa}
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                          account.Type === 'درآمد'
                            ? 'bg-green-50 text-green-800'
                            : 'bg-red-50 text-red-800'
                        }`}>
                          {account.Type}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className={`font-bold text-lg ${
                          account.Type === 'درآمد' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(account.calculatedAmount || account.finalBalance || 0)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                            account.operation === 'بدهکار'
                              ? 'bg-red-50 text-red-800'
                              : 'bg-green-50 text-green-800'
                          }`}>
                            {account.operation}
                          </span>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            account.operation === 'بدهکار'
                              ? 'bg-red-100 text-red-600'
                              : 'bg-green-100 text-green-600'
                          }`}>
                            {account.operation === 'بدهکار' ? '→' : '←'}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {/* اطلاعات انتقال به حساب سرمایه */}
      {capitalAccount && displayData.profitLoss.absoluteValue > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl p-8 mb-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-3 rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-blue-900">انتقال به حساب سرمایه</h3>
              <p className="text-blue-700 mt-1">
                نتیجه نهایی محاسبات به حساب سرمایه منتقل خواهد شد
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white p-5 rounded-xl border border-blue-100">
              <div className="text-sm text-gray-600 mb-2">حساب سرمایه</div>
              <div className="font-bold text-blue-800 text-lg">
                {capitalAccount.AccountCode}
              </div>
              <div className="text-blue-900 mt-1">
                {capitalAccount.TitleFa}
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-xl border border-blue-100">
              <div className="text-sm text-gray-600 mb-2">مبلغ انتقال</div>
              <div className={`text-2xl font-bold ${
                displayData.profitLoss.isProfit ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(displayData.profitLoss.absoluteValue)}
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-xl border border-blue-100">
              <div className="text-sm text-gray-600 mb-2">نوع عملیات</div>
              <div className={`font-bold text-lg ${
                displayData.profitLoss.isProfit ? 'text-green-700' : 'text-red-700'
              }`}>
                {displayData.profitLoss.isProfit ? 'بستانکار کردن' : 'بدهکار کردن'}
              </div>
              <div className={`text-sm mt-1 ${
                displayData.profitLoss.isProfit ? 'text-green-600' : 'text-red-600'
              }`}>
                حساب سرمایه {displayData.profitLoss.isProfit ? 'بستانکار' : 'بدهکار'} می‌شود
              </div>
            </div>
          </div>
          
          <div className={`px-5 py-3 rounded-xl text-sm font-medium ${
            displayData.profitLoss.isProfit
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {displayData.profitLoss.isProfit 
              ? `✅ سود خالص ${formatCurrency(displayData.profitLoss.absoluteValue)} به حساب سرمایه ${capitalAccount.TitleFa} بستانکار خواهد شد.`
              : `⚠️ زیان خالص ${formatCurrency(displayData.profitLoss.absoluteValue)} از حساب سرمایه ${capitalAccount.TitleFa} بدهکار خواهد شد.`
            }
          </div>
        </div>
      )}
      
      {/* دکمه‌های ناوبری */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-gray-200">
        <button
          onClick={handleBackClick}
          className="flex items-center gap-2 px-8 py-3 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl font-medium transition-colors w-full sm:w-auto justify-center"
        >
          <ChevronRight className="w-5 h-5" />
          مرحله قبل
        </button>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <button
            onClick={handleCalculateClick}
            className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors w-full sm:w-auto justify-center"
          >
            <RefreshCw className="w-5 h-5" />
            محاسبه مجدد
          </button>
          
          <button
            onClick={handleNextClick}
            disabled={!displayData.accounts || displayData.accounts.length === 0}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-medium shadow-lg transition-all w-full sm:w-auto justify-center ${
              !displayData.accounts || displayData.accounts.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white hover:shadow-xl'
            }`}
          >
            ادامه برای بستن حساب‌ها
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Step3CalculateProfitLoss;