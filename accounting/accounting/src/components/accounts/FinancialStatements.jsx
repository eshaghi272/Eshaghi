import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileText, 
  Download, 
  Calendar,
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  DollarSign,
  RefreshCw,
  ChevronDown,
  Printer,
  Eye
} from 'lucide-react';

const formatCurrency = (value) => {
  if (value === undefined || value === null || isNaN(value)) return '۰';
  const absoluteValue = Math.abs(Math.round(value));
  return new Intl.NumberFormat('fa-IR').format(absoluteValue);
};

const FinancialStatements = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fiscalYears, setFiscalYears] = useState([]); // آرایه خالی به عنوان پیش‌فرض
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('yearly');
  const [activeTab, setActiveTab] = useState('balance-sheet');
  const [statementData, setStatementData] = useState(null);
  
  // ==================== دریافت سال‌های مالی ====================
  useEffect(() => {
    fetchFiscalYears();
  }, []);
  
  const fetchFiscalYears = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/fiscal-year');
      console.log('✅ پاسخ دریافتی از سرور:', response.data);
      
      // بررسی اینکه response.data آرایه است یا خیر
      let yearsData = [];
      
      if (Array.isArray(response.data)) {
        yearsData = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        yearsData = response.data.data;
      } else if (response.data && typeof response.data === 'object') {
        // اگر آبجکت است، به آرایه تبدیل کن
        yearsData = Object.values(response.data);
      }
      
      console.log('📊 سال‌های مالی پردازش شده:', yearsData);
      setFiscalYears(yearsData);
      
      if (yearsData.length > 0) {
        // انتخاب سال فعال
        const activeYear = yearsData.find(y => y.IsActive === 1);
        setSelectedYear(activeYear?.YearCode?.toString() || yearsData[0].YearCode?.toString());
      }
    } catch (error) {
      console.error('❌ خطا در دریافت سال‌های مالی:', error);
      setError('خطا در دریافت سال‌های مالی');
    }
  };
  
  // ==================== دریافت داده‌های صورت‌های مالی ====================
  // ==================== دریافت داده‌های صورت‌های مالی ====================
