import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  ChevronRight, 
  AlertCircle, 
  RefreshCw,
  CheckCircle,
  Download,
  DollarSign
} from 'lucide-react';

const formatCurrency = (value) => {
  if (value === undefined || value === null || isNaN(value)) return '۰ ریال';
  const absoluteValue = Math.abs(Math.round(value));
  return new Intl.NumberFormat('fa-IR').format(absoluteValue) + ' ریال';
};

const Step4CreateOpeningEntry = ({ 
  sourceYear,
  targetYear,
  accounts = [],
  summary,
  isCreating,
  error,
  success,
  onBack,
  onCreateEntry,
  onComplete
}) => {
  const [confirmed, setConfirmed] = useState(false);
  
  // محاسبه مانده‌ها از accounts دریافتی
  const calculateBalances = () => {
    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;
    const assetsList = [];
    const contraAssetsList = [];
    const liabilitiesList = [];
    let equityAccount = null;
    
    console.log('📊 حساب‌های دریافتی در مرحله 4:', accounts.length);
    
    accounts.forEach(acc => {
      const accountCode = acc.AccountCode?.toString() || '';
      const type = acc.Type || '';
      const nature = acc.Nature || '';
      const title = acc.TitleFa || '';
      const balance = Math.abs(acc.Balance || 0);
      
      console.log(`   حساب: ${accountCode} - ${title} - مانده: ${balance} - نوع: ${type} - ماهیت: ${nature}`);
      
      // تشخیص حساب کاهنده دارایی
      const isContraAsset = 
        accountCode.startsWith('121') || 
        accountCode.startsWith('1211') ||
        (nature === 'بستانكار' && (type === 'Assets' || type === 'CurrentAssets' || type === 'NonCurrentAssets'));
      
      if (isContraAsset) {
        totalAssets -= balance;
        contraAssetsList.push({ ...acc, calculatedBalance: balance });
      } 
      else if (type === 'CurrentAssets' || type === 'NonCurrentAssets' || type === 'Assets') {
        totalAssets += balance;
        assetsList.push({ ...acc, calculatedBalance: balance });
      }
      else if (type === 'CurrentDebit' || type === 'NonCurrentDebit' || type === 'Liabilities') {
        totalLiabilities += balance;
        liabilitiesList.push({ ...acc, calculatedBalance: balance });
      }
      else if (type === 'Equity' || accountCode === '311001') {
        totalEquity += balance;
        equityAccount = { ...acc, calculatedBalance: balance };
      }
    });
    
    const retainedEarnings = totalAssets - totalLiabilities - totalEquity;
    const totalCredit = totalLiabilities + totalEquity + Math.abs(retainedEarnings);
    
    console.log('📊 نتایج محاسبات:');
    console.log(`   کل دارایی‌ها: ${totalAssets}`);
    console.log(`   کل بدهی‌ها: ${totalLiabilities}`);
    console.log(`   کل سرمایه: ${totalEquity}`);
    console.log(`   سود انباشته: ${retainedEarnings}`);
    console.log(`   کل بستانکار: ${totalCredit}`);
    console.log(`   متوازن: ${Math.abs(totalAssets - totalCredit) < 0.01}`);
    
    return {
      assets: assetsList,
      contraAssets: contraAssetsList,
      liabilities: liabilitiesList,
      equityAccount,
      retainedEarnings,
      totalAssets,
      totalLiabilities,
      totalEquity,
      totalCredit,
      isBalanced: Math.abs(totalAssets - totalCredit) < 0.01
    };
  };
  
  const {
    assets,
    contraAssets,
    liabilities,
    equityAccount,
    retainedEarnings,
    totalAssets,
    totalLiabilities,
    totalEquity,
    totalCredit,
    isBalanced
  } = calculateBalances();
  
  const handleCreateEntry = () => {
    if (!onCreateEntry) return;
    
    // ایجاد آرایه خطوط سند
    const journalLines = [];
    
    // دارایی‌های معمولی (بدهکار)
    assets.forEach(acc => {
      journalLines.push({
        AccountCode: acc.AccountCode,
        DebitAmount: acc.calculatedBalance,
        CreditAmount: 0,
        Description: `مانده افتتاحیه ${acc.TitleFa}`
      });
    });
    
    // حساب‌های کاهنده دارایی (بستانکار)
    contraAssets.forEach(acc => {
      journalLines.push({
        AccountCode: acc.AccountCode,
        DebitAmount: 0,
        CreditAmount: acc.calculatedBalance,
        Description: `مانده افتتاحیه ${acc.TitleFa} (کاهنده دارایی)`
      });
    });
    
    // بدهی‌ها (بستانکار)
    liabilities.forEach(acc => {
      journalLines.push({
        AccountCode: acc.AccountCode,
        DebitAmount: 0,
        CreditAmount: acc.calculatedBalance,
        Description: `مانده افتتاحیه ${acc.TitleFa}`
      });
    });
    
    // سرمایه (بستانکار)
    if (equityAccount) {
      journalLines.push({
        AccountCode: equityAccount.AccountCode,
        DebitAmount: 0,
        CreditAmount: equityAccount.calculatedBalance,
        Description: `مانده افتتاحیه ${equityAccount.TitleFa}`
      });
    }
    
    // سود انباشته (بستانکار)
    if (Math.abs(retainedEarnings) > 0) {
      journalLines.push({
        AccountCode: '311002',
        DebitAmount: 0,
        CreditAmount: Math.abs(retainedEarnings),
        Description: 'سود انباشته انتقالی از سال قبل'
      });
    }
    
    // محاسبه مجموع‌ها برای لاگ
    const finalTotalDebit = journalLines.reduce((sum, line) => sum + line.DebitAmount, 0);
    const finalTotalCredit = journalLines.reduce((sum, line) => sum + line.CreditAmount, 0);
    
    console.log('🚀 ارسال به سرور:');
    console.log('   تعداد خطوط:', journalLines.length);
    console.log('   کل بدهکار:', finalTotalDebit);
    console.log('   کل بستانکار:', finalTotalCredit);
    console.log('   نمونه خط:', journalLines[0]);
    
    // ارسال به والد
    onCreateEntry({
      sourceYear,
      targetYear,
      accounts: journalLines,
      summary: {
        totalAssets: finalTotalDebit,
        totalLiabilities,
        totalEquity,
        retainedEarnings: Math.abs(retainedEarnings),
        totalCredit: finalTotalCredit,
        isBalanced
      }
    });
  };
  
  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-amber-100 p-3 rounded-full">
          <FileText className="w-8 h-8 text-amber-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">ایجاد سند افتتاحیه</h2>
          <p className="text-gray-600">
            ثبت سند حسابداری برای انتقال مانده حساب‌ها از سال {sourceYear} به سال {targetYear}
          </p>
        </div>
      </div>
      
      {(error) && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-bold text-red-800">خطا در ایجاد سند افتتاحیه</h3>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-green-600 mt-0.5" />
            <div>
              <h3 className="font-bold text-green-800">✅ سند افتتاحیه با موفقیت ایجاد شد</h3>
              <p className="text-green-700 mt-1">
                سال مالی {targetYear} آماده استفاده است.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* خلاصه سند */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4">📋 خلاصه سند افتتاحیه</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">شرح سند</div>
            <div className="font-bold text-gray-800">
              افتتاح سال مالی {targetYear}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              بر اساس مانده سال {sourceYear}
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">تاریخ سند</div>
            <div className="font-bold text-gray-800">
              {new Date().toLocaleDateString('fa-IR')}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              اولین روز سال مالی {targetYear}
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">مجموع بدهکار:</span>
            <span className="text-lg font-bold text-blue-700">
              {formatCurrency(totalAssets)}
            </span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">مجموع بستانکار:</span>
            <span className="text-lg font-bold text-green-700">
              {formatCurrency(totalCredit)}
            </span>
          </div>
          
          {Math.abs(retainedEarnings) > 0 && (
            <div className="flex items-center justify-between mb-2 pt-2 border-t border-gray-200">
              <span className="text-sm font-medium text-amber-700">سود انباشته (اضافه شده):</span>
              <span className="text-lg font-bold text-amber-700">
                {formatCurrency(Math.abs(retainedEarnings))}
              </span>
            </div>
          )}
          
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <span className="text-sm font-medium text-gray-700">وضعیت توازن:</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              isBalanced
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {isBalanced ? '✅ متوازن' : '❌ نامتوازن'}
            </span>
          </div>
        </div>
        
        {/* نمایش دارایی‌ها */}
        {(assets.length > 0 || contraAssets.length > 0) && (
          <div className="mb-4">
            <div className="bg-blue-50 p-3 rounded-t-lg border border-blue-200">
              <span className="font-medium text-blue-800">بدهکار (دارایی‌ها)</span>
            </div>
            <div className="border-x border-b border-gray-200 rounded-b-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2 text-right text-xs">کد حساب</th>
                    <th className="p-2 text-right text-xs">نام حساب</th>
                    <th className="p-2 text-right text-xs">مبلغ (ریال)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {assets.map((acc, idx) => (
                    <tr key={`asset-${idx}`} className="hover:bg-blue-50">
                      <td className="p-2 font-mono text-sm">{acc.AccountCode}</td>
                      <td className="p-2 text-sm">{acc.TitleFa}</td>
                      <td className="p-2 text-sm font-bold text-blue-700">
                        {formatCurrency(acc.calculatedBalance)}
                      </td>
                    </tr>
                  ))}
                  {contraAssets.map((acc, idx) => (
                    <tr key={`contra-${idx}`} className="bg-red-50">
                      <td className="p-2 font-mono text-sm">{acc.AccountCode}</td>
                      <td className="p-2 text-sm">
                        {acc.TitleFa}
                        <span className="mr-2 px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs">
                          کاهنده
                        </span>
                      </td>
                      <td className="p-2 text-sm font-bold text-red-700">
                        ({formatCurrency(acc.calculatedBalance)})
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-blue-100 font-bold">
                    <td colSpan="2" className="p-2 text-left">مجموع خالص دارایی‌ها:</td>
                    <td className="p-2 text-blue-800">{formatCurrency(totalAssets)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* نمایش بدهی‌ها و سرمایه */}
        {(liabilities.length > 0 || equityAccount) && (
          <div className="mb-4">
            <div className="bg-green-50 p-3 rounded-t-lg border border-green-200">
              <span className="font-medium text-green-800">بستانکار (بدهی‌ها، سرمایه و سود انباشته)</span>
            </div>
            <div className="border-x border-b border-gray-200 rounded-b-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2 text-right text-xs">کد حساب</th>
                    <th className="p-2 text-right text-xs">نام حساب</th>
                    <th className="p-2 text-right text-xs">مبلغ (ریال)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {liabilities.map((acc, idx) => (
                    <tr key={`liability-${idx}`} className="hover:bg-green-50">
                      <td className="p-2 font-mono text-sm">{acc.AccountCode}</td>
                      <td className="p-2 text-sm">{acc.TitleFa}</td>
                      <td className="p-2 text-sm font-bold text-green-700">
                        {formatCurrency(acc.calculatedBalance)}
                      </td>
                    </tr>
                  ))}
                  {equityAccount && (
                    <tr className="hover:bg-green-50">
                      <td className="p-2 font-mono text-sm">{equityAccount.AccountCode}</td>
                      <td className="p-2 text-sm">{equityAccount.TitleFa}</td>
                      <td className="p-2 text-sm font-bold text-green-700">
                        {formatCurrency(equityAccount.calculatedBalance)}
                      </td>
                    </tr>
                  )}
                  {Math.abs(retainedEarnings) > 0 && (
                    <tr className="bg-amber-50">
                      <td className="p-2 font-mono text-sm">311002</td>
                      <td className="p-2 text-sm">
                        سود انباشته
                        <span className="mr-2 px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs">
                          سود انباشته
                        </span>
                      </td>
                      <td className="p-2 text-sm font-bold text-amber-700">
                        {formatCurrency(Math.abs(retainedEarnings))}
                      </td>
                    </tr>
                  )}
                  <tr className="bg-green-100 font-bold">
                    <td colSpan="2" className="p-2 text-left">مجموع بستانکار:</td>
                    <td className="p-2 text-green-800">{formatCurrency(totalCredit)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      
      {/* تأیید نهایی */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-amber-600 mt-0.5" />
          <div>
            <h3 className="font-bold text-amber-800">⚠️ تأیید نهایی</h3>
            <p className="text-amber-700 mt-1">
              با ایجاد سند افتتاحیه، مانده حساب‌های دائمی از سال {sourceYear} به سال {targetYear} منتقل می‌شود.
              این عملیات غیرقابل بازگشت است.
            </p>
            
            {Math.abs(retainedEarnings) > 0 && (
              <div className="mt-4 bg-white p-4 rounded-lg border border-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-amber-600" />
                  <span className="font-bold text-amber-800">سود انباشته</span>
                </div>
                <p className="text-sm text-amber-700">
                  مبلغ <span className="font-bold">{formatCurrency(Math.abs(retainedEarnings))}</span> به عنوان سود انباشته اضافه خواهد شد.
                </p>
              </div>
            )}
            
            <div className="mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="w-5 h-5 text-amber-600 rounded border-gray-300 focus:ring-amber-500"
                  disabled={isCreating || success}
                />
                <span className="text-sm text-amber-800">
                  مطمئن هستم و می‌خواهم سند افتتاحیه ایجاد شود
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>
      
      {/* دکمه‌های عملیات */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <button
          onClick={onBack}
          disabled={isCreating || success}
          className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl font-medium transition-colors disabled:opacity-50"
        >
          <ChevronRight className="w-5 h-5" />
          مرحله قبل
        </button>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center justify-center gap-2 px-6 py-3 border border-blue-300 text-blue-600 hover:bg-blue-50 rounded-xl font-medium transition-colors"
          >
            <Download className="w-5 h-5" />
            چاپ گزارش
          </button>
          
          {!success ? (
            <button
              onClick={handleCreateEntry}
              disabled={isCreating || !confirmed || !isBalanced}
              className={`flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-medium transition-all ${
                isCreating || !confirmed || !isBalanced
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg hover:shadow-xl'
              }`}
            >
              {isCreating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  در حال ایجاد سند...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  ایجاد سند افتتاحیه
                </>
              )}
            </button>
          ) : (
            <button
              onClick={onComplete}
              className="flex items-center justify-center gap-2 px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors"
            >
              <CheckCircle className="w-5 h-5" />
              تکمیل فرآیند افتتاح
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Step4CreateOpeningEntry;