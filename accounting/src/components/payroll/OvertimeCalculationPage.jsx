// 📁 src/components/payroll/OvertimeCalculationPage.jsx
import React, { useEffect, useState } from "react";
import { Clock, Calculator, Users, CheckCircle, AlertCircle, DollarSign, Calendar, Plus, Minus, RefreshCw } from 'lucide-react';
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import FdatePicker from "../ui/FdatePicker";

export default function OvertimeCalculationPage() {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // فیلترها
  const [filters, setFilters] = useState({
    department: '',
    search: '',
    showActiveOnly: true
  });
  
  // تنظیمات اضافه‌کاری
  const [overtimeSettings, setOvertimeSettings] = useState({
    periodYear: '1404',
    periodMonth: '01',
    calculateDate: new Date(), // تغییر نام به calculateDate و مقداردهی اولیه
    normalRate: 1.4,      // نرخ عادی
    holidayRate: 2.0,     // نرخ تعطیل
    nightRate: 1.75,      // نرخ شبانه
    applyToAll: false,
    defaultHours: 0
  });
  
  // تنظیمات اضافه‌کاری برای هر فرد
  const [employeeOvertime, setEmployeeOvertime] = useState({});
  
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
    
  // تابع تبدیل تاریخ به شمسی
  const formatToJalaliString = (date) => {
    if (!date) return '';
    try {
      const persianDate = new DateObject({
        date: date,
        calendar: persian,
        locale: persian_fa,
      });
      return persianDate.format("YYYY/MM/DD");
    } catch (error) {
      console.error("خطا در تبدیل تاریخ:", error);
      return '';
    }
  };

  // Load employees
  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = () => {
    setLoading(true);
    fetch("http://localhost:5000/api/payroll-new/employees")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const employeeList = data.data || [];
          setEmployees(employeeList);
          setFilteredEmployees(employeeList);
          
          // مقداردهی اولیه برای اضافه‌کاری هر کارمند
          const initialOvertime = {};
          employeeList.forEach(emp => {
            initialOvertime[emp.nationalCode] = {
              normalHours: 0,
              holidayHours: 0,
              nightHours: 0,
              notes: ''
            };
          });
          setEmployeeOvertime(initialOvertime);
        }
      })
      .catch((err) => console.error("❌ خطا در دریافت کارمندان:", err))
      .finally(() => setLoading(false));
  };

  // اعمال فیلترها
  useEffect(() => {
    let filtered = [...employees];
    
    // فیلتر بخش
    if (filters.department) {
      filtered = filtered.filter(emp => 
        emp.department?.toLowerCase().includes(filters.department.toLowerCase())
      );
    }
    
    // فیلتر جستجو
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(emp => 
        emp.firstName?.toLowerCase().includes(searchTerm) ||
        emp.lastName?.toLowerCase().includes(searchTerm) ||
        emp.nationalCode?.includes(searchTerm) ||
        emp.jobTitle?.toLowerCase().includes(searchTerm)
      );
    }
    
    // فیلتر وضعیت فعال
    if (filters.showActiveOnly) {
      filtered = filtered.filter(emp => emp.isActive === 1);
    }
    
    setFilteredEmployees(filtered);
    
    // اگر selectAll فعال بود، کارمندان فیلتر شده را انتخاب کن
    if (selectAll) {
      setSelectedEmployees(filtered.map(emp => emp.nationalCode));
    }
  }, [filters, employees, selectAll]);

  // Handlers
  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleOvertimeSettingChange = (e) => {
    const { name, value, type } = e.target;
    setOvertimeSettings(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleDateChange = (date) => {
    setOvertimeSettings(prev => ({
      ...prev,
      calculateDate: date
    }));
  };

  const handleEmployeeOvertimeChange = (nationalCode, field, value) => {
    setEmployeeOvertime(prev => ({
      ...prev,
      [nationalCode]: {
        ...prev[nationalCode],
        [field]: field === 'notes' ? value : toNumber(value)
      }
    }));
  };

  // اعمال ساعت پیش‌فرض به همه انتخاب شده‌ها
  const applyDefaultHours = () => {
    const updated = { ...employeeOvertime };
    selectedEmployees.forEach(nationalCode => {
      updated[nationalCode] = {
        ...updated[nationalCode],
        normalHours: overtimeSettings.defaultHours
      };
    });
    setEmployeeOvertime(updated);
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

  // Handle select all filtered employees
  const handleSelectAllChange = () => {
    if (selectAll) {
      setSelectedEmployees([]);
    } else {
      const allCodes = filteredEmployees.map(emp => emp.nationalCode);
      setSelectedEmployees(allCodes);
    }
    setSelectAll(!selectAll);
  };

  // Update selectAll state when selectedEmployees changes
  useEffect(() => {
    if (filteredEmployees.length > 0) {
      setSelectAll(selectedEmployees.length === filteredEmployees.length);
    }
  }, [selectedEmployees, filteredEmployees.length]);

  // محاسبه اضافه‌کاری برای یک کارمند
  const calculateEmployeeOvertime = (employee) => {
    const overtime = employeeOvertime[employee.nationalCode] || {};
    const hourlyRate = (employee.baseSalary || 0) / 30 / 8; // حقوق ساعتی
    
    const normalAmount = (overtime.normalHours || 0) * hourlyRate * overtimeSettings.normalRate;
    const holidayAmount = (overtime.holidayHours || 0) * hourlyRate * overtimeSettings.holidayRate;
    const nightAmount = (overtime.nightHours || 0) * hourlyRate * overtimeSettings.nightRate;
    
    const totalHours = (overtime.normalHours || 0) + (overtime.holidayHours || 0) + (overtime.nightHours || 0);
    const totalAmount = normalAmount + holidayAmount + nightAmount;
    
    return {
      normalAmount: Math.round(normalAmount),
      holidayAmount: Math.round(holidayAmount),
      nightAmount: Math.round(nightAmount),
      totalHours,
      totalAmount: Math.round(totalAmount),
      hourlyRate: Math.round(hourlyRate)
    };
  };

  // محاسبه مجموع برای انتخاب شده‌ها
  const calculateTotals = () => {
    let totalHours = 0;
    let totalAmount = 0;
    let employeeCount = 0;
    
    selectedEmployees.forEach(nationalCode => {
      const employee = employees.find(emp => emp.nationalCode === nationalCode);
      if (employee) {
        const calc = calculateEmployeeOvertime(employee);
        totalHours += calc.totalHours;
        totalAmount += calc.totalAmount;
        employeeCount++;
      }
    });
    
    return {
      totalHours: Math.round(totalHours * 10) / 10,
      totalAmount: Math.round(totalAmount),
      employeeCount
    };
  };

  // ارسال اطلاعات به سرور برای ذخیره
  const handleSubmitOvertime = async () => {
    if (selectedEmployees.length === 0) {
      alert("⚠️ لطفاً حداقل یک کارمند را انتخاب کنید.");
      return;
    }
    
    const periodCode = `${overtimeSettings.periodYear}-${overtimeSettings.periodMonth}`;
    const calculateDate = formatToJalaliString(overtimeSettings.calculateDate);
    
    if (!calculateDate) {
      alert("⚠️ لطفاً تاریخ محاسبه را انتخاب کنید.");
      return;
    }
    
    const confirmMessage = `آیا از ثبت ${selectedEmployees.length} رکورد اضافه‌کاری برای دوره ${periodCode} در تاریخ ${calculateDate} اطمینان دارید؟`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    setIsProcessing(true);
    
    // آماده‌سازی داده‌ها برای ارسال به API
    const overtimeRecords = selectedEmployees.map(nationalCode => {
      const employee = employees.find(emp => emp.nationalCode === nationalCode);
      const overtime = employeeOvertime[nationalCode] || {};
      const calc = calculateEmployeeOvertime(employee);
      
      return {
        nationalCode,
        normalHours: overtime.normalHours || 0,
        holidayHours: overtime.holidayHours || 0,
        nightHours: overtime.nightHours || 0,
        otherHours: 0,
        normalRate: overtimeSettings.normalRate,
        holidayRate: overtimeSettings.holidayRate,
        nightRate: overtimeSettings.nightRate,
        otherRate: 1.0,
        baseSalary: employee.baseSalary || 0,
        hourlyRate: calc.hourlyRate,
        notes: overtime.notes || '',
        employeeName: `${employee.firstName} ${employee.lastName}`,
        department: employee.department || '',
        jobTitle: employee.jobTitle || ''
      };
    });
    
    const payload = {
      overtimeRecords,
      periodYear: toNumber(overtimeSettings.periodYear),
      periodMonth: toNumber(overtimeSettings.periodMonth),
      periodCode,
      calculateDate, // ارسال تاریخ محاسبه
      description: `ثبت گروهی اضافه‌کاری دوره ${periodCode} - تاریخ محاسبه: ${calculateDate}`
    };
    
    console.log("📤 ارسال داده‌های اضافه‌کاری:", {
      recordCount: overtimeRecords.length,
      periodCode,
      calculateDate,
      totalAmount: totals.totalAmount,
      totalHours: totals.totalHours
    });
    
    try {
      const res = await fetch("http://localhost:5000/api/payroll-overtime/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (data.success) {
        alert(`✅ ${data.message}\n\nثبت شده: ${data.results?.length || 0} کارمند\nخطاها: ${data.errors?.length || 0}\n\nتاریخ محاسبه: ${calculateDate}\nمجموع ساعات: ${totals.totalHours}\nمجموع مبلغ: ${formatCurrency(totals.totalAmount)} ریال`);
        
        // ریست فرم
        setSelectedEmployees([]);
        setSelectAll(false);
        
        // پاک کردن ساعات وارد شده
        const resetOvertime = { ...employeeOvertime };
        selectedEmployees.forEach(nationalCode => {
          resetOvertime[nationalCode] = {
            normalHours: 0,
            holidayHours: 0,
            nightHours: 0,
            notes: ''
          };
        });
        setEmployeeOvertime(resetOvertime);
        
      } else {
        alert(`❌ خطا: ${data.error}`);
      }
    } catch (err) {
      console.error("❌ خطا در ثبت اضافه‌کاری:", err);
      alert(`❌ خطا در ارتباط با سرور: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // لیست بخش‌های موجود
  const departments = [...new Set(employees.map(emp => emp.department).filter(Boolean))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">در حال بارگذاری اطلاعات کارمندان...</p>
        </div>
      </div>
    );
  }

  const totals = calculateTotals();
  const formattedDate = formatToJalaliString(overtimeSettings.calculateDate);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                <Clock className="text-blue-600" size={28} />
                محاسبه اضافه‌کاری کارکنان
              </h1>
              <p className="text-gray-600">
                مدیریت و محاسبه اضافه‌کاری بر اساس حقوق پایه هر کارمند
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={loadEmployees}
                className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                <RefreshCw size={18} />
                <span>بروزرسانی لیست</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* پنل سمت چپ - تنظیمات و فیلترها */}
          <div className="lg:col-span-1 space-y-6">
            {/* تنظیمات دوره */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Calendar size={20} />
                تنظیمات دوره
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    سال
                  </label>
                  <input
                    type="text"
                    name="periodYear"
                    value={overtimeSettings.periodYear}
                    onChange={handleOvertimeSettingChange}
                    className="w-full border rounded-lg p-2"
                    placeholder="1404"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ماه
                  </label>
                  <select
                    name="periodMonth"
                    value={overtimeSettings.periodMonth}
                    onChange={handleOvertimeSettingChange}
                    className="w-full border rounded-lg p-2"
                  >
                    {months.map(month => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    تاریخ محاسبه
                  </label>
                  <FdatePicker
                    calendar={persian}
                    locale={persian_fa}
                    value={overtimeSettings.calculateDate}
                    onChange={handleDateChange}
                    format="YYYY/MM/DD"
                    inputClass="w-full border rounded-lg p-2"
                  />
                  {formattedDate && (
                    <div className="text-xs text-gray-500 mt-1">
                      انتخاب شده: {formattedDate}
                    </div>
                  )}
                </div>
                
                <div className="pt-4 border-t">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    نرخ‌های اضافه‌کاری
                  </label>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">عادی</label>
                      <input
                        type="number"
                        step="0.05"
                        name="normalRate"
                        value={overtimeSettings.normalRate}
                        onChange={handleOvertimeSettingChange}
                        className="w-full border rounded-lg p-2 text-sm"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {overtimeSettings.normalRate}x (معمولاً 1.4)
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">تعطیل</label>
                      <input
                        type="number"
                        step="0.05"
                        name="holidayRate"
                        value={overtimeSettings.holidayRate}
                        onChange={handleOvertimeSettingChange}
                        className="w-full border rounded-lg p-2 text-sm"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {overtimeSettings.holidayRate}x (معمولاً 2.0)
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">شبانه</label>
                      <input
                        type="number"
                        step="0.05"
                        name="nightRate"
                        value={overtimeSettings.nightRate}
                        onChange={handleOvertimeSettingChange}
                        className="w-full border rounded-lg p-2 text-sm"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {overtimeSettings.nightRate}x (معمولاً 1.75)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* فیلترها */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Users size={20} />
                فیلتر کارمندان
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    جستجو
                  </label>
                  <input
                    type="text"
                    name="search"
                    value={filters.search}
                    onChange={handleFilterChange}
                    placeholder="نام، نام خانوادگی، کد ملی..."
                    className="w-full border rounded-lg p-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    واحد سازمانی
                  </label>
                  <select
                    name="department"
                    value={filters.department}
                    onChange={handleFilterChange}
                    className="w-full border rounded-lg p-2"
                  >
                    <option value="">همه واحدها</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showActiveOnly"
                    name="showActiveOnly"
                    checked={filters.showActiveOnly}
                    onChange={handleFilterChange}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="showActiveOnly" className="text-sm text-gray-700">
                    فقط کارمندان فعال
                  </label>
                </div>
              </div>
            </div>

            {/* جمع‌بندی */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Calculator size={20} />
                جمع‌بندی
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm opacity-90">کارمندان انتخاب شده</span>
                  <span className="font-bold text-lg">{selectedEmployees.length}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm opacity-90">مجموع ساعات</span>
                  <span className="font-bold text-lg">{totals.totalHours}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm opacity-90">مجموع مبلغ</span>
                  <span className="font-bold text-lg">{formatCurrency(totals.totalAmount)}</span>
                </div>
                
                <div className="pt-3 border-t border-white/20">
                  <div className="text-xs opacity-80">
                    دوره: {overtimeSettings.periodYear}-{overtimeSettings.periodMonth}
                  </div>
                  <div className="text-xs opacity-80 mt-1">
                    تاریخ: {formattedDate}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* پنل اصلی - لیست کارمندان */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                    لیست کارمندان ({filteredEmployees.length} نفر)
                  </h3>
                  
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAllChange}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        disabled={isProcessing}
                      />
                      <span className="text-sm text-gray-600">انتخاب همه</span>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      انتخاب شده: <span className="font-bold text-blue-600">{selectedEmployees.length}</span> نفر
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      تاریخ: <span className="font-bold text-green-600">{formattedDate}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      setSelectedEmployees([]);
                      setSelectAll(false);
                    }}
                    className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-lg transition-colors text-sm"
                    disabled={isProcessing || selectedEmployees.length === 0}
                  >
                    <Minus size={16} />
                    پاک کردن انتخاب‌ها
                  </button>
                  
                  <button
                    onClick={handleSubmitOvertime}
                    disabled={isProcessing || selectedEmployees.length === 0}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>در حال پردازش...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle size={18} />
                        <span>ثبت اضافه‌کاری</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              {/* تنظیمات سریع */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={overtimeSettings.applyToAll}
                      onChange={(e) => setOvertimeSettings(prev => ({
                        ...prev,
                        applyToAll: e.target.checked
                      }))}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">اعمال ساعت پیش‌فرض به انتخاب شده‌ها</span>
                  </div>
                  
                  {overtimeSettings.applyToAll && (
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        value={overtimeSettings.defaultHours}
                        onChange={(e) => setOvertimeSettings(prev => ({
                          ...prev,
                          defaultHours: toNumber(e.target.value)
                        }))}
                        className="w-24 border rounded-lg p-2"
                        placeholder="ساعت"
                      />
                      <button
                        onClick={applyDefaultHours}
                        className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        اعمال
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* جدول کارمندان */}
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto border rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="p-3 text-right">انتخاب</th>
                      <th className="p-3 text-right">کارمند</th>
                      <th className="p-3 text-right">حقوق ساعتی</th>
                      <th className="p-3 text-right text-center">ساعات عادی</th>
                      <th className="p-3 text-right text-center">ساعات تعطیل</th>
                      <th className="p-3 text-right text-center">ساعات شبانه</th>
                      <th className="p-3 text-right">جمع مبلغ</th>
                      <th className="p-3 text-right">توضیحات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.length > 0 ? (
                      filteredEmployees.map(emp => {
                        const calc = calculateEmployeeOvertime(emp);
                        const overtime = employeeOvertime[emp.nationalCode] || {};
                        const isSelected = selectedEmployees.includes(emp.nationalCode);
                        
                        return (
                          <tr 
                            key={emp.nationalCode} 
                            className={`border-t ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                          >
                            {/* ستون انتخاب */}
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleEmployeeCheckboxChange(emp.nationalCode)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                disabled={isProcessing}
                              />
                            </td>
                            
                            {/* اطلاعات کارمند */}
                            <td className="p-3">
                              <div className="font-medium text-gray-800">
                                {emp.firstName} {emp.lastName}
                              </div>
                              <div className="text-xs text-gray-500">
                                {emp.nationalCode} • {emp.department || '-'}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                حقوق پایه: {formatCurrency(emp.baseSalary || 0)} ریال
                              </div>
                            </td>
                            
                            {/* حقوق ساعتی */}
                            <td className="p-3 text-left">
                              <div className="font-mono text-sm">
                                {formatCurrency(calc.hourlyRate)} ریال
                              </div>
                            </td>
                            
                            {/* ساعات عادی */}
                            <td className="p-3">
                              <div className="flex flex-col items-center">
                                <input
                                  type="number"
                                  value={overtime.normalHours || 0}
                                  onChange={(e) => handleEmployeeOvertimeChange(emp.nationalCode, 'normalHours', e.target.value)}
                                  className="w-20 border rounded p-1 text-center text-sm"
                                  min="0"
                                  step="0.5"
                                />
                                <div className="text-xs text-green-600 mt-1">
                                  {formatCurrency(calc.normalAmount)} ریال
                                </div>
                              </div>
                            </td>
                            
                            {/* ساعات تعطیل */}
                            <td className="p-3">
                              <div className="flex flex-col items-center">
                                <input
                                  type="number"
                                  value={overtime.holidayHours || 0}
                                  onChange={(e) => handleEmployeeOvertimeChange(emp.nationalCode, 'holidayHours', e.target.value)}
                                  className="w-20 border rounded p-1 text-center text-sm"
                                  min="0"
                                  step="0.5"
                                />
                                <div className="text-xs text-orange-600 mt-1">
                                  {formatCurrency(calc.holidayAmount)} ریال
                                </div>
                              </div>
                            </td>
                            
                            {/* ساعات شبانه */}
                            <td className="p-3">
                              <div className="flex flex-col items-center">
                                <input
                                  type="number"
                                  value={overtime.nightHours || 0}
                                  onChange={(e) => handleEmployeeOvertimeChange(emp.nationalCode, 'nightHours', e.target.value)}
                                  className="w-20 border rounded p-1 text-center text-sm"
                                  min="0"
                                  step="0.5"
                                />
                                <div className="text-xs text-purple-600 mt-1">
                                  {formatCurrency(calc.nightAmount)} ریال
                                </div>
                              </div>
                            </td>
                            
                            {/* جمع مبلغ */}
                            <td className="p-3 text-left">
                              <div className="font-bold text-green-700">
                                {formatCurrency(calc.totalAmount)} ریال
                              </div>
                              <div className="text-xs text-gray-500">
                                {calc.totalHours} ساعت
                              </div>
                            </td>
                            
                            {/* توضیحات */}
                            <td className="p-3">
                              <input
                                type="text"
                                value={overtime.notes || ''}
                                onChange={(e) => handleEmployeeOvertimeChange(emp.nationalCode, 'notes', e.target.value)}
                                placeholder="توضیحات..."
                                className="w-full border rounded p-1 text-sm"
                              />
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="8" className="p-8 text-center text-gray-500">
                          <AlertCircle className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                          <p>هیچ کارمندی یافت نشد</p>
                          <p className="text-sm mt-2">لطفاً فیلترهای جستجو را تغییر دهید</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* خلاصه نهایی */}
            {selectedEmployees.length > 0 && (
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h3 className="text-lg font-bold mb-2">خلاصه نهایی اضافه‌کاری</h3>
                    <div className="text-sm opacity-90">
                      دوره: {overtimeSettings.periodYear}-{overtimeSettings.periodMonth}
                    </div>
                    <div className="text-sm opacity-90">
                      تاریخ محاسبه: {formattedDate}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-3xl font-bold mb-1">
                      {formatCurrency(totals.totalAmount)} ریال
                    </div>
                    <div className="text-sm opacity-90">
                      {totals.totalHours} ساعت • {selectedEmployees.length} کارمند
                    </div>
                  </div>
                  
                  <div>
                    <button
                      onClick={handleSubmitOvertime}
                      disabled={isProcessing}
                      className="flex items-center gap-2 bg-white text-green-700 hover:bg-gray-100 px-6 py-3 rounded-lg transition-colors font-bold disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-700"></div>
                          <span>در حال پردازش...</span>
                        </>
                      ) : (
                        <>
                          <DollarSign size={20} />
                          <span>ثبت نهایی اضافه‌کاری</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}