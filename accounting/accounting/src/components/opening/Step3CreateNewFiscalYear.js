import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  ChevronRight, 
  ChevronLeft, 
  AlertCircle, 
  RefreshCw,
  CheckCircle,
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Scale
} from 'lucide-react';

const formatCurrency = (value) => {
  if (value === undefined || value === null || isNaN(value)) return '۰ ریال';
  const absoluteValue = Math.abs(Math.round(value));
  return new Intl.NumberFormat('fa-IR').format(absoluteValue) + ' ریال';
};

const Step3CreateNewFiscalYear = ({ 
  sourceYear,
  targetYear,
  summary,
  accounts = [],
  isCreating,
  error,
  onBack,
  onCreateYear,
  onNext,
  // props جدید برای هماهنگی با والد
  onSuccess,
  fiscalYearCreated
}) => {
  const [startDate, setStartDate] = useState(`${targetYear}/01/01`);
  const [endDate, setEndDate] = useState(`${targetYear}/12/29`);
  const [localError, setLocalError] = useState(null);
  const [creationSuccess, setCreationSuccess] = useState(fiscalYearCreated || false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // ==================== توابع تشخیص نوع حساب ====================
  
  /**
   * تشخیص دسته‌بندی صحیح حساب‌ها
   */
  const getAccountCategory = (account) => {
    const type = account.Type || account.type || '';
    const nature = account.Nature || account.nature || '';
    const accountCode = (account.AccountCode || account.accountCode || '').toString();
    const title = account.TitleFa || account.titleFa || '';
    
    // تشخیص حساب‌های کاهنده دارایی (استهلاك انباشته)
    const isDepreciationCode = accountCode.startsWith('121') || accountCode.startsWith('1211');
    const isDepreciationTitle = title.includes('استهلاك') || title.includes('انباشته');
    const hasCreditNature = nature === 'بستانكار' || nature === 'بستانکار';
    
    if ((isDepreciationCode || isDepreciationTitle) && hasCreditNature) {
      return 'ContraAssets';
    }
    
    // تشخیص دارایی‌ها
    if (type === 'CurrentAssets' || type === 'NonCurrentAssets' || type === 'Assets' || type === 'Asset') {
      return 'Assets';
    }
    
    // تشخیص بدهی‌ها
    if (type === 'CurrentDebit' || type === 'NonCurrentDebit' || type === 'Liabilities' || type === 'Liability') {
      return 'Liabilities';
    }
    
    // تشخیص سرمایه
    if (type === 'Equity' || type === 'CAPITAL' || type === 'Capital' || accountCode === '311001' || accountCode.startsWith('311')) {
      return 'Equity';
    }
    
    return 'Other';
  };
  
  /**
   * تشخیص حساب‌های سرمایه (فقط حساب اصلی)
   */
  const isMainEquityAccount = (account) => {
    const accountCode = (account.AccountCode || account.accountCode || '').toString();
    return accountCode === '311001';
  };
  
  /**
   * محاسبه مجموع دارایی‌ها با در نظر گرفتن حساب‌های کاهنده
   */
  const calculateNetAssets = () => {
    let total = 0;
    
    accounts.forEach(acc => {
      const category = getAccountCategory(acc);
      const balance = Math.abs(acc.Balance || acc.balance || 0);
      
      if (category === 'Assets') {
        total += balance;
      } else if (category === 'ContraAssets') {
        total -= balance;
      }
    });
    
    return total;
  };
  
  /**
   * محاسبه مجموع بدهی‌ها
   */
  const calculateTotalLiabilities = () => {
    return accounts
      .filter(acc => getAccountCategory(acc) === 'Liabilities')
      .reduce((sum, acc) => sum + Math.abs(acc.Balance || acc.balance || 0), 0);
  };
  
  /**
   * محاسبه مجموع سرمایه
   */
  const calculateTotalEquity = () => {
    const equityAccount = accounts.find(acc => isMainEquityAccount(acc));
    return equityAccount ? Math.abs(equityAccount.Balance || equityAccount.balance || 0) : 0;
  };
  
  /**
   * محاسبه سود/زیان انباشته
   */
  const calculateRetainedEarnings = () => {
    const totalAssets = calculateNetAssets();
    const totalLiabilities = calculateTotalLiabilities();
    const totalEquity = calculateTotalEquity();
    
    return totalAssets - totalLiabilities - totalEquity;
  };
  
  // ==================== محاسبات ====================
  
  // دسته‌بندی حساب‌ها برای آمار
  const allAssets = accounts.filter(acc => {
    const cat = getAccountCategory(acc);
    return cat === 'Assets' || cat === 'ContraAssets';
  });
  
  const regularAssets = accounts.filter(acc => getAccountCategory(acc) === 'Assets');
  const contraAssets = accounts.filter(acc => getAccountCategory(acc) === 'ContraAssets');
  const liabilities = accounts.filter(acc => getAccountCategory(acc) === 'Liabilities');
  const equityAccount = accounts.find(acc => isMainEquityAccount(acc));
  
  // محاسبه مجموع‌ها
  const totalAssets = calculateNetAssets();
  const totalLiabilities = calculateTotalLiabilities();
  const totalEquity = calculateTotalEquity();
  const retainedEarnings = calculateRetainedEarnings();
  const totalLiabilitiesEquity = totalLiabilities + totalEquity + retainedEarnings;
  const isBalanced = Math.abs(totalAssets - totalLiabilitiesEquity) < 0.01;
  
  // لاگ برای دیباگ
  console.log('📊 Step3 - داده‌های دریافتی:', {
    accountsCount: accounts.length,
    regularAssets: regularAssets.length,
    contraAssets: contraAssets.length,
    liabilities: liabilities.length,
    hasEquity: !!equityAccount,
    totalAssets,
    totalLiabilities,
    totalEquity,
    retainedEarnings,
    onNextExists: !!onNext,
    fiscalYearCreated,
    creationSuccess
  });
  
  // بررسی وجود خطا و همچنین بررسی اینکه آیا سال هدف از قبل وجود دارد
  useEffect(() => {
    if (accounts.length === 0) {
      setLocalError('هیچ حسابی برای انتقال وجود ندارد');
    } else if (totalAssets === 0 && totalLiabilities === 0 && totalEquity === 0) {
      setLocalError('مانده حساب‌ها صفر است');
    } else {
      setLocalError(null);
    }
    
    // بررسی خطای خاص "سال مالی قبلاً تعریف شده است"
    if (error && error.includes('قبلاً تعریف شده است')) {
      // اگر سال قبلاً تعریف شده، یعنی ایجاد موفق بوده
      setCreationSuccess(true);
      if (onSuccess) onSuccess(true);
    }
  }, [accounts, totalAssets, totalLiabilities, totalEquity, error, onSuccess]);
  
  // هماهنگ‌سازی با props والد
  useEffect(() => {
    if (fiscalYearCreated && !creationSuccess) {
      setCreationSuccess(true);
    }
  }, [fiscalYearCreated, creationSuccess]);
  
  const handleCreateClick = async () => {
    if (onCreateYear) {
      setIsProcessing(true);
      try {
        const result = await onCreateYear({
          startDate,
          endDate,
          summary: {
            totalAssets,
            totalLiabilities,
            totalEquity,
            retainedEarnings,
            accounts: {
              assets: regularAssets.length,
              contraAssets: contraAssets.length,
              liabilities: liabilities.length,
              equity: equityAccount ? 1 : 0
            }
          }
        });
        
        // اگر ایجاد با موفقیت انجام شد
        if (result && result.success) {
          setCreationSuccess(true);
          if (onSuccess) onSuccess(true);
          console.log('✅ سال مالی با موفقیت ایجاد شد:', result);
        } else {
          // اگر خطای تکراری بودن دریافت شد
          if (result?.error?.includes('قبلاً تعریف شده است') || error?.includes('قبلاً تعریف شده است')) {
            setCreationSuccess(true);
            if (onSuccess) onSuccess(true);
            console.log('ℹ️ سال مالی از قبل وجود دارد، به مرحله بعد می‌رویم');
          } else {
            console.error('❌ خطا در ایجاد سال مالی:', result?.error || 'خطای ناشناخته');
          }
        }
      } catch (err) {
        console.error('❌ خطا در ایجاد سال مالی:', err);
        // اگر خطای تکراری بودن باشد
        if (err.message?.includes('قبلاً تعریف شده است') || err.toString().includes('قبلاً تعریف شده است')) {
          setCreationSuccess(true);
          if (onSuccess) onSuccess(true);
        }
      } finally {
        setIsProcessing(false);
      }
    }
  };
  
  // تابع رفتن به مرحله بعد
  const handleNextClick = () => {
    console.log('🔵 کلیک روی دکمه مرحله بعد', {
      onNextExists: !!onNext,
      creationSuccess,
      isCreating,
      isProcessing
    });
    
    if (onNext) {
      if (creationSuccess) {
        console.log('✅ شرط موفقیت برقرار است، انتقال به مرحله بعد');
        onNext();
      } else {
        console.log('⚠️ شرط موفقیت برقرار نیست، اما دکمه فعال است');
        onNext();
      }
    } else {
      console.error('❌ تابع onNext وجود ندارد یا null است');
      alert('خطا: تابع انتقال به مرحله بعد تعریف نشده است');
    }
  };
  
  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-amber-100 p-3 rounded-full">
          <Calendar className="w-8 h-8 text-amber-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">ایجاد سال مالی جدید</h2>
          <p className="text-gray-600">
            سال مالی {targetYear} بر اساس مانده سال {sourceYear} ایجاد خواهد شد
          </p>
        </div>
      </div>
      
      {/* خطاها - به جز خطای تکراری بودن */}
      {(error || localError) && !creationSuccess && !error?.includes('قبلاً تعریف شده است') && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-bold text-red-800">خطا در ایجاد سال مالی</h3>
              <p className="text-red-700 mt-1">{error || localError}</p>
              {localError === 'هیچ حسابی برای انتقال وجود ندارد' && (
                <p className="text-sm text-red-600 mt-2">
                  لطفاً به مرحله قبل بازگشته و حساب‌ها را بررسی کنید.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* پیام اطلاعاتی برای سال تکراری */}
      {error?.includes('قبلاً تعریف شده است') && !creationSuccess && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-bold text-blue-800">ℹ️ سال مالی از قبل وجود دارد</h3>
              <p className="text-blue-700 mt-1">
                سال مالی {targetYear} قبلاً ایجاد شده است. می‌توانید به مرحله بعد بروید.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* پیام موفقیت */}
      {creationSuccess && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-green-600 mt-0.5" />
            <div>
              <h3 className="font-bold text-green-800">✅ سال مالی با موفقیت ایجاد شد</h3>
              <p className="text-green-700 mt-1">
                سال مالی {targetYear} ایجاد شد. اکنون می‌توانید به مرحله بعد بروید.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* خلاصه اطلاعات */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
          <div className="text-sm text-gray-600 mb-2">سال مالی مبدا</div>
          <div className="text-3xl font-bold text-gray-800">{sourceYear}</div>
          <div className="text-xs text-gray-500 mt-2">بسته شده</div>
        </div>
        
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="text-sm text-amber-600 mb-2">سال مالی هدف</div>
          <div className="text-3xl font-bold text-amber-800">{targetYear}</div>
          <div className="text-xs text-amber-600 mt-2">جدید</div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="text-sm text-blue-600 mb-2">تعداد حساب‌های قابل انتقال</div>
          <div className="text-3xl font-bold text-blue-800">{accounts.length}</div>
          <div className="text-xs text-blue-600 mt-2">
            {regularAssets.length} دارایی • {contraAssets.length} کاهنده • {liabilities.length} بدهی • {equityAccount ? 1 : 0} سرمایه
          </div>
        </div>
      </div>
      
      {/* تنظیمات سال مالی جدید */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4">📅 تنظیمات سال مالی جدید</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              تاریخ شروع
            </label>
            <input
              type="text"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              placeholder="مثال: 1405/01/01"
              disabled={isCreating || creationSuccess}
            />
            <p className="text-xs text-gray-500 mt-2">
              تاریخ شروع سال مالی جدید
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              تاریخ پایان
            </label>
            <input
              type="text"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              placeholder="مثال: 1405/12/29"
              disabled={isCreating || creationSuccess}
            />
            <p className="text-xs text-gray-500 mt-2">
              تاریخ پایان سال مالی جدید
            </p>
          </div>
        </div>
      </div>
      
      {/* خلاصه مانده‌ها */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 mb-8">
        <h3 className="text-lg font-bold text-amber-800 mb-4">💰 خلاصه مانده حساب‌ها</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-white p-4 rounded-lg border border-amber-100">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-amber-700">دارایی‌ها</span>
            </div>
            <div className="text-xl font-bold text-blue-700">
              {formatCurrency(totalAssets)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {regularAssets.length} حساب بدهکار
              {contraAssets.length > 0 && ` • ${contraAssets.length} کاهنده`}
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-amber-100">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-amber-700">بدهی‌ها</span>
            </div>
            <div className="text-xl font-bold text-purple-700">
              {formatCurrency(totalLiabilities)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {liabilities.length} حساب بستانکار
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-amber-100">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-sm text-amber-700">سرمایه</span>
            </div>
            <div className="text-xl font-bold text-green-700">
              {formatCurrency(totalEquity)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {equityAccount ? '1 حساب' : '0 حساب'}
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-amber-100">
            <div className="flex items-center gap-2 mb-2">
              <Scale className="w-4 h-4 text-amber-600" />
              <span className="text-sm text-amber-700">سود انباشته</span>
            </div>
            <div className="text-xl font-bold text-amber-700">
              {formatCurrency(retainedEarnings)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
برای تکمیل معادله
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-amber-100">
          <div className="flex items-center justify-between">
            <span className="text-amber-700 font-medium">معادله حسابداری:</span>
            <span className={`font-bold ${isBalanced ? 'text-green-600' : 'text-amber-600'}`}>
              {formatCurrency(totalAssets)} = {formatCurrency(totalLiabilities)} + {formatCurrency(totalEquity)} + {formatCurrency(retainedEarnings)}
            </span>
          </div>
          {!isBalanced && (
            <div className="mt-2 text-xs text-amber-600">
              ⚠️ سود انباشته برای برقراری معادله اضافه خواهد شد
            </div>
          )}
        </div>
      </div>
      
      {/* دکمه‌های عملیات */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <button
          onClick={onBack}
          disabled={isCreating || isProcessing}
          className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl font-medium transition-colors disabled:opacity-50"
        >
          <ChevronRight className="w-5 h-5" />
          مرحله قبل
        </button>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleCreateClick}
            disabled={isCreating || isProcessing || accounts.length === 0 || creationSuccess}
            className={`flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-medium transition-all ${
              isCreating || isProcessing || accounts.length === 0 || creationSuccess
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            {isCreating || isProcessing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                در حال ایجاد سال مالی...
              </>
            ) : creationSuccess ? (
              <>
                <CheckCircle className="w-5 h-5" />
                ایجاد شد
              </>
            ) : (
              <>
                <Calendar className="w-5 h-5" />
                ایجاد سال مالی {targetYear}
              </>
            )}
          </button>
          
          <button
            onClick={handleNextClick}
            disabled={!creationSuccess || isCreating || isProcessing}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${
              creationSuccess && !isCreating && !isProcessing
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <CheckCircle className="w-5 h-5" />
            مرحله بعد: ایجاد سند افتتاحیه
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* پیغام راهنما */}
      {accounts.length > 0 && totalAssets > 0 && !creationSuccess && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-800">
            <span className="font-bold">اطلاعات انتقال:</span> {regularAssets.length} حساب دارایی، {liabilities.length} حساب بدهی و {equityAccount ? 1 : 0} حساب سرمایه به سال {targetYear} منتقل خواهند شد.
            {retainedEarnings !== 0 && ` مبلغ ${formatCurrency(retainedEarnings)} به عنوان سود انباشته به سرمایه اضافه می‌شود.`}
          </p>
        </div>
      )}
    </div>
  );
};

export default Step3CreateNewFiscalYear;