import React from 'react';
import { 
  FileText, 
  ChevronRight, 
  ChevronLeft, 
  AlertCircle, 
  RefreshCw,
  Scale,
  TrendingUp,
  TrendingDown,
  DollarSign
} from 'lucide-react';

const formatCurrency = (value) => {
  if (value === undefined || value === null || isNaN(value)) return '۰ ریال';
  const absoluteValue = Math.abs(Math.round(value));
  return new Intl.NumberFormat('fa-IR').format(absoluteValue) + ' ریال';
};

const Step2CheckPermanentAccounts = ({ 
  loading, 
  error, 
  sourceYear,
  targetYear,
  accounts = [], 
  summary,
  onBack, 
  onNext, 
  onRetry 
}) => {
  
  // ==================== توابع کمکی ====================
  
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
    if (type === 'CurrentAssets' || type === 'NonCurrentAssets' || type === 'Assets') {
      return 'Assets';
    }
    
    // تشخیص بدهی‌ها
    if (type === 'CurrentDebit' || type === 'NonCurrentDebit' || type === 'Liabilities') {
      return 'Liabilities';
    }
    
    // تشخیص سرمایه - فقط حساب 311001
    if (accountCode === '311001' || type === 'Equity' || type === 'CAPITAL') {
      return 'Equity';
    }
    
    return 'Other';
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
   * محاسبه مجموع سرمایه (فقط حساب 311001)
   */
  const calculateTotalEquity = () => {
    // فقط حساب سرمایه 311001
    const equityAccount = accounts.find(acc => {
      const code = (acc.AccountCode || acc.accountCode || '').toString();
      return code === '311001';
    });
    
    return equityAccount ? Math.abs(equityAccount.Balance || equityAccount.balance || 0) : 0;
  };
  
  /**
   * دریافت مانده صحیح حساب
   */
  const getAccountBalanceInfo = (account) => {
    const category = getAccountCategory(account);
    const rawBalance = Math.abs(account.Balance || account.balance || 0);
    
    if (category === 'Assets') {
      return {
        balance: rawBalance,
        displayBalance: formatCurrency(rawBalance),
        side: 'بدهکار',
        sideClass: 'text-blue-700',
        effect: `+${formatCurrency(rawBalance)}`,
        effectClass: 'text-green-600'
      };
    }
    
    if (category === 'ContraAssets') {
      return {
        balance: rawBalance,
        displayBalance: formatCurrency(rawBalance),
        side: 'بستانکار (کاهنده)',
        sideClass: 'text-red-700',
        effect: `-${formatCurrency(rawBalance)}`,
        effectClass: 'text-red-600'
      };
    }
    
    if (category === 'Liabilities') {
      return {
        balance: rawBalance,
        displayBalance: formatCurrency(rawBalance),
        side: 'بستانکار',
        sideClass: 'text-purple-700',
        effect: `+${formatCurrency(rawBalance)}`,
        effectClass: 'text-green-600'
      };
    }
    
    if (category === 'Equity') {
      return {
        balance: rawBalance,
        displayBalance: formatCurrency(rawBalance),
        side: 'بستانکار',
        sideClass: 'text-green-700',
        effect: `+${formatCurrency(rawBalance)}`,
        effectClass: 'text-green-600'
      };
    }
    
    return {
      balance: 0,
      displayBalance: '۰ ریال',
      side: 'نامشخص',
      sideClass: 'text-gray-700',
      effect: '۰ ریال',
      effectClass: 'text-gray-600'
    };
  };
  
  /**
   * محاسبه سود/زیان انباشته (مقدار استهلاك)
   */
  const calculateRetainedEarnings = () => {
    const totalAssets = calculateNetAssets();
    const totalLiabilities = calculateTotalLiabilities();
    const totalEquity = calculateTotalEquity();
    
    // دارایی‌ها - بدهی‌ها = حقوق صاحبان سهام
    const calculatedEquity = totalAssets - totalLiabilities;
    
    // تفاوت با سرمایه ثبت شده = سود/زیان انباشته
    return calculatedEquity - totalEquity;
  };
  
  // ==================== محاسبات اصلی ====================
  
  // دسته‌بندی حساب‌ها
  const allAssets = accounts.filter(acc => {
    const cat = getAccountCategory(acc);
    return cat === 'Assets' || cat === 'ContraAssets';
  });
  
  const contraAssets = accounts.filter(acc => getAccountCategory(acc) === 'ContraAssets');
  const regularAssets = accounts.filter(acc => getAccountCategory(acc) === 'Assets');
  const liabilities = accounts.filter(acc => getAccountCategory(acc) === 'Liabilities');
  const equityAccount = accounts.find(acc => {
    const code = (acc.AccountCode || acc.accountCode || '').toString();
    return code === '311001';
  });
  
  // محاسبه مجموع‌ها
  const totalAssets = calculateNetAssets();
  const totalLiabilities = calculateTotalLiabilities();
  const totalEquity = calculateTotalEquity();
  const retainedEarnings = calculateRetainedEarnings();
  const totalLiabilitiesEquity = totalLiabilities + totalEquity + retainedEarnings;
  const difference = Math.abs(totalAssets - totalLiabilitiesEquity);
  const isBalanced = Math.abs(totalAssets - totalLiabilitiesEquity) < 0.01;
  
  console.log('📊 خلاصه محاسبات:', {
    totalAssets,
    totalLiabilities,
    totalEquity,
    retainedEarnings,
    totalLiabilitiesEquity,
    difference,
    isBalanced
  });
  
  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-amber-100 p-3 rounded-full">
          <FileText className="w-8 h-8 text-amber-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">بررسی مانده حساب‌های دائمی</h2>
          <p className="text-gray-600">
            مانده حساب‌های دارایی، بدهی و سرمایه سال {sourceYear} برای انتقال به سال {targetYear}
          </p>
        </div>
      </div>
      
      {loading ? (
        <div className="py-12 text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-amber-600 mx-auto mb-4" />
          <p className="text-gray-600">در حال دریافت مانده حساب‌های دائمی...</p>
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
          {/* کارت‌های خلاصه */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* دارایی‌ها */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-sm font-medium text-blue-800">مجموع دارایی‌ها (خالص)</div>
              </div>
              <div className="text-2xl font-bold text-blue-900">
                {formatCurrency(totalAssets)}
              </div>
              <div className="text-xs text-blue-700 mt-2">
                {regularAssets.length} حساب بدهکار • {contraAssets.length} حساب کاهنده
              </div>
            </div>
            
            {/* بدهی‌ها */}
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <TrendingDown className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-sm font-medium text-purple-800">مجموع بدهی‌ها</div>
              </div>
              <div className="text-2xl font-bold text-purple-900">
                {formatCurrency(totalLiabilities)}
              </div>
              <div className="text-xs text-purple-700 mt-2">
                {liabilities.length} حساب بستانکار
              </div>
            </div>
            
            {/* سرمایه */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-sm font-medium text-green-800">سرمایه</div>
              </div>
              <div className="text-2xl font-bold text-green-900">
                {formatCurrency(totalEquity)}
              </div>
              <div className="text-xs text-green-700 mt-2">
                1 حساب (311001)
              </div>
            </div>
            
            {/* معادله حسابداری */}
            <div className={`border rounded-xl p-6 ${
              isBalanced ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${
                  isBalanced ? 'bg-green-100' : 'bg-yellow-100'
                }`}>
                  <Scale className={`w-5 h-5 ${
                    isBalanced ? 'text-green-600' : 'text-yellow-600'
                  }`} />
                </div>
                <div className={`text-sm font-medium ${
                  isBalanced ? 'text-green-800' : 'text-yellow-800'
                }`}>
                  معادله حسابداری
                </div>
              </div>
              <div className="text-xs text-gray-600 mb-1">
                {formatCurrency(totalAssets)} = {formatCurrency(totalLiabilities)} + {formatCurrency(totalEquity)} + {formatCurrency(retainedEarnings)}
              </div>
              <div className={`text-sm font-bold ${
                isBalanced ? 'text-green-900' : 'text-yellow-900'
              }`}>
                {isBalanced ? '✅ متوازن' : '⚠️ نیاز به سود/زیان انباشته'}
              </div>
            </div>
          </div>
          
          {/* توضیح سود/زیان انباشته */}
          {!isBalanced && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-bold text-yellow-800">📊 سود/زیان انباشته</h3>
                  <p className="text-yellow-700 mt-1">
                    برای برقراری معادله حسابداری، مبلغ {formatCurrency(retainedEarnings)} به عنوان سود/زیان انباشته به سرمایه اضافه می‌شود.
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-lg">
                      <div className="text-xs text-gray-600">دارایی‌ها</div>
                      <div className="font-bold text-blue-700">{formatCurrency(totalAssets)}</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <div className="text-xs text-gray-600">بدهی‌ها + سرمایه</div>
                      <div className="font-bold text-purple-700">{formatCurrency(totalLiabilities + totalEquity)}</div>
                    </div>
                  </div>
                  <div className="mt-3 bg-yellow-100 p-3 rounded-lg">
                    <div className="text-sm font-bold text-yellow-800">
                      اختلاف (سود/زیان انباشته): {formatCurrency(retainedEarnings)}
                    </div>
                    <p className="text-xs text-yellow-700 mt-1">
                      این مبلغ مربوط به استهلاك انباشته و سایر تعدیلات است که در سود و زیان سال جاری لحاظ شده.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* نمایش حساب‌ها */}
          {accounts.length > 0 ? (
            <div className="mb-8 space-y-6">
              
              {/* ========== دارایی‌ها ========== */}
              {allAssets.length > 0 && (
                <div className="border border-blue-200 rounded-xl overflow-hidden">
                  <div className="bg-blue-100 p-4">
                    <h3 className="font-bold text-blue-800">دارایی‌ها (Assets)</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      {regularAssets.length} حساب با مانده بدهکار • {contraAssets.length} حساب کاهنده دارایی
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="p-3 text-right text-xs font-medium text-gray-500">کد حساب</th>
                          <th className="p-3 text-right text-xs font-medium text-gray-500">نام حساب</th>
                          <th className="p-3 text-right text-xs font-medium text-gray-500">ماهیت</th>
                          <th className="p-3 text-right text-xs font-medium text-gray-500">مانده</th>
                          <th className="p-3 text-right text-xs font-medium text-gray-500">نوع عملیات</th>
                          <th className="p-3 text-right text-xs font-medium text-gray-500">تأثیر در افتتاحیه</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {/* دارایی‌های معمولی */}
                        {regularAssets.map((account, index) => {
                          const info = getAccountBalanceInfo(account);
                          return (
                            <tr key={`asset-${index}`} className="hover:bg-blue-50">
                              <td className="p-3 font-mono text-sm">{account.AccountCode || account.accountCode}</td>
                              <td className="p-3 font-medium">{account.TitleFa || account.titleFa}</td>
                              <td className="p-3">
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                  {account.Nature || account.nature || 'بدهکار'}
                                </span>
                              </td>
                              <td className={`p-3 font-bold ${info.sideClass}`}>
                                {info.displayBalance}
                              </td>
                              <td className="p-3">
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                  {info.side}
                                </span>
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-1 rounded-full text-xs ${info.effectClass} bg-green-50`}>
                                  {info.effect}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                        
                        {/* حساب‌های کاهنده */}
                        {contraAssets.map((account, index) => {
                          const info = getAccountBalanceInfo(account);
                          return (
                            <tr key={`contra-${index}`} className="hover:bg-red-50 bg-red-50/30">
                              <td className="p-3 font-mono text-sm">{account.AccountCode || account.accountCode}</td>
                              <td className="p-3 font-medium">
                                {account.TitleFa || account.titleFa}
                                <span className="mr-2 px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs">
                                  کاهنده
                                </span>
                              </td>
                              <td className="p-3">
                                <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                                  {account.Nature || account.nature || 'بستانکار'}
                                </span>
                              </td>
                              <td className={`p-3 font-bold ${info.sideClass}`}>
                                {info.displayBalance}
                              </td>
                              <td className="p-3">
                                <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                                  {info.side}
                                </span>
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-1 rounded-full text-xs ${info.effectClass} bg-red-50`}>
                                  {info.effect}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                        
                        {/* جمع خالص */}
                        <tr className="bg-blue-100 font-bold">
                          <td colSpan="5" className="p-3 text-left">
                            جمع خالص دارایی‌ها:
                          </td>
                          <td className="p-3 text-blue-800">
                            {formatCurrency(totalAssets)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {/* ========== بدهی‌ها ========== */}
              {liabilities.length > 0 && (
                <div className="border border-purple-200 rounded-xl overflow-hidden">
                  <div className="bg-purple-100 p-4">
                    <h3 className="font-bold text-purple-800">بدهی‌ها (Liabilities)</h3>
                    <p className="text-sm text-purple-700 mt-1">
                      {liabilities.length} حساب با مانده بستانکار
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="p-3 text-right text-xs font-medium text-gray-500">کد حساب</th>
                          <th className="p-3 text-right text-xs font-medium text-gray-500">نام حساب</th>
                          <th className="p-3 text-right text-xs font-medium text-gray-500">ماهیت</th>
                          <th className="p-3 text-right text-xs font-medium text-gray-500">مانده</th>
                          <th className="p-3 text-right text-xs font-medium text-gray-500">نوع عملیات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {liabilities.map((account, index) => {
                          const info = getAccountBalanceInfo(account);
                          return (
                            <tr key={`liab-${index}`} className="hover:bg-purple-50">
                              <td className="p-3 font-mono text-sm">{account.AccountCode || account.accountCode}</td>
                              <td className="p-3 font-medium">{account.TitleFa || account.titleFa}</td>
                              <td className="p-3">
                                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                                  {account.Nature || account.nature || 'بستانکار'}
                                </span>
                              </td>
                              <td className={`p-3 font-bold ${info.sideClass}`}>
                                {info.displayBalance}
                              </td>
                              <td className="p-3">
                                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                                  {info.side}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                        <tr className="bg-purple-100 font-bold">
                          <td colSpan="4" className="p-3 text-left">مجموع بدهی‌ها:</td>
                          <td className="p-3 text-purple-800">{formatCurrency(totalLiabilities)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {/* ========== سرمایه ========== */}
              {equityAccount && (
                <div className="border border-green-200 rounded-xl overflow-hidden">
                  <div className="bg-green-100 p-4">
                    <h3 className="font-bold text-green-800">سرمایه (Equity)</h3>
                    <p className="text-sm text-green-700 mt-1">
                      1 حساب کل با مانده بستانکار
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="p-3 text-right text-xs font-medium text-gray-500">کد حساب</th>
                          <th className="p-3 text-right text-xs font-medium text-gray-500">نام حساب</th>
                          <th className="p-3 text-right text-xs font-medium text-gray-500">ماهیت</th>
                          <th className="p-3 text-right text-xs font-medium text-gray-500">مانده</th>
                          <th className="p-3 text-right text-xs font-medium text-gray-500">نوع عملیات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        <tr className="hover:bg-green-50">
                          <td className="p-3 font-mono text-sm">{equityAccount.AccountCode || equityAccount.accountCode}</td>
                          <td className="p-3 font-medium">{equityAccount.TitleFa || equityAccount.titleFa}</td>
                          <td className="p-3">
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                              {equityAccount.Nature || equityAccount.nature || 'بستانکار'}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-green-700">
                            {formatCurrency(totalEquity)}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                              بستانکار
                            </span>
                          </td>
                        </tr>
                        <tr className="bg-green-100 font-bold">
                          <td colSpan="4" className="p-3 text-left">مجموع سرمایه:</td>
                          <td className="p-3 text-green-800">{formatCurrency(totalEquity)}</td>
                        </tr>
                      </tbody>
                    </table>
                    
                    {/* سود/زیان انباشته */}
                    {Math.abs(retainedEarnings) > 0 && (
                      <div className="bg-yellow-50 p-4 border-t border-green-200">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-yellow-800">سود/زیان انباشته (پیشنهادی):</span>
                          <span className="font-bold text-yellow-800">{formatCurrency(retainedEarnings)}</span>
                        </div>
                        <p className="text-xs text-yellow-700 mt-2">
                          این مبلغ برای تکمیل معادله حسابداری به سرمایه اضافه می‌شود و در سند افتتاحیه به عنوان "سود انباشته" ثبت می‌گردد.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 mb-8 text-center">
              <FileText className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-yellow-800 mb-2">هیچ حساب دائمی با مانده یافت نشد</h3>
              <p className="text-yellow-700">
                برای سال مالی {sourceYear} هیچ حساب دارایی، بدهی یا سرمایه‌ای با مانده وجود ندارد.
              </p>
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
              disabled={accounts.length === 0}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${
                accounts.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-amber-600 hover:bg-amber-700 text-white'
              }`}
            >
              ایجاد سال مالی جدید
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Step2CheckPermanentAccounts;