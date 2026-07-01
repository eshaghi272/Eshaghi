// 📁 src/components/payroll/PayrollPage.jsx
import React, { useEffect, useState } from "react";
import persian from "react-date-object/calendars/persian";
import persian_en from "react-date-object/locales/persian_en";
import FdatePicker from "../ui/FdatePicker";

export default function PayrollPage() {
  const [employees, setEmployees] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, message: "" });
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({});
  const [summary, setSummary] = useState(null);
  
  const [form, setForm] = useState({
    periodYear: "1404",
    periodMonth: "01",
    payDate: null,
    workDays: 30,
    overtimeHours: 0,
    applyToAll: false
  });
  
  const months = [
    { value: "01", label: "فروردین" },
    { value: "02", label: "اردیبهشت" },
    { value: "03", label: "خرداد" },
    { value: "04", label: "تیر" },
    { value: "05", label: "مرداد" },
    { value: "06", label: "شهریور" },
    { value: "07", label: "مهر" },
    { value: "08", label: "آبان" },
    { value: "09", label: "آذر" },
    { value: "10", label: "دی" },
    { value: "11", label: "بهمن" },
    { value: "12", label: "اسفند" }
  ];

  // Helpers
  const toNumber = (val) => {
    const n = Number(val);
    return Number.isFinite(n) ? n : 0;
  };
  
  const formatCurrency = (n) =>
    new Intl.NumberFormat("fa-IR").format(toNumber(n));

  // Load employees
  const loadEmployees = () => {
    setLoading(true);
    fetch("http://localhost:5000/api/payroll-new/employees")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setEmployees(data.data || []);
        }
      })
      .catch((err) => console.error("❌ خطا در دریافت کارمندان:", err))
      .finally(() => setLoading(false));
  };

  // Load payrolls for selected period
  const loadPayrolls = (period) => {
    const url = period 
      ? `http://localhost:5000/api/payroll-new/monthly?period=${period}`
      : "http://localhost:5000/api/payroll-new/monthly";
    
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setPayrolls(data.data || []);
        }
      })
      .catch((err) => console.error("❌ خطا در دریافت حقوق‌ها:", err));
  };

  // Load settings
  const loadSettings = () => {
    fetch("http://localhost:5000/api/payroll-new/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSettings(data.data || {});
        }
      })
      .catch((err) => console.error("❌ خطا در دریافت تنظیمات:", err));
  };

  // Load summary for period
  const loadSummary = (period) => {
    if (!period) return;
    
    fetch(`http://localhost:5000/api/payroll-new/summary/${period}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSummary(data.data);
        }
      })
      .catch((err) => console.error("❌ خطا در دریافت خلاصه:", err));
  };

  useEffect(() => {
    loadEmployees();
    loadSettings();
  }, []);

  useEffect(() => {
    const period = `${form.periodYear}-${form.periodMonth}`;
    loadPayrolls(period);
    loadSummary(period);
  }, [form.periodYear, form.periodMonth]);

  // Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date) => {
    setForm({ ...form, payDate: date });
  };

  // Handle individual employee selection
  const handleEmployeeCheckboxChange = (nationalCode) => {
    setSelectedEmployees(prev => {
      if (prev.includes(nationalCode)) {
        return prev.filter(code => code !== nationalCode);
      } else {
        return [...prev, nationalCode];
      }
    });
  };

  // Handle select all employees
  const handleSelectAllChange = () => {
    if (selectAll) {
      setSelectedEmployees([]);
    } else {
      const allCodes = employees.map(emp => emp.nationalCode);
      setSelectedEmployees(allCodes);
    }
    setSelectAll(!selectAll);
  };

  // Update selectAll state when selectedEmployees changes
  useEffect(() => {
    if (employees.length > 0) {
      setSelectAll(selectedEmployees.length === employees.length);
    }
  }, [selectedEmployees, employees.length]);

  // Calculate payroll for selected employees
  const handleCalculatePayroll = async (e) => {
    e.preventDefault();
    
    if (selectedEmployees.length === 0) {
      alert("⚠️ لطفاً حداقل یک کارمند را انتخاب کنید.");
      return;
    }
    
    if (!form.payDate) {
      alert("⚠️ لطفاً تاریخ پرداخت را انتخاب کنید.");
      return;
    }
    
    const periodCode = `${form.periodYear}-${form.periodMonth}`;
    const confirmMessage = form.applyToAll 
      ? `آیا از ایجاد حقوق برای ${selectedEmployees.length} کارمند در دوره ${periodCode} اطمینان دارید؟\nتنظیمات کارکرد برای همه اعمال خواهد شد.`
      : `آیا از ایجاد حقوق برای ${selectedEmployees.length} کارمند در دوره ${periodCode} اطمینان دارید؟`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    setIsProcessing(true);
    setProgress({ current: 0, total: selectedEmployees.length, message: "در حال پردازش..." });
    
    const formattedPayDate = form.payDate && typeof form.payDate.format === 'function' 
      ? form.payDate.format("YYYY/MM/DD") 
      : form.payDate;
    
    const payload = {
      nationalCodes: selectedEmployees,
      periodYear: toNumber(form.periodYear),
      periodMonth: toNumber(form.periodMonth),
      payDate: formattedPayDate,
      workDays: form.applyToAll ? toNumber(form.workDays) : undefined,
      overtimeHours: form.applyToAll ? toNumber(form.overtimeHours) : undefined,
      commonSettings: form.applyToAll ? {
        workDays: toNumber(form.workDays),
        overtimeHours: toNumber(form.overtimeHours)
      } : {}
    };
    
    try {
      const res = await fetch("http://localhost:5000/api/payroll-new/calculate-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (data.success) {
        alert(`✅ حقوق برای ${data.results?.length || 0} کارمند محاسبه شد.`);
        
        // Reset selection
        setSelectedEmployees([]);
        setSelectAll(false);
        
        // Reload payrolls
        loadPayrolls(periodCode);
      } else {
        alert(`❌ خطا: ${data.error}`);
      }
    } catch (err) {
      console.error("❌ خطا در محاسبه حقوق:", err);
      alert("❌ خطا در ارتباط با سرور: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle payroll status change
  const handleStatusChange = async (payrollId, newStatus) => {
    if (!window.confirm(`آیا از تغییر وضعیت پرداخت به "${newStatus}" اطمینان دارید؟`)) {
      return;
    }
    
    try {
      const res = await fetch(`http://localhost:5000/api/payroll-new/monthly/${payrollId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentStatus: newStatus,
          payDate: form.payDate ? form.payDate.format("YYYY/MM/DD") : undefined
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        alert(data.message);
        // Reload payrolls
        loadPayrolls(`${form.periodYear}-${form.periodMonth}`);
      } else {
        alert(`❌ خطا: ${data.error}`);
      }
    } catch (err) {
      console.error("❌ خطا در تغییر وضعیت پرداخت:", err);
      alert("❌ خطا در ارتباط با سرور: " + err.message);
    }
  };

  // Handle accounting entry generation
  const handleGenerateEntry = async (payrollId) => {
    if (!window.confirm("آیا از صدور سند حسابداری اطمینان دارید؟")) {
      return;
    }
    
    try {
      const res = await fetch(`http://localhost:5000/api/payroll-new/monthly/${payrollId}/generate-entry`, {
        method: "POST"
      });
      
      const data = await res.json();
      
      if (data.success) {
        alert(`✅ سند حسابداری صادر شد.\nشماره سند: ${data.data?.documentNumber}`);
        // Reload payrolls
        loadPayrolls(`${form.periodYear}-${form.periodMonth}`);
      } else {
        alert(`❌ خطا: ${data.error}`);
      }
    } catch (err) {
      console.error("❌ خطا در صدور سند:", err);
      alert("❌ خطا در ارتباط با سرور: " + err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">سیستم حقوق و دستمزد جدید</h2>

      {/* Progress Indicator */}
      {isProcessing && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium text-blue-700">{progress.message}</span>
            <span className="text-blue-600">{progress.current} / {progress.total}</span>
          </div>
          <div className="w-full bg-blue-100 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* تنظیمات دوره */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-bold text-gray-700 mb-4">تنظیمات دوره حقوق</h3>
        <form onSubmit={handleCalculatePayroll} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* سال دوره */}
          <div className="flex items-center gap-3">
            <label className="w-32 text-gray-700">سال:</label>
            <input
              type="text"
              name="periodYear"
              value={form.periodYear}
              onChange={handleChange}
              placeholder="1404"
              className="flex-1 border rounded-lg p-2"
              required
            />
          </div>

          {/* ماه دوره */}
          <div className="flex items-center gap-3">
            <label className="w-32 text-gray-700">ماه:</label>
            <select
              name="periodMonth"
              value={form.periodMonth}
              onChange={handleChange}
              className="flex-1 border rounded-lg p-2"
              required
            >
              {months.map(month => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>

          {/* تاریخ پرداخت */}
          <div className="flex items-center gap-3">
            <label className="w-32 text-gray-700">تاریخ پرداخت:</label>
            <div className="flex-1">
              <FdatePicker
                calendar={persian}
                locale={persian_en}
                value={form.payDate}
                onChange={handleDateChange}
                format="YYYY/MM/DD"
                inputClass="border rounded-lg p-2 w-full"
              />
            </div>
          </div>

          {/* نمایش دوره انتخاب شده */}
          <div className="flex items-center gap-3">
            <label className="w-32 text-gray-700">دوره انتخابی:</label>
            <div className="flex-1 border rounded-lg p-2 bg-gray-100 font-medium">
              {form.periodYear}-{form.periodMonth} ({months.find(m => m.value === form.periodMonth)?.label})
            </div>
          </div>

          {/* اعمال تنظیمات به همه */}
          <div className="flex items-center gap-3">
            <label className="w-32 text-gray-700">اعمال به همه:</label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.applyToAll}
                onChange={(e) => setForm({...form, applyToAll: e.target.checked})}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">اعمال تنظیمات زیر به همه کارمندان</span>
            </div>
          </div>

          {/* روزهای کارکرد */}
          {form.applyToAll && (
            <div className="flex items-center gap-3">
              <label className="w-32 text-gray-700">روزهای کارکرد:</label>
              <input
                type="number"
                name="workDays"
                value={form.workDays}
                onChange={handleChange}
                min="0"
                max="31"
                className="flex-1 border rounded-lg p-2"
              />
            </div>
          )}

          {/* ساعات اضافه‌کاری */}
          {form.applyToAll && (
            <div className="flex items-center gap-3">
              <label className="w-32 text-gray-700">ساعات اضافه‌کاری:</label>
              <input
                type="number"
                name="overtimeHours"
                value={form.overtimeHours}
                onChange={handleChange}
                min="0"
                className="flex-1 border rounded-lg p-2"
              />
            </div>
          )}

          {/* دکمه‌های اقدام */}
          <div className="col-span-1 md:col-span-2 flex justify-between items-center pt-4 border-t">
            <div className="text-gray-700">
              <span className="font-medium">کارمندان انتخاب شده:</span>
              <span className="mr-2 text-blue-600 font-bold"> {selectedEmployees.length}</span>
              نفر از {employees.length} نفر
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedEmployees([]);
                  setSelectAll(false);
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition duration-200"
                disabled={isProcessing || selectedEmployees.length === 0}
              >
                پاک کردن انتخاب‌ها
              </button>
              
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-200 font-medium"
                disabled={isProcessing || selectedEmployees.length === 0}
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    در حال پردازش...
                  </span>
                ) : `محاسبه حقوق برای ${selectedEmployees.length} کارمند`}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* خلاصه دوره */}
      {summary && (
        <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-sm text-gray-600 mb-1">تعداد کارمندان</div>
            <div className="text-2xl font-bold text-blue-600">{summary.summary?.employeeCount || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-sm text-gray-600 mb-1">مجموع ناخالص</div>
            <div className="text-2xl font-bold">{formatCurrency(summary.summary?.totalGross || 0)} ریال</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-sm text-gray-600 mb-1">مجموع خالص</div>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.summary?.totalNet || 0)} ریال</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-sm text-gray-600 mb-1">میانگین خالص</div>
            <div className="text-2xl font-bold">{formatCurrency(Math.round(summary.summary?.avgNet || 0))} ریال</div>
          </div>
        </div>
      )}

      {/* لیست کارمندان */}
      <div className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">
            لیست کارمندان حقوق‌بگیر
            {loading ? " (در حال بارگذاری...)" : ` (${employees.length} نفر)`}
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-gray-600">انتخاب همه</span>
            <input
              type="checkbox"
              checked={selectAll}
              onChange={handleSelectAllChange}
              className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              disabled={isProcessing || loading}
            />
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">در حال بارگذاری اطلاعات کارمندان...</p>
          </div>
        ) : (
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-right">انتخاب</th>
                  <th className="p-3 text-right">کد ملی</th>
                  <th className="p-3 text-right">نام و نام خانوادگی</th>
                  <th className="p-3 text-right">واحد</th>
                  <th className="p-3 text-right">سمت</th>
                  <th className="p-3 text-right">حقوق پایه</th>
                  <th className="p-3 text-right">تعداد فرزند</th>
                  <th className="p-3 text-right">سابقه</th>
                  <th className="p-3 text-right">وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {employees.length > 0 ? (
                  employees.map((emp) => (
                    <tr 
                      key={emp.nationalCode} 
                      className={`border-t hover:bg-gray-50 ${selectedEmployees.includes(emp.nationalCode) ? 'bg-blue-50' : ''}`}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedEmployees.includes(emp.nationalCode)}
                          onChange={() => handleEmployeeCheckboxChange(emp.nationalCode)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          disabled={isProcessing}
                        />
                      </td>
                      <td className="p-3 font-mono">{emp.nationalCode}</td>
                      <td className="p-3 font-medium">{emp.firstName} {emp.lastName}</td>
                      <td className="p-3">{emp.department || '-'}</td>
                      <td className="p-3">{emp.jobTitle || '-'}</td>
                      <td className="p-3 text-left font-bold">
                        {formatCurrency(emp.baseSalary || 0)}
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {emp.childrenCount || 0}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                          {emp.seniorityYears || 0} سال
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${emp.isActive === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {emp.isActive === 1 ? 'فعال' : 'غیرفعال'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="p-8 text-center text-gray-500">
                      هیچ کارمند حقوق‌بگیری یافت نشد
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* لیست حقوق‌های ثبت شده */}
      <div className="mt-10">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">
            حقوق‌های ثبت شده برای دوره {form.periodYear}-{form.periodMonth}
          </h3>
          <span className="text-gray-600">{payrolls.length} رکورد</span>
        </div>
        
        <div className="overflow-x-auto border rounded-lg">
          {payrolls.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-right">کد ملی</th>
                  <th className="p-3 text-right">نام</th>
                  <th className="p-3 text-right">حقوق پایه</th>
                  <th className="p-3 text-right">اضافه‌کاری</th>
                  <th className="p-3 text-right">سنوات</th>
                  <th className="p-3 text-right">ناخالص</th>
                  <th className="p-3 text-right">خالص</th>
                  <th className="p-3 text-right">بیمه کارگر</th>
                  <th className="p-3 text-right">بیمه کارفرما</th>
                  <th className="p-3 text-right">مالیات</th>
                  <th className="p-3 text-right">وضعیت</th>
                  <th className="p-3 text-right">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {payrolls.map((p) => (
                  <tr key={p.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-mono">{p.nationalCode}</td>
                    <td className="p-3">{p.firstName} {p.lastName}</td>
                    <td className="p-3 text-left">{formatCurrency(p.baseSalary)}</td>
                    <td className="p-3 text-left">{formatCurrency(p.overtimeAmount)}</td>
                    <td className="p-3 text-left">{formatCurrency(p.seniorityAmount)}</td>
                    <td className="p-3 text-left font-bold">{formatCurrency(p.grossSalary)}</td>
                    <td className="p-3 text-left font-bold text-green-700">{formatCurrency(p.netSalary)}</td>
                    <td className="p-3 text-left">{formatCurrency(p.insuranceEmployee)}</td>
                    <td className="p-3 text-left">{formatCurrency(p.insuranceEmployer)}</td>
                    <td className="p-3 text-left">{formatCurrency(p.taxAmount)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        p.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                        p.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {p.paymentStatus === 'paid' ? 'پرداخت شده' :
                         p.paymentStatus === 'pending' ? 'در انتظار پرداخت' : 'لغو شده'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <select
                          value={p.paymentStatus}
                          onChange={(e) => handleStatusChange(p.id, e.target.value)}
                          className="border rounded px-2 py-1 text-xs"
                        >
                          <option value="pending">در انتظار</option>
                          <option value="paid">پرداخت شده</option>
                          <option value="cancelled">لغو شده</option>
                        </select>
                        
                        {!p.accountingEntryId && (
                          <button
                            onClick={() => handleGenerateEntry(p.id)}
                            className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 transition duration-200 text-xs"
                            title="صدور سند حسابداری"
                          >
                            ثبت سند
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-gray-500">
              هیچ فیش حقوقی برای این دوره ثبت نشده است
            </div>
          )}
        </div>
      </div>
    </div>
  );
}