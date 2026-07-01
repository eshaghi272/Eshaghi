// 📁 src/components/payroll/EmployeeManagementPage.jsx
import React, { useEffect, useState } from "react";

export default function EmployeeManagementPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nationalCode: '',
    baseSalary: 0,
    department: '',
    jobTitle: '',
    hireDate: '',
    childrenCount: 0,
    seniorityYears: 0,
    isMarried: 0,
    housingAllowance: 0,
    foodAllowance: 0,
    transportationAllowance: 0,
    overtimeRate: 0,
    seniorityPercent: 1,
    taxExemptionAmount: 0,
    bankName: '',
    bankAccount: '',
    shebaNumber: '',
    employmentType: 'permanent',
    jobGrade: '',
    annualLeaveDays: 26
  });

  // Load all employees (including non-salary)
  useEffect(() => {
    fetch("http://localhost:5000/api/persons")
      .then((res) => res.json())
      .then((data) => {
        const employeeList = Array.isArray(data) ? data : 
                           Array.isArray(data?.data) ? data.data : [];
        setEmployees(employeeList);
      })
      .catch((err) => console.error("❌ خطا در دریافت لیست پرسنل:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleEmployeeSelect = (employee) => {  // اصلاح: پارامتر را کامل بگیریم
    const nationalCode = employee.nationalCode;
    const personName = `${employee.firstName} ${employee.lastName}`;
    
    setSelectedEmployee(nationalCode);
    setShowForm(true);
    
    // ابتدا فرم را با اطلاعات اولیه پر کنیم
    setFormData(prev => ({
      ...prev,
      nationalCode: nationalCode,
      baseSalary: 0,
      department: '',
      jobTitle: '',
      hireDate: '',
      childrenCount: 0,
      seniorityYears: 0,
      isMarried: 0,
      housingAllowance: 0,
      foodAllowance: 0,
      transportationAllowance: 0,
      overtimeRate: 0,
      seniorityPercent: 1,
      taxExemptionAmount: 0,
      bankName: '',
      bankAccount: '',
      shebaNumber: '',
      employmentType: 'permanent',
      jobGrade: '',
      annualLeaveDays: 26
    }));
    
    // سپس اطلاعات موجود را از سرور بگیریم
    fetch(`http://localhost:5000/api/payroll-new/employee/${nationalCode}`)
      .then(res => res.json())
      .then(data => {
        console.log("پاسخ API کارمند:", data); // برای دیباگ
        if (data.success && data.data && data.data.employee) {
          const emp = data.data.employee;
          console.log("اطلاعات کارمند از سرور:", emp); // برای دیباگ
          
          setFormData(prev => ({
            ...prev,
            nationalCode: nationalCode,
            baseSalary: emp.baseSalary || 0,
            department: emp.department || '',
            jobTitle: emp.jobTitle || '',
            hireDate: emp.hireDate || '',
            childrenCount: emp.childrenCount || 0,
            seniorityYears: emp.seniorityYears || 0,
            isMarried: emp.isMarried || 0,
            housingAllowance: emp.housingAllowance || 0,
            foodAllowance: emp.foodAllowance || 0,
            transportationAllowance: emp.transportationAllowance || 0,
            overtimeRate: emp.overtimeRate || 0,
            seniorityPercent: emp.seniorityPercent || 1,
            taxExemptionAmount: emp.taxExemptionAmount || 0,
            bankName: emp.bankName || '',
            bankAccount: emp.bankAccount || '',
            shebaNumber: emp.shebaNumber || '',
            employmentType: emp.employmentType || 'permanent',
            jobGrade: emp.jobGrade || '',
            annualLeaveDays: emp.annualLeaveDays || 26
          }));
        } else {
          console.log("اطلاعات کارمند موجود نیست");
          // فقط کد ملی را تنظیم کنیم
          setFormData(prev => ({
            ...prev,
            nationalCode: nationalCode
          }));
        }
      })
      .catch(err => {
        console.error("❌ خطا در دریافت اطلاعات کارمند:", err);
        // در صورت خطا، حداقل کد ملی را تنظیم کنیم
        setFormData(prev => ({
          ...prev,
          nationalCode: nationalCode
        }));
      });
  };

  const handleFormChange = (e) => {
    const { name, value, type } = e.target;
    
    // مدیریت انواع مختلف فیلدها
    let processedValue = value;
    
    if (type === 'number') {
      processedValue = value === '' ? 0 : parseInt(value);
    } else if (name.includes('Percent') || name.includes('Rate')) {
      processedValue = value === '' ? 0 : parseFloat(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // اعتبارسنجی
    if (!formData.nationalCode || formData.nationalCode.trim() === '') {
      alert("❌ خطا: کد ملی الزامی است");
      return;
    }
    
    if (!formData.baseSalary || formData.baseSalary <= 0) {
      alert("❌ خطا: حقوق پایه باید بیشتر از صفر باشد");
      return;
    }
    
    console.log("داده‌های ارسالی به سرور:", formData);
    
    try {
      const res = await fetch("http://localhost:5000/api/payroll-new/employee/details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      console.log("پاسخ از سرور:", data);
      
      if (data.success) {
        alert(`✅ ${data.message}`);
        setShowForm(false);
        setSelectedEmployee(null);
        
        // بارگذاری مجدد لیست پرسنل
        setTimeout(() => {
          fetch("http://localhost:5000/api/persons")
            .then((res) => res.json())
            .then((data) => {
              const employeeList = Array.isArray(data) ? data : 
                                 Array.isArray(data?.data) ? data.data : [];
              setEmployees(employeeList);
            })
            .catch(err => console.error("❌ خطا در بارگذاری مجدد لیست:", err));
        }, 500);
        
      } else {
        alert(`❌ خطا: ${data.error || 'خطای ناشناخته'}`);
      }
    } catch (err) {
      console.error("❌ خطا در ذخیره اطلاعات:", err);
      alert(`❌ خطا در ارتباط با سرور: ${err.message}`);
    }
  };
  const formatCurrency = (n) => 
    new Intl.NumberFormat("fa-IR").format(n || 0);

  // تابع برای چک کردن اینکه آیا کارمند حقوق‌بگیر است یا نه
  const isEmployeeSalaried = (employee) => {
    return employee.isSalary === 1 || employee.isSalary === '1' || employee.isSalary === true;
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto bg-white shadow-lg rounded-lg p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">در حال بارگذاری لیست پرسنل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">مدیریت کارمندان حقوق‌بگیر</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* لیست پرسنل */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-700">لیست تمام پرسنل</h3>
            <span className="text-sm text-gray-600">
              {employees.filter(e => isEmployeeSalaried(e)).length} نفر حقوق‌بگیر
            </span>
          </div>
          <div className="overflow-x-auto border rounded-lg max-h-[600px] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="p-3 text-right">کد ملی</th>
                  <th className="p-3 text-right">نام و نام خانوادگی</th>
                  <th className="p-3 text-right">وضعیت حقوق</th>
                  <th className="p-3 text-right">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {employees.length > 0 ? (
                  employees.map((emp) => (
                    <tr 
                      key={emp.id || emp.nationalCode} 
                      className="border-t hover:bg-gray-50"
                    >
                      <td className="p-3 font-mono text-sm">{emp.nationalCode || '-'}</td>
                      <td className="p-3">{emp.firstName || ''} {emp.lastName || ''}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${isEmployeeSalaried(emp) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {isEmployeeSalaried(emp) ? 'حقوق‌بگیر' : 'غیر حقوق‌بگیر'}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleEmployeeSelect(emp)}
                          className={`px-3 py-1 rounded transition duration-200 text-xs ${isEmployeeSalaried(emp) ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-green-600 text-white hover:bg-green-700'}`}
                        >
                          {isEmployeeSalaried(emp) ? 'ویرایش اطلاعات' : 'اضافه کردن حقوق'}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-gray-500">
                      هیچ پرسنلی یافت نشد
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* فرم اطلاعات حقوقی */}
        <div className={`border rounded-lg p-4 ${showForm ? 'bg-gray-50' : 'bg-gray-100'} transition-all duration-300`}>
          {showForm && selectedEmployee ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-700">
                  {formData.baseSalary > 0 ? 'ویرایش اطلاعات حقوقی' : 'ثبت اطلاعات حقوقی'}
                </h3>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setSelectedEmployee(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                  title="بستن فرم"
                >
                  ✕
                </button>
              </div>
              
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <div className="text-sm font-medium text-blue-800">کد ملی انتخاب شده:</div>
                <div className="font-mono text-lg font-bold">{formData.nationalCode}</div>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      حقوق پایه (ریال)
                    </label>
                    <input
                      type="number"
                      name="baseSalary"
                      value={formData.baseSalary}
                      onChange={handleFormChange}
                      className="w-full border rounded-lg p-2"
                      required
                      min="0"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {formatCurrency(formData.baseSalary)} ریال
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      واحد سازمانی
                    </label>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleFormChange}
                      className="w-full border rounded-lg p-2"
                      placeholder="مثلاً: مالی، فروش، فنی"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      عنوان شغلی
                    </label>
                    <input
                      type="text"
                      name="jobTitle"
                      value={formData.jobTitle}
                      onChange={handleFormChange}
                      className="w-full border rounded-lg p-2"
                      placeholder="مثلاً: حسابدار، کارشناس فروش"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      تاریخ استخدام
                    </label>
                    <input
                      type="text"
                      name="hireDate"
                      value={formData.hireDate}
                      onChange={handleFormChange}
                      placeholder="1403/01/01"
                      className="w-full border rounded-lg p-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      تعداد فرزند
                    </label>
                    <input
                      type="number"
                      name="childrenCount"
                      value={formData.childrenCount}
                      onChange={handleFormChange}
                      className="w-full border rounded-lg p-2"
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      سابقه کار (سال)
                    </label>
                    <input
                      type="number"
                      name="seniorityYears"
                      value={formData.seniorityYears}
                      onChange={handleFormChange}
                      className="w-full border rounded-lg p-2"
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      وضعیت تأهل
                    </label>
                    <select
                      name="isMarried"
                      value={formData.isMarried}
                      onChange={handleFormChange}
                      className="w-full border rounded-lg p-2"
                    >
                      <option value="0">مجرد</option>
                      <option value="1">متأهل</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      نوع استخدام
                    </label>
                    <select
                      name="employmentType"
                      value={formData.employmentType}
                      onChange={handleFormChange}
                      className="w-full border rounded-lg p-2"
                    >
                      <option value="permanent">دائمی</option>
                      <option value="contract">قراردادی</option>
                      <option value="temporary">موقت</option>
                      <option value="parttime">پاره وقت</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      حق مسکن (ریال)
                    </label>
                    <input
                      type="number"
                      name="housingAllowance"
                      value={formData.housingAllowance}
                      onChange={handleFormChange}
                      className="w-full border rounded-lg p-2"
                      min="0"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {formatCurrency(formData.housingAllowance)} ریال
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      بن خواربار (ریال)
                    </label>
                    <input
                      type="number"
                      name="foodAllowance"
                      value={formData.foodAllowance}
                      onChange={handleFormChange}
                      className="w-full border rounded-lg p-2"
                      min="0"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {formatCurrency(formData.foodAllowance)} ریال
                    </div>
                  </div>
                </div>
                
                {/* اطلاعات بانکی */}
                <div className="pt-4 border-t">
                  <h4 className="text-md font-medium text-gray-700 mb-3">اطلاعات بانکی</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        نام بانک
                      </label>
                      <input
                        type="text"
                        name="bankName"
                        value={formData.bankName}
                        onChange={handleFormChange}
                        className="w-full border rounded-lg p-2"
                        placeholder="مثلاً: ملت، صادرات"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        شماره حساب
                      </label>
                      <input
                        type="text"
                        name="bankAccount"
                        value={formData.bankAccount}
                        onChange={handleFormChange}
                        className="w-full border rounded-lg p-2"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        شماره شبا
                      </label>
                      <input
                        type="text"
                        name="shebaNumber"
                        value={formData.shebaNumber}
                        onChange={handleFormChange}
                        className="w-full border rounded-lg p-2"
                        placeholder="IRXXXXXXXXXXXXXXXXXXXXXXXX"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setSelectedEmployee(null);
                    }}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition duration-200"
                  >
                    انصراف
                  </button>
                  
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-200 font-medium"
                  >
                    ذخیره اطلاعات
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 2.5l-2.12-2.122m0 0l-2.122-2.121m2.122 2.121L19.5 19.5m-2.121-2.121l2.121-2.122m-2.121 2.122l-2.122 2.121"></path>
              </svg>
              <p className="text-lg">کارمندی انتخاب نشده است</p>
              <p className="text-sm mt-2">برای ویرایش اطلاعات، یک کارمند را از لیست انتخاب کنید</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}