const fetchFinancialStatements = async () => {
  if (!selectedYear) return;
  
  setLoading(true);
  setError(null);
  
  try {
    // ✅ اصلاح آدرس به financialStatements (بدون fetch)
    const response = await axios.get(
      `http://localhost:5000/api/financialStatements/${selectedYear}`,
      { params: { period: selectedPeriod } }
    );
    
    console.log('✅ داده‌های صورت‌های مالی:', response.data);
    
    if (response.data.success) {
      setStatementData(response.data);
    } else {
      setError(response.data.error || 'خطا در دریافت اطلاعات');
    }
  } catch (error) {
    console.error('❌ خطا در دریافت صورت‌های مالی:', error);
    setError(error.response?.data?.error || error.message || 'خطا در دریافت اطلاعات');
  } finally {
    setLoading(false);
  }
    };
    
    
  useEffect(() => {
    if (selectedYear) {
      fetchFinancialStatements();
    }
  }, [selectedYear, selectedPeriod]);
  
  // ==================== رندر ترازنامه ====================
  const renderBalanceSheet = () => {
    if (!statementData?.balanceSheet) {
      return (
        <div className="text-center py-12 text-gray-500">
          اطلاعاتی برای نمایش وجود ندارد
        </div>
      );
    }
    
    const bs = statementData.balanceSheet;
    
    return (
      <div className="space-y-6">
        {/* خلاصه ترازنامه */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-blue-800">مجموع دارایی‌ها</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {formatCurrency(bs.totalAssets)} ریال
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-xl border border-amber-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-amber-600 p-2 rounded-lg">
                <TrendingDown className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-amber-800">مجموع بدهی‌ها</span>
            </div>
            <div className="text-2xl font-bold text-amber-900">
              {formatCurrency(bs.totalLiabilities)} ریال
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-green-600 p-2 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-green-800">حقوق صاحبان سهام</span>
            </div>
            <div className="text-2xl font-bold text-green-900">
              {formatCurrency(bs.totalEquity)} ریال
            </div>
          </div>
        </div>
        
        {/* معادله حسابداری */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <p className="text-center text-gray-700">
            <span className="font-bold text-blue-700">{formatCurrency(bs.totalAssets)} ریال</span>
            <span className="mx-2">=</span>
            <span className="font-bold text-amber-700">{formatCurrency(bs.totalLiabilities)} ریال</span>
            <span className="mx-2">+</span>
            <span className="font-bold text-green-700">{formatCurrency(bs.totalEquity)} ریال</span>
          </p>
        </div>
        
        {/* جدول دارایی‌ها */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4">
            <h3 className="text-lg font-bold text-white">دارایی‌ها (Assets)</h3>
          </div>
          
          <div className="p-4">
            {/* دارایی‌های جاری */}
            {bs.currentAssets && bs.currentAssets.length > 0 && (
              <div className="mb-6">
                <h4 className="font-bold text-gray-700 mb-3 pb-2 border-b border-gray-200">
                  دارایی‌های جاری
                </h4>
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-3 text-right text-sm">کد حساب</th>
                      <th className="p-3 text-right text-sm">شرح</th>
                      <th className="p-3 text-left text-sm">مبلغ (ریال)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {bs.currentAssets.map((item, idx) => (
                      <tr key={idx} className="hover:bg-blue-50">
                        <td className="p-3 font-mono text-sm">{item.code}</td>
                        <td className="p-3 text-sm">{item.title}</td>
                        <td className="p-3 text-left font-bold text-blue-700">
                          {formatCurrency(item.balance)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-blue-100 font-bold">
                      <td colSpan="2" className="p-3 text-left">جمع دارایی‌های جاری</td>
                      <td className="p-3 text-left text-blue-800">
                        {formatCurrency(bs.totalCurrentAssets)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            
            {/* دارایی‌های غیرجاری */}
            {bs.nonCurrentAssets && bs.nonCurrentAssets.length > 0 && (
              <div className="mb-6">
                <h4 className="font-bold text-gray-700 mb-3 pb-2 border-b border-gray-200">
                  دارایی‌های غیرجاری
                </h4>
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-3 text-right text-sm">کد حساب</th>
                      <th className="p-3 text-right text-sm">شرح</th>
                      <th className="p-3 text-left text-sm">مبلغ (ریال)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {bs.nonCurrentAssets.map((item, idx) => (
                      <tr key={idx} className="hover:bg-blue-50">
                        <td className="p-3 font-mono text-sm">{item.code}</td>
                        <td className="p-3 text-sm">{item.title}</td>
                        <td className="p-3 text-left font-bold text-blue-700">
                          {formatCurrency(item.balance)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-blue-100 font-bold">
                      <td colSpan="2" className="p-3 text-left">جمع دارایی‌های غیرجاری</td>
                      <td className="p-3 text-left text-blue-800">
                        {formatCurrency(bs.totalNonCurrentAssets)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            
            {/* استهلاک انباشته */}
            {bs.accumulatedDepreciation && bs.accumulatedDepreciation.length > 0 && (
              <div className="mb-6">
                <h4 className="font-bold text-gray-700 mb-3 pb-2 border-b border-gray-200 text-red-700">
                  کاهنده دارایی‌ها
                </h4>
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-3 text-right text-sm">کد حساب</th>
                      <th className="p-3 text-right text-sm">شرح</th>
                      <th className="p-3 text-left text-sm">مبلغ (ریال)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {bs.accumulatedDepreciation.map((item, idx) => (
                      <tr key={idx} className="hover:bg-red-50">
                        <td className="p-3 font-mono text-sm">{item.code}</td>
                        <td className="p-3 text-sm">{item.title}</td>
                        <td className="p-3 text-left font-bold text-red-700">
                          ({formatCurrency(item.balance)})
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        
        {/* جدول بدهی‌ها و سرمایه */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-amber-600 to-amber-700 p-4">
            <h3 className="text-lg font-bold text-white">بدهی‌ها و حقوق صاحبان سهام</h3>
          </div>
          
          <div className="p-4">
            {/* بدهی‌های جاری */}
            {bs.currentLiabilities && bs.currentLiabilities.length > 0 && (
              <div className="mb-6">
                <h4 className="font-bold text-gray-700 mb-3 pb-2 border-b border-gray-200">
                  بدهی‌های جاری
                </h4>
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-3 text-right text-sm">کد حساب</th>
                      <th className="p-3 text-right text-sm">شرح</th>
                      <th className="p-3 text-left text-sm">مبلغ (ریال)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {bs.currentLiabilities.map((item, idx) => (
                      <tr key={idx} className="hover:bg-amber-50">
                        <td className="p-3 font-mono text-sm">{item.code}</td>
                        <td className="p-3 text-sm">{item.title}</td>
                        <td className="p-3 text-left font-bold text-amber-700">
                          {formatCurrency(item.balance)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-amber-100 font-bold">
                      <td colSpan="2" className="p-3 text-left">جمع بدهی‌های جاری</td>
                      <td className="p-3 text-left text-amber-800">
                        {formatCurrency(bs.totalCurrentLiabilities)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            
            {/* بدهی‌های غیرجاری */}
            {bs.nonCurrentLiabilities && bs.nonCurrentLiabilities.length > 0 && (
              <div className="mb-6">
                <h4 className="font-bold text-gray-700 mb-3 pb-2 border-b border-gray-200">
                  بدهی‌های غیرجاری
                </h4>
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-3 text-right text-sm">کد حساب</th>
                      <th className="p-3 text-right text-sm">شرح</th>
                      <th className="p-3 text-left text-sm">مبلغ (ریال)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {bs.nonCurrentLiabilities.map((item, idx) => (
                      <tr key={idx} className="hover:bg-amber-50">
                        <td className="p-3 font-mono text-sm">{item.code}</td>
                        <td className="p-3 text-sm">{item.title}</td>
                        <td className="p-3 text-left font-bold text-amber-700">
                          {formatCurrency(item.balance)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-amber-100 font-bold">
                      <td colSpan="2" className="p-3 text-left">جمع بدهی‌های غیرجاری</td>
                      <td className="p-3 text-left text-amber-800">
                        {formatCurrency(bs.totalNonCurrentLiabilities)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            
            {/* حقوق صاحبان سهام */}
            {bs.equity && bs.equity.length > 0 && (
              <div className="mb-6">
                <h4 className="font-bold text-gray-700 mb-3 pb-2 border-b border-gray-200">
                  حقوق صاحبان سهام
                </h4>
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-3 text-right text-sm">کد حساب</th>
                      <th className="p-3 text-right text-sm">شرح</th>
                      <th className="p-3 text-left text-sm">مبلغ (ریال)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {bs.equity.map((item, idx) => (
                      <tr key={idx} className="hover:bg-green-50">
                        <td className="p-3 font-mono text-sm">{item.code}</td>
                        <td className="p-3 text-sm">{item.title}</td>
                        <td className="p-3 text-left font-bold text-green-700">
                          {formatCurrency(item.balance)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-green-100 font-bold">
                      <td colSpan="2" className="p-3 text-left">جمع حقوق صاحبان سهام</td>
                      <td className="p-3 text-left text-green-800">
                        {formatCurrency(bs.totalEquity)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // ==================== رندر صورت سود و زیان ====================
  const renderIncomeStatement = () => {
    if (!statementData?.incomeStatement) {
      return (
        <div className="text-center py-12 text-gray-500">
          اطلاعاتی برای نمایش وجود ندارد
        </div>
      );
    }
    
    const is = statementData.incomeStatement;
    
    return (
      <div className="space-y-6">
        {/* خلاصه سود و زیان */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
            <div className="text-sm text-green-800 mb-1">درآمدها</div>
            <div className="text-xl font-bold text-green-900">
              {formatCurrency(is.totalRevenue)} ریال
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
            <div className="text-sm text-red-800 mb-1">هزینه‌ها</div>
            <div className="text-xl font-bold text-red-900">
              {formatCurrency(is.totalExpenses)} ریال
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
            <div className="text-sm text-blue-800 mb-1">سود ناخالص</div>
            <div className="text-xl font-bold text-blue-900">
              {formatCurrency(is.grossProfit)} ریال
            </div>
          </div>
          
          <div className={`bg-gradient-to-br p-4 rounded-xl border ${
            is.netProfit >= 0 
              ? 'from-emerald-50 to-emerald-100 border-emerald-200' 
              : 'from-rose-50 to-rose-100 border-rose-200'
          }`}>
            <div className={`text-sm mb-1 ${
              is.netProfit >= 0 ? 'text-emerald-800' : 'text-rose-800'
            }`}>
              {is.netProfit >= 0 ? 'سود خالص' : 'زیان خالص'}
            </div>
            <div className={`text-xl font-bold ${
              is.netProfit >= 0 ? 'text-emerald-900' : 'text-rose-900'
            }`}>
              {formatCurrency(Math.abs(is.netProfit))} ریال
            </div>
          </div>
        </div>
        
        {/* جدول جزئیات */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-4">
            <h3 className="text-lg font-bold text-white">جزئیات صورت سود و زیان</h3>
          </div>
          
          <div className="p-4">
            <table className="w-full">
              <tbody className="divide-y divide-gray-200">
                {/* درآمدها */}
                <tr className="bg-green-50">
                  <td colSpan="2" className="p-3 font-bold text-green-800">درآمدها</td>
                  <td className="p-3 text-left font-bold text-green-800">{formatCurrency(is.totalRevenue)}</td>
                </tr>
                {is.revenues?.map((item, idx) => (
                  <tr key={idx} className="hover:bg-green-50">
                    <td className="p-3 pr-8 text-sm text-gray-600">{item.title}</td>
                    <td className="p-3 text-xs text-gray-500">{item.code}</td>
                    <td className="p-3 text-left text-green-700">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
                
                {/* بهای تمام شده */}
                {is.costOfGoodsSold > 0 && (
                  <>
                    <tr className="bg-amber-50">
                      <td colSpan="2" className="p-3 font-bold text-amber-800">بهای تمام شده کالای فروش رفته</td>
                      <td className="p-3 text-left font-bold text-amber-800">
                        ({formatCurrency(is.costOfGoodsSold)})
                      </td>
                    </tr>
                    <tr>
                      <td colSpan="3" className="p-3 text-center text-gray-500">
                        سود ناخالص: {formatCurrency(is.grossProfit)} ریال
                      </td>
                    </tr>
                  </>
                )}
                
                {/* هزینه‌ها */}
                <tr className="bg-red-50">
                  <td colSpan="2" className="p-3 font-bold text-red-800">هزینه‌ها</td>
                  <td className="p-3 text-left font-bold text-red-800">({formatCurrency(is.totalExpenses)})</td>
                </tr>
                {is.expenses?.map((item, idx) => (
                  <tr key={idx} className="hover:bg-red-50">
                    <td className="p-3 pr-8 text-sm text-gray-600">{item.title}</td>
                    <td className="p-3 text-xs text-gray-500">{item.code}</td>
                    <td className="p-3 text-left text-red-700">({formatCurrency(item.amount)})</td>
                  </tr>
                ))}
                
                {/* سود خالص */}
                <tr className={`${
                  is.netProfit >= 0 ? 'bg-emerald-100' : 'bg-rose-100'
                } font-bold`}>
                  <td colSpan="2" className="p-3 text-lg">
                    {is.netProfit >= 0 ? 'سود خالص' : 'زیان خالص'}
                  </td>
                  <td className={`p-3 text-left text-lg ${
                    is.netProfit >= 0 ? 'text-emerald-800' : 'text-rose-800'
                  }`}>
                    {formatCurrency(Math.abs(is.netProfit))} ریال
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };
  
  // ==================== رندر صورت جریان وجوه نقد ====================
  const renderCashFlow = () => {
    if (!statementData?.cashFlow) {
      return (
        <div className="text-center py-12 text-gray-500">
          اطلاعاتی برای نمایش وجود ندارد
        </div>
      );
    }
    
    const cf = statementData.cashFlow;
    
    return (
      <div className="space-y-6">
        {/* خلاصه جریان نقد */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-4 rounded-xl border border-cyan-200">
            <div className="text-sm text-cyan-800 mb-1">جریان نقد عملیاتی</div>
            <div className="text-xl font-bold text-cyan-900">
              {formatCurrency(cf.operatingCashFlow)} ریال
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
            <div className="text-sm text-purple-800 mb-1">جریان نقد سرمایه‌گذاری</div>
            <div className="text-xl font-bold text-purple-900">
              {formatCurrency(cf.investingCashFlow)} ریال
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
            <div className="text-sm text-orange-800 mb-1">جریان نقد تأمین مالی</div>
            <div className="text-xl font-bold text-orange-900">
              {formatCurrency(cf.financingCashFlow)} ریال
            </div>
          </div>
        </div>
        
        {/* تغییر خالص وجوه نقد */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-xl text-white">
          <div className="text-lg mb-2">تغییر خالص وجوه نقد</div>
          <div className="text-3xl font-bold">
            {formatCurrency(cf.netCashFlow)} ریال
          </div>
        </div>
        
        {/* مانده نقد ابتدا و انتهای دوره */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600">مانده نقد ابتدای دوره</div>
            <div className="text-xl font-bold text-gray-800">
              {formatCurrency(cf.beginningCash)} ریال
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600">مانده نقد انتهای دوره</div>
            <div className="text-xl font-bold text-gray-800">
              {formatCurrency(cf.endingCash)} ریال
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* هدر */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-2xl p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">صورت‌های مالی</h1>
              <p className="text-indigo-100">گزارش‌های مالی جامع شامل ترازنامه، سود و زیان و جریان وجوه نقد</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => window.print()}
                className="bg-white/20 hover:bg-white/30 p-3 rounded-xl transition-colors"
              >
                <Printer className="w-5 h-5" />
              </button>
              <button className="bg-white/20 hover:bg-white/30 p-3 rounded-xl transition-colors">
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
        
        {/* فیلترها */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                سال مالی
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={fiscalYears.length === 0}
              >
                {fiscalYears.length === 0 ? (
                  <option value="">در حال بارگذاری...</option>
                ) : (
                  fiscalYears.map(year => (
                    <option key={year.FiscalYearId || year.id} value={year.YearCode || year.yearCode}>
                      {year.YearCode || year.yearCode} - {year.StatusFa || (year.IsActive ? 'فعال' : 'بسته شده')}
                    </option>
                  ))
                )}
              </select>
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                دوره گزارش
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="yearly">سالانه</option>
                <option value="quarterly">فصلی</option>
                <option value="monthly">ماهانه</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={fetchFinancialStatements}
                disabled={loading || !selectedYear}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                نمایش گزارش
              </button>
            </div>
          </div>
        </div>
        
        {/* تب‌ها */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('balance-sheet')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
                activeTab === 'balance-sheet'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline ml-2" />
              ترازنامه
            </button>
            <button
              onClick={() => setActiveTab('income-statement')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
                activeTab === 'income-statement'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline ml-2" />
              صورت سود و زیان
            </button>
            <button
              onClick={() => setActiveTab('cash-flow')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
                activeTab === 'cash-flow'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <DollarSign className="w-4 h-4 inline ml-2" />
              صورت جریان وجوه نقد
            </button>
          </div>
        </div>
        
        {/* محتوای تب‌ها */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
              <p className="text-gray-600">در حال بارگذاری اطلاعات...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <p className="text-red-700">{error}</p>
            </div>
          ) : (
            <>
              {activeTab === 'balance-sheet' && renderBalanceSheet()}
              {activeTab === 'income-statement' && renderIncomeStatement()}
              {activeTab === 'cash-flow' && renderCashFlow()}
            </>
          )}
        </div>
        
        {/* فوتر */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>تاریخ گزارش: {new Date().toLocaleDateString('fa-IR')}</p>
        </div>
      </div>
    </div>
  );
};

export default FinancialStatements;