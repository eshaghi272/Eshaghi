import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertCircle, CheckCircle } from 'lucide-react';

import Header from './Header';
import StepIndicator from './StepIndicator';
import Step1SelectSourceYear from './Step1SelectSourceYear';
import Step2CheckPermanentAccounts from './Step2CheckPermanentAccounts';
import Step3CreateNewFiscalYear from './Step3CreateNewFiscalYear';
import Step4CreateOpeningEntry from './Step4CreateOpeningEntry';
import Step5OpeningResult from './Step5OpeningResult';

const StepwiseOpening = ({ onBack, onComplete }) => {
  // ================ State Management ================
  const [steps, setSteps] = useState([
    { step: 1, title: 'انتخاب سال مبدا', status: 'active', icon: 'calendar' },
    { step: 2, title: 'بررسی حساب‌های دائمی', status: 'pending', icon: 'file-text' },
    { step: 3, title: 'ایجاد سال مالی جدید', status: 'pending', icon: 'database' },
    { step: 4, title: 'ایجاد سند افتتاحیه', status: 'pending', icon: 'file-signature' },
    { step: 5, title: 'نتیجه نهایی', status: 'pending', icon: 'check-circle' }
  ]);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Step 1: انتخاب سال مالی مبدا
  const [fiscalYears, setFiscalYears] = useState([]);
  const [sourceYear, setSourceYear] = useState('');
  const [targetYear, setTargetYear] = useState('');
  
  // Step 2: اطلاعات حساب‌های دائمی
  const [permanentAccounts, setPermanentAccounts] = useState([]);
  const [accountSummary, setAccountSummary] = useState(null);
  
  // Step 3: سال مالی جدید
  const [newFiscalYear, setNewFiscalYear] = useState(null);
  const [isCreatingYear, setIsCreatingYear] = useState(false);
  const [fiscalYearCreated, setFiscalYearCreated] = useState(false); // state جدید
  
  // Step 4: سند افتتاحیه
  const [openingResult, setOpeningResult] = useState(null);
  const [isCreatingEntry, setIsCreatingEntry] = useState(false);
  
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
    
    // اعتبارسنجی مراحل - اصلاح شده
    if (step === 3 && (!sourceYear || permanentAccounts.length === 0)) {
      setError('لطفاً ابتدا حساب‌های دائمی را بررسی کنید');
      return;
    }
    
    // شرط اصلاح شده - بررسی fiscalYearCreated به جای newFiscalYear
    if (step === 4 && !fiscalYearCreated) {
      setError('لطفاً ابتدا سال مالی جدید را ایجاد کنید');
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
      const response = await axios.get('http://localhost:5000/api/opening/fiscal-years');
      
      if (response.data && Array.isArray(response.data)) {
        console.log('✅ سال‌های مالی دریافت شد:', response.data.length);
        setFiscalYears(response.data);
      } else {
        console.error('❌ فرمت پاسخ نامعتبر:', response.data);
        setError('فرمت پاسخ دریافتی نامعتبر است');
      }
    } catch (error) {
      console.error('❌ خطا در دریافت سال‌های مالی:', error);
      setError(error.response?.data?.error || error.message || 'خطا در دریافت سال‌های مالی');
    } finally {
      setLoading(false);
    }
  };

  const checkOpeningRequirements = async (year) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`http://localhost:5000/api/opening/check-opening-requirements/${year}`);
      
      if (response.data.success) {
        if (response.data.canOpen) {
          setTargetYear(response.data.targetFiscalYear.yearCode);
          console.log('✅ شرایط افتتاحیه برقرار است:', response.data);
          return true;
        } else {
          const missing = response.data.missingRequirements || [];
          setError(missing.join('، ') || 'امکان افتتاح سال جدید وجود ندارد');
          return false;
        }
      } else {
        setError(response.data.error || 'خطا در بررسی شرایط');
        return false;
      }
    } catch (error) {
      console.error('❌ خطا در بررسی شرایط افتتاحیه:', error);
      setError(error.response?.data?.error || error.message || 'خطا در بررسی شرایط افتتاح سال');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const fetchPermanentAccounts = async (year) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`http://localhost:5000/api/opening/permanent-accounts-balances/${year}`);
      
      if (response.data.success) {
        setPermanentAccounts(response.data.accounts || []);
        setAccountSummary(response.data.summary);
        console.log(`✅ ${response.data.accounts.length} حساب دائمی دریافت شد`);
        return true;
      } else {
        setError(response.data.error || 'خطا در دریافت حساب‌های دائمی');
        return false;
      }
    } catch (error) {
      console.error('❌ خطا در دریافت حساب‌های دائمی:', error);
      setError(error.response?.data?.error || error.message || 'خطا در دریافت مانده حساب‌های دائمی');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const createNewFiscalYear = async (yearData) => {
    setIsCreatingYear(true);
    setError(null);
    
    try {
      const response = await axios.post('http://localhost:5000/api/opening/create-new-fiscal-year', {
        sourceYear,
        targetYear,
        startDate: yearData.startDate,
        endDate: yearData.endDate
      });
      
      if (response.data.success) {
        setNewFiscalYear(response.data);
        setFiscalYearCreated(true); // تنظیم state جدید
        setSuccess(true);
        console.log('✅ سال مالی جدید ایجاد شد:', response.data);
        
        // انتقال به مرحله ۴ - با تاخیر
        setTimeout(() => {
          goToStep(4);
        }, 500);
        
        return { success: true, data: response.data };
      } else {
        setError(response.data.error || 'خطا در ایجاد سال مالی جدید');
        return { success: false, error: response.data.error };
      }
    } catch (error) {
      console.error('❌ خطا در ایجاد سال مالی:', error);
      const errorMsg = error.response?.data?.error || error.message || 'خطا در ایجاد سال مالی جدید';
      setError(errorMsg);
      
      // اگر خطای تکراری بودن است، باز هم fiscalYearCreated را true کن
      if (errorMsg.includes('قبلاً تعریف شده است')) {
        setFiscalYearCreated(true);
        return { success: true, alreadyExists: true };
      }
      
      return { success: false, error: errorMsg };
    } finally {
      setIsCreatingYear(false);
    }
  };

  const createOpeningEntry = async () => {
    setIsCreatingEntry(true);
    setError(null);
    
    try {
      // ابتدا مطمئن شویم که permanentAccounts دارای مانده است
      console.log('📊 حساب‌های دائمی برای ارسال:', permanentAccounts);
      
      // ایجاد خطوط سند با فرمت مناسب
      const journalLines = [];
      
      permanentAccounts.forEach(acc => {
        const accountCode = acc.AccountCode?.toString() || '';
        const type = acc.Type || '';
        const nature = acc.Nature || '';
        const balance = Math.abs(acc.Balance || 0);
        
        // تشخیص حساب کاهنده دارایی
        const isContraAsset = 
          accountCode.startsWith('121') || 
          accountCode.startsWith('1211') ||
          (nature === 'بستانكار' && (type === 'Assets' || type === 'CurrentAssets' || type === 'NonCurrentAssets'));
        
        if (isContraAsset) {
          journalLines.push({
            AccountCode: acc.AccountCode,
            DebitAmount: 0,
            CreditAmount: balance,
            Description: `مانده افتتاحیه ${acc.TitleFa} (کاهنده دارایی)`
          });
        } 
        else if (type === 'CurrentAssets' || type === 'NonCurrentAssets' || type === 'Assets') {
          journalLines.push({
            AccountCode: acc.AccountCode,
            DebitAmount: balance,
            CreditAmount: 0,
            Description: `مانده افتتاحیه ${acc.TitleFa}`
          });
        }
        else if (type === 'CurrentDebit' || type === 'NonCurrentDebit' || type === 'Liabilities') {
          journalLines.push({
            AccountCode: acc.AccountCode,
            DebitAmount: 0,
            CreditAmount: balance,
            Description: `مانده افتتاحیه ${acc.TitleFa}`
          });
        }
        else if (type === 'Equity' || accountCode === '311001') {
          journalLines.push({
            AccountCode: acc.AccountCode,
            DebitAmount: 0,
            CreditAmount: balance,
            Description: `مانده افتتاحیه ${acc.TitleFa}`
          });
        }
      });
      
      // محاسبه سود انباشته
      let totalAssets = 0;
      let totalLiabilities = 0;
      let totalEquity = 0;
      
      permanentAccounts.forEach(acc => {
        const accountCode = acc.AccountCode?.toString() || '';
        const type = acc.Type || '';
        const nature = acc.Nature || '';
        const balance = Math.abs(acc.Balance || 0);
        
        const isContraAsset = 
          accountCode.startsWith('121') || 
          accountCode.startsWith('1211') ||
          (nature === 'بستانكار' && (type === 'Assets' || type === 'CurrentAssets' || type === 'NonCurrentAssets'));
        
        if (isContraAsset) {
          totalAssets -= balance;
        } 
        else if (type === 'CurrentAssets' || type === 'NonCurrentAssets' || type === 'Assets') {
          totalAssets += balance;
        }
        else if (type === 'CurrentDebit' || type === 'NonCurrentDebit' || type === 'Liabilities') {
          totalLiabilities += balance;
        }
        else if (type === 'Equity' || accountCode === '311001') {
          totalEquity += balance;
        }
      });
      
      const retainedEarnings = totalAssets - totalLiabilities - totalEquity;
      
      if (Math.abs(retainedEarnings) > 0) {
        journalLines.push({
          AccountCode: '311002',
          DebitAmount: 0,
          CreditAmount: Math.abs(retainedEarnings),
          Description: 'سود انباشته انتقالی از سال قبل'
        });
      }
      
      console.log('🚀 خطوط سند ایجاد شده:', journalLines.length);
      console.log('   نمونه:', journalLines[0]);
      
      const response = await axios.post('http://localhost:5000/api/opening/create-opening-entry', {
        sourceYear,
        targetYear,
        accounts: journalLines,  // ارسال خطوط سند با مقادیر عددی
        summary: {
          totalAssets,
          totalLiabilities,
          totalEquity,
          retainedEarnings: Math.abs(retainedEarnings),
          totalCredit: totalLiabilities + totalEquity + Math.abs(retainedEarnings),
          isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity + Math.abs(retainedEarnings))) < 0.01
        }
      });
      
      if (response.data.success) {
        setOpeningResult(response.data);
        setSuccess(true);
        console.log('✅ سند افتتاحیه ایجاد شد:', response.data);
        
        // انتقال به مرحله ۵
        setTimeout(() => {
          goToStep(5);
        }, 500);
        
        return true;
      } else {
        setError(response.data.error || 'خطا در ایجاد سند افتتاحیه');
        return false;
      }
    } catch (error) {
      console.error('❌ خطا در ایجاد سند افتتاحیه:', error);
      setError(error.response?.data?.error || error.message || 'خطا در ایجاد سند افتتاحیه');
      return false;
    } finally {
      setIsCreatingEntry(false);
    }
    };
    
  // ================ Event Handlers ================
  const handleSelectSourceYear = async (year) => {
    console.log('🔍 انتخاب سال مبدأ:', year);
    setSourceYear(year);
    
    // بررسی شرایط افتتاح
    const canOpen = await checkOpeningRequirements(year);
    
    if (canOpen) {
      // دریافت حساب‌های دائمی
      await fetchPermanentAccounts(year);
      
      // انتقال به مرحله ۲
      goToStep(2);
    }
  };

  const handleCreateFiscalYear = async (yearData) => {
    const result = await createNewFiscalYear(yearData);
    return result;
  };

  const handleCreateOpeningEntry = async () => {
    const created = await createOpeningEntry();
    return created;
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete(targetYear);
    }
  };

  const handleFiscalYearSuccess = (success) => {
    setFiscalYearCreated(success);
  };

  // ================ Effects ================
  useEffect(() => {
    fetchFiscalYears();
  }, []);

  // ================ Render ================
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1SelectSourceYear
            fiscalYears={fiscalYears}
            selectedYear={sourceYear}
            setSelectedYear={(year) => handleSelectSourceYear(year)}
            onBack={onBack}
            onNext={() => goToStep(2)}
            loading={loading}
            error={error}
          />
        );
        
      case 2:
        return (
          <Step2CheckPermanentAccounts
            loading={loading}
            error={error}
            sourceYear={sourceYear}
            targetYear={targetYear}
            accounts={permanentAccounts}
            summary={accountSummary}
            onBack={() => goToStep(1)}
            onNext={() => goToStep(3)}
            onRetry={() => fetchPermanentAccounts(sourceYear)}
          />
        );
        
      case 3:
        return (
          <Step3CreateNewFiscalYear
            sourceYear={sourceYear}
            targetYear={targetYear}
            accounts={permanentAccounts}
            summary={accountSummary}
            isCreating={isCreatingYear}
            error={error}
            onBack={() => goToStep(2)}
            onCreateYear={handleCreateFiscalYear}
            onNext={() => goToStep(4)}
            onSuccess={handleFiscalYearSuccess}  // prop جدید
            fiscalYearCreated={fiscalYearCreated}  // prop جدید
          />
        );
        
      case 4:
        return (
          <Step4CreateOpeningEntry
            sourceYear={sourceYear}
            targetYear={targetYear}
            accounts={permanentAccounts}
            summary={accountSummary}
            isCreating={isCreatingEntry}
            error={error}
            success={!!openingResult}
            onBack={() => goToStep(3)}
            onCreateEntry={handleCreateOpeningEntry}
          />
        );
        
      case 5:
        return (
          <Step5OpeningResult
            sourceYear={sourceYear}
            targetYear={targetYear}
            openingResult={openingResult}
            error={error}
            onBack={onBack}
            onComplete={handleComplete}
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
          title="افتتاح سال مالی جدید"
          subtitle="انتقال مانده حساب‌های دائمی از سال بسته شده به سال جدید"
          stepInfo={`مرحله ${currentStep} از ۵`}
          onBack={currentStep === 1 ? onBack : () => goToStep(currentStep - 1)}
        />
        
        <StepIndicator steps={steps} currentStep={currentStep} />
        
        {renderStepContent()}
        
        {error && currentStep < 5 && (
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
        
        {success && currentStep < 5 && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
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

export default StepwiseOpening;