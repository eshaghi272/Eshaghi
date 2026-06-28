import React, { useState, useEffect } from 'react';
import axios from 'axios';
import persian from "react-date-object/calendars/persian";
import persian_en from "react-date-object/locales/persian_en";
import FdatePicker from "../ui/FdatePicker";
import StepwiseClosing from './StepwiseClosing';
import {
  LockOpen,
  Lock,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  FileText,
  Calendar,
  Plus,
  X,
  Download,
  ChevronRight,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Info,
  Shield,
  Home,
  BookOpen,
  Save,
  Clock,
  ChevronLeft,
  ArrowRight,
  ArrowLeft,
  BarChart3,
  Users,
  Database,
  Layers
} from 'lucide-react';

const ClosingAccounts = () => {
  const [showStepwise, setShowStepwise] = useState(false);
  
  // تمام Hooks باید قبل از هر شرطی فراخوانی شوند
  const [fiscalYears, setFiscalYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [temporaryAccounts, setTemporaryAccounts] = useState([]);
  const [closingProcess, setClosingProcess] = useState({
    loading: false,
    error: null,
    success: false,
    result: null
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    type: '',
    title: '',
    message: '',
    onConfirm: null
  });
  const [messageDialog, setMessageDialog] = useState({
    open: false,
    title: '',
    message: '',
    type: 'info'
  });
  const [newYear, setNewYear] = useState({
    yearCode: '',
    startDate: null,
    endDate: null
  });
  const [loading, setLoading] = useState({
    accounts: false,
    years: false,
    profitLoss: false,
    opening: false
  });
  const [profitLossData, setProfitLossData] = useState(null);
  const [closingRequirements, setClosingRequirements] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stepwiseProgress, setStepwiseProgress] = useState(0);

  // Effects
  useEffect(() => {
    fetchFiscalYears();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      fetchTemporaryAccounts();
      checkClosingRequirements();
    }
  }, [selectedYear]);

  // اگر حالت مرحله‌ای فعال است، کامپوننت مرحله‌ای را نمایش بده
  if (showStepwise) {
    return <StepwiseClosing onBack={() => setShowStepwise(false)} />;
  }

  // API Functions
  const fetchFiscalYears = async () => {
    try {
      setLoading(prev => ({ ...prev, years: true }));
      const response = await axios.get('http://localhost:5000/api/closing/fiscal-years');
      setFiscalYears(response.data);
      const activeYear = response.data.find(year => year.IsActive === 1);
      if (activeYear) {
        setSelectedYear(activeYear.YearCode.toString());
      }
    } catch (error) {
      console.error('Error fetching fiscal years:', error);
      showMessage('خطا', 'خطا در دریافت سال‌های مالی', 'error');
    } finally {
      setLoading(prev => ({ ...prev, years: false }));
    }
  };

  const fetchTemporaryAccounts = async () => {
    if (!selectedYear) return;
    
    try {
      setLoading(prev => ({ ...prev, accounts: true }));
      const response = await axios.get(`http://localhost:5000/api/closing/temporary-accounts/${selectedYear}`);
      const accounts = response.data.accounts || [];
      setTemporaryAccounts(accounts);
      calculateProfitLossFromTable(accounts);
    } catch (error) {
      console.error('Error fetching temporary accounts:', error);
      setTemporaryAccounts([]);
      showMessage('خطا', 'خطا در دریافت حساب‌های موقت', 'error');
    } finally {
      setLoading(prev => ({ ...prev, accounts: false }));
    }
  };

  const checkClosingRequirements = async () => {
    if (!selectedYear) return;
    
    try {
      const response = await axios.get(`http://localhost:5000/api/closing/check-closing-requirements/${selectedYear}`);
      setClosingRequirements(response.data);
    } catch (error) {
      console.error('Error checking closing requirements:', error);
      setClosingRequirements(null);
    }
  };

  const calculateProfitLossFromTable = (accounts = temporaryAccounts) => {
    if (!Array.isArray(accounts) || accounts.length === 0) {
      setProfitLossData(null);
      return;
    }
    
    let totalRevenue = 0;
    let totalExpense = 0;
    
    accounts.forEach(account => {
      const debitBalance = account.debitBalance || account.debitTotal || 0;
      const creditBalance = account.creditBalance || account.creditTotal || 0;
      
      if (account.Type === 'درآمد') {
        if (creditBalance > debitBalance) {
          totalRevenue += (creditBalance - debitBalance);
        }
      } else if (account.Type === 'هزینه') {
        if (debitBalance > creditBalance) {
          totalExpense += (debitBalance - creditBalance);
        }
      }
    });
    
    const netProfitLoss = totalRevenue - totalExpense;
    
    setProfitLossData({
      revenues: {
        total: totalRevenue,
        count: accounts.filter(acc => 
          acc.Type === 'درآمد' && ((acc.creditBalance || acc.creditTotal || 0) > (acc.debitBalance || acc.debitTotal || 0))
        ).length
      },
      expenses: {
        total: totalExpense,
        count: accounts.filter(acc => 
          acc.Type === 'هزینه' && ((acc.debitBalance || acc.debitTotal || 0) > (acc.creditBalance || acc.creditTotal || 0))
        ).length
      },
      profitLoss: {
        netProfitLoss: netProfitLoss,
        isProfit: netProfitLoss > 0,
        isLoss: netProfitLoss < 0,
        absoluteValue: Math.abs(netProfitLoss),
        totalRevenue,
        totalExpense
      }
    });
  };

  // Dialog Management
  const showConfirm = (title, message, type, onConfirm) => {
    setConfirmDialog({
      open: true,
      title,
      message,
      type,
      onConfirm
    });
  };

  const showMessage = (title, message, type = 'info') => {
    setMessageDialog({
      open: true,
      title,
      message,
      type
    });
  };

  // Business Logic
  const handleCloseAccounts = () => {
    if (!selectedYear) {
      showMessage('خطا', 'لطفاً یک سال مالی انتخاب کنید', 'error');
      return;
    }

    if (!Array.isArray(temporaryAccounts) || temporaryAccounts.length === 0) {
      showMessage('خطا', 'حساب موقتی برای بستن یافت نشد', 'error');
      return;
    }

    if (closingRequirements?.alreadyClosed) {
      showMessage('خطا', `حساب‌های سال ${selectedYear} قبلاً بسته شده‌اند`, 'error');
      return;
    }

    if (!closingRequirements?.hasCapitalAccount) {
      showMessage('خطا', 'حساب سرمایه یافت نشد. لطفاً حساب سرمایه ایجاد کنید.', 'error');
      return;
    }

    const currentProfitLoss = calculateCurrentProfitLoss();
    const profitLossText = currentProfitLoss.isProfit 
      ? `💰 سود خالص: ${formatCurrency(currentProfitLoss.absoluteValue)}`
      : currentProfitLoss.isLoss
      ? `📉 زیان خالص: ${formatCurrency(currentProfitLoss.absoluteValue)}`
      : '⚖️ تراز صفر';

    const accountsWithBalance = temporaryAccounts.filter(acc => {
      const debitBalance = acc.debitBalance || acc.debitTotal || 0;
      const creditBalance = acc.creditBalance || acc.creditTotal || 0;
      return Math.abs(debitBalance - creditBalance) > 0.01;
    }).length;

    const summary = `
📊 خلاصه عملیات بستن حساب‌ها:

سال مالی: ${selectedYear}
تعداد کل حساب‌های موقت: ${temporaryAccounts.length}
• حساب‌های دارای مانده: ${accountsWithBalance} حساب
• حساب‌های درآمد: ${profitLossData?.revenues?.count || 0} حساب
• حساب‌های هزینه: ${profitLossData?.expenses?.count || 0} حساب

${profitLossText}

✅ حساب سرمایه: ${closingRequirements?.capitalAccount?.AccountCode || '311001'} - ${closingRequirements?.capitalAccount?.TitleFa || 'سرمایه'}
    `;

    showConfirm(
      'تأیید بستن حساب‌ها',
      summary,
      'close',
      () => executeCloseAccounts()
    );
  };

  const calculateCurrentProfitLoss = () => {
    if (!profitLossData) {
      return { netProfitLoss: 0, isProfit: false, isLoss: false, absoluteValue: 0 };
    }
    
    const net = profitLossData.profitLoss?.netProfitLoss || 0;
    return {
      netProfitLoss: net,
      isProfit: net > 0,
      isLoss: net < 0,
      absoluteValue: Math.abs(net)
    };
  };

  const executeCloseAccounts = async () => {
    setClosingProcess({
      loading: true,
      error: null,
      success: false,
      result: null
    });

    try {
      const response = await axios.post('http://localhost:5000/api/closing/close-temporary-accounts', {
        fiscalYear: selectedYear
      });

      setClosingProcess({
        loading: false,
        success: true,
        result: response.data
      });

      fetchTemporaryAccounts();
      checkClosingRequirements();
      
      showMessage('موفقیت', response.data.message || 'حساب‌های موقت با موفقیت بسته شدند', 'success');
      setActiveTab('closing');
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.details || 'خطا در بستن حساب‌ها';
      setClosingProcess({
        loading: false,
        error: errorMessage,
        success: false,
        result: null
      });
      showMessage('خطا', errorMessage, 'error');
    }
  };

  const handleOpenNewYear = () => {
    if (!closingProcess.result?.closingEntryId) {
      showMessage('خطا', 'لطفاً ابتدا حساب‌های سال جاری را ببندید', 'error');
      return;
    }

    const newYearCode = parseInt(selectedYear) + 1;
    showConfirm(
      'تأیید افتتاح سال جدید',
      `آیا از افتتاح سال مالی ${newYearCode} اطمینان دارید؟

      این عملیات:
      1️⃣ مانده حساب‌های دائمی را به سال جدید منتقل می‌کند
      2️⃣ سال مالی جدید را فعال می‌کند
      3️⃣ سند افتتاحیه ایجاد می‌کند

      سال مالی فعلی: ${selectedYear}
      سال مالی جدید: ${newYearCode}`,
      'open',
      () => executeOpenNewYear()
    );
  };

  const executeOpenNewYear = async () => {
    try {
      setLoading(prev => ({ ...prev, opening: true }));
      const response = await axios.post('http://localhost:5000/api/closing/open-new-year', {
        closingEntryId: closingProcess.result.closingEntryId,
        newYearCode: parseInt(selectedYear) + 1
      });

      showMessage('موفقیت', response.data.message || 'سال مالی جدید با موفقیت افتتاح شد', 'success');
      fetchFiscalYears();
      setSelectedYear((parseInt(selectedYear) + 1).toString());
      setActiveTab('accounts');
      setClosingProcess({ loading: false, error: null, success: false, result: null });
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.details || 'خطا در افتتاح سال جدید';
      showMessage('خطا', errorMessage, 'error');
    } finally {
      setLoading(prev => ({ ...prev, opening: false }));
    }
  };

  const handleCreateNewYear = async () => {
    if (!newYear.yearCode || !newYear.startDate || !newYear.endDate) {
      showMessage('خطا', 'پر کردن تمام فیلدها الزامی است', 'error');
      return;
    }

    try {
      // تاریخ‌ها مستقیماً به صورت شمسی ذخیره می‌شوند
      const startDate = newYear.startDate.format('YYYY/MM/DD');
      const endDate = newYear.endDate.format('YYYY/MM/DD');
      
      const response = await axios.post('http://localhost:5000/api/closing/fiscal-years', {
        YearCode: newYear.yearCode,
        StartDate: startDate, // تاریخ شمسی
        EndDate: endDate // تاریخ شمسی
      });
      
      setOpenDialog(false);
      fetchFiscalYears();
      showMessage('موفقیت', response.data.message || `سال مالی ${newYear.yearCode} با موفقیت ایجاد شد`, 'success');
      setNewYear({ yearCode: '', startDate: null, endDate: null });
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'خطا در ایجاد سال مالی';
      showMessage('خطا', errorMessage, 'error');
    }
  };

  // Formatting Functions - تاریخ‌ها شمسی هستند و نیازی به تبدیل ندارند
  const formatDate = (persianDate) => {
    if (!persianDate) return '';
    return persianDate; // مستقیماً تاریخ شمسی را برگردان
  };

  const formatCurrency = (value) => {
    if (value === undefined || value === null || isNaN(value)) return '۰ ریال';
    const absoluteValue = Math.abs(Math.round(value));
    return new Intl.NumberFormat('fa-IR').format(absoluteValue) + ' ریال';
  };

  const getAccountNature = (nature) => {
    const natures = {
      'D': 'بدهکار',
      'C': 'بستانکار',
      'B': 'دوطرفه'
    };
    return natures[nature] || nature;
  };

  const getAccountTypeColor = (type) => {
    const colors = {
      'درآمد': 'bg-green-100 text-green-800 border border-green-200',
      'هزینه': 'bg-red-100 text-red-800 border border-red-200',
      'معین': 'bg-gray-100 text-gray-800 border border-gray-200',
      'سرمایه': 'bg-blue-100 text-blue-800 border border-blue-200',
      'دارایی': 'bg-purple-100 text-purple-800 border border-purple-200',
      'بدهی': 'bg-yellow-100 text-yellow-800 border border-yellow-200'
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border border-gray-200';
  };

  const getBalanceColor = (value, type = 'debit') => {
    if (type === 'debit') {
      return value > 0 ? 'text-red-600 font-medium' : 'text-gray-500';
    }
    return value > 0 ? 'text-green-600 font-medium' : 'text-gray-500';
  };

  const getFinalBalanceText = (account) => {
    if (!account) return '';
    
    const debitBalance = account.debitBalance || account.debitTotal || 0;
    const creditBalance = account.creditBalance || account.creditTotal || 0;
    const netBalance = creditBalance - debitBalance;
    const absBalance = Math.abs(netBalance);
    
    if (Math.abs(netBalance) < 0.01) return 'صفر';
    
    if (account.Type === 'درآمد') {
      if (netBalance > 0.01) {
        return `${formatCurrency(absBalance)} (بستانکار)`;
      } else if (netBalance < -0.01) {
        return `${formatCurrency(absBalance)} (بدهکار)`;
      }
    } else if (account.Type === 'هزینه') {
      if (netBalance < -0.01) {
        return `${formatCurrency(absBalance)} (بدهکار)`;
      } else if (netBalance > 0.01) {
        return `${formatCurrency(absBalance)} (بستانکار)`;
      }
    } else {
      if (netBalance > 0.01) {
        return `${formatCurrency(absBalance)} (بستانکار)`;
      } else if (netBalance < -0.01) {
        return `${formatCurrency(absBalance)} (بدهکار)`;
      }
    }
    
    return 'صفر';
  };

  const getFinalBalanceColor = (account) => {
    if (!account) return 'text-gray-700';
    
    const debitBalance = account.debitBalance || account.debitTotal || 0;
    const creditBalance = account.creditBalance || account.creditTotal || 0;
    const netBalance = creditBalance - debitBalance;
    
    if (Math.abs(netBalance) < 0.01) return 'text-gray-700';
    
    if (account.Type === 'درآمد') {
      if (netBalance > 0.01) return 'text-green-600 font-bold';
      if (netBalance < -0.01) return 'text-red-600 font-bold';
    } else if (account.Type === 'هزینه') {
      if (netBalance < -0.01) return 'text-red-600 font-bold';
      if (netBalance > 0.01) return 'text-green-600 font-bold';
    }
    
    return 'text-gray-700';
  };

  const downloadReport = () => {
    if (!Array.isArray(temporaryAccounts) || temporaryAccounts.length === 0) {
      showMessage('خطا', 'گزارشی برای دانلود وجود ندارد', 'error');
      return;
    }

    const headers = ['کد حساب', 'نام حساب', 'نوع', 'طبیعت', 'مانده بدهکار', 'مانده بستانکار', 'مانده نهایی', 'وضعیت'];
    const rows = temporaryAccounts.map(acc => [
      acc.AccountCode,
      acc.TitleFa,
      acc.Type,
      getAccountNature(acc.Nature),
      formatCurrency(acc.debitBalance || acc.debitTotal || 0),
      formatCurrency(acc.creditBalance || acc.creditTotal || 0),
      getFinalBalanceText(acc),
      acc.isClosed ? 'بسته شده' : 'باز'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `حساب-موقت-${selectedYear}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showMessage('موفقیت', 'گزارش با موفقیت دانلود شد', 'success');
  };

  const calculateTableProfitLoss = () => {
    if (!Array.isArray(temporaryAccounts) || temporaryAccounts.length === 0) {
      return { 
        netProfitLoss: 0, 
        isProfit: false, 
        isLoss: false, 
        absoluteValue: 0,
        totalRevenue: 0,
        totalExpense: 0
      };
    }
    
    let totalRevenue = 0;
    let totalExpense = 0;
    
    temporaryAccounts.forEach(account => {
      const debitBalance = account.debitBalance || account.debitTotal || 0;
      const creditBalance = account.creditBalance || account.creditTotal || 0;
      
      if (account.Type === 'درآمد') {
        const revenue = creditBalance - debitBalance;
        if (revenue > 0.01) totalRevenue += revenue;
      } else if (account.Type === 'هزینه') {
        const expense = debitBalance - creditBalance;
        if (expense > 0.01) totalExpense += expense;
      }
    });
    
    const netProfitLoss = totalRevenue - totalExpense;
    
    return {
      netProfitLoss,
      isProfit: netProfitLoss > 0,
      isLoss: netProfitLoss < 0,
      absoluteValue: Math.abs(netProfitLoss),
      totalRevenue,
      totalExpense
    };
  };

  // Event Handlers
  const handleStartDateChange = (date) => {
    setNewYear({ ...newYear, startDate: date });
  };

  const handleEndDateChange = (date) => {
    setNewYear({ ...newYear, endDate: date });
  };

  // Render Functions
  const renderDashboard = () => (
    <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-full">
            <BarChart3 className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">داشبورد بستن حساب‌ها</h2>
            <p className="text-gray-600">مرور کلی وضعیت حساب‌های موقت</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
            سال مالی: {selectedYear || '--'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 opacity-80" />
            <span className="text-2xl font-bold">{temporaryAccounts.length || 0}</span>
          </div>
          <div className="text-sm font-medium">حساب‌های موقت</div>
          <div className="text-xs opacity-80 mt-1">کل حساب‌های قابل بستن</div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 opacity-80" />
            <span className="text-2xl font-bold">{calculateTableProfitLoss().totalRevenue > 0 ? '💰' : '--'}</span>
          </div>
          <div className="text-sm font-medium">درآمد کل</div>
          <div className="text-xs opacity-80 mt-1">{formatCurrency(calculateTableProfitLoss().totalRevenue)}</div>
        </div>

        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <TrendingDown className="w-8 h-8 opacity-80" />
            <span className="text-2xl font-bold">{calculateTableProfitLoss().totalExpense > 0 ? '💸' : '--'}</span>
          </div>
          <div className="text-sm font-medium">هزینه کل</div>
          <div className="text-xs opacity-80 mt-1">{formatCurrency(calculateTableProfitLoss().totalExpense)}</div>
        </div>

        <div className={`rounded-xl p-6 ${
          calculateTableProfitLoss().isProfit
            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
            : calculateTableProfitLoss().isLoss
            ? 'bg-gradient-to-r from-amber-500 to-amber-600'
            : 'bg-gradient-to-r from-gray-500 to-gray-600'
        } text-white`}>
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 opacity-80" />
            <span className="text-2xl font-bold">
              {calculateTableProfitLoss().isProfit ? '↑' : calculateTableProfitLoss().isLoss ? '↓' : '='}
            </span>
          </div>
          <div className="text-sm font-medium">سود/زیان</div>
          <div className="text-xs opacity-80 mt-1">{formatCurrency(calculateTableProfitLoss().absoluteValue)}</div>
        </div>
      </div>

      <div className="flex justify-center gap-4">
        <button
          onClick={() => setShowStepwise(true)}
          className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl"
        >
          <ArrowRight className="w-5 h-5" />
          شروع بستن مرحله‌ای
        </button>
        
        <button
          onClick={handleCloseAccounts}
          disabled={!selectedYear || loading.accounts || closingProcess.loading || closingRequirements?.alreadyClosed}
          className={`flex items-center gap-3 px-6 py-3 rounded-xl font-medium transition-all ${
            !selectedYear || loading.accounts || closingProcess.loading || closingRequirements?.alreadyClosed
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
          }`}
        >
          {closingProcess.loading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              در حال بستن...
            </>
          ) : (
            <>
              <Lock className="w-5 h-5" />
              بستن سریع حساب‌ها
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderTemporaryAccountsTable = () => (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">حساب‌های موقت سال {selectedYear || '--'}</h3>
              <p className="text-gray-600">لیست کامل حساب‌های درآمد و هزینه</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={downloadReport}
              disabled={!selectedYear || !Array.isArray(temporaryAccounts) || temporaryAccounts.length === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                !selectedYear || !Array.isArray(temporaryAccounts) || temporaryAccounts.length === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              <Download className="w-5 h-5" />
              دانلود گزارش
            </button>
            
            <button
              onClick={fetchTemporaryAccounts}
              disabled={!selectedYear || loading.accounts}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${loading.accounts ? 'animate-spin' : ''}`} />
              بروزرسانی
            </button>
          </div>
        </div>
      </div>

      {loading.accounts ? (
        <div className="p-12 text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">در حال دریافت حساب‌های موقت...</p>
        </div>
      ) : Array.isArray(temporaryAccounts) && temporaryAccounts.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 text-right text-sm font-medium text-gray-500">کد حساب</th>
                  <th className="p-4 text-right text-sm font-medium text-gray-500">نام حساب</th>
                  <th className="p-4 text-right text-sm font-medium text-gray-500">نوع</th>
                  <th className="p-4 text-right text-sm font-medium text-gray-500">طبیعت</th>
                  <th className="p-4 text-right text-sm font-medium text-gray-500">مانده بدهکار</th>
                  <th className="p-4 text-right text-sm font-medium text-gray-500">مانده بستانکار</th>
                  <th className="p-4 text-right text-sm font-medium text-gray-500">مانده نهایی</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {temporaryAccounts.map((account, index) => (
                  <tr key={`${account.AccountCode}-${index}`} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {account.AccountCode}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-gray-900">
                      {account.TitleFa}
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getAccountTypeColor(account.Type)}`}>
                        {account.Type}
                      </span>
                    </td>
                    <td className="p-4 text-gray-700">
                      {getAccountNature(account.Nature)}
                    </td>
                    <td className="p-4 text-left">
                      <span className={`font-medium ${getBalanceColor(account.debitBalance || account.debitTotal || 0, 'debit')}`}>
                        {formatCurrency(account.debitBalance || account.debitTotal || 0)}
                      </span>
                    </td>
                    <td className="p-4 text-left">
                      <span className={`font-medium ${getBalanceColor(account.creditBalance || account.creditTotal || 0, 'credit')}`}>
                        {formatCurrency(account.creditBalance || account.creditTotal || 0)}
                      </span>
                    </td>
                    <td className="p-4 text-left">
                      <span className={`font-medium ${getFinalBalanceColor(account)}`}>
                        {getFinalBalanceText(account)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-gray-50 p-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-sm text-gray-500 mb-1">مجموع مانده بدهکار</div>
                <div className="text-xl font-bold text-red-600">
                  {formatCurrency(temporaryAccounts.reduce((sum, acc) => sum + (acc.debitBalance || acc.debitTotal || 0), 0))}
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-sm text-gray-500 mb-1">مجموع مانده بستانکار</div>
                <div className="text-xl font-bold text-green-600">
                  {formatCurrency(temporaryAccounts.reduce((sum, acc) => sum + (acc.creditBalance || acc.creditTotal || 0), 0))}
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-sm text-gray-500 mb-1">تعداد حساب‌ها</div>
                <div className="text-xl font-bold text-blue-600">
                  {temporaryAccounts.length} حساب
                </div>
              </div>
              
              <div className={`p-4 rounded-lg border ${
                calculateTableProfitLoss().isProfit 
                  ? 'bg-green-50 border-green-200' 
                  : calculateTableProfitLoss().isLoss
                  ? 'bg-red-50 border-red-200'
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className={`text-sm mb-1 ${
                  calculateTableProfitLoss().isProfit 
                    ? 'text-green-800' 
                    : calculateTableProfitLoss().isLoss
                    ? 'text-red-800'
                    : 'text-gray-800'
                }`}>
                  سود/زیان خالص
                </div>
                <div className={`text-xl font-bold ${
                  calculateTableProfitLoss().isProfit 
                    ? 'text-green-900' 
                    : calculateTableProfitLoss().isLoss
                    ? 'text-red-900'
                    : 'text-gray-900'
                }`}>
                  {formatCurrency(calculateTableProfitLoss().absoluteValue)}
                  <span className="text-sm font-normal mr-2">
                    {calculateTableProfitLoss().isProfit 
                      ? '(سود)' 
                      : calculateTableProfitLoss().isLoss
                      ? '(زیان)'
                      : '(تراز)'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="p-12 text-center">
          <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">
            {selectedYear ? 'حساب موقتی یافت نشد' : 'لطفاً سال مالی انتخاب کنید'}
          </p>
          {selectedYear && (
            <p className="text-sm text-gray-500">
              یا حساب‌های موقت برای این سال مالی وجود ندارد یا همه حساب‌ها بسته شده‌اند
            </p>
          )}
        </div>
      )}
    </div>
  );

  const renderClosingResult = () => (
    closingProcess.result && (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-green-100 p-3 rounded-full">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">عملیات با موفقیت انجام شد</h2>
            <p className="text-gray-600">نتایج بستن حساب‌های موقت</p>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-full">
              <Lock className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-bold text-green-800">✅ عملیات موفق</h4>
              <p className="text-green-700 mt-1">{closingProcess.result.message}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-100 p-2 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-blue-800">سند اختتامیه</div>
                <div className="text-2xl font-bold text-blue-900">
                  #{closingProcess.result.closingEntryId}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">تاریخ:</span>
                <span className="font-medium">
                  {new Date().toLocaleDateString('fa-IR')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">سال مالی:</span>
                <span className="font-medium">{closingProcess.result.fiscalYear}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-purple-100 p-2 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-purple-800">حساب سرمایه</div>
                <div className="text-2xl font-bold text-purple-900">
                  {closingProcess.result.capitalAccount?.code || closingProcess.result.capitalAccount?.AccountCode}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {closingProcess.result.capitalAccount?.title || closingProcess.result.capitalAccount?.TitleFa || 'حساب سرمایه'}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">مبلغ انتقال:</span>
                <span className={`font-bold ${
                  closingProcess.result.netProfitLoss > 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {formatCurrency(Math.abs(closingProcess.result.netProfitLoss))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">نوع:</span>
                <span className={`font-medium ${
                  closingProcess.result.netProfitLoss > 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {closingProcess.result.netProfitLoss > 0 ? 'سود' : 'زیان'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => setActiveTab('opening')}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors shadow-lg hover:shadow-xl"
          >
            ادامه برای افتتاح سال جدید
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    )
  );

  const renderOpeningYear = () => (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-emerald-100 p-3 rounded-full">
          <Calendar className="w-8 h-8 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">افتتاح سال مالی جدید</h2>
          <p className="text-gray-600">افتتاح سال مالی پس از بستن حساب‌های موقت</p>
        </div>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-100 p-3 rounded-full">
            <Shield className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-bold text-emerald-800">آماده برای افتتاح سال جدید</h4>
            <p className="text-emerald-700 mt-1">
              پس از بستن حساب‌های سال {selectedYear}، می‌توانید سال مالی جدید {parseInt(selectedYear) + 1} را افتتاح کنید.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-100 p-2 rounded-lg">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-blue-800">سال مالی فعلی</div>
              <div className="text-2xl font-bold text-blue-900">
                {selectedYear}
              </div>
            </div>
          </div>
          <div className="text-sm text-blue-700">
            حساب‌های موقت بسته شده
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-green-100 p-2 rounded-lg">
              <Layers className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-green-800">سال مالی جدید</div>
              <div className="text-2xl font-bold text-green-900">
                {parseInt(selectedYear) + 1}
              </div>
            </div>
          </div>
          <div className="text-sm text-green-700">
            آماده برای افتتاح
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Database className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-purple-800">حساب‌های دائمی</div>
              <div className="text-2xl font-bold text-purple-900">
                منتقل می‌شوند
              </div>
            </div>
          </div>
          <div className="text-sm text-purple-700">
            به سال جدید منتقل می‌شوند
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setActiveTab('accounts')}
          className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl font-medium transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          بازگشت به حساب‌ها
        </button>
        
        <button
          onClick={handleOpenNewYear}
          disabled={!closingProcess.result || loading.opening}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${
            !closingProcess.result || loading.opening
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl'
          }`}
        >
          <Calendar className="w-5 h-5" />
          افتتاح سال مالی جدید
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white rounded-2xl p-8 mb-8 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
                <LockOpen className="w-10 h-10" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl lg:text-4xl font-bold mb-3">
                  بستن حساب‌های موقت و افتتاحیه
                </h1>
                <p className="text-blue-100 text-lg">
                  عملیات پایان سال مالی • انتقال سود و زیان به حساب سرمایه
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setOpenDialog(true)}
                className="flex items-center gap-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-5 py-3 rounded-xl font-medium transition-all"
              >
                <Plus className="w-5 h-5" />
                ایجاد سال مالی جدید
              </button>
              <button
                onClick={() => setShowStepwise(true)}
                className="flex items-center gap-3 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white px-5 py-3 rounded-xl font-medium transition-all shadow-lg"
              >
                <ArrowRight className="w-5 h-5" />
                شروع مرحله‌ای
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex-1 min-w-[180px] py-4 px-6 text-center font-medium transition-all ${
                activeTab === 'dashboard' 
                  ? 'text-blue-600 border-b-4 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-3">
                <BarChart3 className="w-5 h-5" />
                داشبورد
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('accounts')}
              className={`flex-1 min-w-[180px] py-4 px-6 text-center font-medium transition-all ${
                activeTab === 'accounts' 
                  ? 'text-blue-600 border-b-4 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-3">
                <Database className="w-5 h-5" />
                حساب‌های موقت
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('closing')}
              className={`flex-1 min-w-[180px] py-4 px-6 text-center font-medium transition-all ${
                activeTab === 'closing' 
                  ? 'text-blue-600 border-b-4 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              disabled={!closingProcess.result}
            >
              <div className="flex items-center justify-center gap-3">
                <Lock className="w-5 h-5" />
                نتیجه بستن
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('opening')}
              className={`flex-1 min-w-[180px] py-4 px-6 text-center font-medium transition-all ${
                activeTab === 'opening' 
                  ? 'text-blue-600 border-b-4 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-3">
                <Calendar className="w-5 h-5" />
                افتتاح سال جدید
              </div>
            </button>
          </div>
        </div>

        {/* Year Selection and Status */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                سال مالی
              </label>
              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none bg-white"
                  disabled={loading.years}
                >
                  <option value="">انتخاب سال مالی</option>
                  {fiscalYears.map((year) => (
                    <option key={year.YearCode} value={year.YearCode.toString()}>
                      {year.YearCode} {year.IsActive === 1 ? '(فعال)' : ''}
                    </option>
                  ))}
                </select>
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Calendar className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>
            
            {selectedYear && closingRequirements && (
              <div className="lg:col-span-2">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${closingRequirements.checks.fiscalYearExists ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-sm text-gray-700">سال مالی وجود دارد</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${closingRequirements.checks.hasCapitalAccount ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-sm text-gray-700">حساب سرمایه موجود است</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${closingRequirements.checks.notAlreadyClosed ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-sm text-gray-700">حساب‌ها بسته نشده</span>
                    </div>
                  </div>
                  {closingRequirements.hasCapitalAccount && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <div className="text-sm text-gray-600">
                        حساب سرمایه: 
                        <span className="font-bold mr-2">
                          {closingRequirements.capitalAccount.AccountCode} - {closingRequirements.capitalAccount.TitleFa}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'accounts' && renderTemporaryAccountsTable()}
        {activeTab === 'closing' && renderClosingResult()}
        {activeTab === 'opening' && renderOpeningYear()}

        {/* Create New Year Dialog */}
        {openDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">ایجاد سال مالی جدید</h3>
                <button
                  onClick={() => setOpenDialog(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      کد سال مالی <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newYear.yearCode}
                      onChange={(e) => setNewYear({...newYear, yearCode: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-left font-sans"
                      placeholder="۱۴۰۴"
                      dir="ltr"
                    />
                    <div className="mt-1 text-xs text-gray-500">
                      مثال: ۱۴۰۴ برای سال مالی ۱۴۰۴-۱۴۰۵
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <label className="w-32 text-gray-700">تاریخ شروع:</label>
                    <div className="flex-1">
                      <FdatePicker
                        calendar={persian}
                        locale={persian_en}
                        value={newYear.startDate}
                        onChange={handleStartDateChange}
                        format="YYYY/MM/DD"
                        inputClass="border rounded-lg p-2 w-full"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <label className="w-32 text-gray-700">تاریخ پایان:</label>
                    <div className="flex-1">
                      <FdatePicker
                        calendar={persian}
                        locale={persian_en}
                        value={newYear.endDate}
                        onChange={handleEndDateChange}
                        format="YYYY/MM/DD"
                        inputClass="border rounded-lg p-2 w-full"
                      />
                    </div>
                  </div>
                  
                  {newYear.startDate && newYear.endDate && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="text-sm font-medium text-blue-800 mb-2">خلاصه سال مالی:</div>
                      <div className="space-y-1 text-sm text-gray-700">
                        <div>سال مالی: <span className="font-bold">{newYear.yearCode}</span></div>
                        <div>از تاریخ: <span className="font-bold">{newYear.startDate?.format('YYYY/MM/DD')}</span></div>
                        <div>تا تاریخ: <span className="font-bold">{newYear.endDate?.format('YYYY/MM/DD')}</span></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => setOpenDialog(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                >
                  انصراف
                </button>
                <button
                  onClick={handleCreateNewYear}
                  disabled={!newYear.yearCode || !newYear.startDate || !newYear.endDate}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    !newYear.yearCode || !newYear.startDate || !newYear.endDate
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  ایجاد سال مالی
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Dialog */}
        {confirmDialog.open && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-800">{confirmDialog.title}</h3>
              </div>
              
              <div className="p-6">
                <div className="whitespace-pre-line text-gray-700 mb-4">{confirmDialog.message}</div>
                {confirmDialog.type === 'close' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div className="text-sm text-amber-800">
                        <strong>هشدار:</strong> این عملیات غیرقابل بازگشت است. لطفاً قبل از ادامه از صحت اطلاعات اطمینان حاصل کنید.
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => setConfirmDialog({ open: false, type: '', title: '', message: '', onConfirm: null })}
                  className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                >
                  انصراف
                </button>
                <button
                  onClick={() => {
                    if (confirmDialog.onConfirm) confirmDialog.onConfirm();
                    setConfirmDialog({ open: false, type: '', title: '', message: '', onConfirm: null });
                  }}
                  className={`px-4 py-2 rounded-lg font-medium text-white transition-colors ${
                    confirmDialog.type === 'close' 
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  تأیید و ادامه
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Message Dialog */}
        {messageDialog.open && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className={`p-6 border-b ${
                messageDialog.type === 'error' ? 'border-red-200' :
                messageDialog.type === 'success' ? 'border-green-200' :
                'border-blue-200'
              }`}>
                <div className="flex items-center gap-3">
                  {messageDialog.type === 'error' && <AlertCircle className="w-6 h-6 text-red-600" />}
                  {messageDialog.type === 'success' && <CheckCircle className="w-6 h-6 text-green-600" />}
                  {messageDialog.type === 'info' && <FileText className="w-6 h-6 text-blue-600" />}
                  <h3 className="text-xl font-bold text-gray-800">{messageDialog.title}</h3>
                </div>
              </div>
              
              <div className="p-6">
                <p className="text-gray-700">{messageDialog.message}</p>
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setMessageDialog({ open: false, title: '', message: '', type: 'info' })}
                  className={`px-4 py-2 rounded-lg font-medium text-white transition-colors ${
                    messageDialog.type === 'error' ? 'bg-red-600 hover:bg-red-700' :
                    messageDialog.type === 'success' ? 'bg-green-600 hover:bg-green-700' :
                    'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  متوجه شدم
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClosingAccounts;