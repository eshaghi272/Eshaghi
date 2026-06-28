// components/assets/FixedAssetForm.jsx
import React, { useState, useEffect, useMemo } from "react";
import { 
  PlusCircle, Edit2, Trash2, RefreshCw, FileText, 
  Save, X, Calculator, Building, Calendar, Tag,
  DollarSign, Clock, TrendingDown, CreditCard,
  Layers, Hash, Type, Package
} from "lucide-react";
import FixedAssetList from "./FixedAssetList";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_en from "react-date-object/locales/persian_fa";

export default function FixedAssetForm() {
  const [asset, setAsset] = useState({
    AssetCode: "",
    TitleFa: "",
    PurchaseDate: null,
    Quantity: 1,
    PurchaseCost: 0,
    UsefulLife: 5,
    SalvageValue: 0,
    DepreciationMethod: "SL",
    AssetType: "machinery",
    PaymentMethod: "payable"
  });

  const [assets, setAssets] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [accountSettings, setAccountSettings] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showSummary, setShowSummary] = useState(true);

  const assetTypes = [
    { value: "land", label: "زمین", icon: "🏞️", color: "bg-green-100 text-green-800" },
    { value: "building", label: "ساختمان", icon: "🏢", color: "bg-blue-100 text-blue-800" },
    { value: "facility", label: "تاسیسات", icon: "⚙️", color: "bg-gray-100 text-gray-800" },
    { value: "machinery", label: "ماشین آلات", icon: "🏭", color: "bg-orange-100 text-orange-800" },
    { value: "vehicle", label: "وسائط نقلیه", icon: "🚗", color: "bg-red-100 text-red-800" },
    { value: "computer", label: "کامپیوتر", icon: "💻", color: "bg-purple-100 text-purple-800" },
    { value: "furniture", label: "اثاثیه", icon: "🛋️", color: "bg-yellow-100 text-yellow-800" },
    { value: "software", label: "نرم افزار", icon: "📱", color: "bg-indigo-100 text-indigo-800" }
  ];

  const paymentMethods = [
    { value: "cash", label: "نقدی", icon: "💵", color: "bg-green-100 text-green-800" },
    { value: "bank", label: "بانک", icon: "🏦", color: "bg-blue-100 text-blue-800" },
    { value: "payable", label: "نسیه", icon: "📝", color: "bg-yellow-100 text-yellow-800" },
    { value: "capital", label: "سرمایه", icon: "💼", color: "bg-purple-100 text-purple-800" }
  ];

  const depreciationMethods = [
    { value: "SL", label: "خط مستقیم", description: "استهلاک ثابت سالانه" },
    { value: "DB", label: "نزولی", description: "استهلاک با نرخ ثابت از ارزش باقیمانده" }
  ];

  // 📌 محاسبه حساب بدهکار
  const getDebitAccount = (assetType) => {
    const key = `asset_debit_${assetType}`;
    const account = accountSettings[key] || '121004';
    console.log(`🔍 حساب بدهکار: key=${key}, value=${account}`);
    return account;
  };

  // 📌 محاسبه حساب بستانکار
  const getCreditAccount = (paymentMethod) => {
    const key = `asset_credit_${paymentMethod}`;
    const account = accountSettings[key] || '211001';
    console.log(`🔍 حساب بستانکار: key=${key}, value=${account}`);
    return account;
  };

  // 📌 محاسبه حساب‌های بدهکار و بستانکار با استفاده از useMemo
  const debitAccount = useMemo(() => {
    return getDebitAccount(asset.AssetType);
  }, [asset.AssetType, accountSettings]);

  const creditAccount = useMemo(() => {
    return getCreditAccount(asset.PaymentMethod);
  }, [asset.PaymentMethod, accountSettings]);

  useEffect(() => {
    fetchAssets();
    fetchAccountSettings();
  }, []);

  // 📌 دریافت تنظیمات حساب‌ها
  const fetchAccountSettings = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/system-settings/accounts");
      if (!res.ok) throw new Error(`خطا در دریافت تنظیمات: ${res.status}`);
      
      const data = await res.json();
      const settingsObj = {};
      
      if (Array.isArray(data)) {
        data.forEach(setting => {
          settingsObj[setting.settingKey] = setting.settingValue;
        });
      }
      
      // افزودن مقادیر پیش‌فرض برای همه کلیدهای لازم
      const defaultSettings = {
        'asset_debit_land': '121001',
        'asset_debit_building': '121002',
        'asset_debit_facility': '121003',
        'asset_debit_machinery': '121004',
        'asset_debit_vehicle': '121005',
        'asset_debit_computer': '121006',
        'asset_debit_furniture': '121007',
        'asset_debit_software': '121008',
        'asset_credit_cash': '111001',
        'asset_credit_bank': '111002',
        'asset_credit_payable': '211001',
        'asset_credit_capital': '311001',
        'depreciation_expense_land': '611301',
        'depreciation_expense_building': '611302',
        'depreciation_expense_machinery': '611303',
        'depreciation_expense_vehicle': '611304',
        'depreciation_expense_computer': '611305',
        'depreciation_accumulated_land': '121101',
        'depreciation_accumulated_building': '121102',
        'depreciation_accumulated_machinery': '121103',
        'depreciation_accumulated_vehicle': '121104',
        'depreciation_accumulated_computer': '121105'
      };
      
      setAccountSettings({...defaultSettings, ...settingsObj});
    } catch (err) {
      console.error("❌ خطا در دریافت تنظیمات:", err);
      // استفاده از مقادیر پیش‌فرض
      setAccountSettings({
        'asset_debit_land': '121001',
        'asset_debit_building': '121002',
        'asset_debit_facility': '121003',
        'asset_debit_machinery': '121004',
        'asset_debit_vehicle': '121005',
        'asset_debit_computer': '121006',
        'asset_debit_furniture': '121007',
        'asset_debit_software': '121008',
        'asset_credit_cash': '111001',
        'asset_credit_bank': '111002',
        'asset_credit_payable': '211001',
        'asset_credit_capital': '311001',
        'depreciation_expense_machinery': '611303',
        'depreciation_accumulated_machinery': '121103'
      });
    }
  };

  // 📌 دریافت لیست دارایی‌ها
  const fetchAssets = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/fixedassets");
      if (!res.ok) throw new Error(`خطا در دریافت: ${res.status}`);
      
      const data = await res.json();
      setAssets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ خطا در دریافت دارایی‌ها:", err);
      alert("خطا در دریافت لیست دارایی‌ها");
    } finally {
      setLoading(false);
    }
  };

  // 📌 محاسبه استهلاک سالانه
  const calculateAnnualDepreciation = () => {
    const { PurchaseCost, SalvageValue, UsefulLife } = asset;
    const cost = PurchaseCost || 0;
    const salvage = SalvageValue || 0;
    const life = UsefulLife || 1;
    
    return (cost - salvage) / life;
  };

  // 📌 اعتبارسنجی فرم
  const validateForm = () => {
    const errors = [];
    
    if (!asset.AssetCode.trim()) errors.push("کد دارایی الزامی است");
    if (!asset.TitleFa.trim()) errors.push("نام دارایی الزامی است");
    if (!asset.PurchaseDate) errors.push("تاریخ خرید الزامی است");
    if (asset.Quantity <= 0) errors.push("تعداد باید بزرگتر از صفر باشد");
    if (asset.PurchaseCost <= 0) errors.push("بهای تمام‌شده باید بزرگتر از صفر باشد");
    if (asset.UsefulLife <= 0) errors.push("عمر مفید باید بزرگتر از صفر باشد");
    if (asset.SalvageValue < 0) errors.push("ارزش اسقاط نمی‌تواند منفی باشد");
    
    return errors;
  };

  // 📌 ثبت یا ویرایش دارایی
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (errors.length > 0) {
      alert(errors.join("\n"));
      return;
    }
    
    setSubmitting(true);
    
    try {
      // آماده‌سازی داده
      const payload = {
        ...asset,
        PurchaseDate: formatDateForAPI(asset.PurchaseDate),
        Quantity: Number(asset.Quantity),
        PurchaseCost: Number(asset.PurchaseCost),
        UsefulLife: Number(asset.UsefulLife),
        SalvageValue: Number(asset.SalvageValue),
        DepreciationMethod: asset.DepreciationMethod,
        AssetType: asset.AssetType,
        PaymentMethod: asset.PaymentMethod,
        DebitAccount: debitAccount,
        CreditAccount: creditAccount
      };
      
      console.log("📦 ارسال داده:", payload);
      
      const url = editingId 
        ? `http://localhost:5000/api/fixedassets/${editingId}`
        : "http://localhost:5000/api/fixedassets";
      
      const method = editingId ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `خطای ${response.status}`);
      }
      
      console.log("✅ نتیجه:", result);
      
      alert(editingId ? "✅ دارایی ویرایش شد" : "✅ دارایی ثبت شد");
      await fetchAssets();
      resetForm();
      
    } catch (err) {
      console.error("❌ خطا در ثبت دارایی:", err);
      alert("خطا در ثبت دارایی: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 📌 فرمت تاریخ برای API
  const formatDateForAPI = (date) => {
    if (!date) return "";
    if (typeof date === 'string') return date;
    if (date && typeof date.format === 'function') {
      return date.format("YYYY/MM/DD");
    }
    return "";
  };

  // 📌 فرمت تاریخ برای نمایش
  const formatDateForDisplay = (date) => {
    if (!date) return "";
    if (typeof date === 'string') return date;
    if (date && typeof date.format === 'function') {
      return date.format("YYYY/MM/DD");
    }
    return "";
  };

  // 📌 تغییر مقادیر فرم
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const newValue = type === "number" ? (value === "" ? 0 : parseFloat(value)) : value;
    
    setAsset({ 
      ...asset, 
      [name]: newValue
    });
    
    // لاگ برای دیباگ
    if (name === 'AssetType' || name === 'PaymentMethod') {
      console.log(`🔄 تغییر ${name} به ${value}`);
    }
  };

  // 📌 تغییر تاریخ
  const handleDateChange = (date) => {
    setAsset({ ...asset, PurchaseDate: date });
  };

  // 📌 عملیات CRUD
  const handleEdit = (assetToEdit) => {
    setAsset({
      AssetCode: assetToEdit.AssetCode || "",
      TitleFa: assetToEdit.TitleFa || "",
      PurchaseDate: assetToEdit.PurchaseDate || null,
      Quantity: Number(assetToEdit.Quantity) || 1,
      PurchaseCost: Number(assetToEdit.PurchaseCost) || 0,
      UsefulLife: Number(assetToEdit.UsefulLife) || 5,
      SalvageValue: Number(assetToEdit.SalvageValue) || 0,
      DepreciationMethod: assetToEdit.DepreciationMethod || "SL",
      AssetType: assetToEdit.AssetType || "machinery",
      PaymentMethod: assetToEdit.PaymentMethod || "payable"
    });
    setEditingId(assetToEdit.AssetId);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("آیا از حذف این دارایی اطمینان دارید؟")) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/fixedassets/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) throw new Error(`خطا در حذف: ${response.status}`);
      
      await fetchAssets();
      alert("✅ دارایی حذف شد");
    } catch (err) {
      console.error("❌ خطا در حذف دارایی:", err);
      alert("خطا در حذف دارایی: " + err.message);
    }
  };

  const handleGenerateEntry = async (assetId) => {
    if (!window.confirm("آیا از صدور سند خرید اطمینان دارید؟")) return;
    
    try {
      const res = await fetch(`http://localhost:5000/api/fixedassets/${assetId}/generate-entry`, {
        method: "POST",
      });
      
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "✅ سند خرید صادر شد");
      } else {
        alert("❌ خطا: " + (data.error || "خطا در صدور سند"));
      }
    } catch (err) {
      console.error("❌ خطا در صدور سند خرید:", err);
      alert("خطا در ارتباط با سرور");
    }
  };

  const handleGenerateDepEntry = async (assetId) => {
    if (!window.confirm("آیا از صدور سند استهلاک اطمینان دارید؟")) return;
    
    try {
      const res = await fetch(`http://localhost:5000/api/fixedassets/${assetId}/generate-depreciation`, {
        method: "POST",
      });
      
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "✅ سند استهلاک صادر شد");
      } else {
        alert("❌ خطا: " + (data.error || "خطا در صدور سند استهلاک"));
      }
    } catch (err) {
      console.error("❌ خطا در صدور سند استهلاک:", err);
      alert("خطا در ارتباط با سرور");
    }
  };

  // 📌 ریست فرم
  const resetForm = () => {
    setAsset({
      AssetCode: "",
      TitleFa: "",
      PurchaseDate: null,
      Quantity: 1,
      PurchaseCost: 0,
      UsefulLife: 5,
      SalvageValue: 0,
      DepreciationMethod: "SL",
      AssetType: "machinery",
      PaymentMethod: "payable"
    });
    setEditingId(null);
  };

  // 📌 فیلتر دارایی‌ها
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.AssetCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.TitleFa?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || asset.AssetType === filterType;
    return matchesSearch && matchesType;
  });

  // 📌 محاسبات مالی
  const totalCost = (asset.PurchaseCost || 0) * (asset.Quantity || 1);
  const annualDepreciation = calculateAnnualDepreciation();
  const monthlyDepreciation = annualDepreciation / 12;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* هدر */}
      <div className="mb-6">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl p-4 shadow">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white mb-1 flex items-center">
                <Building className="h-6 w-6 ml-2" />
                مدیریت دارایی‌های ثابت
              </h1>
              <p className="text-emerald-100 text-sm">
                ثبت، ویرایش و مدیریت دارایی‌های ثابت
              </p>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse mt-3 md:mt-0">
              <button
                onClick={fetchAssets}
                className="inline-flex items-center px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm"
              >
                <RefreshCw className="h-4 w-4 ml-1" />
                بروزرسانی
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ستون اول: فرم اصلی */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl p-4 shadow">
              <h2 className="text-lg font-bold text-white flex items-center">
                {editingId ? (
                  <>
                    <Edit2 className="h-5 w-5 ml-2" />
                    ویرایش دارایی
                  </>
                ) : (
                  <>
                    <PlusCircle className="h-5 w-5 ml-2" />
                    ثبت دارایی جدید
                  </>
                )}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* ستون اول: اطلاعات پایه */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <Hash className="h-3 w-3 ml-1 text-gray-500" />
                      کد دارایی *
                    </label>
                    <input
                      type="text"
                      name="AssetCode"
                      value={asset.AssetCode}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500"
                      placeholder="مثال: 10001"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <Type className="h-3 w-3 ml-1 text-gray-500" />
                      نام دارایی *
                    </label>
                    <input
                      type="text"
                      name="TitleFa"
                      value={asset.TitleFa}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500"
                      placeholder="نام کامل دارایی"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <Tag className="h-3 w-3 ml-1 text-gray-500" />
                      نوع دارایی *
                    </label>
                    <select
                      name="AssetType"
                      value={asset.AssetType}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500"
                      required
                    >
                      <option value="">انتخاب کنید</option>
                      {assetTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.icon} {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* ستون دوم: اطلاعات کمی */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <Package className="h-3 w-3 ml-1 text-gray-500" />
                      تعداد *
                    </label>
                    <input
                      type="number"
                      name="Quantity"
                      value={asset.Quantity}
                      onChange={handleChange}
                      min="1"
                      step="1"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <DollarSign className="h-3 w-3 ml-1 text-gray-500" />
                      بهای تمام‌شده *
                    </label>
                    <input
                      type="number"
                      name="PurchaseCost"
                      value={asset.PurchaseCost}
                      onChange={handleChange}
                      min="0"
                      step="1000"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <Clock className="h-3 w-3 ml-1 text-gray-500" />
                      عمر مفید (سال) *
                    </label>
                    <input
                      type="number"
                      name="UsefulLife"
                      value={asset.UsefulLife}
                      onChange={handleChange}
                      min="1"
                      max="100"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>
                </div>

                {/* ستون سوم: تاریخ و روش‌ها */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <Calendar className="h-3 w-3 ml-1 text-gray-500" />
                      تاریخ خرید *
                    </label>
                    <DatePicker
                      calendar={persian}
                      locale={persian_en}
                      value={asset.PurchaseDate}
                      onChange={handleDateChange}
                      format="YYYY/MM/DD"
                      inputClass="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500"
                      placeholder="انتخاب تاریخ..."
                      required
                    />
                    {asset.PurchaseDate && (
                      <p className="text-xs text-green-600 mt-1">
                        {formatDateForDisplay(asset.PurchaseDate)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <CreditCard className="h-3 w-3 ml-1 text-gray-500" />
                      روش پرداخت *
                    </label>
                    <select
                      name="PaymentMethod"
                      value={asset.PaymentMethod}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500"
                      required
                    >
                      <option value="">انتخاب کنید</option>
                      {paymentMethods.map(method => (
                        <option key={method.value} value={method.value}>
                          {method.icon} {method.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <TrendingDown className="h-3 w-3 ml-1 text-gray-500" />
                      روش استهلاک
                    </label>
                    <select
                      name="DepreciationMethod"
                      value={asset.DepreciationMethod}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500"
                    >
                      {depreciationMethods.map(method => (
                        <option key={method.value} value={method.value}>
                          {method.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* ردیف دوم: اطلاعات مالی اضافی */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    ارزش اسقاط
                  </label>
                  <input
                    type="number"
                    name="SalvageValue"
                    value={asset.SalvageValue}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    حساب بدهکار
                  </label>
                  <div className="px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg">
                    <span className="font-mono text-green-600">{debitAccount}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    حساب بستانکار
                  </label>
                  <div className="px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg">
                    <span className="font-mono text-blue-600">{creditAccount}</span>
                  </div>
                </div>
              </div>

              {/* دکمه‌های عمل */}
              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                   >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                      در حال پردازش...
                    </>
                  ) : editingId ? (
                    <>
                      <Save className="h-4 w-4 ml-2" />
                      ذخیره تغییرات
                    </>
                  ) : (
                    <>
                      <PlusCircle className="h-4 w-4 ml-2" />
                      ثبت دارایی
                    </>
                  )}
                </button>

                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2.5 bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-all flex items-center"
                  >
                    <X className="h-4 w-4 ml-2" />
                    لغو
                  </button>
                )}
              </div>
            </form>

            {/* خلاصه محاسبات */}
            {showSummary && (
              <div className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-xl">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-700 flex items-center">
                    <Calculator className="h-4 w-4 ml-2" />
                    خلاصه محاسبات
                  </h4>
                  <button
                    onClick={() => setShowSummary(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                    <div className="text-lg font-bold text-green-600">
                      {new Intl.NumberFormat("fa-IR").format(totalCost)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">ارزش کل</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                    <div className="text-lg font-bold text-blue-600">
                      {new Intl.NumberFormat("fa-IR").format(Math.round(annualDepreciation))}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">استهلاک سالانه</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                    <div className="text-lg font-bold text-purple-600">
                      {new Intl.NumberFormat("fa-IR").format(Math.round(monthlyDepreciation))}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">استهلاک ماهانه</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                    <div className="text-lg font-bold text-orange-600">
                      {asset.UsefulLife}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">عمر مفید (سال)</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ستون دوم: سایدبار اطلاعات */}
        <div className="space-y-4">
          {/* آمار */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="font-medium text-gray-800 mb-3 flex items-center">
              <FileText className="h-4 w-4 ml-2" />
              آمار دارایی‌ها
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-green-50 rounded-lg">
                <span className="text-sm text-gray-700">تعداد کل</span>
                <span className="font-bold text-green-600">{assets.length}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg">
                <span className="text-sm text-gray-700">ارزش کل</span>
                <span className="font-medium text-blue-600 text-sm">
                  {new Intl.NumberFormat("fa-IR").format(
                    assets.reduce((sum, a) => sum + (a.PurchaseCost * a.Quantity), 0)
                  )} ریال
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-purple-50 rounded-lg">
                <span className="text-sm text-gray-700">میانگین عمر</span>
                <span className="font-medium text-purple-600">
                  {assets.length > 0 
                    ? Math.round(assets.reduce((sum, a) => sum + a.UsefulLife, 0) / assets.length)
                    : 0} سال
                </span>
              </div>
            </div>
          </div>

          {/* جستجو و فیلتر */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="font-medium text-gray-800 mb-3">جستجو و فیلتر</h3>
            <div className="space-y-3">
              <div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="جستجوی دارایی..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="all">همه انواع</option>
                  {assetTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* انواع دارایی */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="font-medium text-gray-800 mb-3">انواع دارایی</h3>
            <div className="grid grid-cols-2 gap-2">
              {assetTypes.map(type => (
                <div
                  key={type.value}
                  className={`p-2 rounded-lg text-center ${type.color} ${asset.AssetType === type.value ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}
                  onClick={() => setAsset({...asset, AssetType: type.value})}
                >
                  <div className="text-lg mb-1">{type.icon}</div>
                  <div className="text-xs font-medium">{type.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* لیست دارایی‌ها */}
      <div className="mt-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <p className="mt-2 text-gray-600 text-sm">در حال بارگذاری...</p>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-xl shadow-sm">
            <div className="text-gray-400 text-3xl mb-3">📭</div>
            <p className="text-gray-600">هیچ دارایی یافت نشد</p>
            <button
              onClick={fetchAssets}
              className="mt-3 px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
            >
              بارگذاری مجدد
            </button>
          </div>
        ) : (
          <FixedAssetList
            assets={filteredAssets}
            onDelete={handleDelete}
            onEdit={handleEdit}
            onGenerateEntry={handleGenerateEntry}
            onGenerateDepEntry={handleGenerateDepEntry}
          />
        )}
      </div>
    </div>
  );
}