import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertCircle, CheckCircle } from 'lucide-react';

import Header from './Header';
import StepIndicator from './StepIndicator';
import Step1SelectYear from './Step1SelectYear';
import Step2CheckAccounts from './Step2CheckAccounts';
import Step3CalculateProfitLoss from './Step3CalculateProfitLoss';
import Step4CreateClosingEntry from './Step4CreateClosingEntry';
import Step5FinalResult from './Step5FinalResult';

const StepwiseClosing = ({ onBack }) => {
  // ================ State Management ================
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
  
  // ================ Helper Functions ================
  const updateStepStatus = (targetStep) => {
    setSteps(prevSteps => 
      prevSteps.map(step => ({
        ...step,
        status: step.step === targetStep ? 'active' :
                step.step < targetStep ? 'completed' : 'pending'
      }))
    );
  };

  const goToStep = (step) => {
    if (step < 1 || step > 5 || step === currentStep) return;
    
    // اعتبارسنجی مراحل
    if (step === 3 && (!closingData || temporaryAccounts.length === 0)) {
      setError('لطفاً ابتدا حساب‌های موقت را بررسی کنید');
      return;
    }
    
    if (step === 4 && (!profitLoss || calculatedAccounts.length === 0)) {
      setError('لطفاً ابتدا سود و زیان را محاسبه کنید');
      return;
    }
    
    setCurrentStep(step);
    setError(null);
    setSuccess(false);
    updateStepStatus(step);
  };

  // ================ API Calls ================
  const fetchFiscalYears = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📡 درخواست دریافت سال‌های مالی از سرور...');
      const response = await axios.get('http://localhost:5000/api/closing/fiscal-years');
      
      if (!response.data) {
        throw new Error('پاسخی از سرور دریافت نشد');
      }
      
      if (Array.isArray(response.data) && response.data.length > 0) {
        console.log(`✅ ${response.data.length} سال مالی دریافت شد`);
        setFiscalYears(response.data);
        
        // انتخاب سال فعال یا اولین سال
        const activeYear = response.data.find(year => year.IsActive === 1);
        if (activeYear) {
          setSelectedYear(activeYear.YearCode);
        } else {
          setSelectedYear(response.data[0].YearCode);
        }
      } else {
        setError('هیچ سال مالی در سیستم ثبت نشده است');
        setFiscalYears([]);
      }
    } catch (error) {
      console.error('❌ خطا در دریافت سال‌های مالی:', error);
      setError('خطا در ارتباط با سرور. لطفاً از اتصال به سرور اطمینان حاصل کنید.');
      setFiscalYears([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchClosingSteps = async () => {
    if (!selectedYear) {
      setError('لطفاً یک سال مالی انتخاب کنید');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log(`📡 بررسی شرایط بستن برای سال ${selectedYear}...`);
      
      // 1. دریافت حساب سرمایه و بررسی شرایط
      const capitalResponse = await axios.get(`http://localhost:5000/api/closing/check-closing-requirements/${selectedYear}`);
      
      if (!capitalResponse.data) {
        throw new Error('پاسخی از سرور دریافت نشد');
      }
      
      // بررسی وجود حساب سرمایه
      if (capitalResponse.data.capitalAccount) {
        setCapitalAccount(capitalResponse.data.capitalAccount);
        console.log('✅ حساب سرمایه:', capitalResponse.data.capitalAccount);
      } else {
        setError('حساب سرمایه (کد 3110 یا 311001) در سیستم تعریف نشده است');
        setCapitalAccount(null);
        return;
      }
      
      // بررسی بسته شدن قبلی
      if (capitalResponse.data.alreadyClosed) {
        setError(`سال مالی ${selectedYear} قبلاً بسته شده است`);
        return;
      }
      
      // 2. دریافت حساب‌های موقت
      console.log(`📡 دریافت حساب‌های موقت سال ${selectedYear}...`);
      const response = await axios.get(`http://localhost:5000/api/closing/temporary-accounts/${selectedYear}`);
      
      if (!response.data) {
        throw new Error('پاسخی از سرور دریافت نشد');
      }
      
      if (response.data.success) {
        setClosingData(response.data);
        const accounts = response.data.accounts || [];
        
        if (Array.isArray(accounts) && accounts.length > 0) {
          setTemporaryAccounts(accounts);
          console.log(`✅ ${accounts.length} حساب موقت با مانده دریافت شد`);
        } else {
          setTemporaryAccounts([]);
          setError('هیچ حساب موقتی با مانده برای این سال مالی یافت نشد');
        }
      } else {
        throw new Error(response.data.error || 'خطا در دریافت حساب‌های موقت');
      }
      
    } catch (error) {
      console.error('❌ خطا در بررسی حساب‌های موقت:', error);
      
      let errorMessage = 'خطا در بررسی حساب‌های موقت: ';
      if (error.response) {
        errorMessage += error.response.data?.error || error.response.data?.details || `کد خطا ${error.response.status}`;
      } else if (error.request) {
        errorMessage += 'عدم دریافت پاسخ از سرور';
      } else {
        errorMessage += error.message;
      }
      
      setError(errorMessage);
      setTemporaryAccounts([]);
      setClosingData(null);
    } finally {
      setLoading(false);
    }
  };

  // ================ Core Business Logic ================
  const handleCalculateProfitLoss = async () => {
    if (!selectedYear) {
      setError('لطفاً سال مالی انتخاب کنید');
      return;
    }
    
    if (!temporaryAccounts || temporaryAccounts.length === 0) {
      setError('ابتدا حساب‌های موقت را بررسی کنید');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('📊 محاسبه سود و زیان برای سال:', selectedYear);
      
      // استفاده از همان endpoint که در مرحله ۲ کار می‌کند
      const response = await axios.get(`http://localhost:5000/api/closing/temporary-accounts/${selectedYear}`);
      
      if (!response.data) {
        throw new Error('پاسخی از سرور دریافت نشد');
      }
      
      if (response.data.success) {
        const accounts = response.data.accounts || [];
        
        // تبدیل حساب‌ها به فرمت مورد نیاز
        const formattedAccounts = accounts.map(account => {
          const isIncome = account.Type === 'Incomes';
          const balance = isIncome 
            ? (account.credit || 0) - (account.debit || 0)
            : (account.debit || 0) - (account.credit || 0);
          const absBalance = Math.abs(balance);
          
          return {
            AccountCode: account.AccountCode,
            TitleFa: account.TitleFa,
            Type: isIncome ? 'درآمد' : 'هزینه',
            Nature: account.Nature || (isIncome ? 'بستانکار' : 'بدهکار'),
            debit: account.debit || 0,
            credit: account.credit || 0,
            finalBalance: absBalance,
            calculatedAmount: absBalance,
            balance: absBalance,
            balanceSide: isIncome ? 'بستانکار' : 'بدهکار',
            balanceDisplay: account.balanceDisplay || `${absBalance.toLocaleString('fa-IR')} ریال`,
            operation: isIncome ? 'بدهکار' : 'بستانکار'
          };
        }).filter(acc => acc.calculatedAmount > 0);
        
        // محاسبه سود و زیان
        const revenueAccounts = formattedAccounts.filter(acc => acc.Type === 'درآمد');
        const expenseAccounts = formattedAccounts.filter(acc => acc.Type === 'هزینه');
        
        const totalRevenue = revenueAccounts.reduce((sum, acc) => sum + acc.calculatedAmount, 0);
        const totalExpense = expenseAccounts.reduce((sum, acc) => sum + acc.calculatedAmount, 0);
        const netProfitLoss = totalRevenue - totalExpense;
        
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
        
        // بروزرسانی state
        setCalculatedAccounts(formattedAccounts);
        setProfitLoss(profitLossData);
        
        console.log('✅ محاسبه سود و زیان با موفقیت انجام شد');
        console.log('💰 سود/زیان خالص:', netProfitLoss.toLocaleString('fa-IR'), 'ریال');
        
        // انتقال به مرحله ۴
        setCurrentStep(4);
        updateStepStatus(4);
        
      } else {
        throw new Error(response.data.error || 'خطا در محاسبه سود و زیان');
      }
      
    } catch (error) {
      console.error('❌ خطا در محاسبه سود و زیان:', error);
      
      let errorMessage = 'خطا در محاسبه سود و زیان: ';
      if (error.response) {
        errorMessage += error.response.data?.error || error.response.data?.details || `کد خطا ${error.response.status}`;
      } else if (error.request) {
        errorMessage += 'عدم دریافت پاسخ از سرور';
      } else {
        errorMessage += error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
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
    
    setIsClosing(true);
    setError(null);
    
    try {
      console.log('🔒 شروع عملیات بستن حساب‌ها...');
      
      const accountsForServer = calculatedAccounts.map(acc => ({
        AccountCode: acc.AccountCode,
        TitleFa: acc.TitleFa,
        Type: acc.Type === 'درآمد' ? 'Incomes' : 'OperatingCost',
        Nature: acc.Nature,
        calculatedAmount: acc.calculatedAmount || acc.finalBalance || 0,
        operation: acc.operation
      }));
      
      const response = await axios.post('http://localhost:5000/api/closing/close-temporary-accounts', {
        fiscalYear: selectedYear,
        calculatedAccounts: accountsForServer,
        profitLoss: {
          totalRevenue: profitLoss.totalRevenue,
          totalExpense: profitLoss.totalExpense,
          netProfitLoss: profitLoss.netProfitLoss,
          isProfit: profitLoss.isProfit,
          isLoss: profitLoss.isLoss
        },
        capitalAccount: {
          AccountCode: capitalAccount.AccountCode,
          TitleFa: capitalAccount.TitleFa,
          Type: capitalAccount.Type,
          Nature: capitalAccount.Nature
        }
      });
      
      if (response.data.success) {
        setClosingResult(response.data);
        setSuccess(true);
        
        // انتقال به مرحله ۵
        setCurrentStep(5);
        updateStepStatus(5);
        
        console.log('🎉 عملیات بستن حساب‌ها با موفقیت انجام شد');
      } else {
        throw new Error(response.data.error || 'خطا در بستن حساب‌ها');
      }
      
    } catch (error) {
      console.error('❌ خطا در بستن حساب‌ها:', error);
      
      let errorMessage = 'خطا در بستن حساب‌ها: ';
      if (error.response) {
        errorMessage += error.response.data?.error || error.response.data?.details || `کد خطا ${error.response.status}`;
      } else if (error.request) {
        errorMessage += 'عدم دریافت پاسخ از سرور';
      } else {
        errorMessage += error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsClosing(false);
    }
  };

  const handleOpenNewYear = () => {
    alert(`سال مالی ${parseInt(selectedYear) + 1} آماده افتتاح است!`);
  };

  // ================ Effects ================
  useEffect(() => {
    fetchFiscalYears();
  }, []);

  // انتقال خودکار به مرحله ۲ پس از انتخاب سال
  useEffect(() => {
    if (selectedYear && currentStep === 1 && fiscalYears.length > 0) {
      goToStep(2);
    }
  }, [selectedYear, currentStep, fiscalYears]);

  // بارگیری داده‌ها در مرحله ۲
  useEffect(() => {
    if (selectedYear && currentStep === 2) {
      fetchClosingSteps();
    }
  }, [selectedYear, currentStep]);

  // ================ Render ================
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1SelectYear
            fiscalYears={fiscalYears}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            onBack={onBack}
            onNext={() => goToStep(2)}
            loading={loading}
            error={error}
          />
        );
        
      case 2:
        return (
          <Step2CheckAccounts
            loading={loading}
            error={error}
            selectedYear={selectedYear}
            fiscalYears={fiscalYears}
            temporaryAccounts={temporaryAccounts}
            capitalAccount={capitalAccount}
            onBack={() => goToStep(1)}
            onNext={() => {
              if (temporaryAccounts.length > 0) {
                goToStep(3);
              } else {
                setError('هیچ حساب موقتی با مانده برای این سال مالی یافت نشد');
              }
            }}
            onRetry={fetchClosingSteps}
          />
        );
        
        case 3:
            return (
              <Step3CalculateProfitLoss
                profitLoss={profitLoss}
                calculatedAccounts={calculatedAccounts}
                capitalAccount={capitalAccount}
                selectedYear={selectedYear}
                fiscalYearInfo={fiscalYears.find(y => y.YearCode === selectedYear)}
                temporaryAccounts={temporaryAccounts}
                onBack={() => goToStep(2)}
                onNext={() => {
                  // فقط به مرحله بعد برو
                  if (calculatedAccounts.length > 0 && profitLoss) {
                    goToStep(4);
                  }
                }}
                onCalculate={handleCalculateProfitLoss}
                isLoading={loading}
                calculationError={error}
              />
            );
        
      case 4:
        return (
          <Step4CreateClosingEntry
            selectedYear={selectedYear}
            capitalAccount={capitalAccount}
            profitLoss={profitLoss}
            calculatedAccounts={calculatedAccounts}
            isClosing={isClosing}
            error={error}
            onBack={() => goToStep(3)}
            onCloseAccounts={handleCloseAccounts}
          />
        );
        
      case 5:
        return (
          <Step5FinalResult
            selectedYear={selectedYear}
            closingResult={closingResult}
            error={error}
            onBack={onBack}
            onOpenNewYear={handleOpenNewYear}
          />
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <Header
          title="بستن حساب‌های موقت - مرحله‌ای"
          subtitle="۵ مرحله ساده برای بستن حساب‌های موقت و انتقال سود/زیان"
          stepInfo={`مرحله ${currentStep} از ۵`}
          onBack={onBack}
        />
        
        <StepIndicator steps={steps} currentStep={currentStep} />
        
        {renderStepContent()}
        
        {/* نمایش خطا - فقط در مراحل ۱-۳ و خارج از کامپوننت‌ها */}
        {error && currentStep < 4 && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-red-800">خطا</h3>
                <p className="text-red-700 mt-1 whitespace-pre-line">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* نمایش موفقیت */}
        {success && currentStep === 5 && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-green-800">موفقیت</h3>
                <p className="text-green-700 mt-1">عملیات بستن حساب‌ها با موفقیت انجام شد</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StepwiseClosing;