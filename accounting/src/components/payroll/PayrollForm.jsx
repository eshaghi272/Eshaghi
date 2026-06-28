// 📁 src/components/payroll/PayrollPage.jsx
import React, { useEffect, useState } from "react";
import persian from "react-date-object/calendars/persian";
import persian_en from "react-date-object/locales/persian_en";
import FdatePicker from "../ui/FdatePicker";

export default function PayrollPage() {
  const [employees, setEmployees] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, message: "" });
  const [loading, setLoading] = useState(true);
  
  const [form, setForm] = useState({
    Period: "1404-01",
    PayDate: null,
    WorkDays: 30,
    OvertimeHours: 0,
  });
  
  const [year, setYear] = useState("1404");
  const [month, setMonth] = useState("01");
  
  // Helpers
  const toNumber = (val) => {
    const n = Number(val);
    return Number.isFinite(n) ? n : 0;
  };
  
  const formatCurrency = (n) =>
    new Intl.NumberFormat("fa-IR").format(toNumber(n));

  // Load employees with payroll info
  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:5000/api/persons");
        const data = await res.json();
        
        let employeeList = [];
        if (Array.isArray(data)) {
          employeeList = data;
        } else if (Array.isArray(data?.data)) {
          employeeList = data.data;
        }
        
        // فرض می‌کنیم اطلاعات هر کارمند شامل این فیلدها است:
        // childrenCount, seniorityYears, isMarried, baseSalary
        // اگر این فیلدها در API شما متفاوت هستند، آنها را مطابق API خود تنظیم کنید
        
        setEmployees(employeeList);
      } catch (err) {
        console.error("❌ خطا در دریافت لیست پرسنل:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEmployees();
  }, []);

  // Load payrolls
  const loadPayrolls = () => {
    fetch("http://localhost:5000/api/payroll")
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];
        setPayrolls(list);
      })
      .catch((err) => console.error("❌ خطا در دریافت لیست حقوق:", err));
  };
  
  useEffect(() => {
    loadPayrolls();
  }, []);

  // Update Period when year or month changes
  useEffect(() => {
    setForm(prev => ({...prev, Period: `${year}-${month}`}));
  }, [year, month]);

  // Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleYearChange = (e) => {
    setYear(e.target.value);
  };

  const handleMonthChange = (e) => {
    setMonth(e.target.value);
  };

  const handleDateChange = (date) => {
    setForm({ ...form, PayDate: date });
  };
  
  // Handle individual employee selection
  const handleEmployeeCheckboxChange = (employeeId) => {
    setSelectedEmployeeIds(prev => {
      if (prev.includes(employeeId)) {
        return prev.filter(id => id !== employeeId);
      } else {
        return [...prev, employeeId];
      }
    });
  };
  
  // Handle select all employees
  const handleSelectAllChange = () => {
    if (selectAll) {
      setSelectedEmployeeIds([]);
    } else {
      const allIds = employees.map(emp => emp.id);
      setSelectedEmployeeIds(allIds);
    }
    setSelectAll(!selectAll);
  };
  
  // Update selectAll state when selectedEmployeeIds changes
  useEffect(() => {
    if (employees.length > 0) {
      setSelectAll(selectedEmployeeIds.length === employees.length);
    }
  }, [selectedEmployeeIds, employees.length]);

  // Submit payroll for multiple employees
  const handleSubmitMultiple = async (e) => {
    e.preventDefault();
    
    if (selectedEmployeeIds.length === 0) {
      alert("⚠️ لطفاً حداقل یک کارمند را انتخاب کنید.");
      return;
    }
    
    if (!form.PayDate) {
      alert("⚠️ لطفاً تاریخ پرداخت را انتخاب کنید.");
      return;
    }
    
    if (!window.confirm(`آیا از ایجاد حقوق برای ${selectedEmployeeIds.length} کارمند در دوره ${year}-${month} اطمینان دارید؟`)) {
      return;
    }
    
    setIsProcessing(true);
    setProgress({ current: 0, total: selectedEmployeeIds.length, message: "در حال پردازش..." });
    
    const formattedPayDate = typeof form.PayDate.format === 'function' 
      ? form.PayDate.format("YYYY/MM/DD") 
      : form.PayDate;
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (let i = 0; i < selectedEmployeeIds.length; i++) {
      const employeeId = selectedEmployeeIds[i];
      const employee = employees.find(emp => emp.id === employeeId);
      
      if (!employee) continue;
      
      setProgress({ 
        current: i + 1, 
        total: selectedEmployeeIds.length, 
        message: `در حال پردازش: ${employee.firstName} ${employee.lastName}` 
      });
      
      // استفاده از اطلاعات ذخیره شده برای هر کارمند
      // توجه: نام فیلدها باید با API شما تطبیق داده شوند
      const childrenCount = employee.childrenCount || employee.childCount || 0;
      const seniorityYears = employee.seniorityYears || employee.seniority || 0;
      const isMarried = employee.isMarried || employee.maritalStatus || 0;
      const baseSalary = employee.baseSalary || employee.salary || 0;
      
      const payrollData = {
        PersonnelCode: employeeId,
        NationalCode: employee.nationalCode,
        FullName: `${employee.firstName} ${employee.lastName}`,
        Period: `${year}-${month}`,
        PayDate: formattedPayDate,
        WorkDays: form.WorkDays,
        OvertimeHours: form.OvertimeHours,
        ChildrenCount: childrenCount,
        SeniorityYears: seniorityYears,
        IsMarried: isMarried,
        BaseSalary: baseSalary, // ارسال حقوق پایه به سرور برای محاسبات
      };
      
      try {
        const res = await fetch("http://localhost:5000/api/payroll", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payrollData)
        });
        
        if (res.ok) {
          successCount++;
        } else {
          const errorText = await res.text();
          errors.push(`${employee.firstName} ${employee.lastName}: ${errorText}`);
          errorCount++;
          console.error(`خطا برای کارمند ${employeeId}:`, errorText);
        }
      } catch (err) {
        errors.push(`${employee.firstName} ${employee.lastName}: ${err.message}`);
        errorCount++;
        console.error(`خطای شبکه برای کارمند ${employeeId}:`, err);
      }
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setIsProcessing(false);
    
    if (errorCount === 0) {
      alert(`✅ حقوق برای ${successCount} کارمند با موفقیت ایجاد شد.`);
    } else {
      let errorMessage = `⚠️ پردازش کامل شد:\n✅ ${successCount} کارمند با موفقیت\n❌ ${errorCount} کارمند با خطا`;
      
      if (errors.length > 0) {
        errorMessage += "\n\nخطاها:\n" + errors.slice(0, 5).join("\n");
        if (errors.length > 5) {
          errorMessage += `\n... و ${errors.length - 5} خطای دیگر`;
        }
      }
      
      alert(errorMessage);
    }
    
    // Reset selection
    setSelectedEmployeeIds([]);
    setSelectAll(false);
    
    // Reload payrolls
    loadPayrolls();
  };

  // Totals
  const isArray = Array.isArray(payrolls);
  const totalBase = isArray ? payrolls.reduce((s, p) => s + toNumber(p.BaseSalary), 0) : 0;
  const totalGross = isArray ? payrolls.reduce((s, p) => s + toNumber(p.GrossSalary), 0) : 0;
  const totalInsuranceEmp = isArray ? payrolls.reduce((s, p) => s + toNumber(p.InsuranceEmployee), 0) : 0;
  const totalInsuranceEr = isArray ? payrolls.reduce((s, p) => s + toNumber(p.InsuranceEmployer), 0) : 0;
  const totalTax = isArray ? payrolls.reduce((s, p) => s + toNumber(p.TaxAmount), 0) : 0;
  const totalDeductions = isArray ? payrolls.reduce((s, p) => s + toNumber(p.Deductions), 0) : 0;
  const totalNet = isArray ? payrolls.reduce((s, p) => s + toNumber(p.NetSalary), 0) : 0;

  // Helper to get marital status text
  const getMaritalStatus = (employee) => {
    const isMarried = employee.isMarried || employee.maritalStatus || 0;
    return isMarried === 1 ? "متأهل" : "مجرد";
  };

  return (
    <div className="max-w-7xl mx-auto bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">سیستم حقوق و دستمزد</h2>

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

      {/* اطلاعات دوره و تنظیمات عمومی */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-bold text-gray-700 mb-4">تنظیمات دوره حقوق</h3>
        <form onSubmit={handleSubmitMultiple} className="grid grid-cols-2 gap-4">
          {/* سال دوره */}
          <div className="flex items-center gap-3">
            <label className="w-32 text-gray-700">سال:</label>
            <input
              type="text"
              value={year}
              onChange={handleYearChange}
              placeholder="مثلاً 1404"
              className="flex-1 border rounded-lg p-2"
              required
            />
          </div>

          {/* ماه دوره */}
          <div className="flex items-center gap-3">
            <label className="w-32 text-gray-700">ماه:</label>
            <select
              className="flex-1 border rounded-lg p-2"
              value={month}
              onChange={handleMonthChange}
              required
            >
              <option value="01">فروردین</option>
              <option value="02">اردیبهشت</option>
              <option value="03">خرداد</option>
              <option value="04">تیر</option>
              <option value="05">مرداد</option>
              <option value="06">شهریور</option>
              <option value="07">مهر</option>
              <option value="08">آبان</option>
              <option value="09">آذر</option>
              <option value="10">دی</option>
              <option value="11">بهمن</option>
              <option value="12">اسفند</option>
            </select>
          </div>

          {/* تاریخ پرداخت */}
          <div className="flex items-center gap-3">
            <label className="w-32 text-gray-700">تاریخ پرداخت:</label>
            <div className="flex-1">
              <FdatePicker
                calendar={persian}
                locale={persian_en}
                value={form.PayDate}
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
              {year}-{month} ({month === "01" ? "فروردین" : 
                month === "02" ? "اردیبهشت" :
                month === "03" ? "خرداد" :
                month === "04" ? "تیر" :
                month === "05" ? "مرداد" :
                month === "06" ? "شهریور" :
                month === "07" ? "مهر" :
                month === "08" ? "آبان" :
                month === "09" ? "آذر" :
                month === "10" ? "دی" :
                month === "11" ? "بهمن" : "اسفند"})
            </div>
          </div>

          {/* روزهای کارکرد */}
          <div className="flex items-center gap-3">
            <label className="w-32 text-gray-700">روزهای کارکرد:</label>
            <input
              name="WorkDays"
              type="number"
              min="0"
              max="31"
              value={form.WorkDays}
              onChange={handleChange}
              className="flex-1 border rounded-lg p-2"
              required
            />
          </div>

          {/* ساعات اضافه‌کاری */}
          <div className="flex items-center gap-3">
            <label className="w-32 text-gray-700">ساعات اضافه‌کاری:</label>
            <input
              name="OvertimeHours"
              type="number"
              min="0"
              value={form.OvertimeHours}
              onChange={handleChange}
              className="flex-1 border rounded-lg p-2"
            />
          </div>

          {/* دکمه‌های اقدام */}
          <div className="col-span-2 flex justify-between items-center pt-4 border-t">
            <div className="text-gray-700">
              <span className="font-medium">کارمندان انتخاب شده:</span>
              <span className="mr-2 text-blue-600 font-bold"> {selectedEmployeeIds.length}</span>
              نفر
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedEmployeeIds([]);
                  setSelectAll(false);
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition duration-200"
                disabled={isProcessing || selectedEmployeeIds.length === 0}
              >
                پاک کردن انتخاب‌ها
              </button>
              
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-200 font-medium"
                disabled={isProcessing || selectedEmployeeIds.length === 0}
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    در حال پردازش...
                  </span>
                ) : `ایجاد حقوق برای ${selectedEmployeeIds.length} کارمند`}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* لیست کارمندان با امکان انتخاب */}
      <div className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">لیست کارمندان 
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
                  <th className="p-3 text-right">کد پرسنلی</th>
                  <th className="p-3 text-right">نام و نام خانوادگی</th>
                  <th className="p-3 text-right">کد ملی</th>
                  <th className="p-3 text-right">وضعیت تأهل</th>
                  <th className="p-3 text-right">تعداد فرزند</th>
                  <th className="p-3 text-right">سابقه (سال)</th>
                  <th className="p-3 text-right">حقوق پایه</th>
                  <th className="p-3 text-right">وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {employees.length > 0 ? (
                  employees.map((emp) => (
                    <tr 
                      key={emp.id} 
                      className={`border-t hover:bg-gray-50 ${selectedEmployeeIds.includes(emp.id) ? 'bg-blue-50' : ''}`}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedEmployeeIds.includes(emp.id)}
                          onChange={() => handleEmployeeCheckboxChange(emp.id)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          disabled={isProcessing}
                        />
                      </td>
                      <td className="p-3 font-medium">{emp.id}</td>
                      <td className="p-3 font-medium">{emp.firstName} {emp.lastName}</td>
                      <td className="p-3 font-mono">{emp.nationalCode}</td>
                      <td className="p-3">
                        <span className={`px-3 py-1 rounded-full text-sm ${getMaritalStatus(emp) === 'متأهل' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {getMaritalStatus(emp)}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {emp.childrenCount || emp.childCount || 0}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                          {emp.seniorityYears || emp.seniority || 0}
                        </span>
                      </td>
                      <td className="p-3 text-left font-bold">
                        {formatCurrency(emp.baseSalary || emp.salary || 0)}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${selectedEmployeeIds.includes(emp.id) ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                          {selectedEmployeeIds.includes(emp.id) ? 'انتخاب شده' : 'آماده'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="p-8 text-center text-gray-500">
                      <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 2.5l-2.12-2.122m0 0l-2.122-2.121m2.122 2.121L19.5 19.5m-2.121-2.121l2.121-2.122m-2.121 2.122l-2.122 2.121"></path>
                      </svg>
                      هیچ کارمندی یافت نشد
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* جدول لیست حقوق‌های ثبت شده */}
      <div className="mt-10">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">لیست حقوق‌های ثبت شده</h3>
          <button
            onClick={loadPayrolls}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition duration-200 text-sm"
          >
            بروزرسانی لیست
          </button>
        </div>
        
        {/* جمع‌های کل */}
        {isArray && payrolls.length > 0 && (
          <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-blue-50 rounded-lg shadow">
            <div className="text-center p-3 bg-white rounded shadow-sm">
              <div className="text-sm text-gray-600 mb-1">جمع ناخالص</div>
              <div className="text-lg font-bold text-blue-700">{formatCurrency(totalGross)} ریال</div>
            </div>
            <div className="text-center p-3 bg-white rounded shadow-sm">
              <div className="text-sm text-gray-600 mb-1">جمع خالص</div>
              <div className="text-lg font-bold text-green-700">{formatCurrency(totalNet)} ریال</div>
            </div>
            <div className="text-center p-3 bg-white rounded shadow-sm">
              <div className="text-sm text-gray-600 mb-1">جمع بیمه کارفرما</div>
              <div className="text-lg font-bold text-purple-700">{formatCurrency(totalInsuranceEr)} ریال</div>
            </div>
            <div className="text-center p-3 bg-white rounded shadow-sm">
              <div className="text-sm text-gray-600 mb-1">جمع مالیات</div>
              <div className="text-lg font-bold text-red-700">{formatCurrency(totalTax)} ریال</div>
            </div>
          </div>
        )}
        
        <div className="overflow-x-auto border rounded-lg">
          {isArray && payrolls.length > 0 ? (
            <table className="w-full border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-2">کد ملی</th>
                  <th className="border p-2">نام</th>
                  <th className="border p-2">دوره</th>
                  <th className="border p-2">روزهای کارکرد</th>
                  <th className="border p-2">ساعات اضافه‌کاری</th>
                  <th className="border p-2">تعداد فرزند</th>
                  <th className="border p-2">سابقه</th>
                  <th className="border p-2">تأهل</th>
                  <th className="border p-2">حقوق پایه</th>
                  <th className="border p-2">اضافه‌کاری</th>
                  <th className="border p-2">سنوات</th>
                  <th className="border p-2">حق مسکن</th>
                  <th className="border p-2">بن</th>
                  <th className="border p-2">حق اولاد</th>
                  <th className="border p-2">حق تأهل</th>
                  <th className="border p-2">جمع ناخالص</th>
                  <th className="border p-2">بیمه کارگر</th>
                  <th className="border p-2">بیمه کارفرما</th>
                  <th className="border p-2">مالیات</th>
                  <th className="border p-2">کسورات</th>
                  <th className="border p-2">خالص پرداختی</th>
                  <th className="border p-2">تاریخ پرداخت</th>
                  <th className="border p-2">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {payrolls.map((p) => (
                  <tr key={p.PayrollId || `${p.PersonnelCode}-${p.Period}`} 
                      className="hover:bg-gray-50 border-t">
                    <td className="border p-2 text-center">{p.NationalCode}</td>
                    <td className="border p-2">{p.FullName}</td>
                    <td className="border p-2 text-center font-medium">{p.Period}</td>
                    <td className="border p-2 text-center">{p.WorkDays}</td>
                    <td className="border p-2 text-center">{p.OvertimeHours}</td>
                    <td className="border p-2 text-center">{p.ChildrenCount}</td>
                    <td className="border p-2 text-center">{p.SeniorityYears}</td>
                    <td className="border p-2 text-center">{p.IsMarried === 1 ? "متأهل" : "مجرد"}</td>
                    <td className="border p-2 text-left">{formatCurrency(p.BaseSalary)}</td>
                    <td className="border p-2 text-left">{formatCurrency(p.OvertimeAmount)}</td>
                    <td className="border p-2 text-left">{formatCurrency(p.SeniorityPay)}</td>
                    <td className="border p-2 text-left">{formatCurrency(p.HousingAllowance)}</td>
                    <td className="border p-2 text-left">{formatCurrency(p.FoodAllowance)}</td>
                    <td className="border p-2 text-left">{formatCurrency(p.ChildAllowanceTotal)}</td>
                    <td className="border p-2 text-left">{formatCurrency(p.MarriageAllowance)}</td>
                    <td className="border p-2 text-left font-semibold">{formatCurrency(p.GrossSalary)}</td>
                    <td className="border p-2 text-left">{formatCurrency(p.InsuranceEmployee)}</td>
                    <td className="border p-2 text-left">{formatCurrency(p.InsuranceEmployer)}</td>
                    <td className="border p-2 text-left">{formatCurrency(p.TaxAmount)}</td>
                    <td className="border p-2 text-left">{formatCurrency(p.Deductions)}</td>
                    <td className="border p-2 text-left text-green-700 font-bold">
                      {formatCurrency(p.NetSalary)}
                    </td>
                    <td className="border p-2 text-center">{p.PayDate || "-"}</td>
                    <td className="border p-2 text-center">
                      <button
                        onClick={async () => {
                          if (!window.confirm("آیا از صدور سند حسابداری اطمینان دارید؟")) {
                            return;
                          }
                          try {
                            const res = await fetch(
                              `http://localhost:5000/api/payroll/${p.PayrollId}/generate-entry`,
                              { method: "POST" }
                            );
                            const data = await res.json();
                            if (res.ok && data.success) {
                              alert(data.message || "✅ سند حسابداری صادر شد");
                            } else {
                              alert("❌ خطا در صدور سند: " + (data.error || "خطای ناشناخته"));
                            }
                          } catch (err) {
                            alert("❌ خطا در ارتباط با سرور: " + err.message);
                          }
                        }}
                        className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 transition duration-200 text-xs"
                        title="صدور سند حسابداری"
                      >
                        ثبت سند
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <p className="text-lg">هیچ داده‌ای یافت نشد</p>
              <p className="text-sm mt-2">هنوز حقوقی برای کارمندان ثبت نشده است.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}