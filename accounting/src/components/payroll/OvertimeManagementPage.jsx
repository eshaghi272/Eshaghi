// 📁 src/components/payroll/OvertimeManagementPage.jsx
import React, { useEffect, useState } from "react";
import { Clock, Search, Filter, Download, Eye, Edit,RefreshCw, Trash2, CheckCircle, XCircle, DollarSign, Calendar, Users, BarChart } from 'lucide-react';

export default function OvertimeManagementPage() {
  const [overtimeRecords, setOvertimeRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    nationalCode: '',
    search: ''
  });

  // Helpers
  const formatCurrency = (n) =>
    new Intl.NumberFormat("fa-IR").format(n || 0);

  // Load overtime records
  const loadOvertimeRecords = (period = '') => {
    setLoading(true);
    let url = 'http://localhost:5000/api/payroll-overtime';
    const params = [];
    
    if (period) {
      url += `?period=${period}`;
      if (filters.status) params.push(`status=${filters.status}`);
      if (filters.nationalCode) params.push(`nationalCode=${filters.nationalCode}`);
    }
    
    if (params.length > 0) {
      url += (period ? '&' : '?') + params.join('&');
    }
    
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setOvertimeRecords(data.data || []);
        }
      })
      .catch((err) => console.error("❌ خطا در دریافت لیست اضافه‌کاری:", err))
      .finally(() => setLoading(false));
  };

  // Load summary
  const loadSummary = (period) => {
    if (!period) return;
    
    fetch(`http://localhost:5000/api/payroll-overtime/summary/${period}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSummary(data.data);
        }
      })
      .catch((err) => console.error("❌ خطا در دریافت خلاصه:", err));
  };

  useEffect(() => {
    loadOvertimeRecords(selectedPeriod);
    if (selectedPeriod) {
      loadSummary(selectedPeriod);
    }
  }, [selectedPeriod]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    loadOvertimeRecords(selectedPeriod);
  };

  const handleStatusChange = async (overtimeId, newStatus) => {
    if (!window.confirm(`آیا از تغییر وضعیت به "${newStatus}" اطمینان دارید؟`)) {
      return;
    }
    
    try {
      const res = await fetch(`http://localhost:5000/api/payroll-overtime/${overtimeId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      
      const data = await res.json();
      
      if (data.success) {
        alert(data.message);
        loadOvertimeRecords(selectedPeriod);
      } else {
        alert(`❌ خطا: ${data.error}`);
      }
    } catch (err) {
      console.error("❌ خطا در تغییر وضعیت:", err);
      alert("❌ خطا در ارتباط با سرور: " + err.message);
    }
  };

  const handleGenerateEntry = async (overtimeId) => {
    if (!window.confirm("آیا از صدور سند حسابداری اطمینان دارید؟")) {
      return;
    }
    
    try {
      const res = await fetch(`http://localhost:5000/api/payroll-overtime/${overtimeId}/generate-entry`, {
        method: "POST"
      });
      
      const data = await res.json();
      
      if (data.success) {
        alert(`✅ ${data.message}\nشماره سند: ${data.data?.documentNumber}`);
        loadOvertimeRecords(selectedPeriod);
      } else {
        alert(`❌ خطا: ${data.error}`);
      }
    } catch (err) {
      console.error("❌ خطا در صدور سند:", err);
      alert("❌ خطا در ارتباط با سرور: " + err.message);
    }
  };

  const handleDelete = async (overtimeId) => {
    if (!window.confirm("آیا از حذف این رکورد اطمینان دارید؟")) {
      return;
    }
    
    try {
      const res = await fetch(`http://localhost:5000/api/payroll-overtime/${overtimeId}`, {
        method: "DELETE"
      });
      
      const data = await res.json();
      
      if (data.success) {
        alert(data.message);
        loadOvertimeRecords(selectedPeriod);
      } else {
        alert(`❌ خطا: ${data.error}`);
      }
    } catch (err) {
      console.error("❌ خطا در حذف رکورد:", err);
      alert("❌ خطا در ارتباط با سرور: " + err.message);
    }
  };

  // تولید لیست دوره‌ها
  const generatePeriods = () => {
    const periods = [];
    const currentYear = 1404;
    const currentMonth = 2;
    
    for (let year = currentYear - 1; year <= currentYear; year++) {
      for (let month = 1; month <= 12; month++) {
        if (year === currentYear && month > currentMonth) break;
        periods.push(`${year}-${String(month).padStart(2, '0')}`);
      }
    }
    
    return periods.reverse();
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'pending': return 'در انتظار';
      case 'approved': return 'تأیید شده';
      case 'paid': return 'پرداخت شده';
      case 'cancelled': return 'لغو شده';
      default: return status;
    }
  };

  if (loading && !overtimeRecords.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">در حال بارگذاری اطلاعات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                <Clock className="text-blue-600" size={28} />
                مدیریت اضافه‌کاری‌ها
              </h1>
              <p className="text-gray-600">
                مشاهده، تأیید و مدیریت رکوردهای اضافه‌کاری کارکنان
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <a
                href="/overtime-calculation"
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Clock size={18} />
                <span>محاسبه اضافه‌کاری جدید</span>
              </a>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* پنل فیلترها */}
          <div className="lg:col-span-1 space-y-6">
            {/* انتخاب دوره */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Calendar size={20} />
                انتخاب دوره
              </h3>
              
              <div className="space-y-3">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="w-full border rounded-lg p-2"
                >
                  <option value="">همه دوره‌ها</option>
                  {generatePeriods().map(period => (
                    <option key={period} value={period}>{period}</option>
                  ))}
                </select>
                
                <div className="text-sm text-gray-500">
                  {selectedPeriod ? `دوره انتخابی: ${selectedPeriod}` : 'تمامی دوره‌ها'}
                </div>
              </div>
            </div>

            {/* فیلترها */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Filter size={20} />
                فیلترهای پیشرفته
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    وضعیت
                  </label>
                  <select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    className="w-full border rounded-lg p-2"
                  >
                    <option value="">همه وضعیت‌ها</option>
                    <option value="pending">در انتظار</option>
                    <option value="approved">تأیید شده</option>
                    <option value="paid">پرداخت شده</option>
                    <option value="cancelled">لغو شده</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    کد ملی
                  </label>
                  <input
                    type="text"
                    name="nationalCode"
                    value={filters.nationalCode}
                    onChange={handleFilterChange}
                    placeholder="جستجو با کد ملی..."
                    className="w-full border rounded-lg p-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    جستجو
                  </label>
                  <input
                    type="text"
                    name="search"
                    value={filters.search}
                    onChange={handleFilterChange}
                    placeholder="نام، نام خانوادگی..."
                    className="w-full border rounded-lg p-2"
                  />
                </div>
                
                <button
                  onClick={applyFilters}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Search size={18} />
                  <span>اعمال فیلترها</span>
                </button>
              </div>
            </div>

            {/* خلاصه آماری */}
            {summary && (
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl shadow-lg p-6 text-white">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <BarChart size={20} />
                  خلاصه آماری
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm opacity-90">تعداد رکورد</span>
                    <span className="font-bold">{summary.summary?.recordCount || 0}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm opacity-90">تعداد کارمند</span>
                    <span className="font-bold">{summary.summary?.employeeCount || 0}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm opacity-90">مجموع ساعات</span>
                    <span className="font-bold">{summary.summary?.totalHours?.toFixed(1) || 0}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm opacity-90">مجموع مبلغ</span>
                    <span className="font-bold">{formatCurrency(summary.summary?.totalAmount || 0)}</span>
                  </div>
                  
                  <div className="pt-3 border-t border-white/20">
                    <div className="text-xs opacity-80">
                      میانگین ساعات: {summary.summary?.avgHoursPerEmployee?.toFixed(1) || 0}
                    </div>
                    <div className="text-xs opacity-80 mt-1">
                      میانگین مبلغ: {formatCurrency(Math.round(summary.summary?.avgAmountPerEmployee || 0))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* پنل اصلی - لیست رکوردها */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                    لیست رکوردهای اضافه‌کاری
                  </h3>
                  <div className="text-sm text-gray-600">
                    {overtimeRecords.length} رکورد یافت شد
                    {selectedPeriod && ` • دوره: ${selectedPeriod}`}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => loadOvertimeRecords(selectedPeriod)}
                    className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-lg transition-colors text-sm"
                  >
                    <RefreshCw size={16} />
                    <span>بروزرسانی</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      // امکان خروجی اکسل یا PDF
                      alert('امکان خروجی در نسخه بعدی اضافه خواهد شد');
                    }}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors text-sm"
                  >
                    <Download size={16} />
                    <span>خروجی</span>
                  </button>
                </div>
              </div>
              
              {/* جدول رکوردها */}
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto border rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="p-3 text-right">کارمند</th>
                      <th className="p-3 text-right">دوره</th>
                      <th className="p-3 text-right text-center">ساعات</th>
                      <th className="p-3 text-right text-center">مبلغ</th>
                      <th className="p-3 text-right">وضعیت</th>
                      <th className="p-3 text-right">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overtimeRecords.length > 0 ? (
                      overtimeRecords.map((record) => (
                        <tr key={record.id} className="border-t hover:bg-gray-50">
                          {/* اطلاعات کارمند */}
                          <td className="p-3">
                            <div className="font-medium text-gray-800">
                              {record.firstName} {record.lastName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {record.nationalCode} • {record.department || '-'}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {record.jobTitle || 'بدون عنوان'}
                            </div>
                          </td>
                          
                          {/* دوره */}
                          <td className="p-3">
                            <div className="text-center">
                              <div className="font-mono">{record.periodCode}</div>
                              <div className="text-xs text-gray-500">
                                {record.calculateDate}
                              </div>
                            </div>
                          </td>
                          
                          {/* ساعات */}
                          <td className="p-3">
                            <div className="text-center">
                              <div className="font-bold">{record.totalHours.toFixed(1)}</div>
                              <div className="text-xs text-gray-500 space-x-2">
                                <span title="عادی">{record.normalHours.toFixed(1)}</span>
                                <span title="تعطیل" className="text-orange-600">{record.holidayHours.toFixed(1)}</span>
                                <span title="شبانه" className="text-purple-600">{record.nightHours.toFixed(1)}</span>
                              </div>
                            </div>
                          </td>
                          
                          {/* مبلغ */}
                          <td className="p-3">
                            <div className="text-center">
                              <div className="font-bold text-green-700">
                                {formatCurrency(record.totalAmount)} ریال
                              </div>
                              <div className="text-xs text-gray-500">
                                ساعتی: {formatCurrency(record.hourlyRate)}
                              </div>
                            </div>
                          </td>
                          
                          {/* وضعیت */}
                          <td className="p-3">
                            <div className="flex flex-col items-center">
                              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(record.status)}`}>
                                {getStatusText(record.status)}
                              </span>
                              {record.accountingEntryId && (
                                <div className="text-xs text-blue-600 mt-1" title="شماره سند">
                                  سند: {record.accountingEntryId}
                                </div>
                              )}
                            </div>
                          </td>
                          
                          {/* عملیات */}
                          <td className="p-3">
                            <div className="flex flex-col gap-2">
                              {/* دکمه تغییر وضعیت */}
                              <select
                                value={record.status}
                                onChange={(e) => handleStatusChange(record.id, e.target.value)}
                                className="border rounded px-2 py-1 text-xs"
                              >
                                <option value="pending">در انتظار</option>
                                <option value="approved">تأیید</option>
                                <option value="paid">پرداخت</option>
                                <option value="cancelled">لغو</option>
                              </select>
                              
                              <div className="flex gap-1">
                                {/* دکمه مشاهده جزئیات */}
                                <button
                                  onClick={() => {
                                    alert(`جزئیات اضافه‌کاری:\n\nکارمند: ${record.firstName} ${record.lastName}\nدوره: ${record.periodCode}\nساعات کل: ${record.totalHours}\nمبلغ کل: ${formatCurrency(record.totalAmount)} ریال\nوضعیت: ${getStatusText(record.status)}\nتاریخ ثبت: ${new Date(record.createdAt).toLocaleDateString('fa-IR')}`);
                                  }}
                                  className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 p-1 rounded text-xs flex items-center justify-center gap-1"
                                  title="مشاهده جزئیات"
                                >
                                  <Eye size={12} />
                                </button>
                                
                                {/* دکمه صدور سند */}
                                {!record.accountingEntryId && record.status === 'approved' && (
                                  <button
                                    onClick={() => handleGenerateEntry(record.id)}
                                    className="flex-1 bg-purple-100 hover:bg-purple-200 text-purple-700 p-1 rounded text-xs flex items-center justify-center gap-1"
                                    title="صدور سند"
                                  >
                                    <DollarSign size={12} />
                                  </button>
                                )}
                                
                                {/* دکمه حذف */}
                                {record.status === 'pending' && (
                                  <button
                                    onClick={() => handleDelete(record.id)}
                                    className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 p-1 rounded text-xs flex items-center justify-center gap-1"
                                    title="حذف"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-gray-500">
                          <Clock className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                          <p>هیچ رکورد اضافه‌کاری یافت نشد</p>
                          <p className="text-sm mt-2">لطفاً فیلترهای جستجو را تغییر دهید</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* کارمندان برتر (اگر خلاصه موجود باشد) */}
            {summary?.topEmployees && summary.topEmployees.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Users size={20} />
                  کارمندان برتر از نظر اضافه‌کاری
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {summary.topEmployees.slice(0, 6).map((emp, index) => (
                    <div key={emp.nationalCode} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-800">
                          #{index + 1} {emp.fullName}
                        </div>
                        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {emp.nationalCode}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">ساعات:</span>
                          <span className="font-bold">{emp.totalHours.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">مبلغ:</span>
                          <span className="font-bold text-green-700">
                            {formatCurrency(emp.totalAmount)} ریال
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}