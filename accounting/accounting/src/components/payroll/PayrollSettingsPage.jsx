// 📁 src/components/payroll/PayrollSettingsPage.jsx
import React, { useEffect, useState } from "react";
import { Moon, Sun, Save, Settings, DollarSign, Shield, Home, Calendar, Clock, Briefcase, Users, Baby, Heart } from 'lucide-react';

export default function PayrollSettingsPage() {
  const [settings, setSettings] = useState({
    taxExemptionSingle: 50000000,
    taxExemptionMarried: 60000000,
    taxChildExemption: 2000000,
    insuranceEmployeePercent: 7.0,
    insuranceEmployerPercent: 23.0,
    insuranceBaseMin: 30000000,
    insuranceBaseMax: 300000000,
    housingAllowanceAmount: 15000000,
    foodAllowanceAmount: 5000000,
    transportationAllowanceAmount: 3000000,
    childAllowanceAmount: 2000000,
    marriageAllowanceAmount: 5000000,
    seniorityPercent: 1.0,
    seniorityMaxYears: 30,
    overtimeNormalRate: 1.4,
    overtimeHolidayRate: 2.0,
    overtimeNightRate: 1.75,
    annualLeaveDays: 26,
    sickLeaveDays: 14,
    workHoursPerDay: 8,
    workDaysPerMonth: 30,
    payrollDay: 1,
    description: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('tax'); // tax, insurance, benefits, seniority, leave

  // Load current settings
  useEffect(() => {
    fetch("http://localhost:5000/api/payroll-new/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSettings(data.data);
        }
      })
      .catch((err) => console.error("❌ خطا در دریافت تنظیمات:", err))
      .finally(() => setLoading(false));
  }, []);

  // Check user preference for dark mode
  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('theme');
    setDarkMode(savedTheme === 'dark' || (!savedTheme && prefersDark));
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: name.includes('Percent') || name.includes('Rate') 
        ? parseFloat(value) 
        : parseInt(value) || value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const res = await fetch("http://localhost:5000/api/payroll-new/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });

      const data = await res.json();
      
      if (data.success) {
        setMessage('✅ تنظیمات با موفقیت ذخیره شد');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(`❌ خطا: ${data.error}`);
      }
    } catch (err) {
      console.error("❌ خطا در ذخیره تنظیمات:", err);
      setMessage("❌ خطا در ارتباط با سرور");
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (n) => 
    new Intl.NumberFormat("fa-IR").format(n || 0);

  const tabs = [
    { id: 'tax', label: 'مالیات', icon: DollarSign, color: 'bg-red-500' },
    { id: 'insurance', label: 'بیمه', icon: Shield, color: 'bg-blue-500' },
    { id: 'benefits', label: 'مزایا', icon: Home, color: 'bg-green-500' },
    { id: 'seniority', label: 'سنوات', icon: Briefcase, color: 'bg-purple-500' },
    { id: 'leave', label: 'مرخصی', icon: Calendar, color: 'bg-yellow-500' },
    { id: 'other', label: 'سایر', icon: Settings, color: 'bg-gray-500' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">در حال بارگذاری تنظیمات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-2">
              تنظیمات سیستم حقوق و دستمزد
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              مدیریت تنظیمات مالیات، بیمه، مزایا و سایر موارد مربوط به حقوق
            </p>
          </div>
          
          <div className="flex items-center space-x-4 space-x-reverse mt-4 md:mt-0">
            {/* Dark Mode Toggle */}
            {/* <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              title={darkMode ? 'حالت روز' : 'حالت شب'}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button> */}
            
            {/* Save Button */}
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>در حال ذخیره...</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>ذخیره تنظیمات</span>
                </>
              )}
            </button>
                  </div>
             
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.includes('✅') 
            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
            : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'}`}>
            {message}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? `${tab.color} text-white`
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <tab.icon size={18} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel - Compact Form */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              {activeTab === 'tax' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <DollarSign className="text-red-500" size={24} />
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">تنظیمات مالیاتی</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        معافیت مالیاتی مجرد
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          name="taxExemptionSingle"
                          value={settings.taxExemptionSingle}
                          onChange={handleChange}
                          className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-3 pr-12"
                        />
                        <span className="absolute left-3 top-3 text-gray-500 dark:text-gray-400">ریال</span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatCurrency(settings.taxExemptionSingle)} تومان
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        معافیت مالیاتی متأهل
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          name="taxExemptionMarried"
                          value={settings.taxExemptionMarried}
                          onChange={handleChange}
                          className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-3 pr-12"
                        />
                        <span className="absolute left-3 top-3 text-gray-500 dark:text-gray-400">ریال</span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatCurrency(settings.taxExemptionMarried)} ریال
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        معافیت به ازای هر فرزند
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          name="taxChildExemption"
                          value={settings.taxChildExemption}
                          onChange={handleChange}
                          className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-3 pr-12"
                        />
                        <span className="absolute left-3 top-3 text-gray-500 dark:text-gray-400">ریال</span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatCurrency(settings.taxChildExemption)} ریال
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'insurance' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Shield className="text-blue-500" size={24} />
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">تنظیمات بیمه</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        درصد بیمه کارمند
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          name="insuranceEmployeePercent"
                          value={settings.insuranceEmployeePercent}
                          onChange={handleChange}
                          className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-3 pr-12"
                        />
                        <span className="absolute left-3 top-3 text-gray-500 dark:text-gray-400">%</span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {settings.insuranceEmployeePercent}%
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        درصد بیمه کارفرما
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          name="insuranceEmployerPercent"
                          value={settings.insuranceEmployerPercent}
                          onChange={handleChange}
                          className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-3 pr-12"
                        />
                        <span className="absolute left-3 top-3 text-gray-500 dark:text-gray-400">%</span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {settings.insuranceEmployerPercent}%
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        حداقل پایه بیمه
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          name="insuranceBaseMin"
                          value={settings.insuranceBaseMin}
                          onChange={handleChange}
                          className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-3 pr-12"
                        />
                        <span className="absolute left-3 top-3 text-gray-500 dark:text-gray-400">ریال</span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatCurrency(settings.insuranceBaseMin)} ریال
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        حداکثر پایه بیمه
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          name="insuranceBaseMax"
                          value={settings.insuranceBaseMax}
                          onChange={handleChange}
                          className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-3 pr-12"
                        />
                        <span className="absolute left-3 top-3 text-gray-500 dark:text-gray-400">ریال</span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatCurrency(settings.insuranceBaseMax)} ریال
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'benefits' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Home className="text-green-500" size={24} />
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">مزایا و کمک‌ها</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                      { icon: Home, name: 'housingAllowanceAmount', label: 'حق مسکن', value: settings.housingAllowanceAmount },
                      { icon: Home, name: 'foodAllowanceAmount', label: 'بن خواربار', value: settings.foodAllowanceAmount },
                      { icon: Clock, name: 'transportationAllowanceAmount', label: 'حق ایاب و ذهاب', value: settings.transportationAllowanceAmount },
                      { icon: Baby, name: 'childAllowanceAmount', label: 'حق اولاد (هر فرزند)', value: settings.childAllowanceAmount },
                      { icon: Heart, name: 'marriageAllowanceAmount', label: 'حق تأهل', value: settings.marriageAllowanceAmount },
                    ].map((item) => (
                      <div key={item.name} className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          {item.label}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            name={item.name}
                            value={item.value}
                            onChange={handleChange}
                            className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-3 pr-12"
                          />
                          <span className="absolute left-3 top-3 text-gray-500 dark:text-gray-400">ریال</span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatCurrency(item.value)} ریال
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'seniority' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Briefcase className="text-purple-500" size={24} />
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">سنوات و اضافه‌کاری</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        درصد سنوات (هر سال)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          name="seniorityPercent"
                          value={settings.seniorityPercent}
                          onChange={handleChange}
                          className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-3 pr-12"
                        />
                        <span className="absolute left-3 top-3 text-gray-500 dark:text-gray-400">%</span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {settings.seniorityPercent}%
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        حداکثر سنوات (سال)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          name="seniorityMaxYears"
                          value={settings.seniorityMaxYears}
                          onChange={handleChange}
                          className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-3"
                        />
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {settings.seniorityMaxYears} سال
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        نرخ اضافه‌کاری عادی
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.05"
                          name="overtimeNormalRate"
                          value={settings.overtimeNormalRate}
                          onChange={handleChange}
                          className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-3"
                        />
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {settings.overtimeNormalRate}x (معمولاً 1.4)
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        نرخ اضافه‌کاری تعطیل
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.05"
                          name="overtimeHolidayRate"
                          value={settings.overtimeHolidayRate}
                          onChange={handleChange}
                          className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-3"
                        />
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {settings.overtimeHolidayRate}x (معمولاً 2.0)
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        نرخ اضافه‌کاری شبانه
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.05"
                          name="overtimeNightRate"
                          value={settings.overtimeNightRate}
                          onChange={handleChange}
                          className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-3"
                        />
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {settings.overtimeNightRate}x (معمولاً 1.75)
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'leave' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Calendar className="text-yellow-500" size={24} />
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">مرخصی و زمان کار</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        مرخصی سالانه (روز)
                      </label>
                      <input
                        type="number"
                        name="annualLeaveDays"
                        value={settings.annualLeaveDays}
                        onChange={handleChange}
                        className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-3"
                      />
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {settings.annualLeaveDays} روز
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        مرخصی استعلاجی (روز)
                      </label>
                      <input
                        type="number"
                        name="sickLeaveDays"
                        value={settings.sickLeaveDays}
                        onChange={handleChange}
                        className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-3"
                      />
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {settings.sickLeaveDays} روز
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        ساعت کار روزانه
                      </label>
                      <input
                        type="number"
                        name="workHoursPerDay"
                        value={settings.workHoursPerDay}
                        onChange={handleChange}
                        className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-3"
                      />
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {settings.workHoursPerDay} ساعت
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        روز کار ماهانه
                      </label>
                      <input
                        type="number"
                        name="workDaysPerMonth"
                        value={settings.workDaysPerMonth}
                        onChange={handleChange}
                        className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-3"
                      />
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {settings.workDaysPerMonth} روز
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        روز پرداخت حقوق
                      </label>
                      <input
                        type="number"
                        name="payrollDay"
                        value={settings.payrollDay}
                        onChange={handleChange}
                        min="1"
                        max="31"
                        className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-3"
                      />
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        روز {settings.payrollDay} ماه بعد
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'other' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Settings className="text-gray-500" size={24} />
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">سایر تنظیمات</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        توضیحات
                      </label>
                      <textarea
                        name="description"
                        value={settings.description}
                        onChange={handleChange}
                        rows="4"
                        className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-3"
                        placeholder="توضیحاتی درباره این تنظیمات..."
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">اطلاعات کلی</h4>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <li>تعداد فیلدهای تنظیم شده: 25</li>
                          <li>آخرین بروزرسانی: تنظیمات پیش‌فرض</li>
                          <li>وضعیت: فعال</li>
                        </ul>
                      </div>
                      
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2">راهنما</h4>
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                          پس از تغییر هر تنظیم، دکمه "ذخیره تنظیمات" را بزنید.
                          تغییرات بلافاصله در محاسبات حقوق اعمال می‌شوند.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Summary & Actions */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              {/* Quick Summary */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">خلاصه تنظیمات</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">حقوق پایه ماهانه</span>
                    <span className="font-medium text-gray-800 dark:text-white">
                      {formatCurrency(settings.taxExemptionMarried * 2)} ریال
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">مجموع بیمه</span>
                    <span className="font-medium text-gray-800 dark:text-white">
                      {settings.insuranceEmployeePercent + settings.insuranceEmployerPercent}%
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">مجموع مزایا</span>
                    <span className="font-medium text-gray-800 dark:text-white">
                      {formatCurrency(
                        settings.housingAllowanceAmount + 
                        settings.foodAllowanceAmount + 
                        settings.transportationAllowanceAmount
                      )} ریال
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">حداکثر سنوات</span>
                    <span className="font-medium text-gray-800 dark:text-white">
                      {settings.seniorityMaxYears} سال
                    </span>
                  </div>
                </div>
              </div>


              {/* Info Card */}
              {/* <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                <h3 className="text-lg font-bold mb-3">💡 نکته مهم</h3>
                <p className="text-sm opacity-90">
                  تنظیمات مالیاتی و بیمه بر اساس قوانین جاری کشور می‌باشند. 
                  لطفاً قبل از اعمال تغییرات از به‌روز بودن اطلاعات اطمینان حاصل کنید.
                </p>
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}