// components/assets/FixedAssetListView.jsx
import React, { useState, useEffect, useMemo } from "react";
import { 
  Search, Filter, Download, Printer, Eye, 
  Edit, Trash2, RefreshCw, Building, Car,
  Cpu, Home, Wrench, Sofa, Smartphone, Layers,
  ChevronRight, ChevronLeft, Calendar, DollarSign,
  Clock, TrendingDown, Package, Hash, Type,
  CreditCard, FileText, CheckCircle, XCircle,
  Calculator, BarChart
} from "lucide-react";

export default function FixedAssetListView() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortField, setSortField] = useState("CreatedAt");
  const [sortDirection, setSortDirection] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    totalValue: 0,
    totalAssets: 0,
    totalDepreciation: 0,
    activeAssets: 0
  });

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

  const statusOptions = [
    { value: "all", label: "همه وضعیت‌ها" },
    { value: "active", label: "فعال", color: "text-green-600" },
    { value: "inactive", label: "غیرفعال", color: "text-red-600" }
  ];

  // 📌 دریافت لیست دارایی‌ها
  const fetchAssets = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/fixedassets");
      if (!res.ok) throw new Error(`خطا در دریافت: ${res.status}`);
      
      const data = await res.json();
      setAssets(Array.isArray(data) ? data : []);
      
      // محاسبه آمار
      calculateStats(data || []);
    } catch (err) {
      console.error("❌ خطا در دریافت دارایی‌ها:", err);
      alert("خطا در دریافت لیست دارایی‌ها");
    } finally {
      setLoading(false);
    }
  };

  // 📌 محاسبه آمار
  const calculateStats = (assetsList) => {
    const totalValue = assetsList.reduce((sum, asset) => 
      sum + (asset.PurchaseCost || 0) * (asset.Quantity || 1), 0);
    
    const activeAssets = assetsList.filter(asset => asset.IsActive === 1).length;
    
    const totalDepreciation = assetsList.reduce((sum, asset) => {
      const annualDep = calculateAnnualDepreciation(asset);
      const yearsPassed = calculateYearsSincePurchase(asset.PurchaseDate);
      return sum + (annualDep * Math.min(yearsPassed, asset.UsefulLife || 0));
    }, 0);
    
    setStats({
      totalValue,
      totalAssets: assetsList.length,
      totalDepreciation: Math.round(totalDepreciation),
      activeAssets
    });
  };

  // 📌 محاسبه استهلاک سالانه
  const calculateAnnualDepreciation = (asset) => {
    const cost = asset.PurchaseCost || 0;
    const salvage = asset.SalvageValue || 0;
    const life = asset.UsefulLife || 1;
    
    if (life <= 0) return 0;
    
    if (asset.DepreciationMethod === "SL") {
      return (cost - salvage) / life;
    } else if (asset.DepreciationMethod === "DB") {
      // روش نزولی با نرخ 20%
      return cost * 0.20;
    }
    return 0;
  };

  // 📌 محاسبه سال‌های گذشته از تاریخ شمسی
  const calculateYearsSincePurchase = (jalaliDate) => {
    if (!jalaliDate) return 0;
    
    try {
      // تاریخ شمسی به فرمت YYYY/MM/DD یا YYYY-MM-DD
      const dateStr = jalaliDate.replace(/-/g, '/');
      const parts = dateStr.split('/');
      
      if (parts.length >= 1) {
        const purchaseYear = parseInt(parts[0]);
        
        // گرفتن سال شمسی جاری (ساده‌سازی)
        const now = new Date();
        const currentGregorianYear = now.getFullYear();
        const currentGregorianMonth = now.getMonth() + 1;
        const currentGregorianDay = now.getDate();
        
        // تبدیل ساده میلادی به شمسی (تقریبی)
        const currentJalaliYear = currentGregorianYear - 621;
        
        // تنظیم بر اساس ماه و روز
        let adjustedYear = currentJalaliYear;
        if (currentGregorianMonth < 3 || (currentGregorianMonth === 3 && currentGregorianDay < 21)) {
          adjustedYear--;
        }
        
        return Math.max(0, adjustedYear - purchaseYear);
      }
    } catch (err) {
      console.warn("خطا در محاسبه سال‌های گذشته:", err);
    }
    
    return 0;
  };

  // 📌 محاسبه ارزش فعلی
  const calculateCurrentValue = (asset) => {
    const cost = asset.PurchaseCost || 0;
    const annualDep = calculateAnnualDepreciation(asset);
    const yearsPassed = calculateYearsSincePurchase(asset.PurchaseDate);
    const accumulatedDep = annualDep * Math.min(yearsPassed, asset.UsefulLife || 0);
    return Math.max(cost - accumulatedDep, asset.SalvageValue || 0);
  };

  // 📌 فرمت تاریخ شمسی (همان رشته ورودی)
  const formatJalaliDate = (dateString) => {
    if (!dateString) return "-";
    // اگر تاریخ با - جدا شده، به / تغییر می‌دهیم
    return dateString.replace(/-/g, '/');
  };

  // 📌 فرمت اعداد فارسی
  const formatNumber = (num) => {
    return new Intl.NumberFormat("fa-IR").format(num || 0);
  };

  // 📌 تبدیل عدد فارسی به انگلیسی برای مرتب‌سازی
  const persianToEnglish = (str) => {
    if (!str) return '';
    return str.toString().replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  // 📌 فیلتر و مرتب‌سازی دارایی‌ها
  const filteredAndSortedAssets = useMemo(() => {
    let filtered = assets.filter(asset => {
      // جستجو
      const matchesSearch = 
        (asset.AssetCode && asset.AssetCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (asset.TitleFa && asset.TitleFa.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // فیلتر نوع
      const matchesType = filterType === "all" || asset.AssetType === filterType;
      
      // فیلتر وضعیت
      const matchesStatus = filterStatus === "all" || 
        (filterStatus === "active" && asset.IsActive === 1) ||
        (filterStatus === "inactive" && (asset.IsActive === 0 || asset.IsActive === null));
      
      return matchesSearch && matchesType && matchesStatus;
    });

    // مرتب‌سازی
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // تبدیل به عدد برای فیلدهای عددی
      if (sortField === "PurchaseCost" || sortField === "Quantity" || sortField === "UsefulLife") {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      }
      
      // برای تاریخ‌های شمسی
      if (sortField === "PurchaseDate" || sortField === "CreatedAt") {
        // تبدیل تاریخ شمسی به رشته قابل مقایسه
        aValue = (aValue || '').replace(/-/g, '/');
        bValue = (bValue || '').replace(/-/g, '/');
      }
      
      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [assets, searchTerm, filterType, filterStatus, sortField, sortDirection]);

  // 📌 محاسبه صفحات
  const totalPages = Math.ceil(filteredAndSortedAssets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAssets = filteredAndSortedAssets.slice(startIndex, endIndex);

  // 📌 تغییر صفحه
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // 📌 مرتب‌سازی
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // 📌 انتخاب/عدم انتخاب همه
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedAssets(currentAssets.map(asset => asset.AssetId));
    } else {
      setSelectedAssets([]);
    }
  };

  // 📌 انتخاب یک دارایی
  const handleSelectAsset = (assetId) => {
    setSelectedAssets(prev => 
      prev.includes(assetId) 
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    );
  };

  // 📌 حذف دارایی‌های انتخاب شده
  const handleDeleteSelected = async () => {
    if (selectedAssets.length === 0) {
      alert("هیچ دارایی انتخاب نشده است");
      return;
    }
    
    if (!window.confirm(`آیا از حذف ${selectedAssets.length} دارایی انتخاب شده اطمینان دارید؟`)) {
      return;
    }
    
    try {
      const deletePromises = selectedAssets.map(id => 
        fetch(`http://localhost:5000/api/fixedassets/${id}`, {
          method: "DELETE",
        })
      );
      
      await Promise.all(deletePromises);
      alert("✅ دارایی‌های انتخاب شده حذف شدند");
      setSelectedAssets([]);
      fetchAssets();
    } catch (err) {
      console.error("❌ خطا در حذف دارایی‌ها:", err);
      alert("خطا در حذف دارایی‌ها");
    }
  };

  // 📌 دریافت آیکون نوع دارایی
  const getAssetTypeIcon = (type) => {
    switch (type) {
      case 'land': return '🏞️';
      case 'building': return '🏢';
      case 'facility': return '⚙️';
      case 'machinery': return '🏭';
      case 'vehicle': return '🚗';
      case 'computer': return '💻';
      case 'furniture': return '🛋️';
      case 'software': return '📱';
      default: return '📦';
    }
  };

  // 📌 دریافت نام فارسی نوع دارایی
  const getAssetTypeLabel = (type) => {
    const found = assetTypes.find(t => t.value === type);
    return found ? found.label : type;
  };

  // 📌 دریافت وضعیت
  const getStatusBadge = (isActive) => {
    if (isActive === 1) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 ml-1" />
          فعال
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <XCircle className="h-3 w-3 ml-1" />
        غیرفعال
      </span>
    );
  };

  // 📌 مدیریت ویرایش
  const handleEdit = (asset) => {
    // این تابع باید از طریق props از والد دریافت شود
    console.log("ویرایش دارایی:", asset);
    // window.location.href = `/fixed-assets/edit/${asset.AssetId}`;
  };

  // 📌 مدیریت حذف
  const handleDelete = async (assetId) => {
    if (!window.confirm("آیا از حذف این دارایی اطمینان دارید؟")) return;
    
    try {
      await fetch(`http://localhost:5000/api/fixedassets/${assetId}`, {
        method: "DELETE",
      });
      alert("✅ دارایی حذف شد");
      fetchAssets();
    } catch (err) {
      console.error("❌ خطا در حذف دارایی:", err);
      alert("خطا در حذف دارایی");
    }
  };

  // 📌 مشاهده جزئیات
  const handleViewDetails = (asset) => {
    // می‌توانید یک مودال یا صفحه جدید باز کنید
    const annualDep = calculateAnnualDepreciation(asset);
    const currentValue = calculateCurrentValue(asset);
    const yearsPassed = calculateYearsSincePurchase(asset.PurchaseDate);
    
    const details = `
      جزئیات دارایی:
      ====================
      کد دارایی: ${asset.AssetCode}
      نام: ${asset.TitleFa}
      نوع: ${getAssetTypeLabel(asset.AssetType)}
      تعداد: ${asset.Quantity}
      تاریخ خرید: ${formatJalaliDate(asset.PurchaseDate)}
      بهای تمام‌شده: ${formatNumber(asset.PurchaseCost)} ریال
      ارزش کل: ${formatNumber(asset.PurchaseCost * asset.Quantity)} ریال
      عمر مفید: ${asset.UsefulLife} سال
      ارزش اسقاط: ${formatNumber(asset.SalvageValue)} ریال
      روش استهلاک: ${asset.DepreciationMethod === 'SL' ? 'خط مستقیم' : 'نزولی'}
      استهلاک سالانه: ${formatNumber(Math.round(annualDep))} ریال
      سال‌های گذشته: ${yearsPassed} سال
      ارزش فعلی: ${formatNumber(currentValue * asset.Quantity)} ریال
      روش پرداخت: ${asset.PaymentMethod === 'cash' ? 'نقدی' : 
                   asset.PaymentMethod === 'bank' ? 'بانک' : 
                   asset.PaymentMethod === 'payable' ? 'نسیه' : 'سرمایه'}
      حساب بدهکار: ${asset.DebitAccount || 'تعریف نشده'}
      حساب بستانکار: ${asset.CreditAccount || 'تعریف نشده'}
      وضعیت: ${asset.IsActive === 1 ? 'فعال' : 'غیرفعال'}
    `;
    
    alert(details);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* هدر */}
      <div className="mb-6">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl p-4 shadow">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white mb-1 flex items-center">
                <Layers className="h-6 w-6 ml-2" />
                لیست دارایی‌های ثابت
              </h1>
              <p className="text-blue-100 text-sm">
                مشاهده، جستجو و مدیریت دارایی‌های ثابت
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
              <button 
                className="inline-flex items-center px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm"
                onClick={() => window.print()}
              >
                <Printer className="h-4 w-4 ml-1" />
                چاپ
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* آمار کلی */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building className="h-6 w-6 text-blue-600" />
            </div>
            <div className="mr-3">
              <p className="text-sm text-gray-600">تعداد کل دارایی‌ها</p>
              <p className="text-xl font-bold text-gray-900">{formatNumber(stats.totalAssets)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="mr-3">
              <p className="text-sm text-gray-600">ارزش کل دارایی‌ها</p>
              <p className="text-xl font-bold text-gray-900">{formatNumber(stats.totalValue)} ریال</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calculator className="h-6 w-6 text-orange-600" />
            </div>
            <div className="mr-3">
              <p className="text-sm text-gray-600">استهلاک انباشته</p>
              <p className="text-xl font-bold text-gray-900">{formatNumber(stats.totalDepreciation)} ریال</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-purple-600" />
            </div>
            <div className="mr-3">
              <p className="text-sm text-gray-600">دارایی‌های فعال</p>
              <p className="text-xl font-bold text-gray-900">{formatNumber(stats.activeAssets)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* نوار جستجو و فیلتر */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* جستجو */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="جستجوی دارایی بر اساس کد یا نام..."
                className="w-full pr-10 pl-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* دکمه‌های فیلتر و انتخاب */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center px-3 py-2 text-sm rounded-lg ${showFilters ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              <Filter className="h-4 w-4 ml-1" />
              فیلترها
            </button>
            
            {selectedAssets.length > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="inline-flex items-center px-3 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg"
              >
                <Trash2 className="h-4 w-4 ml-1" />
                حذف انتخاب‌شده‌ها ({selectedAssets.length})
              </button>
            )}
          </div>
        </div>

        {/* فیلترهای پیشرفته */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  نوع دارایی
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">همه انواع</option>
                  {assetTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  وضعیت
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  {statusOptions.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  تعداد در هر صفحه
                </label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="5">5 مورد</option>
                  <option value="10">10 مورد</option>
                  <option value="20">20 مورد</option>
                  <option value="50">50 مورد</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* جدول دارایی‌ها */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* هدر جدول */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-800">لیست دارایی‌ها</h3>
            <p className="text-xs text-gray-500 mt-1">
              نمایش {formatNumber(currentAssets.length)} از {formatNumber(filteredAndSortedAssets.length)} دارایی
            </p>
          </div>
          
          <div className="text-xs text-gray-500">
            <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded">
              {filteredAndSortedAssets.length > 0 
                ? `صفحه ${currentPage} از ${totalPages}`
                : "بدون داده"
              }
            </span>
          </div>
        </div>

        {/* حالت لودینگ */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            <p className="mt-3 text-gray-600 text-sm">در حال بارگذاری دارایی‌ها...</p>
          </div>
        ) : filteredAndSortedAssets.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-3">📭</div>
            <p className="text-gray-600">هیچ دارایی یافت نشد</p>
            {searchTerm || filterType !== "all" || filterStatus !== "all" ? (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterType("all");
                  setFilterStatus("all");
                }}
                className="mt-3 px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
              >
                پاک کردن فیلترها
              </button>
            ) : null}
          </div>
        ) : (
          <>
            {/* جدول */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-12 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedAssets.length === currentAssets.length && currentAssets.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th 
                      className="px-4 py-3 text-right text-xs font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("AssetCode")}
                    >
                      <div className="flex items-center">
                        <Hash className="h-3 w-3 ml-1" />
                        کد دارایی
                        {sortField === "AssetCode" && (
                          <span className="mr-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-right text-xs font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("TitleFa")}
                    >
                      <div className="flex items-center">
                        <Type className="h-3 w-3 ml-1" />
                        نام دارایی
                        {sortField === "TitleFa" && (
                          <span className="mr-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">نوع</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">تعداد</th>
                    <th 
                      className="px-4 py-3 text-right text-xs font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("PurchaseCost")}
                    >
                      <div className="flex items-center">
                        <DollarSign className="h-3 w-3 ml-1" />
                        ارزش کل
                        {sortField === "PurchaseCost" && (
                          <span className="mr-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">ارزش فعلی</th>
                    <th 
                      className="px-4 py-3 text-right text-xs font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("PurchaseDate")}
                    >
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 ml-1" />
                        تاریخ خرید
                        {sortField === "PurchaseDate" && (
                          <span className="mr-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">وضعیت</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentAssets.map((asset) => {
                    const currentValue = calculateCurrentValue(asset);
                    const annualDep = calculateAnnualDepreciation(asset);
                    const yearsPassed = calculateYearsSincePurchase(asset.PurchaseDate);
                    
                    return (
                      <tr key={asset.AssetId} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedAssets.includes(asset.AssetId)}
                            onChange={() => handleSelectAsset(asset.AssetId)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <span className="text-lg mr-2">{getAssetTypeIcon(asset.AssetType)}</span>
                            <div>
                              <div className="font-mono text-sm font-medium text-gray-900">
                                {asset.AssetCode}
                              </div>
                              <div className="text-xs text-gray-500">
                                عمر مفید: {asset.UsefulLife} سال
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{asset.TitleFa}</div>
                          <div className="text-xs text-gray-500 flex items-center mt-1">
                            <CreditCard className="h-3 w-3 ml-1" />
                            {asset.PaymentMethod === "cash" ? "نقدی" : 
                             asset.PaymentMethod === "bank" ? "بانک" : 
                             asset.PaymentMethod === "payable" ? "نسیه" : "سرمایه"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${assetTypes.find(t => t.value === asset.AssetType)?.color || 'bg-gray-100'}`}>
                            {getAssetTypeLabel(asset.AssetType)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center">
                            <Package className="h-4 w-4 text-gray-400 ml-1" />
                            <span className="font-medium">{asset.Quantity}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-left">
                            <div className="font-medium text-gray-900">{formatNumber(asset.PurchaseCost * asset.Quantity)} ریال</div>
                            <div className="text-xs text-gray-500">هر واحد: {formatNumber(asset.PurchaseCost)}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-left">
                            <div className="font-medium text-gray-900">{formatNumber(currentValue * asset.Quantity)} ریال</div>
                            <div className="text-xs text-gray-500 flex items-center mt-1">
                              <TrendingDown className="h-3 w-3 ml-1" />
                              استهلاک سالانه: {formatNumber(Math.round(annualDep))}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">{formatJalaliDate(asset.PurchaseDate)}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            <Clock className="h-3 w-3 inline ml-1" />
                            {yearsPassed} سال گذشته
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(asset.IsActive)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-1 space-x-reverse">
                            <button
                              onClick={() => handleViewDetails(asset)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="مشاهده جزئیات"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(asset)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="ویرایش"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(asset.AssetId)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="حذف"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* صفحه‌بندی */}
            <div className="px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-gray-500 mb-2 sm:mb-0">
                نمایش {formatNumber(startIndex + 1)} تا {formatNumber(Math.min(endIndex, filteredAndSortedAssets.length))} از{" "}
                {formatNumber(filteredAndSortedAssets.length)} نتیجه
              </div>
              
              <div className="flex items-center space-x-2 space-x-reverse">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1 text-sm rounded-lg ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* خلاصه اطلاعات */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* توزیع بر اساس نوع */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="font-medium text-gray-800 mb-4 flex items-center">
            <BarChart className="h-4 w-4 ml-2" />
            توزیع دارایی‌ها بر اساس نوع
          </h3>
          <div className="space-y-3">
            {assetTypes.map(type => {
              const count = filteredAndSortedAssets.filter(a => a.AssetType === type.value).length;
              const percentage = filteredAndSortedAssets.length > 0 
                ? Math.round((count / filteredAndSortedAssets.length) * 100) 
                : 0;
              
              return (
                <div key={type.value} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-lg mr-2">{type.icon}</span>
                    <span className="text-sm text-gray-700">{type.label}</span>
                  </div>
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-blue-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium w-12 text-left">
                      {count} ({percentage}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* اطلاعات حساب‌ها */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="font-medium text-gray-800 mb-4 flex items-center">
            <FileText className="h-4 w-4 ml-2" />
            اطلاعات حسابداری
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">ارزش کل دارایی‌ها</div>
                <div className="font-bold text-blue-600">{formatNumber(stats.totalValue)} ریال</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">ارزش فعلی دارایی‌ها</div>
                <div className="font-bold text-green-600">
                  {formatNumber(stats.totalValue - stats.totalDepreciation)} ریال
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-600 mb-2">میانگین اطلاعات</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-sm text-gray-700">میانگین عمر مفید</div>
                  <div className="font-medium">
                    {filteredAndSortedAssets.length > 0
                      ? Math.round(filteredAndSortedAssets.reduce((sum, a) => sum + a.UsefulLife, 0) / filteredAndSortedAssets.length)
                      : 0} سال
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-700">میانگین استهلاک سالانه</div>
                  <div className="font-medium">
                    {filteredAndSortedAssets.length > 0
                      ? formatNumber(Math.round(filteredAndSortedAssets.reduce((sum, a) => sum + calculateAnnualDepreciation(a), 0) / filteredAndSortedAssets.length))
                      : 0} ریال
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}