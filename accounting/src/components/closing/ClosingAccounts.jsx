// StepwiseClosing.js - نسخه کامل اصلاح شده
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  CheckCircle,
  AlertCircle,
  FileText,
  Lock,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Home,
  Calendar,
  Shield,
  Download,
  Clock,
  Calculator,
  X,
  Check
} from 'lucide-react';

// تابع تبدیل تاریخ میلادی به شمسی
const formatPersianDate = (dateString) => {
  if (!dateString) return '';
  try {
    // اگر تاریخ شمسی است (مانند 1404/01/01) همان را برگردان
    if (typeof dateString === 'string' && dateString.includes('/')) {
      return dateString;
    }
    
    // اگر تاریخ میلادی است، به شمسی تبدیل کن
    if (dateString instanceof Date || (typeof dateString === 'string' && dateString.includes('-'))) {
      const date = new Date(dateString);
      const persianDate = new Intl.DateTimeFormat('fa-IR').format(date);
      return persianDate;
    }
    
    return dateString;
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

const StepwiseClosing = ({ onBack }) => {
  const [steps, setSteps] = useState([
    { step: 1, title: 'انتخاب سال مالی', status: 'active', icon: 'calendar' },
    { step: 2, title: 'بررسی حساب‌های موقت', status: 'pending', icon: 'file-text' },
    { step: 3, title: 'محاسبه سود و زیان', status: 'pending', icon: 'calculator' },
    { step: 4, title: 'ایجاد سند اختتامیه', status: 'pending', icon: 'lock' },
    { step: 5, title: 'نتیجه نهایی', status: 'pending', icon: 'check-circle' }
  ]);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Step 1: انتخاب سال مالی
  const [fiscalYears, setFiscalYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  
  // Step 2: اطلاعات حساب‌ها
  const [closingData, setClosingData] = useState(null);
  const [temporaryAccounts, setTemporaryAccounts] = useState([]);
  const [capitalAccount, setCapitalAccount] = useState(null);
  
  // Step 3: سود و زیان
  const [profitLoss, setProfitLoss] = useState(null);
  const [calculatedAccounts, setCalculatedAccounts] = useState([]);
  
  // Step 4: سند اختتامیه
  const [closingResult, setClosingResult] = useState(null);
  const [isClosing, setIsClosing] = useState(false);
  
  // Step 5: نتیجه
  const [closingEntry, setClosingEntry] = useState(null);
  
  // بارگیری اولیه سال‌های مالی
  useEffect(() => {
    fetchFiscalYears();
  }, []);
  
  const fetchFiscalYears = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/closing/fiscal-years');
      
      // اگر پاسخ شامل سال‌های مالی است
      if (response.data && Array.isArray(response.data)) {
        setFiscalYears(response.data);
        // به طور پیش‌فرض سال فعال را انتخاب کن
        const activeYear = response.data.find(year => year.IsActive === 1);
        if (activeYear) {
          setSelectedYear(activeYear.YearCode);
        } else if (response.data.length > 0) {
          setSelectedYear(response.data[0].YearCode);
        }
      } else {
        // داده‌های نمونه برای تست
        const sampleYears = [
          {
            YearCode: '1404',
            StartDate: '1404/01/01',
            EndDate: '1404/12/29',
            IsActive: 1,
            EntryCount: 62
          }
        ];
        setFiscalYears(sampleYears);
        setSelectedYear('1404');
      }
    } catch (error) {
      console.error('Error fetching fiscal years:', error);
      
      // داده‌های نمونه در صورت خطا
      const sampleYears = [
        {
          YearCode: '1404',
          StartDate: '1404/01/01',
          EndDate: '1404/12/29',
          IsActive: 1,
          EntryCount: 62
        }
      ];
      setFiscalYears(sampleYears);
      setSelectedYear('1404');
      
      setError('اتصال به سرور مشکل دارد. از داده‌های نمونه استفاده می‌شود.');
    } finally {
      setLoading(false);
    }
  };
  
  // هنگام تغییر سال مالی، مرحله 2 را اجرا کن
  useEffect(() => {
    if (selectedYear && currentStep === 1) {
      goToStep(2);
    }
  }, [selectedYear]);
  
  // بارگیری داده‌های مرحله 2
  useEffect(() => {
    if (selectedYear && currentStep === 2) {
      fetchClosingSteps();
    }
  }, [selectedYear, currentStep]);
  
  const fetchClosingSteps = async () => {
    if (!selectedYear) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // ابتدا حساب سرمایه را پیدا کن
      const capitalResponse = await axios.get(`http://localhost:5000/api/closing/check-closing-requirements/${selectedYear}`);
      
      if (capitalResponse.data.capitalAccount) {
        setCapitalAccount(capitalResponse.data.capitalAccount);
      } else {
        setError('حساب سرمایه یافت نشد. لطفاً حساب سرمایه (3110 یا 311001) ایجاد کنید.');
        return;
      }
      
      // دریافت حساب‌های موقت
      const response = await axios.get(`http://localhost:5000/api/closing/temporary-accounts/${selectedYear}`);
      
      if (response.data.success) {
        setClosingData(response.data);
        
        // مطمئن شویم accounts همیشه آرایه است
        const accounts = response.data.accounts || [];
        if (Array.isArray(accounts)) {
          setTemporaryAccounts(accounts);
        } else {
          setTemporaryAccounts([]);
        }
        
        // به‌روزرسانی وضعیت مراحل
        const updatedSteps = [...steps];
        updatedSteps[0] = { ...updatedSteps[0], status: 'completed' };
        updatedSteps[1] = { ...updatedSteps[1], status: 'completed' };
        updatedSteps[2] = { ...updatedSteps[2], status: 'active' };
        setSteps(updatedSteps);
        
      } else {
        setError(response.data.error || 'خطا در دریافت حساب‌های موقت');
      }
      
    } catch (error) {
      console.error('Error fetching closing steps:', error);
      setError('خطا در بررسی حساب‌های موقت. لطفاً اتصال به سرور را بررسی کنید.');
    } finally {
      setLoading(false);
    }
  };
  
  const goToStep = (step) => {
    if (step < 1 || step > 5) return;
    
    // اعتبارسنجی مراحل
    if (step === 3 && (!closingData || temporaryAccounts.length === 0)) {
      setError('لطفاً ابتدا حساب‌ها را بررسی کنید');
      return;
    }
    
    if (step === 4 && !profitLoss) {
      setError('لطفاً ابتدا سود و زیان را محاسبه کنید');
      return;
    }
    
    setCurrentStep(step);
    setError(null);
    setSuccess(false);
    
    // به‌روزرسانی وضعیت مراحل
    const updatedSteps = steps.map(s => ({
      ...s,
      status: 
        s.step < step ? 'completed' :
        s.step === step ? 'active' : 'pending'
    }));
    setSteps(updatedSteps);
  };
  
  // در تابع handleCalculateProfitLoss اصلاح کنید:
const handleCalculateProfitLoss = () => {
  if (!closingData || temporaryAccounts.length === 0) return;
  
  console.log('📊 محاسبه سود و زیان شروع شد...');
  
  // جدا کردن حساب‌های درآمد و هزینه
  const revenueAccounts = [];
  const expenseAccounts = [];
  let totalRevenue = 0;
  let totalExpense = 0;
  
  temporaryAccounts.forEach(account => {
    const balance = account.finalBalance || 0;
    const accountType = account.Type || '';
    const nature = account.Nature || '';
    
    // کپی حساب برای محاسبات
    const calculatedAccount = { ...account };
    
    console.log(`🔍 بررسی حساب: ${account.AccountCode} - ${account.TitleFa}`);
    console.log(`  نوع: ${accountType}, طبیعت: ${nature}, مانده: ${balance.toLocaleString()}`);
    
    if (accountType === 'درآمد') {
      // حساب درآمد با طبیعت بستانکار: مانده منفی = درآمد اصلی
      if (nature === 'بستانکار' || nature === 'C') {
        if (balance < -0.01) {
          // مانده منفی برای حساب درآمد بستانکار = درآمد مثبت
          const revenueAmount = Math.abs(balance);
          totalRevenue += revenueAmount;
          calculatedAccount.calculatedAmount = revenueAmount;
          calculatedAccount.operation = 'بدهکار'; // برای بستن باید بدهکار شود
          revenueAccounts.push(calculatedAccount);
          console.log(`💰 درآمد شناسایی شد: ${account.AccountCode} - ${revenueAmount.toLocaleString()} (طبیعت: ${nature})`);
        } else if (balance > 0.01) {
          // مانده مثبت برای حساب درآمد = برگشت/تخفیف
          console.log(`📉 برگشت درآمد: ${account.AccountCode} - ${balance.toLocaleString()}`);
        }
      }
    } else if (accountType === 'هزینه') {
      // حساب هزینه با طبیعت بدهکار: مانده مثبت = هزینه اصلی
      if (nature === 'بدهکار' || nature === 'D') {
        if (balance > 0.01) {
          // مانده مثبت برای حساب هزینه بدهکار = هزینه مثبت
          totalExpense += balance;
          calculatedAccount.calculatedAmount = balance;
          calculatedAccount.operation = 'بستانکار'; // برای بستن باید بستانکار شود
          expenseAccounts.push(calculatedAccount);
          console.log(`💸 هزینه شناسایی شد: ${account.AccountCode} - ${balance.toLocaleString()} (طبیعت: ${nature})`);
        } else if (balance < -0.01) {
          // مانده منفی برای حساب هزینه = برگشت هزینه
          console.log(`📈 برگشت هزینه: ${account.AccountCode} - ${Math.abs(balance).toLocaleString()}`);
        }
      }
    }
  });
  
  // محاسبه سود/زیان
  const netProfitLoss = totalRevenue - totalExpense;
  
  console.log('📈 نتایج محاسبه سود و زیان:');
  console.log(`  مجموع درآمدها: ${totalRevenue.toLocaleString()}`);
  console.log(`  مجموع هزینه‌ها: ${totalExpense.toLocaleString()}`);
  console.log(`  سود/زیان خالص: ${netProfitLoss.toLocaleString()}`);
  console.log(`  تعداد حساب درآمد برای بستن: ${revenueAccounts.length}`);
  console.log(`  تعداد حساب هزینه برای بستن: ${expenseAccounts.length}`);
  
  const profitLossData = {
    totalRevenue,
    totalExpense,
    netProfitLoss,
    isProfit: netProfitLoss > 0,
    isLoss: netProfitLoss < 0,
    absoluteValue: Math.abs(netProfitLoss),
    revenueAccounts: revenueAccounts.length,
    expenseAccounts: expenseAccounts.length
  };
  
  // ذخیره حساب‌های محاسبه شده
  setCalculatedAccounts([...revenueAccounts, ...expenseAccounts]);
  setProfitLoss(profitLossData);
  
  // رفتن به مرحله بعدی
  goToStep(4);
    };
    
    
  const handleCloseAccounts = async () => {
    if (!selectedYear) {
      setError('لطفاً سال مالی انتخاب کنید');
      return;
    }
    
    if (!capitalAccount) {
      setError('حساب سرمایه یافت نشد');
      return;
    }
    
    if (!profitLoss || calculatedAccounts.length === 0) {
      setError('لطفاً ابتدا سود و زیان را محاسبه کنید');
      return;
    }
    
    try {
      setIsClosing(true);
      setError(null);
      
      console.log('🚀 شروع عملیات بستن حساب‌ها...');
      
      const response = await axios.post('http://localhost:5000/api/closing/close-temporary-accounts', {
        fiscalYear: selectedYear
      });
      
      console.log('✅ پاسخ سرور:', response.data);
      
      if (response.data.success) {
        setClosingResult(response.data);
        setClosingEntry(response.data);
        setSuccess(true);
        
        // به‌روزرسانی وضعیت مراحل
        const updatedSteps = [...steps];
        updatedSteps[3] = { ...updatedSteps[3], status: 'completed' };
        updatedSteps[4] = { ...updatedSteps[4], status: 'active' };
        setSteps(updatedSteps);
        
        goToStep(5);
      } else {
        setError(response.data.error || 'خطا در بستن حساب‌ها');
      }
      
    } catch (error) {
      console.error('❌ خطا در بستن حساب‌ها:', error);
      const errorMessage = error.response?.data?.error || 
                         error.response?.data?.details || 
                         'خطا در بستن حساب‌ها. لطفاً دوباره تلاش کنید.';
      setError(errorMessage);
    } finally {
      setIsClosing(false);
    }
  };
  
  const formatCurrency = (value) => {
    if (value === undefined || value === null || isNaN(value)) return '۰ ریال';
    const absoluteValue = Math.abs(Math.round(value));
    return new Intl.NumberFormat('fa-IR').format(absoluteValue) + ' ریال';
  };
  
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-blue-100 p-3 rounded-full">
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">انتخاب سال مالی</h2>
                <p className="text-gray-600">سال مالی مورد نظر برای بستن حساب‌ها را انتخاب کنید</p>
              </div>
            </div>
            
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                سال مالی
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {fiscalYears.map((year) => (
                  <button
                    key={year.YearCode}
                    onClick={() => setSelectedYear(year.YearCode)}
                    className={`p-4 border-2 rounded-xl text-right transition-all ${
                      selectedYear === year.YearCode
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm px-2 py-1 rounded-full ${
                        year.IsActive === 1 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {year.IsActive === 1 ? 'فعال' : 'غیرفعال'}
                      </span>
                      <span className="font-bold text-lg">{year.YearCode}</span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>شروع: {year.StartDate}</div>
                      <div>پایان: {year.EndDate}</div>
                      <div className="text-xs">تعداد اسناد: {year.EntryCount || 0}</div>
                    </div>
                  </button>
                ))}
              </div>
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
                onClick={() => goToStep(2)}
                disabled={!selectedYear}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${
                  !selectedYear
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                مرحله بعد
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
          </div>
        );
        
      case 2:
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
                  onClick={fetchClosingSteps}
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
                      {temporaryAccounts.filter(acc => acc.Type === 'درآمد').length} درآمد،{' '}
                      {temporaryAccounts.filter(acc => acc.Type === 'هزینه').length} هزینه
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
                        {temporaryAccounts.filter(acc => Math.abs(acc.finalBalance) > 0.01).length} حساب دارای مانده
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
                            .filter(account => Math.abs(account.finalBalance) > 0.01)
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
                                    account.Type === 'درآمد'
                                      ? 'bg-green-100 text-green-800'
                                      : account.Type === 'هزینه'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {account.Type || 'نامشخص'}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    account.Nature === 'بستانکار'
                                      ? 'bg-blue-100 text-blue-800'
                                      : account.Nature === 'بدهکار'
                                      ? 'bg-orange-100 text-orange-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {account.Nature || 'نامشخص'}
                                  </span>
                                </td>
                                <td className="p-4 text-left">
                                  <span className={`font-medium ${
                                    account.finalBalance > 0
                                      ? account.Type === 'درآمد'
                                        ? 'text-green-600'
                                        : 'text-red-600'
                                      : 'text-gray-600'
                                  }`}>
                                    {formatCurrency(Math.abs(account.finalBalance || 0))}
                                    {account.finalBalance > 0 
                                      ? account.Type === 'درآمد' ? ' (بستانکار)' : ' (بدهکار)'
                                      : account.Type === 'درآمد' ? ' (بدهکار)' : ' (بستانکار)'
                                    }
                                  </span>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                      {temporaryAccounts.filter(acc => Math.abs(acc.finalBalance) > 0.01).length > 10 && (
                        <div className="p-4 text-center border-t border-gray-200">
                          <span className="text-sm text-gray-600">
                            و {temporaryAccounts.filter(acc => Math.abs(acc.finalBalance) > 0.01).length - 10} حساب دیگر...
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
                            {formatCurrency(
                              temporaryAccounts
                                .filter(acc => acc.Type === 'درآمد' && acc.finalBalance < -0.01)
                                .reduce((sum, acc) => sum + Math.abs(acc.finalBalance), 0)
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-red-800 mb-2">حساب‌های هزینه</h4>
                        <div className="flex items-center justify-between">
                          <span className="text-red-600">مجموع مانده بدهکار:</span>
                          <span className="font-bold text-red-700">
                            {formatCurrency(
                              temporaryAccounts
                                .filter(acc => acc.Type === 'هزینه' && acc.finalBalance > 0.01)
                                .reduce((sum, acc) => sum + acc.finalBalance, 0)
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
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
                    onClick={() => goToStep(1)}
                    className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl font-medium transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                    مرحله قبل
                  </button>
                  <button
                    onClick={() => goToStep(3)}
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
        
      case 3:
        return (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-purple-100 p-3 rounded-full">
                <Calculator className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">محاسبه سود و زیان</h2>
                <p className="text-gray-600">محاسبه سود و زیان خالص سال {selectedYear}</p>
              </div>
            </div>
            
            {!profitLoss ? (
              <div className="text-center py-12">
                <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-6">برای محاسبه سود و زیان روی دکمه زیر کلیک کنید</p>
                <button
                  onClick={handleCalculateProfitLoss}
                  disabled={!capitalAccount || temporaryAccounts.length === 0}
                  className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                    !capitalAccount || temporaryAccounts.length === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                >
                  محاسبه سود و زیان
                </button>
              </div>
            ) : (
              <>
                {/* کارت‌های سود و زیان */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-green-800">مجموع درآمدها</div>
                        <div className="text-2xl font-bold text-green-900">
                          {formatCurrency(profitLoss.totalRevenue)}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-green-700">
                      از {profitLoss.revenueAccounts} حساب درآمد
                    </div>
                  </div>
                  
                  <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-red-100 p-2 rounded-lg">
                        <TrendingDown className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-red-800">مجموع هزینه‌ها</div>
                        <div className="text-2xl font-bold text-red-900">
                          {formatCurrency(profitLoss.totalExpense)}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-red-700">
                      از {profitLoss.expenseAccounts} حساب هزینه
                    </div>
                  </div>
                  
                  <div className={`border rounded-xl p-6 ${
                    profitLoss.isProfit
                      ? 'bg-green-50 border-green-200'
                      : profitLoss.isLoss
                      ? 'bg-red-50 border-red-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2 rounded-lg ${
                        profitLoss.isProfit
                          ? 'bg-green-100'
                          : profitLoss.isLoss
                          ? 'bg-red-100'
                          : 'bg-gray-100'
                      }`}>
                        <DollarSign className={`w-6 h-6 ${
                          profitLoss.isProfit
                            ? 'text-green-600'
                            : profitLoss.isLoss
                            ? 'text-red-600'
                            : 'text-gray-600'
                        }`} />
                      </div>
                      <div>
                        <div className={`text-sm font-medium ${
                          profitLoss.isProfit
                            ? 'text-green-800'
                            : profitLoss.isLoss
                            ? 'text-red-800'
                            : 'text-gray-800'
                        }`}>
                          سود/زیان خالص
                        </div>
                        <div className={`text-2xl font-bold ${
                          profitLoss.isProfit
                            ? 'text-green-900'
                            : profitLoss.isLoss
                            ? 'text-red-900'
                            : 'text-gray-900'
                        }`}>
                          {formatCurrency(profitLoss.absoluteValue)}
                        </div>
                      </div>
                    </div>
                    <div className={`text-sm font-medium ${
                      profitLoss.isProfit
                        ? 'text-green-700'
                        : profitLoss.isLoss
                        ? 'text-red-700'
                        : 'text-gray-700'
                    }`}>
                      {profitLoss.isProfit ? '💰 سود' : profitLoss.isLoss ? '📉 زیان' : '⚖️ تراز'}
                    </div>
                  </div>
                </div>
                
                {/* جدول حساب‌های محاسبه شده */}
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">حساب‌های قابل بستن</h3>
                  
                  <div className="overflow-x-auto border border-gray-200 rounded-xl">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="p-4 text-right text-sm font-medium text-gray-500">کد حساب</th>
                          <th className="p-4 text-right text-sm font-medium text-gray-500">نام حساب</th>
                          <th className="p-4 text-right text-sm font-medium text-gray-500">نوع</th>
                          <th className="p-4 text-right text-sm font-medium text-gray-500">مبلغ</th>
                          <th className="p-4 text-right text-sm font-medium text-gray-500">عملیات بستن</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {calculatedAccounts.map((account, index) => (
                          <tr key={`${account.AccountCode}-${index}`} className="hover:bg-gray-50">
                            <td className="p-4">
                              <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                {account.AccountCode}
                              </span>
                            </td>
                            <td className="p-4 font-medium text-gray-900">
                              {account.TitleFa}
                            </td>
                            <td className="p-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                account.Type === 'درآمد'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {account.Type}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`font-bold ${
                                account.Type === 'درآمد' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {formatCurrency(account.calculatedAmount)}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                account.operation === 'بدهکار'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {account.operation}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {/* اطلاعات انتقال به حساب سرمایه */}
                {capitalAccount && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
                    <h3 className="text-lg font-bold text-blue-800 mb-4">انتقال به حساب سرمایه</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-lg border border-blue-100">
                        <div className="text-sm text-gray-600 mb-1">حساب سرمایه</div>
                        <div className="font-bold text-blue-700">
                          {capitalAccount.AccountCode} - {capitalAccount.TitleFa}
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-blue-100">
                        <div className="text-sm text-gray-600 mb-1">مبلغ انتقال</div>
                        <div className={`text-xl font-bold ${
                          profitLoss.isProfit ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(profitLoss.absoluteValue)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 text-sm text-blue-700">
                      {profitLoss.isProfit 
                        ? `سود خالص ${formatCurrency(profitLoss.absoluteValue)} به حساب سرمایه بستانکار می‌شود.`
                        : profitLoss.isLoss
                        ? `زیان خالص ${formatCurrency(profitLoss.absoluteValue)} از حساب سرمایه بدهکار می‌شود.`
                        : 'حساب‌ها تراز هستند.'
                      }
                    </div>
                  </div>
                )}
                
                {/* دکمه‌های ناوبری */}
                <div className="flex justify-between">
                  <button
                    onClick={() => goToStep(2)}
                    className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl font-medium transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                    مرحله قبل
                  </button>
                  <button
                    onClick={() => goToStep(4)}
                    className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors"
                  >
                    ادامه برای بستن حساب‌ها
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </div>
              </>
            )}
          </div>
        );
        
      case 4:
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
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-bold text-yellow-800">توجه مهم</h3>
                  <p className="text-yellow-700 mt-1">
                    این عملیات غیرقابل بازگشت است. قبل از ادامه از صحت اطلاعات اطمینان حاصل کنید.
                  </p>
                  <ul className="mt-2 text-yellow-700 text-sm list-disc mr-4 space-y-1">
                    <li>حساب‌های درآمد با مانده بستانکار بدهکار می‌شوند</li>
                    <li>حساب‌های هزینه با مانده بدهکار بستانکار می‌شوند</li>
                    <li>سود/زیان خالص به حساب سرمایه منتقل می‌شود</li>
                    <li>سند اختتامیه ایجاد و ثبت می‌شود</li>
                  </ul>
                </div>
              </div>
            </div>
            
            {/* خلاصه عملیات */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-bold text-gray-800 mb-4">خلاصه عملیات بستن</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="text-sm text-gray-600 mb-1">سال مالی</div>
                    <div className="font-bold text-gray-800">{selectedYear}</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="text-sm text-gray-600 mb-1">تعداد حساب‌های قابل بستن</div>
                    <div className="font-bold text-gray-800">{calculatedAccounts.length} حساب</div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">سود/زیان خالص</div>
                  <div className={`text-xl font-bold ${
                    profitLoss?.isProfit ? 'text-green-600' : profitLoss?.isLoss ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {formatCurrency(profitLoss?.absoluteValue || 0)}
                    <span className="text-sm font-normal mr-2">
                      ({profitLoss?.isProfit ? 'سود' : profitLoss?.isLoss ? 'زیان' : 'تراز'})
                    </span>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">حساب سرمایه مقصد</div>
                  <div className="font-bold text-gray-800">
                    {capitalAccount?.AccountCode} - {capitalAccount?.TitleFa}
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">جزئیات عملیات</div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-700">بستن حساب درآمد:</span>
                      <span className="font-medium text-green-600">
                        {calculatedAccounts.filter(acc => acc.Type === 'درآمد').length} حساب
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">بستن حساب هزینه:</span>
                      <span className="font-medium text-red-600">
                        {calculatedAccounts.filter(acc => acc.Type === 'هزینه').length} حساب
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">مجموع مبلغ عملیات:</span>
                      <span className="font-medium text-blue-600">
                        {formatCurrency(
                          calculatedAccounts.reduce((sum, acc) => sum + acc.calculatedAmount, 0)
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* دکمه‌های عملیات */}
            <div className="flex justify-between">
              <button
                onClick={() => goToStep(3)}
                className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl font-medium transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
                مرحله قبل
              </button>
              
              <div className="flex gap-3">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-6 py-3 border border-blue-300 text-blue-600 hover:bg-blue-50 rounded-xl font-medium transition-colors"
                >
                  <Download className="w-5 h-5" />
                  چاپ گزارش
                </button>
                <button
                  onClick={handleCloseAccounts}
                  disabled={isClosing || !capitalAccount || calculatedAccounts.length === 0}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${
                    isClosing || !capitalAccount || calculatedAccounts.length === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {isClosing ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      در حال بستن...
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      بستن حساب‌ها و ایجاد سند
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {error && (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                  <div>
                    <h3 className="font-bold text-red-800">خطا در عملیات</h3>
                    <p className="text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
        
      case 5:
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
                      onClick={() => {
                        // افتتاح سال جدید
                        alert(`سال مالی ${parseInt(selectedYear) + 1} آماده افتتاح است!`);
                      }}
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
                  onClick={() => goToStep(4)}
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
        
      default:
        return null;
    }
  };
  
  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* هدر */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl p-6 mb-6 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-full">
                <Lock className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">
                  بستن حساب‌های موقت - مرحله‌ای
                </h1>
                <p className="text-blue-100">
                  ۵ مرحله ساده برای بستن حساب‌های موقت و انتقال سود/زیان
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-white/20 px-3 py-1 rounded-full text-sm">
                مرحله {currentStep} از ۵
              </div>
              <button
                onClick={onBack}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
                بازگشت
              </button>
            </div>
          </div>
        </div>
        
        {/* نوار مراحل */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="hidden md:flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.step}>
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                    step.status === 'completed' ? 'bg-green-100 text-green-600' :
                    step.status === 'active' ? 'bg-blue-100 text-blue-600' :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    {step.icon === 'calendar' && <Calendar className="w-6 h-6" />}
                    {step.icon === 'file-text' && <FileText className="w-6 h-6" />}
                    {step.icon === 'calculator' && <Calculator className="w-6 h-6" />}
                    {step.icon === 'lock' && <Lock className="w-6 h-6" />}
                    {step.icon === 'check-circle' && <CheckCircle className="w-6 h-6" />}
                  </div>
                  <div className="text-center">
                    <div className={`text-sm font-medium ${
                      step.status === 'completed' ? 'text-green-700' :
                      step.status === 'active' ? 'text-blue-700' :
                      'text-gray-500'
                    }`}>
                      مرحله {step.step}
                    </div>
                    <div className="text-xs text-gray-600">{step.title}</div>
                  </div>
                </div>
                
                {index < steps.length - 1 && (
                  <div className="flex-1 h-0.5 mx-4">
                    <div className={`h-full ${
                      steps[index + 1].status === 'pending' 
                        ? 'bg-gray-200' 
                        : 'bg-green-200'
                    }`}></div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
          
          {/* نمایش موبایل */}
          <div className="md:hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  steps[currentStep - 1].status === 'completed' ? 'bg-green-100 text-green-600' :
                  steps[currentStep - 1].status === 'active' ? 'bg-blue-100 text-blue-600' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {steps[currentStep - 1].icon === 'calendar' && <Calendar className="w-4 h-4" />}
                  {steps[currentStep - 1].icon === 'file-text' && <FileText className="w-4 h-4" />}
                  {steps[currentStep - 1].icon === 'calculator' && <Calculator className="w-4 h-4" />}
                  {steps[currentStep - 1].icon === 'lock' && <Lock className="w-4 h-4" />}
                  {steps[currentStep - 1].icon === 'check-circle' && <CheckCircle className="w-4 h-4" />}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">
                    مرحله {currentStep} از ۵
                  </div>
                  <div className="text-xs text-gray-600">{steps[currentStep - 1].title}</div>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {currentStep > 1 && (
                  <button
                    onClick={() => goToStep(currentStep - 1)}
                    className="flex items-center gap-1 text-blue-600"
                  >
                    <ChevronRight className="w-4 h-4" />
                    قبل
                  </button>
                )}
              </div>
            </div>
            
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all"
                style={{ width: `${(currentStep / 5) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        {/* محتوای مرحله */}
        {renderStepContent()}
        
        {/* نمایش خطا */}
        {error && currentStep !== 5 && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <div>
                <h3 className="font-bold text-red-800">خطا</h3>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* نمایش موفقیت */}
        {success && currentStep !== 5 && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <h3 className="font-bold text-green-800">موفقیت</h3>
                <p className="text-green-700 mt-1">عملیات با موفقیت انجام شد</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StepwiseClosing;