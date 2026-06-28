// components/payroll/PayrollAccounting.jsx
import { useState, useEffect, useCallback } from "react";
import { 
  FileText, DollarSign, Users, CheckCircle, 
  AlertCircle, RefreshCw, Calendar, User,
  TrendingUp, Receipt, BookOpen, ChevronDown,
  ChevronUp, CreditCard, Building, Wallet, Search, X
} from "lucide-react";

export default function PayrollAccounting() {
  const [payrolls, setPayrolls] = useState([]);
  const [filteredPayrolls, setFilteredPayrolls] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPayrolls, setLoadingPayrolls] = useState(false);
  const [expandedRows, setExpandedRows] = useState([]);
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [filterStatus, setFilterStatus] = useState("unposted"); // unposted, posted, all
  const [periods, setPeriods] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // تابع فرمت اعداد
  const formatNumber = useCallback((num) => {
    return new Intl.NumberFormat('fa-IR').format(Math.round(num || 0));
  }, []);

  // دریافت لیست فیش‌های حقوقی
  const fetchPayrolls = useCallback(async () => {
    setLoadingPayrolls(true);
    try {
      const res = await fetch("http://localhost:5000/api/payroll");
      if (!res.ok) throw new Error("خطا در دریافت فیش‌های حقوقی");
      const data = await res.json();
      
      if (data.success) {
        // استخراج دوره‌های منحصر به فرد
        const uniquePeriods = [...new Set(data.data.map(p => p.Period))];
        setPeriods(uniquePeriods.map(p => ({ value: p, label: p })));
        
        // پردازش داده‌ها: استفاده از IsPosted و DocNumber برای تعیین وضعیت
        const processedPayrolls = data.data.map(payroll => {
          // تبدیل IsPosted به عدد برای بررسی راحت‌تر
          const isPosted = parseInt(payroll.IsPosted) === 1;
          const hasEntry = isPosted && payroll.DocNumber;
          
          return {
            ...payroll,
            hasAccountingEntry: hasEntry,
            isPosted: isPosted,
            docNumber: payroll.DocNumber
          };
        });
        
        setPayrolls(processedPayrolls);
        setFilteredPayrolls(processedPayrolls);
      }
    } catch (err) {
      console.error("❌ خطا در دریافت فیش‌های حقوقی:", err);
      alert("❌ خطا در دریافت فیش‌های حقوقی");
    } finally {
      setLoadingPayrolls(false);
    }
  }, []);

  useEffect(() => {
    fetchPayrolls();
  }, [fetchPayrolls]);

  // فیلتر کردن فیش‌ها بر اساس دوره، وضعیت و جستجو
  useEffect(() => {
    let result = [...payrolls];
    
    // فیلتر بر اساس دوره
    if (filterPeriod !== "all") {
      result = result.filter(p => p.Period === filterPeriod);
    }
    
    // فیلتر بر اساس وضعیت سند (با استفاده از IsPosted)
    if (filterStatus !== "all") {
      if (filterStatus === "unposted") {
        result = result.filter(p => !p.isPosted || p.isPosted === 0);
      } else if (filterStatus === "posted") {
        result = result.filter(p => p.isPosted === 1 && p.docNumber);
      }
    }
    
    // فیلتر بر اساس جستجو
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.FullName?.toLowerCase().includes(term) ||
        p.PersonnelCode?.toLowerCase().includes(term) ||
        p.Period?.toLowerCase().includes(term) ||
        p.docNumber?.toLowerCase().includes(term)
      );
    }
    
    setFilteredPayrolls(result);
  }, [payrolls, filterPeriod, filterStatus, searchTerm]);

  // تابع انتخاب/لغو انتخاب
  const toggleSelection = useCallback((id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }, []);

  // انتخاب همه فیش‌های بدون سند
  const toggleAll = useCallback(() => {
    const unpostedPayrolls = filteredPayrolls.filter(p => !p.isPosted || p.isPosted === 0);
    const unpostedIds = unpostedPayrolls.map(p => p.PayrollId);
    
    if (selectedIds.length === unpostedIds.length && unpostedIds.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(unpostedIds);
    }
  }, [filteredPayrolls, selectedIds]);

  // گسترش ردیف
  const toggleRowExpand = useCallback((id) => {
    setExpandedRows(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }, []);

  // صدور سند حسابداری برای فیش‌های انتخاب شده
  const generateAccountingEntries = async () => {
    if (selectedIds.length === 0) {
      alert("⚠️ هیچ فیش حقوقی انتخاب نشده است");
      return;
    }
    
    // بررسی که آیا همه فیش‌های انتخابی بدون سند هستند
    const selectedPayrolls = filteredPayrolls.filter(p => selectedIds.includes(p.PayrollId));
    const alreadyPosted = selectedPayrolls.filter(p => p.isPosted === 1);
    
    if (alreadyPosted.length > 0) {
      alert(`⚠️ ${alreadyPosted.length} فیش از موارد انتخاب شده قبلاً سند حسابداری دریافت کرده‌اند. لطفاً فقط فیش‌های بدون سند را انتخاب کنید.`);
      return;
    }
    
    if (!window.confirm(`آیا از صدور سند حسابداری برای ${selectedIds.length} فیش حقوقی اطمینان دارید؟`)) {
      return;
    }
    
    setLoading(true);
    const startTime = Date.now();
    
    try {
      let successCount = 0;
      let errorCount = 0;
      const errors = [];
      const results = [];
      
      // برای هر فیش انتخابی سند حسابداری ایجاد می‌کنیم
      for (const [index, payrollId] of selectedIds.entries()) {
        try {
          console.log(`📝 [${index + 1}/${selectedIds.length}] صدور سند برای فیش ${payrollId}...`);
          
          const res = await fetch(`http://localhost:5000/api/payroll/${payrollId}/generate-entry`, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Accept": "application/json"
            }
          });
          
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || `خطای ${res.status}`);
          }
          
          const result = await res.json();
          console.log(`✅ سند صادر شد برای ${payrollId}:`, result);
          
          successCount++;
          results.push({
            payrollId,
            entryId: result.entryId,
            documentNumber: result.documentNumber
          });
          
          // تاخیر کوتاه بین درخواست‌ها
          if (index < selectedIds.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
          
        } catch (err) {
          console.error(`❌ خطا در صدور سند برای ${payrollId}:`, err);
          errors.push({ 
            payrollId, 
            error: err.message 
          });
          errorCount++;
        }
      }
      
      // نمایش نتایج
      const duration = Math.round((Date.now() - startTime) / 1000);
      
      let message = "";
      if (successCount > 0) {
        message += `✅ ${successCount} سند حسابداری با موفقیت صادر شد.\n`;
        if (results.length > 0) {
          message += `📋 شماره اسناد:\n`;
          results.forEach(r => {
            message += `   - فیش ${r.payrollId}: سند ${r.documentNumber}\n`;
          });
        }
      }
      if (errorCount > 0) {
        message += `\n❌ ${errorCount} مورد با خطا مواجه شد:\n`;
        errors.forEach(err => {
          message += `   - فیش ${err.payrollId}: ${err.error}\n`;
        });
      }
      
      alert(message);
      
      // بازنشانی انتخاب‌ها و بارگذاری مجدد
      setSelectedIds([]);
      await fetchPayrolls();
      
    } catch (err) {
      console.error("💥 خطای کلی در صدور سند:", err);
      alert(`❌ خطای سیستمی در صدور سند: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // محاسبه جمع‌های انتخابی
  const totals = filteredPayrolls.filter(p => selectedIds.includes(p.PayrollId)).reduce(
    (acc, payroll) => {
      acc.totalGrossSalary += payroll.GrossSalary || 0;
      acc.totalNetSalary += payroll.NetSalary || 0;
      acc.totalDeductions += payroll.Deductions || 0;
      acc.totalInsurance += (payroll.InsuranceEmployee || 0) + (payroll.InsuranceEmployer || 0);
      acc.count++;
      return acc;
    },
    { count: 0, totalGrossSalary: 0, totalNetSalary: 0, totalDeductions: 0, totalInsurance: 0 }
  );

  // تابع نمایش جزئیات فیش
  const showPayrollDetails = (payroll) => {
    const statusText = payroll.isPosted === 1 && payroll.docNumber ? 
      `✅ صادر شده (شماره سند: ${payroll.docNumber})` : 
      '⏳ منتظر صدور';
    
    alert(`🧾 فیش حقوقی ${payroll.FullName}
    
📅 دوره: ${payroll.Period}
👤 کد پرسنلی: ${payroll.PersonnelCode}

💰 درآمدها:
حقوق پایه: ${formatNumber(payroll.BaseSalary)} ریال
اضافه‌کاری: ${formatNumber(payroll.OvertimeAmount)} ریال
سنوات: ${formatNumber(payroll.SeniorityPay)} ریال
مسکن: ${formatNumber(payroll.HousingAllowance)} ریال
خوراک: ${formatNumber(payroll.FoodAllowance)} ریال
همسر: ${formatNumber(payroll.MarriageAllowance)} ریال
فرزند: ${formatNumber(payroll.ChildAllowanceTotal)} ریال

➖ کسورات:
بیمه سهم کارگر: ${formatNumber(payroll.InsuranceEmployee)} ریال
بیمه سهم کارفرما: ${formatNumber(payroll.InsuranceEmployer)} ریال
مالیات: ${formatNumber(payroll.TaxAmount)} ریال

📊 جمع‌بندی:
حقوق ناخالص: ${formatNumber(payroll.GrossSalary)} ریال
کسورات کل: ${formatNumber(payroll.Deductions)} ریال
حقوق خالص: ${formatNumber(payroll.NetSalary)} ریال

📝 وضعیت سند: ${statusText}
    `);
  };

  // مشاهده سند حسابداری
  const viewAccountingEntry = useCallback(async (payroll) => {
    if (!payroll.docNumber) return;
    
    try {
      // دریافت سند بر اساس شماره سند
      const res = await fetch(`http://localhost:5000/api/journalentries?documentNumber=${payroll.docNumber}`);
      if (!res.ok) throw new Error("خطا در دریافت اطلاعات سند");
      const data = await res.json();
      
      if (data.success && data.data && data.data.length > 0) {
        const entry = data.data[0];
        alert(`📄 سند حسابداری
شماره سند: ${entry.DocumentNumber}
تاریخ: ${entry.EntryDate}
شرح: ${entry.Description}
نوع: ${entry.TypeDoc || 'نامشخص'}
وضعیت تراز: ${entry.IsBalanced ? '✅ متعادل' : '⚠️ نامتعادل'}
تاریخ ایجاد: ${new Date(entry.CreatedAt).toLocaleDateString('fa-IR')}
        `);
      } else {
        alert(`✅ سند حسابداری صادر شده\nشماره سند: ${payroll.docNumber}\nبرای فیش حقوقی ${payroll.FullName}`);
      }
    } catch (err) {
      console.error("❌ خطا در مشاهده سند:", err);
      alert(`✅ سند حسابداری صادر شده\nشماره سند: ${payroll.docNumber}\nبرای فیش حقوقی ${payroll.FullName}`);
    }
  }, []);

  // صدور سند برای یک فیش خاص
  const generateSingleEntry = async (payroll) => {
    if (payroll.isPosted === 1) {
      alert(`⚠️ برای فیش ${payroll.FullName} قبلاً سند حسابداری صادر شده است.\nشماره سند: ${payroll.docNumber || 'نامشخص'}`);
      return;
    }
    
    if (!window.confirm(`آیا از صدور سند برای ${payroll.FullName} اطمینان دارید؟`)) return;
    
    try {
      const res = await fetch(`http://localhost:5000/api/payroll/${payroll.PayrollId}/generate-entry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      
      if (res.ok) {
        const data = await res.json();
        alert(`✅ سند حسابداری صادر شد\nشماره سند: ${data.documentNumber}\nبرای فیش حقوقی ${payroll.FullName}`);
        await fetchPayrolls();
      } else {
        const error = await res.json();
        throw new Error(error.error || "خطا در صدور سند");
      }
    } catch (err) {
      alert(`❌ خطا در صدور سند: ${err.message}`);
    }
  };

  // بازنشانی جستجو
  const clearSearch = () => {
    setSearchTerm("");
  };

  // تعداد فیش‌های بدون سند
  const unpostedCount = payrolls.filter(p => !p.isPosted || p.isPosted === 0).length;
  const postedCount = payrolls.filter(p => p.isPosted === 1 && p.docNumber).length;

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900 min-h-screen w-full">
      {/* هدر */}
      <div className="mb-4 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
              <BookOpen className="h-5 w-5 ml-2 text-blue-600" />
              صدور سند حسابداری حقوق
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">
              صدور سند حسابداری برای فیش‌های حقوقی ثبت شده
              <span className="mr-2 text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                هزینه‌ها بدهکار / حساب پرداختنی بستانکار
              </span>
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={fetchPayrolls}
              disabled={loadingPayrolls}
              className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs"
            >
              <RefreshCw className="h-3.5 w-3.5 ml-1.5" />
              بروزرسانی
              {loadingPayrolls && (
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white mr-1"></div>
              )}
            </button>
            
            <button
              onClick={generateAccountingEntries}
              disabled={loading || selectedIds.length === 0}
              className={`inline-flex items-center px-4 py-1.5 rounded-lg text-xs font-medium shadow transition-all ${
                selectedIds.length > 0
                  ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white hover:shadow-md"
                  : "bg-gray-400 dark:bg-gray-700 text-gray-300 dark:text-gray-500 cursor-not-allowed"
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-1.5"></div>
                  در حال صدور...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 ml-1.5" />
                  صدور سند ({selectedIds.length})
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* خلاصه وضعیت */}
        <div className="mt-3 grid grid-cols-3 md:grid-cols-6 gap-1.5">
          <div className="bg-gray-100 dark:bg-gray-700 p-1.5 rounded">
            <div className="text-xs text-gray-600 dark:text-gray-400">کل فیش‌ها</div>
            <div className="font-bold text-sm">{payrolls.length}</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-1.5 rounded">
            <div className="text-xs text-blue-600 dark:text-blue-400">بدون سند</div>
            <div className="font-bold text-blue-600 dark:text-blue-400 text-sm">
              {unpostedCount}
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-1.5 rounded">
            <div className="text-xs text-green-600 dark:text-green-400">دارای سند</div>
            <div className="font-bold text-green-600 dark:text-green-400 text-sm">
              {postedCount}
            </div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-1.5 rounded">
            <div className="text-xs text-purple-600 dark:text-purple-400">انتخاب شده</div>
            <div className="font-bold text-purple-600 dark:text-purple-400 text-sm">
              {selectedIds.length}
            </div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-1.5 rounded">
            <div className="text-xs text-yellow-600 dark:text-yellow-400">دوره</div>
            <div className="font-bold text-yellow-600 dark:text-yellow-400 text-sm">
              {filterPeriod === "all" ? "همه" : filterPeriod}
            </div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 p-1.5 rounded">
            <div className="text-xs text-red-600 dark:text-red-400">حقوق خالص</div>
            <div className="font-bold text-red-600 dark:text-red-400 text-sm">
              {formatNumber(totals.totalNetSalary)}
            </div>
          </div>
        </div>
      </div>

      {/* فیلترها و جستجو */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* جستجو */}
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center">
            <Search className="h-3.5 w-3.5 ml-1.5" />
            جستجو
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-1.5 pr-8 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              placeholder="نام، کد پرسنلی، دوره یا شماره سند..."
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* فیلتر دوره */}
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center">
            <Calendar className="h-3.5 w-3.5 ml-1.5" />
            فیلتر دوره
          </label>
          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
          >
            <option value="all">همه دوره‌ها</option>
            {periods.map(period => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>
        </div>

        {/* فیلتر وضعیت سند */}
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center">
            <FileText className="h-3.5 w-3.5 ml-1.5" />
            وضعیت سند
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
          >
            <option value="all">همه</option>
            <option value="unposted">بدون سند (IsPosted = 0)</option>
            <option value="posted">دارای سند (IsPosted = 1)</option>
          </select>
        </div>

        {/* اطلاعات مالی */}
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
          <h3 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
            <DollarSign className="h-3.5 w-3.5 ml-1.5" />
            اطلاعات مالی انتخابی
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center p-1.5 bg-green-50 dark:bg-green-900/20 rounded">
              <div className="text-sm font-bold text-green-600 dark:text-green-400">
                {selectedIds.length}
              </div>
              <div className="text-[10px] text-gray-600 dark:text-gray-400">تعداد</div>
            </div>
            <div className="text-center p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded">
              <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {formatNumber(totals.totalNetSalary)}
              </div>
              <div className="text-[10px] text-gray-600 dark:text-gray-400">خالص</div>
            </div>
          </div>
        </div>
      </div>

      {/* گزینه انتخاب همه */}
      {filteredPayrolls.length > 0 && (
        <div className="mb-3 flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
          <div className="flex items-center space-x-2 space-x-reverse">
            <input
              type="checkbox"
              id="selectAll"
              checked={selectedIds.length === filteredPayrolls.filter(p => !p.isPosted || p.isPosted === 0).length && 
                       filteredPayrolls.filter(p => !p.isPosted || p.isPosted === 0).length > 0}
              onChange={toggleAll}
              disabled={filteredPayrolls.filter(p => !p.isPosted || p.isPosted === 0).length === 0}
              className="h-3.5 w-3.5 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
            />
            <label htmlFor="selectAll" className="text-xs font-medium text-gray-700 dark:text-gray-300">
              انتخاب همه بدون سند ({filteredPayrolls.filter(p => !p.isPosted || p.isPosted === 0).length})
            </label>
          </div>
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="text-xs font-medium text-blue-600 dark:text-blue-400">
              {selectedIds.length} فیش انتخاب شده
            </div>
            <button
              onClick={() => {
                const unpostedCount = filteredPayrolls.filter(p => !p.isPosted || p.isPosted === 0).length;
                const postedCount = filteredPayrolls.filter(p => p.isPosted === 1 && p.docNumber).length;
                alert(`📊 آمار فیلتر شده:
📈 کل: ${filteredPayrolls.length}
⏳ بدون سند: ${unpostedCount}
✅ دارای سند: ${postedCount}
👥 انتخاب شده: ${selectedIds.length}
💰 حقوق خالص انتخابی: ${formatNumber(totals.totalNetSalary)} ریال`);
              }}
              className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              نمایش آمار
            </button>
          </div>
        </div>
      )}

      {/* جدول فیش‌های حقوقی */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full w-full divide-y divide-gray-200 dark:divide-gray-700 text-xs">
            <thead className="bg-gray-100 dark:bg-gray-900">
              <tr>
                <th className="w-8 px-2 py-1.5"></th>
                <th className="w-8 px-2 py-1.5">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredPayrolls.filter(p => !p.isPosted || p.isPosted === 0).length && 
                             filteredPayrolls.filter(p => !p.isPosted || p.isPosted === 0).length > 0}
                    onChange={toggleAll}
                    disabled={filteredPayrolls.filter(p => !p.isPosted || p.isPosted === 0).length === 0}
                    className="h-3.5 w-3.5 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
                  />
                </th>
                <th className="px-2 py-1.5 text-right font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  اطلاعات پرسنل
                </th>
                <th className="px-2 py-1.5 text-right font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  دوره
                </th>
                <th className="px-2 py-1.5 text-right font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  حقوق ناخالص
                </th>
                <th className="px-2 py-1.5 text-right font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  حقوق خالص
                </th>
                <th className="px-2 py-1.5 text-right font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  وضعیت سند
                </th>
                <th className="w-20 px-2 py-1.5 text-right font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  عملیات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loadingPayrolls ? (
                <tr>
                  <td colSpan="8" className="px-2 py-4 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">در حال بارگذاری فیش‌ها...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredPayrolls.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-2 py-4 text-center text-gray-500 dark:text-gray-400">
                    هیچ فیش حقوقی یافت نشد
                  </td>
                </tr>
              ) : (
                filteredPayrolls.map((payroll) => {
                  const isExpanded = expandedRows.includes(payroll.PayrollId);
                  const isSelected = selectedIds.includes(payroll.PayrollId);
                  const hasEntry = payroll.isPosted === 1 && payroll.docNumber;
                  const canSelect = !hasEntry;
                  
                  return (
                    <tbody key={payroll.PayrollId}>
                      <tr 
                        className={`hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors ${
                          isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        } ${hasEntry ? 'opacity-90' : ''}`}
                      >
                        {/* دکمه گسترش */}
                        <td className="px-2 py-1.5 whitespace-nowrap">
                          <button
                            onClick={() => toggleRowExpand(payroll.PayrollId)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </td>

                        {/* ستون انتخاب */}
                        <td className="px-2 py-1.5 whitespace-nowrap">
                          <div className="flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelection(payroll.PayrollId)}
                              className="h-3.5 w-3.5 text-blue-600 rounded focus:ring-blue-500"
                              disabled={!canSelect}
                            />
                          </div>
                        </td>

                        {/* اطلاعات پرسنل */}
                        <td className="px-2 py-1.5 whitespace-nowrap">
                          <div className="min-w-[150px]">
                            <div className="font-medium text-gray-900 dark:text-white text-xs">
                              {payroll.FullName}
                            </div>
                            <div className="text-gray-600 dark:text-gray-400 text-[10px] mt-0.5">
                              <div>کد: {payroll.PersonnelCode}</div>
                              <div>کد ملی: {payroll.NationalCode}</div>
                            </div>
                          </div>
                        </td>

                        {/* دوره */}
                        <td className="px-2 py-1.5 whitespace-nowrap">
                          <div className="text-gray-700 dark:text-gray-300">
                            <div className="font-medium">{payroll.Period}</div>
                            <div className="text-[10px] text-gray-500 dark:text-gray-400">
                              {payroll.PayDate}
                            </div>
                          </div>
                        </td>

                        {/* حقوق ناخالص */}
                        <td className="px-2 py-1.5 whitespace-nowrap">
                          <div className="text-blue-600 dark:text-blue-400 font-medium">
                            {formatNumber(payroll.GrossSalary)}
                          </div>
                          <div className="text-[10px] text-red-600 dark:text-red-400">
                            کسورات: {formatNumber(payroll.Deductions)}
                          </div>
                        </td>

                        {/* حقوق خالص */}
                        <td className="px-2 py-1.5 whitespace-nowrap">
                          <div className="font-bold text-green-600 dark:text-green-400">
                            {formatNumber(payroll.NetSalary)}
                          </div>
                        </td>

                        {/* وضعیت سند */}
                        <td className="px-2 py-1.5 whitespace-nowrap">
                          <div className="space-y-1">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                              hasEntry 
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                            }`}>
                              {hasEntry ? `✅ صادر شده` : "⏳ منتظر صدور"}
                            </span>
                            {hasEntry && (
                              <div className="text-[10px] text-gray-600 dark:text-gray-400">
                                شماره: {payroll.docNumber}
                              </div>
                            )}
                            <div className="text-[10px] text-gray-500 dark:text-gray-400">
                              IsPosted: {payroll.isPosted === 1 ? '1' : '0'}
                            </div>
                          </div>
                        </td>

                        {/* دکمه‌های عملیات */}
                        <td className="px-2 py-1.5 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => showPayrollDetails(payroll)}
                              className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                              title="نمایش جزئیات فیش"
                            >
                              🧾 جزئیات
                            </button>
                            {!hasEntry ? (
                              <button
                                onClick={() => generateSingleEntry(payroll)}
                                className="text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
                                title="صدور سند برای این فیش"
                              >
                                📄 صدور سند
                              </button>
                            ) : (
                              <button
                                onClick={() => viewAccountingEntry(payroll)}
                                className="text-[10px] px-1.5 py-0.5 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded hover:bg-green-200 dark:hover:bg-green-800"
                                title="مشاهده سند"
                              >
                                👁️ مشاهده سند
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      
                      {/* ردیف گسترش‌یافته */}
                      {isExpanded && (
                        <tr className="bg-gray-50 dark:bg-gray-900/50">
                          <td colSpan="8" className="px-2 py-2">
                            <div className="bg-white dark:bg-gray-800 p-3 rounded shadow-inner">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {/* ستون درآمدها */}
                                <div className="space-y-1.5">
                                  <h4 className="font-medium text-green-600 dark:text-green-400 text-xs flex items-center">
                                    <TrendingUp className="h-3 w-3 ml-1" />
                                    درآمدها
                                  </h4>
                                  {[
                                    { label: "حقوق پایه", value: payroll.BaseSalary, color: "blue" },
                                    { label: "اضافه‌کاری", value: payroll.OvertimeAmount, color: "green" },
                                    { label: "سنوات", value: payroll.SeniorityPay, color: "purple" },
                                    { label: "مسکن", value: payroll.HousingAllowance, color: "yellow" },
                                    { label: "خوراک", value: payroll.FoodAllowance, color: "green" },
                                    { label: "همسر", value: payroll.MarriageAllowance, color: "pink" },
                                    { label: "فرزند", value: payroll.ChildAllowanceTotal, color: "indigo" }
                                  ].map(item => (
                                    <div key={item.label} className="flex justify-between items-center">
                                      <span className="text-xs text-gray-600 dark:text-gray-400">{item.label}:</span>
                                      <span className={`text-xs font-medium text-${item.color}-600 dark:text-${item.color}-400`}>
                                        {formatNumber(item.value)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                                
                                {/* ستون کسورات */}
                                <div className="space-y-1.5">
                                  <h4 className="font-medium text-red-600 dark:text-red-400 text-xs flex items-center">
                                    <Receipt className="h-3 w-3 ml-1" />
                                    کسورات
                                  </h4>
                                  {[
                                    { label: "بیمه کارگر", value: payroll.InsuranceEmployee, color: "purple" },
                                    { label: "بیمه کارفرما", value: payroll.InsuranceEmployer, color: "purple" },
                                    { label: "مالیات", value: payroll.TaxAmount, color: "red" }
                                  ].map(item => (
                                    <div key={item.label} className="flex justify-between items-center">
                                      <span className="text-xs text-gray-600 dark:text-gray-400">{item.label}:</span>
                                      <span className={`text-xs font-medium text-${item.color}-600 dark:text-${item.color}-400`}>
                                        {formatNumber(item.value)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                                
                                {/* ستون جمع‌بندی */}
                                <div className="space-y-2">
                                  <h4 className="font-medium text-blue-600 dark:text-blue-400 text-xs flex items-center">
                                    <Wallet className="h-3 w-3 ml-1" />
                                    جمع‌بندی
                                  </h4>
                                  <div className="bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-900/20 dark:to-emerald-900/20 p-2 rounded">
                                    <div className="text-center mb-2">
                                      <div className="text-[10px] text-gray-600 dark:text-gray-400">حقوق خالص قابل پرداخت</div>
                                      <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                        {formatNumber(payroll.NetSalary)} ریال
                                      </div>
                                    </div>
                                    {hasEntry && (
                                      <div className="mt-2 p-1.5 bg-green-50 dark:bg-green-900/20 rounded">
                                        <div className="text-center">
                                          <div className="text-[10px] text-green-700 dark:text-green-300">✅ سند صادر شده</div>
                                          <div className="text-[10px] font-medium">شماره سند: {payroll.docNumber}</div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* جمع‌های نهایی */}
      {selectedIds.length > 0 && (
        <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-900/20 dark:to-emerald-900/20 rounded-lg shadow">
          <h3 className="font-medium text-gray-800 dark:text-white text-sm mb-2 flex items-center">
            <Receipt className="h-4 w-4 ml-1.5" />
            جمع‌بندی سندهای حسابداری
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <div className="text-center p-2 bg-white dark:bg-gray-800 rounded shadow">
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {totals.count}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">تعداد فیش</div>
            </div>
            <div className="text-center p-2 bg-white dark:bg-gray-800 rounded shadow">
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                {formatNumber(totals.totalGrossSalary)}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">حقوق ناخالص</div>
            </div>
            <div className="text-center p-2 bg-white dark:bg-gray-800 rounded shadow">
              <div className="text-lg font-bold text-red-600 dark:text-red-400">
                {formatNumber(totals.totalDeductions)}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">کسورات کل</div>
            </div>
            <div className="text-center p-2 bg-white dark:bg-gray-800 rounded shadow">
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {formatNumber(totals.totalInsurance)}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">بیمه کارفرما</div>
            </div>
            <div className="text-center p-2 bg-white dark:bg-gray-800 rounded shadow">
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {formatNumber(totals.totalNetSalary)}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">حقوق خالص</div>
            </div>
          </div>
        </div>
      )}

      {/* پیام‌های راهنما */}
      {filteredPayrolls.length === 0 && !loadingPayrolls && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 ml-1.5" />
            <p className="text-blue-700 dark:text-blue-300 text-xs">
              هیچ فیش حقوقی مطابق با فیلترهای انتخاب شده یافت نشد.
            </p>
          </div>
        </div>
      )}

      {filterStatus === "unposted" && filteredPayrolls.filter(p => !p.isPosted || p.isPosted === 0).length === 0 && filteredPayrolls.length > 0 && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 ml-1.5" />
            <p className="text-green-700 dark:text-green-300 text-xs">
              ✅ تمامی فیش‌های حقوقی این دوره دارای سند حسابداری هستند.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}