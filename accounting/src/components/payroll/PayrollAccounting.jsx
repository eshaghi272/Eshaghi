// components/payroll/PayrollAccounting.jsx
import { useState, useEffect, useCallback } from "react";
import { 
  FileText, DollarSign, Users, CheckCircle, 
  AlertCircle, RefreshCw, Calendar, User,
  TrendingUp, Receipt, BookOpen, ChevronDown,
  ChevronUp, CreditCard, Building, Wallet
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
  const [accountingEntries, setAccountingEntries] = useState([]);

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
        
        // دریافت سندهای حسابداری برای بررسی وضعیت
        const entriesRes = await fetch("http://localhost:5000/api/journalentries");
        if (entriesRes.ok) {
          const entriesData = await entriesRes.json();
          if (entriesData.success) {
            setAccountingEntries(entriesData.data);
          }
        }
        
        // اضافه کردن وضعیت سند به هر فیش
        const payrollsWithStatus = data.data.map(payroll => {
          // بررسی وجود سند برای این فیش حقوقی
          const hasEntry = accountingEntries.some(entry => 
            entry.Description && entry.Description.includes(`حقوق ${payroll.PersonnelCode}`) ||
            entry.Description && entry.Description.includes(payroll.Period)
          );
          
          return {
            ...payroll,
            hasAccountingEntry: hasEntry,
            entryId: hasEntry ? accountingEntries.find(e => 
              e.Description && e.Description.includes(`حقوق ${payroll.PersonnelCode}`)
            )?.EntryId : null
          };
        });
        
        setPayrolls(payrollsWithStatus);
        setFilteredPayrolls(payrollsWithStatus);
      }
    } catch (err) {
      console.error("❌ خطا در دریافت فیش‌های حقوقی:", err);
      alert("❌ خطا در دریافت فیش‌های حقوقی");
    } finally {
      setLoadingPayrolls(false);
    }
  }, [accountingEntries]);

  useEffect(() => {
    fetchPayrolls();
  }, [fetchPayrolls]);

  // فیلتر کردن فیش‌ها بر اساس دوره و وضعیت
  useEffect(() => {
    let result = [...payrolls];
    
    if (filterPeriod !== "all") {
      result = result.filter(p => p.Period === filterPeriod);
    }
    
    if (filterStatus !== "all") {
      if (filterStatus === "unposted") {
        result = result.filter(p => !p.hasAccountingEntry);
      } else if (filterStatus === "posted") {
        result = result.filter(p => p.hasAccountingEntry);
      }
    }
    
    setFilteredPayrolls(result);
  }, [payrolls, filterPeriod, filterStatus]);

  // تابع انتخاب/لغو انتخاب
  const toggleSelection = useCallback((id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }, []);

  // انتخاب همه
  const toggleAll = useCallback(() => {
    const unpostedPayrolls = filteredPayrolls.filter(p => !p.hasAccountingEntry);
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
            docNumber: result.docNumber
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
            message += `   - فیش ${r.payrollId}: سند ${r.docNumber}\n`;
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

📝 وضعیت سند: ${payroll.hasAccountingEntry ? '✅ صادر شده' : '⏳ منتظر صدور'}
    `);
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* هدر */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
              <BookOpen className="h-6 w-6 ml-3 text-blue-600" />
              صدور سند حسابداری حقوق
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              صدور سند حسابداری برای فیش‌های حقوقی ثبت شده
              <span className="mr-2 text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                هزینه‌ها بدهکار / حساب پرداختنی بستانکار
              </span>
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={fetchPayrolls}
              disabled={loadingPayrolls}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
            >
              <RefreshCw className="h-4 w-4 ml-2" />
              بروزرسانی لیست
              {loadingPayrolls && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
            </button>
            
            <button
              onClick={generateAccountingEntries}
              disabled={loading || selectedIds.length === 0}
              className={`inline-flex items-center px-6 py-2 rounded-lg text-sm font-medium shadow-lg transition-all ${
                selectedIds.length > 0
                  ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white hover:shadow-xl transform hover:-translate-y-0.5"
                  : "bg-gray-400 dark:bg-gray-700 text-gray-300 dark:text-gray-500 cursor-not-allowed"
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white ml-2"></div>
                  در حال صدور...
                </>
              ) : (
                <>
                  <FileText className="h-5 w-5 ml-2" />
                  صدور سند ({selectedIds.length})
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* خلاصه وضعیت */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-6 gap-2">
          <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
            <div className="text-xs text-gray-600 dark:text-gray-400">کل فیش‌ها</div>
            <div className="font-bold">{payrolls.length}</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
            <div className="text-xs text-blue-600 dark:text-blue-400">بدون سند</div>
            <div className="font-bold text-blue-600 dark:text-blue-400">
              {payrolls.filter(p => !p.hasAccountingEntry).length}
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">
            <div className="text-xs text-green-600 dark:text-green-400">دارای سند</div>
            <div className="font-bold text-green-600 dark:text-green-400">
              {payrolls.filter(p => p.hasAccountingEntry).length}
            </div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded-lg">
            <div className="text-xs text-purple-600 dark:text-purple-400">انتخاب شده</div>
            <div className="font-bold text-purple-600 dark:text-purple-400">
              {selectedIds.length}
            </div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded-lg">
            <div className="text-xs text-yellow-600 dark:text-yellow-400">دوره انتخاب شده</div>
            <div className="font-bold text-yellow-600 dark:text-yellow-400">
              {filterPeriod === "all" ? "همه" : filterPeriod}
            </div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
            <div className="text-xs text-red-600 dark:text-red-400">حقوق خالص کل انتخابی</div>
            <div className="font-bold text-red-600 dark:text-red-400">
              {formatNumber(totals.totalNetSalary)} ریال
            </div>
          </div>
        </div>
      </div>

      {/* فیلترها */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* فیلتر دوره */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
            <Calendar className="h-4 w-4 ml-2" />
            فیلتر دوره
          </label>
          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
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
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
            <FileText className="h-4 w-4 ml-2" />
            وضعیت سند حسابداری
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
          >
            <option value="all">همه</option>
            <option value="unposted">بدون سند</option>
            <option value="posted">دارای سند</option>
          </select>
        </div>

        {/* اطلاعات مالی */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow col-span-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
            <DollarSign className="h-4 w-4 ml-2" />
            اطلاعات مالی انتخابی
          </h3>
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                {selectedIds.length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">تعداد</div>
            </div>
            <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {formatNumber(totals.totalGrossSalary)}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">ناخالص</div>
            </div>
            <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                {formatNumber(totals.totalDeductions)}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">کسورات</div>
            </div>
            <div className="text-center p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {formatNumber(totals.totalNetSalary)}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">خالص</div>
            </div>
          </div>
        </div>
      </div>

      {/* گزینه انتخاب همه */}
      {filteredPayrolls.length > 0 && (
        <div className="mb-4 flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
          <div className="flex items-center space-x-2 space-x-reverse">
            <input
              type="checkbox"
              id="selectAll"
              checked={selectedIds.length === filteredPayrolls.filter(p => !p.hasAccountingEntry).length && 
                       filteredPayrolls.filter(p => !p.hasAccountingEntry).length > 0}
              onChange={toggleAll}
              disabled={filteredPayrolls.filter(p => !p.hasAccountingEntry).length === 0}
              className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
            />
            <label htmlFor="selectAll" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              انتخاب همه بدون سند ({filteredPayrolls.filter(p => !p.hasAccountingEntry).length})
            </label>
          </div>
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
              {selectedIds.length} فیش انتخاب شده
            </div>
            <button
              onClick={() => {
                const unpostedCount = filteredPayrolls.filter(p => !p.hasAccountingEntry).length;
                const postedCount = filteredPayrolls.filter(p => p.hasAccountingEntry).length;
                alert(`📊 آمار فیلتر شده:\n
📈 کل: ${filteredPayrolls.length}
⏳ بدون سند: ${unpostedCount}
✅ دارای سند: ${postedCount}
👥 انتخاب شده: ${selectedIds.length}
💰 حقوق خالص انتخابی: ${formatNumber(totals.totalNetSalary)} ریال`);
              }}
              className="text-sm px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              نمایش آمار
            </button>
          </div>
        </div>
      )}

      {/* جدول فیش‌های حقوقی */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-100 dark:bg-gray-900">
              <tr>
                <th className="w-12 px-4 py-3"></th>
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredPayrolls.filter(p => !p.hasAccountingEntry).length && 
                             filteredPayrolls.filter(p => !p.hasAccountingEntry).length > 0}
                    onChange={toggleAll}
                    disabled={filteredPayrolls.filter(p => !p.hasAccountingEntry).length === 0}
                    className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
                  />
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  اطلاعات پرسنل
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  اطلاعات مالی
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  وضعیت سند
                </th>
                <th className="w-16 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loadingPayrolls ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">در حال بارگذاری فیش‌ها...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredPayrolls.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    هیچ فیش حقوقی یافت نشد
                  </td>
                </tr>
              ) : (
                filteredPayrolls.map((payroll) => {
                  const isExpanded = expandedRows.includes(payroll.PayrollId);
                  const isSelected = selectedIds.includes(payroll.PayrollId);
                  const hasEntry = payroll.hasAccountingEntry;
                  
                  return (
                    <tbody key={payroll.PayrollId}>
                      <tr 
                        className={`hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors ${
                          isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        } ${hasEntry ? 'opacity-90' : ''}`}
                      >
                        {/* دکمه گسترش */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button
                            onClick={() => toggleRowExpand(payroll.PayrollId)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        </td>

                        {/* ستون انتخاب */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelection(payroll.PayrollId)}
                              className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                              disabled={hasEntry}
                            />
                          </div>
                        </td>

                        {/* اطلاعات پرسنل */}
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {payroll.FullName}
                              <span className={`text-xs px-2 py-1 rounded mr-2 ${
                                hasEntry 
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                              }`}>
                                {hasEntry ? "سند صادر شده" : "در انتظار سند"}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              <div className="flex items-center">
                                <User className="h-3 w-3 ml-1" />
                                کد پرسنلی: 
                                <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded mr-2">
                                  {payroll.PersonnelCode}
                                </span>
                              </div>
                              <div>
                                <Calendar className="h-3 w-3 ml-1 inline" />
                                دوره: {payroll.Period}
                              </div>
                              <div>تاریخ پرداخت: {payroll.PayDate}</div>
                            </div>
                          </div>
                        </td>

                        {/* اطلاعات مالی */}
                        <td className="px-4 py-3">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400">حقوق ناخالص:</span>
                              <span className="font-medium text-blue-600 dark:text-blue-400">
                                {formatNumber(payroll.GrossSalary)} ریال
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400">کسورات:</span>
                              <span className="font-medium text-red-600 dark:text-red-400">
                                {formatNumber(payroll.Deductions)} ریال
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400">حقوق خالص:</span>
                              <span className="font-bold text-green-600 dark:text-green-400">
                                {formatNumber(payroll.NetSalary)} ریال
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400">بیمه کارفرما:</span>
                              <span className="font-medium text-purple-600 dark:text-purple-400">
                                {formatNumber(payroll.InsuranceEmployer)} ریال
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* وضعیت سند */}
                        <td className="px-4 py-3">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400">وضعیت:</span>
                              <span className={`text-xs px-2 py-1 rounded ${
                                hasEntry 
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                              }`}>
                                {hasEntry ? "✅ صادر شده" : "⏳ منتظر صدور"}
                              </span>
                            </div>
                            {hasEntry && payroll.entryId && (
                              <>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-600 dark:text-gray-400">شماره سند:</span>
                                  <span className="font-mono text-sm">
                                    {payroll.entryId}
                                  </span>
                                </div>
                                <button
                                  onClick={() => {
                                    const entry = accountingEntries.find(e => e.EntryId === payroll.entryId);
                                    if (entry) {
                                      alert(`📄 سند حسابداری
شماره سند: ${entry.docNumber}
تاریخ: ${entry.EntryDate}
شرح: ${entry.Description}
وضعیت تراز: ${entry.IsBalanced ? '✅ متعادل' : '⚠️ نامتعادل'}
تاریخ ایجاد: ${new Date(entry.CreatedAt).toLocaleDateString('fa-IR')}
                                      `);
                                    }
                                  }}
                                  className="text-xs w-full px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                                >
                                  مشاهده سند
                                </button>
                              </>
                            )}
                          </div>
                        </td>

                        {/* دکمه‌های عملیات */}
                        <td className="px-2 py-3 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => showPayrollDetails(payroll)}
                              className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                              title="نمایش جزئیات فیش"
                            >
                              🧾
                            </button>
                            {!hasEntry && (
                              <button
                                onClick={async () => {
                                  if (!window.confirm(`آیا از صدور سند برای ${payroll.FullName} اطمینان دارید؟`)) return;
                                  
                                  try {
                                    const res = await fetch(`http://localhost:5000/api/payroll/${payroll.PayrollId}/generate-entry`, {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" }
                                    });
                                    
                                    if (res.ok) {
                                      const data = await res.json();
                                      alert(`✅ سند حسابداری صادر شد\nشماره سند: ${data.docNumber}`);
                                      await fetchPayrolls();
                                    } else {
                                      const error = await res.json();
                                      throw new Error(error.error);
                                    }
                                  } catch (err) {
                                    alert(`❌ خطا در صدور سند: ${err.message}`);
                                  }
                                }}
                                className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
                                title="صدور سند برای این فیش"
                              >
                                📄
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      
                      {/* ردیف گسترش‌یافته */}
                      {isExpanded && (
                        <tr className="bg-gray-50 dark:bg-gray-900/50">
                          <td colSpan="6" className="px-4 py-3">
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-inner">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* ستون درآمدها */}
                                <div className="space-y-2">
                                  <h4 className="font-medium text-green-600 dark:text-green-400 flex items-center">
                                    <TrendingUp className="h-4 w-4 ml-1" />
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
                                      <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}:</span>
                                      <span className={`font-medium text-${item.color}-600 dark:text-${item.color}-400`}>
                                        {formatNumber(item.value)} ریال
                                      </span>
                                    </div>
                                  ))}
                                  <div className="border-t pt-2 mt-2">
                                    <div className="flex justify-between items-center">
                                      <span className="font-medium text-gray-700 dark:text-gray-300">جمع درآمدها:</span>
                                      <span className="font-bold text-green-600 dark:text-green-400">
                                        {formatNumber(payroll.GrossSalary)} ریال
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* ستون کسورات */}
                                <div className="space-y-2">
                                  <h4 className="font-medium text-red-600 dark:text-red-400 flex items-center">
                                    <Receipt className="h-4 w-4 ml-1" />
                                    کسورات
                                  </h4>
                                  {[
                                    { label: "بیمه کارگر", value: payroll.InsuranceEmployee, color: "purple" },
                                    { label: "بیمه کارفرما", value: payroll.InsuranceEmployer, color: "purple" },
                                    { label: "مالیات", value: payroll.TaxAmount, color: "red" }
                                  ].map(item => (
                                    <div key={item.label} className="flex justify-between items-center">
                                      <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}:</span>
                                      <span className={`font-medium text-${item.color}-600 dark:text-${item.color}-400`}>
                                        {formatNumber(item.value)} ریال
                                      </span>
                                    </div>
                                  ))}
                                  <div className="border-t pt-2 mt-2">
                                    <div className="flex justify-between items-center">
                                      <span className="font-medium text-gray-700 dark:text-gray-300">جمع کسورات:</span>
                                      <span className="font-bold text-red-600 dark:text-red-400">
                                        {formatNumber(payroll.Deductions)} ریال
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* ستون جمع‌بندی */}
                                <div className="space-y-4">
                                  <h4 className="font-medium text-blue-600 dark:text-blue-400 flex items-center">
                                    <Wallet className="h-4 w-4 ml-1" />
                                    جمع‌بندی
                                  </h4>
                                  <div className="bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-900/20 dark:to-emerald-900/20 p-4 rounded-lg">
                                    <div className="text-center mb-4">
                                      <div className="text-xs text-gray-600 dark:text-gray-400">حقوق خالص قابل پرداخت</div>
                                      <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                        {formatNumber(payroll.NetSalary)} ریال
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <div className="flex justify-between items-center">
                                        <span>ناخالص:</span>
                                        <span>{formatNumber(payroll.GrossSalary)}</span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span>کسورات:</span>
                                        <span className="text-red-600 dark:text-red-400">-{formatNumber(payroll.Deductions)}</span>
                                      </div>
                                      <div className="border-t pt-2">
                                        <div className="flex justify-between items-center font-bold">
                                          <span>خالص:</span>
                                          <span>{formatNumber(payroll.NetSalary)}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* اطلاعات سند حسابداری */}
                                  {hasEntry && payroll.entryId && (
                                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm text-green-700 dark:text-green-300">✅ سند صادر شده</span>
                                        <button
                                          onClick={() => {
                                            const entry = accountingEntries.find(e => e.EntryId === payroll.entryId);
                                            if (entry) {
                                              alert(`📄 سند حسابداری
شماره: ${entry.docNumber}
تاریخ: ${entry.EntryDate}
شرح: ${entry.Description}
وضعیت: ${entry.IsBalanced ? '✅ متعادل' : '⚠️ نامتعادل'}
                                              `);
                                            }
                                          }}
                                          className="text-xs px-2 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 rounded hover:bg-green-200 dark:hover:bg-green-700"
                                        >
                                          مشاهده سند
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* سند حسابداری که ایجاد خواهد شد */}
                              {!hasEntry && (
                                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                  <h5 className="font-medium text-yellow-700 dark:text-yellow-300 mb-2 flex items-center">
                                    <AlertCircle className="h-4 w-4 ml-2" />
                                    سند حسابداری که ایجاد می‌شود:
                                  </h5>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">💰 بدهکار:</div>
                                      <ul className="list-disc mr-4 space-y-1">
                                        <li className="text-gray-600 dark:text-gray-400">هزینه حقوق و دستمزد</li>
                                        <li className="text-gray-600 dark:text-gray-400">هزینه بیمه سهم کارفرما</li>
                                      </ul>
                                    </div>
                                    <div>
                                      <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">💳 بستانکار:</div>
                                      <ul className="list-disc mr-4 space-y-1">
                                        <li className="text-gray-600 dark:text-gray-400">حساب پرداختنی حقوق (معین هر کارمند)</li>
                                      </ul>
                                    </div>
                                  </div>
                                  <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                                    * پس از صدور سند، هزینه‌ها بدهکار و حساب پرداختنی حقوق بستانکار می‌شود.
                                  </div>
                                </div>
                              )}
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
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-900/20 dark:to-emerald-900/20 rounded-xl shadow">
          <h3 className="font-medium text-gray-800 dark:text-white mb-3 flex items-center">
            <Receipt className="h-5 w-5 ml-2" />
            جمع‌بندی سندهای حسابداری
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {totals.count}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">تعداد فیش</div>
            </div>
            <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="text-xl font-bold text-green-600 dark:text-green-400">
                {formatNumber(totals.totalGrossSalary)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">حقوق ناخالص</div>
            </div>
            <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="text-xl font-bold text-red-600 dark:text-red-400">
                {formatNumber(totals.totalDeductions)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">کسورات کل</div>
            </div>
            <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                {formatNumber(totals.totalInsurance)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">بیمه کارفرما</div>
            </div>
            <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatNumber(totals.totalNetSalary)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">حقوق خالص</div>
            </div>
          </div>
          
          {/* راهنمای حسابداری */}
          <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">راهنمای حسابداری:</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-green-600 dark:text-green-400 font-medium">📥 بدهکار (هزینه‌ها):</div>
                <div className="text-gray-600 dark:text-gray-400 mr-4">
                  • هزینه حقوق و دستمزد: {formatNumber(totals.totalGrossSalary - totals.totalInsurance)} ریال<br/>
                  • هزینه بیمه کارفرما: {formatNumber(totals.totalInsurance)} ریال
                </div>
              </div>
              <div>
                <div className="text-blue-600 dark:text-blue-400 font-medium">📤 بستانکار (بدهی‌ها):</div>
                <div className="text-gray-600 dark:text-gray-400 mr-4">
                  • حساب پرداختنی حقوق: {formatNumber(totals.totalNetSalary)} ریال<br/>
                  <span className="text-xs">(با معین هر کارمند)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* پیام‌های راهنما */}
      {filteredPayrolls.length === 0 && !loadingPayrolls && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 ml-2" />
            <p className="text-blue-700 dark:text-blue-300">
              هیچ فیش حقوقی مطابق با فیلترهای انتخاب شده یافت نشد.
            </p>
          </div>
        </div>
      )}

      {filterStatus === "unposted" && filteredPayrolls.filter(p => !p.hasAccountingEntry).length === 0 && filteredPayrolls.length > 0 && (
        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 ml-2" />
            <p className="text-green-700 dark:text-green-300">
              ✅ تمامی فیش‌های حقوقی این دوره دارای سند حسابداری هستند.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}