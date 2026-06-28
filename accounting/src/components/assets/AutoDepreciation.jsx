// components/assets/AutoDepreciation.jsx
import { useState, useEffect, useMemo, useCallback } from "react";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { 
  Calculator, Calendar, CheckCircle, DollarSign, TrendingDown, 
  Clock, Repeat, Filter, ChevronDown, ChevronUp, Package, AlertCircle,
  PlayCircle, Bug
} from "lucide-react";

export default function AutoDepreciation() {
  const [assets, setAssets] = useState([]);
  const [calculatedAssets, setCalculatedAssets] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [period, setPeriod] = useState("");
  const [periodType, setPeriodType] = useState("monthly");
  const [loading, setLoading] = useState(false);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [expandedRows, setExpandedRows] = useState([]);
  const [filterAssetType, setFilterAssetType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showOnlyDepreciable, setShowOnlyDepreciable] = useState(false);

  // انواع دارایی
  const assetTypes = [
    { value: "all", label: "همه انواع" },
    { value: "land", label: "زمین" },
    { value: "building", label: "ساختمان" },
    { value: "facility", label: "تاسیسات" },
    { value: "machinery", label: "ماشین آلات" },
    { value: "vehicle", label: "وسائط نقلیه" },
    { value: "computer", label: "کامپیوتر" },
    { value: "furniture", label: "اثاثیه" },
    { value: "software", label: "نرم افزار" }
  ];

  // وضعیت‌ها
  const statusOptions = [
    { value: "all", label: "همه وضعیت‌ها" },
    { value: "active", label: "فعال" },
    { value: "inactive", label: "غیرفعال" }
  ];

  // تابع تبدیل اعداد فارسی به انگلیسی
  const persianToEnglish = useCallback((str) => {
    if (!str) return "";
    return str.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
  }, []);

  // فرمت اعداد
  const formatNumber = useCallback((num) => {
    return new Intl.NumberFormat('fa-IR').format(Math.round(num || 0));
  }, []);

  // دریافت نام فارسی نوع دارایی
  const getAssetTypeLabel = useCallback((type) => {
    const found = assetTypes.find(t => t.value === type);
    return found ? found.label : type;
  }, [assetTypes]);

  // دریافت دارایی‌ها از API
  const reloadAssets = useCallback(async () => {
    setLoadingAssets(true);
    try {
      const res = await fetch("http://localhost:5000/api/fixedassets");
      if (!res.ok) throw new Error("خطا در واکشی دارایی‌ها");
      const data = await res.json();
      setAssets(data);
    } catch (err) {
      console.error("❌ خطا در دریافت دارایی‌ها:", err);
      alert("❌ خطا در دریافت لیست دارایی‌ها");
    } finally {
      setLoadingAssets(false);
    }
  }, []);

  useEffect(() => {
    reloadAssets();
  }, [reloadAssets]);

  // تابع محاسبه تعداد ماه‌های گذشته از تاریخ خرید شمسی تا دوره انتخابی شمسی
  const calculateMonthsElapsed = useCallback((purchaseDate, targetPeriod) => {
    if (!purchaseDate || !targetPeriod) return 0;
    
    try {
      // تبدیل اعداد فارسی به انگلیسی
      const cleanPurchaseDate = persianToEnglish(purchaseDate).replace(/\s/g, '');
      const cleanTargetPeriod = persianToEnglish(targetPeriod).replace(/\s/g, '');
      
      // استخراج سال و ماه از تاریخ خرید
      let purchaseYear, purchaseMonth;
      
      if (cleanPurchaseDate.includes('-')) {
        const purchaseParts = cleanPurchaseDate.split('-');
        purchaseYear = parseInt(purchaseParts[0]);
        purchaseMonth = parseInt(purchaseParts[1]) || 1;
      } else if (cleanPurchaseDate.includes('/')) {
        const purchaseParts = cleanPurchaseDate.split('/');
        purchaseYear = parseInt(purchaseParts[0]);
        purchaseMonth = parseInt(purchaseParts[1]) || 1;
      } else {
        purchaseYear = parseInt(cleanPurchaseDate.substring(0, 4));
        purchaseMonth = parseInt(cleanPurchaseDate.substring(5, 7)) || 1;
      }
      
      // استخراج سال و ماه از دوره انتخابی
      let targetYear, targetMonth;
      
      if (cleanTargetPeriod.includes('-')) {
        const targetParts = cleanTargetPeriod.split('-');
        targetYear = parseInt(targetParts[0]);
        targetMonth = parseInt(targetParts[1]) || 1;
      } else {
        targetYear = parseInt(cleanTargetPeriod.substring(0, 4));
        targetMonth = parseInt(cleanTargetPeriod.substring(5, 7)) || 1;
      }
      
      // محاسبه ماه‌های گذشته
      const monthsElapsed = (targetYear - purchaseYear) * 12 + (targetMonth - purchaseMonth);
      
      // اگر دوره انتخابی قبل از تاریخ خرید باشد، صفر می‌دهیم
      return Math.max(0, monthsElapsed);
    } catch (error) {
      console.error("❌ خطا در محاسبه ماه‌های گذشته:", error);
      return 0;
    }
  }, [persianToEnglish]);

  // محاسبات استهلاک برای هر دارایی بر اساس دوره انتخابی
  useEffect(() => {
    if (assets.length > 0 && period) {
      console.log("🧮 شروع محاسبات استهلاک برای دوره:", period);
      
      const calculated = assets.map(asset => {
        // محاسبه استهلاک سالانه
        const annualDepreciation = (asset.PurchaseCost - (asset.SalvageValue || 0)) / asset.UsefulLife;
        
        // محاسبه استهلاک ماهانه
        const monthlyDepreciation = annualDepreciation / 12;
        
        // تعیین استهلاک بر اساس دوره انتخابی
        let periodDepreciation = 0;
        if (periodType === "yearly") {
          periodDepreciation = annualDepreciation;
        } else if (periodType === "monthly") {
          periodDepreciation = monthlyDepreciation;
        }
        
        // محاسبه ماه‌های گذشته از تاریخ خرید
        const monthsElapsed = calculateMonthsElapsed(asset.PurchaseDate, period);
        
        // محاسبه استهلاک انباشته تا دوره انتخابی
        const accumulatedDepreciation = Math.min(
          monthsElapsed * monthlyDepreciation, 
          asset.PurchaseCost - (asset.SalvageValue || 0)
        );
        
        // ارزش دفتری
        const bookValue = Math.max(
          asset.PurchaseCost - accumulatedDepreciation,
          asset.SalvageValue || 0
        );
        
        // محاسبه تعداد دوره‌های گذشته
        let periodsElapsed = 0;
        if (period) {
          if (periodType === "yearly") {
            periodsElapsed = Math.floor(monthsElapsed / 12);
          } else {
            periodsElapsed = monthsElapsed;
          }
        }
        
        // بررسی آیا دارایی هنوز در دوره استهلاک قرار دارد؟
        const isInDepreciationPeriod = periodsElapsed < asset.UsefulLife * (periodType === "yearly" ? 1 : 12);
        
        // بررسی آیا دارایی قابل استهلاک است؟
        const canDepreciate = isInDepreciationPeriod && 
                             periodDepreciation > 0 && 
                             monthsElapsed > 0; // باید حداقل یک ماه گذشته باشد
        
        // دیباگ برای دارایی‌های مشکل‌دار
        if (isNaN(periodsElapsed) || isNaN(monthsElapsed)) {
          console.error("⚠️ مشکل در محاسبات دارایی:", {
            assetCode: asset.AssetCode,
            purchaseDate: asset.PurchaseDate,
            period,
            monthsElapsed,
            periodsElapsed,
            isInDepreciationPeriod
          });
        }
        
        return {
          ...asset,
          annualDepreciation,
          monthlyDepreciation,
          periodDepreciation,
          accumulatedDepreciation,
          bookValue,
          totalCost: asset.PurchaseCost * asset.Quantity,
          periodsElapsed: isNaN(periodsElapsed) ? 0 : periodsElapsed,
          monthsElapsed: isNaN(monthsElapsed) ? 0 : monthsElapsed,
          isInDepreciationPeriod,
          canDepreciate
        };
      });
      
      console.log("✅ محاسبات تکمیل شد. تعداد:", calculated.length);
      setCalculatedAssets(calculated);
    } else if (assets.length > 0) {
      // اگر دوره انتخاب نشده، فقط اطلاعات پایه را نمایش بده
      setCalculatedAssets(assets.map(asset => ({
        ...asset,
        totalCost: asset.PurchaseCost * asset.Quantity,
        canDepreciate: false,
        periodDepreciation: 0,
        accumulatedDepreciation: 0,
        bookValue: asset.PurchaseCost,
        periodsElapsed: 0,
        monthsElapsed: 0,
        isInDepreciationPeriod: false
      })));
    }
  }, [assets, period, periodType, calculateMonthsElapsed]);

  // فیلتر دارایی‌ها
  const filteredAssets = useMemo(() => {
    return calculatedAssets.filter(asset => {
      const matchesType = filterAssetType === "all" || asset.AssetType === filterAssetType;
      const matchesStatus = filterStatus === "all" || 
        (filterStatus === "active" && asset.IsActive === 1) ||
        (filterStatus === "inactive" && asset.IsActive === 0);
      const matchesDepreciable = !showOnlyDepreciable || asset.canDepreciate;
      
      return matchesType && matchesStatus && matchesDepreciable;
    });
  }, [calculatedAssets, filterAssetType, filterStatus, showOnlyDepreciable]);

  // دارایی‌های قابل استهلاک
  const depreciableAssets = useMemo(() => 
    filteredAssets.filter(asset => asset.canDepreciate), 
    [filteredAssets]
  );

  const toggleSelection = useCallback((id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }, []);

  const toggleAll = useCallback(() => {
    const currentDepreciableIds = depreciableAssets.map(a => a.AssetId);
    if (selectedIds.length === currentDepreciableIds.length && currentDepreciableIds.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentDepreciableIds);
    }
  }, [depreciableAssets, selectedIds]);

  const toggleRowExpand = useCallback((id) => {
    setExpandedRows(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }, []);

  // تابع دیباگ برای نمایش جزئیات محاسبات هر دارایی
  const debugAssetCalculation = useCallback((asset) => {
    if (!period) {
      alert("لطفاً ابتدا دوره را انتخاب کنید");
      return;
    }
    
    const monthsElapsed = calculateMonthsElapsed(asset.PurchaseDate, period);
    const annualDepreciation = (asset.PurchaseCost - (asset.SalvageValue || 0)) / asset.UsefulLife;
    const monthlyDepreciation = annualDepreciation / 12;
    const periodDepreciation = periodType === "yearly" ? annualDepreciation : monthlyDepreciation;
    const accumulatedDepreciation = Math.min(
      monthsElapsed * monthlyDepreciation, 
      asset.PurchaseCost - (asset.SalvageValue || 0)
    );
    const bookValue = Math.max(
      asset.PurchaseCost - accumulatedDepreciation,
      asset.SalvageValue || 0
    );
    const periodsElapsed = periodType === "yearly" ? Math.floor(monthsElapsed / 12) : monthsElapsed;
    const isInDepreciationPeriod = periodsElapsed < asset.UsefulLife * (periodType === "yearly" ? 1 : 12);
    const canDepreciate = isInDepreciationPeriod && periodDepreciation > 0 && monthsElapsed > 0;
    
    const message = `
🔍 دیباگ محاسبات دارایی:

📋 اطلاعات پایه:
کد: ${asset.AssetCode}
نام: ${asset.TitleFa}
نوع: ${getAssetTypeLabel(asset.AssetType)}
تعداد: ${asset.Quantity}
عمر مفید: ${asset.UsefulLife} سال

💰 اطلاعات مالی:
بهای تمام‌شده: ${formatNumber(asset.PurchaseCost)} ریال
ارزش اسقاط: ${formatNumber(asset.SalvageValue || 0)} ریال

📅 اطلاعات زمانی:
تاریخ خرید: ${asset.PurchaseDate}
دوره انتخابی: ${period} (${periodType === "monthly" ? "ماهانه" : "سالانه"})
ماه‌های گذشته: ${monthsElapsed} ماه
دوره‌های گذشته: ${periodsElapsed} ${periodType === "monthly" ? "ماه" : "سال"}

🧮 محاسبات استهلاک:
استهلاک سالانه: ${formatNumber(annualDepreciation)} ریال
استهلاک ماهانه: ${formatNumber(monthlyDepreciation)} ریال
استهلاک دوره: ${formatNumber(periodDepreciation)} ریال
استهلاک انباشته: ${formatNumber(accumulatedDepreciation)} ریال
ارزش دفتری: ${formatNumber(bookValue)} ریال

📊 وضعیت:
در عمر مفید: ${isInDepreciationPeriod ? "✅ بله" : "❌ خیر"}
قابل استهلاک: ${canDepreciate ? "✅ بله" : "❌ خیر"}
    `;
    
    alert(message);
  }, [period, periodType, calculateMonthsElapsed, getAssetTypeLabel, formatNumber]);

  // تابع برای بررسی محاسبات همه دارایی‌ها
  const debugAllCalculations = useCallback(() => {
    if (!period) {
      alert("لطفاً ابتدا دوره را انتخاب کنید");
      return;
    }
    
    console.log("🔍 دیباگ محاسبات همه دارایی‌ها برای دوره:", period);
    
    calculatedAssets.forEach((asset, index) => {
      console.log(`📊 دارایی ${index + 1}:`, {
        کد: asset.AssetCode,
        نام: asset.TitleFa,
        تاریخ_خرید: asset.PurchaseDate,
        دوره_انتخابی: period,
        ماه_گذشته: asset.monthsElapsed,
        دوره_گذشته: asset.periodsElapsed,
        در_عمر_مفید: asset.isInDepreciationPeriod,
        قابل_استهلاک: asset.canDepreciate,
        عمر_مفید: asset.UsefulLife,
        استهلاک_دوره: asset.periodDepreciation
      });
    });
    
    alert(`دیباگ محاسبات برای ${calculatedAssets.length} دارایی در کنسول نمایش داده شد.`);
  }, [calculatedAssets, period]);

  // تابع تست API
  const testDepreciationAPI = useCallback(async () => {
    if (calculatedAssets.length === 0) {
      alert("ابتدا دارایی‌ها را بارگذاری کنید");
      return;
    }
    
    // پیدا کردن اولین دارایی قابل استهلاک
    const testAsset = calculatedAssets.find(asset => asset.canDepreciate);
    if (!testAsset) {
      alert("هیچ دارایی قابل استهلاک برای تست پیدا نشد");
      return;
    }
    
    console.log("🧪 تست API برای دارایی:", testAsset.AssetCode);
    
    try {
      const periodDate = period ? `${period}-01` : "2024-01-01";
      const depreciationAmount = Math.round(testAsset.periodDepreciation * testAsset.Quantity);
      
      const testData = {
        period: periodDate,
        periodType: periodType,
        depreciationAmount: depreciationAmount,
        description: `تست استهلاک خودکار ${testAsset.TitleFa}`,
        quantity: testAsset.Quantity
      };
      
      console.log("📤 ارسال داده تست:", testData);
      
      const res = await fetch(`http://localhost:5000/api/fixedassets/${testAsset.AssetId}/generate-depreciation`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(testData)
      });
      
      console.log("📥 پاسخ تست:", {
        status: res.status,
        statusText: res.statusText
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log("✅ تست موفق:", data);
        alert(`✅ تست API موفق بود\nشماره سند: ${data.documentNumber}\nمبلغ: ${formatNumber(data.depreciationAmount)} ریال`);
      } else {
        const errorText = await res.text();
        console.error("❌ خطا در تست:", errorText);
        alert(`❌ تست API با خطا مواجه شد\nکد: ${res.status}\n${errorText}`);
      }
    } catch (err) {
      console.error("💥 خطای شبکه در تست:", err);
      alert(`❌ خطای شبکه در تست API: ${err.message}`);
    }
  }, [calculatedAssets, period, periodType, formatNumber]);

  // محاسبه جمع مقادیر برای دارایی‌های انتخاب‌شده
  const totals = useMemo(() => {
    const selectedAssets = depreciableAssets.filter(asset => selectedIds.includes(asset.AssetId));
    
    return {
      count: selectedAssets.length,
      totalCost: selectedAssets.reduce((sum, asset) => sum + (asset.totalCost || 0), 0),
      totalPeriodDepreciation: selectedAssets.reduce((sum, asset) => sum + (asset.periodDepreciation || 0) * asset.Quantity, 0),
      totalAccumulatedDepreciation: selectedAssets.reduce((sum, asset) => sum + (asset.accumulatedDepreciation || 0) * asset.Quantity, 0),
      totalBookValue: selectedAssets.reduce((sum, asset) => sum + (asset.bookValue || 0) * asset.Quantity, 0)
    };
  }, [depreciableAssets, selectedIds]);

  // دریافت وضعیت دارایی برای نمایش
  const getAssetStatus = useCallback((asset) => {
    if (!period) {
      return { text: "منتظر انتخاب دوره", color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300" };
    }
    
    if (!asset.canDepreciate) {
      if (asset.monthsElapsed <= 0) {
        return { text: "قبل از تاریخ خرید", color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300" };
      } else if (!asset.isInDepreciationPeriod) {
        return { text: "عمر مفید پایان یافته", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" };
      } else {
        return { text: "غیرقابل استهلاک", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300" };
      }
    }
    
    return { text: "قابل استهلاک", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" };
  }, [period]);

  // وضعیت قابل ثبت بودن
  const canSubmit = useMemo(() => {
    return !loading && selectedIds.length > 0 && period && depreciableAssets.length > 0;
  }, [loading, selectedIds, period, depreciableAssets]);

  // ارسال درخواست برای ثبت استهلاک
  const postDepEntries = async () => {
    console.log("🚀 شروع ثبت استهلاک خودکار");
    
    if (selectedIds.length === 0 || !period) {
      alert("⚠️ لطفاً دارایی و دوره را انتخاب کنید");
      return;
    }
    
    if (!window.confirm(`آیا از ثبت استهلاک برای ${selectedIds.length} دارایی در دوره ${period} اطمینان دارید؟`)) {
      return;
    }

    setLoading(true);
    const startTime = Date.now();

    try {
      const selectedAssets = depreciableAssets.filter(asset => selectedIds.includes(asset.AssetId));
      
      if (selectedAssets.length === 0) {
        alert("⚠️ هیچ دارایی قابل استهلاک انتخاب نشده است");
        setLoading(false);
        return;
      }

      let successCount = 0;
      let errorCount = 0;
      const errors = [];
      const results = [];

      // برای هر دارایی انتخاب شده درخواست جداگانه ارسال می‌کنیم
      for (const [index, asset] of selectedAssets.entries()) {
        try {
          console.log(`📝 [${index + 1}/${selectedAssets.length}] ثبت استهلاک برای ${asset.AssetCode}...`);
          
          const periodDate = `${period}-01`;
          const depreciationAmount = Math.round(asset.periodDepreciation * asset.Quantity);
          const description = `استهلاک ${periodType === 'monthly' ? 'ماهانه' : 'سالانه'} ${asset.TitleFa} - دوره ${period}`;
          
          const requestBody = {
            period: periodDate,
            periodType: periodType,
            depreciationAmount: depreciationAmount,
            description: description,
            quantity: asset.Quantity
          };
          
          console.log("📤 ارسال درخواست:", requestBody);
          
          const res = await fetch(`http://localhost:5000/api/fixedassets/${asset.AssetId}/generate-depreciation`, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Accept": "application/json"
            },
            body: JSON.stringify(requestBody)
          });

          if (!res.ok) {
            let errorMessage;
            try {
              const errorData = await res.json();
              errorMessage = errorData.error || errorData.message || `خطای ${res.status}`;
            } catch {
              errorMessage = await res.text();
            }
            throw new Error(errorMessage);
          }

          const result = await res.json();
          console.log(`✅ موفق: ${asset.AssetCode}`, result);
          
          successCount++;
          results.push({
            assetCode: asset.AssetCode,
            documentNumber: result.documentNumber,
            amount: result.depreciationAmount || depreciationAmount
          });
          
          // تاخیر کوتاه بین درخواست‌ها
          if (index < selectedAssets.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
          
        } catch (err) {
          console.error(`❌ خطا در ${asset.AssetCode}:`, err);
          errors.push({ 
            assetCode: asset.AssetCode, 
            assetName: asset.TitleFa,
            error: err.message 
          });
          errorCount++;
        }
      }

      // نمایش نتایج
      const duration = Math.round((Date.now() - startTime) / 1000);
      console.log(`🎉 نتیجه نهایی در ${duration} ثانیه:`, { 
        successCount, 
        errorCount, 
        results, 
        errors 
      });
      
      let message = "";
      if (successCount > 0) {
        message += `✅ ${successCount} سند استهلاک با موفقیت ثبت شد.\n`;
        if (results.length > 0) {
          message += `📋 شماره سندها:\n`;
          results.forEach(r => {
            message += `   - ${r.assetCode}: ${r.documentNumber} (${formatNumber(r.amount)} ریال)\n`;
          });
        }
      }
      if (errorCount > 0) {
        message += `\n❌ ${errorCount} مورد با خطا مواجه شد:\n`;
        errors.forEach(err => {
          message += `   - ${err.assetCode} (${err.assetName}): ${err.error}\n`;
        });
      }
      
      alert(message);
      
      // بازنشانی انتخاب‌ها و بارگذاری مجدد دارایی‌ها
      setSelectedIds([]);
      await reloadAssets();
      
    } catch (err) {
      console.error("💥 خطای کلی در ثبت:", err);
      alert(`❌ خطای سیستمی در ثبت سند استهلاک: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // رندر کامپوننت
  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* هدر */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
              <TrendingDown className="h-6 w-6 ml-3 text-blue-600" />
              صدور سند استهلاک خودکار
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              انتخاب دارایی‌ها و دوره برای ثبت استهلاک به صورت گروهی
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={debugAllCalculations}
              disabled={loadingAssets}
              className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm"
              title="دیباگ همه محاسبات"
            >
              <Bug className="h-4 w-4 ml-2" />
              دیباگ همه
            </button>
            
            <button
              onClick={testDepreciationAPI}
              disabled={loadingAssets}
              className="inline-flex items-center px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm"
              title="تست اتصال API"
            >
              <AlertCircle className="h-4 w-4 ml-2" />
              تست API
            </button>
            
            <button
              onClick={reloadAssets}
              disabled={loadingAssets}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
            >
              <Repeat className="h-4 w-4 ml-2" />
              بروزرسانی لیست
              {loadingAssets && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
            </button>
            
            <button
              onClick={postDepEntries}
              disabled={!canSubmit}
              className={`inline-flex items-center px-6 py-2 rounded-lg text-sm font-medium shadow-lg transition-all ${
                canSubmit
                  ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white hover:shadow-xl transform hover:-translate-y-0.5"
                  : "bg-gray-400 dark:bg-gray-700 text-gray-300 dark:text-gray-500 cursor-not-allowed"
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white ml-2"></div>
                  در حال ثبت...
                </>
              ) : (
                <>
                  <PlayCircle className="h-5 w-5 ml-2" />
                  ثبت استهلاک ({selectedIds.length})
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* خلاصه وضعیت */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
            <div className="text-xs text-gray-600 dark:text-gray-400">دارایی‌ها</div>
            <div className="font-bold">{calculatedAssets.length}</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
            <div className="text-xs text-blue-600 dark:text-blue-400">قابل استهلاک</div>
            <div className="font-bold text-blue-600 dark:text-blue-400">{depreciableAssets.length}</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">
            <div className="text-xs text-green-600 dark:text-green-400">انتخاب شده</div>
            <div className="font-bold text-green-600 dark:text-green-400">{selectedIds.length}</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded-lg">
            <div className="text-xs text-purple-600 dark:text-purple-400">دوره</div>
            <div className="font-bold text-purple-600 dark:text-purple-400">
              {period || "انتخاب نشده"} ({periodType === "monthly" ? "ماهانه" : "سالانه"})
            </div>
          </div>
        </div>
      </div>

      {/* کنترل‌های فیلتر */}
      <div className="mb-6 grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* انتخاب دوره */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
            <Calendar className="h-4 w-4 ml-2" />
            انتخاب دوره
          </label>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 space-x-reverse">
              <DatePicker
                calendar={persian}
                locale={persian_fa}
                value={period}
                onChange={(date) => setPeriod(date ? date.format("YYYY-MM") : "")}
                format="YYYY-MM"
                inputClass="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                placeholder="1404-01"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                نوع دوره
              </label>
              <div className="flex space-x-3 space-x-reverse">
                <button
                  onClick={() => setPeriodType("monthly")}
                  className={`flex-1 py-2 px-3 text-center rounded-lg border ${
                    periodType === "monthly"
                      ? "bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                      : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  ماهانه
                </button>
                <button
                  onClick={() => setPeriodType("yearly")}
                  className={`flex-1 py-2 px-3 text-center rounded-lg border ${
                    periodType === "yearly"
                      ? "bg-green-100 border-green-500 text-green-700 dark:bg-green-900 dark:text-green-300"
                      : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  سالانه
                </button>
              </div>
            </div>
            
            {period && (
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  دوره انتخابی: <span className="font-bold">{period}</span>
                  <span className="mr-2">({periodType === "monthly" ? "ماهانه" : "سالانه"})</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* فیلترها */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
            <Filter className="h-4 w-4 ml-2" />
            فیلترها
          </label>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                نوع دارایی
              </label>
              <select
                value={filterAssetType}
                onChange={(e) => setFilterAssetType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                {assetTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                وضعیت
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                {statusOptions.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* فیلتر قابل استهلاک */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            نمایش
          </label>
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showOnlyDepreciable"
                checked={showOnlyDepreciable}
                onChange={(e) => setShowOnlyDepreciable(e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="showOnlyDepreciable" className="mr-2 text-sm text-gray-700 dark:text-gray-300">
                فقط دارایی‌های قابل استهلاک
              </label>
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <div className="flex justify-between">
                <span>کل دارایی‌ها:</span>
                <span className="font-medium">{calculatedAssets.length}</span>
              </div>
              <div className="flex justify-between">
                <span>قابل استهلاک:</span>
                <span className="font-medium text-green-600 dark:text-green-400">{depreciableAssets.length}</span>
              </div>
              <div className="flex justify-between">
                <span>انتخاب شده:</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">{selectedIds.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* آمار کلی */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
            <Calculator className="h-4 w-4 ml-2" />
            آمار مالی
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {formatNumber(filteredAssets.reduce((sum, asset) => sum + (asset.totalCost || 0), 0))}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">ارزش کل دارایی‌ها</div>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-xl font-bold text-green-600 dark:text-green-400">
                {formatNumber(depreciableAssets.reduce((sum, asset) => sum + (asset.periodDepreciation || 0) * asset.Quantity, 0))}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">استهلاک دوره</div>
            </div>
            <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                {formatNumber(depreciableAssets.reduce((sum, asset) => sum + (asset.accumulatedDepreciation || 0) * asset.Quantity, 0))}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">استهلاک انباشته</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                {formatNumber(depreciableAssets.reduce((sum, asset) => sum + (asset.bookValue || 0) * asset.Quantity, 0))}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">ارزش دفتری</div>
            </div>
          </div>
        </div>
      </div>

      {/* گزینه انتخاب همه */}
      {depreciableAssets.length > 0 && (
        <div className="mb-4 flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
          <div className="flex items-center space-x-2 space-x-reverse">
            <input
              type="checkbox"
              id="selectAll"
              checked={selectedIds.length === depreciableAssets.length && depreciableAssets.length > 0}
              onChange={toggleAll}
              disabled={depreciableAssets.length === 0}
              className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
            />
            <label htmlFor="selectAll" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              انتخاب همه دارایی‌های قابل استهلاک ({depreciableAssets.length})
            </label>
          </div>
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
              {selectedIds.length} دارایی انتخاب شده
            </div>
            {selectedIds.length > 0 && period && (
              <button
                onClick={() => {
                  const selectedAssets = depreciableAssets.filter(asset => selectedIds.includes(asset.AssetId));
                  const totalDepreciation = selectedAssets.reduce((sum, asset) => 
                    sum + (asset.periodDepreciation || 0) * asset.Quantity, 0);
                  alert(`📊 خلاصه انتخاب:\nتعداد: ${selectedAssets.length}\nمبلغ کل استهلاک: ${formatNumber(totalDepreciation)} ریال`);
                }}
                className="text-sm px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                نمایش خلاصه
              </button>
            )}
          </div>
        </div>
      )}

      {/* جدول دارایی‌ها */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-100 dark:bg-gray-900">
              <tr>
                <th className="w-12 px-4 py-3"></th>
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === depreciableAssets.length && depreciableAssets.length > 0}
                    onChange={toggleAll}
                    disabled={depreciableAssets.length === 0}
                    className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
                  />
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  اطلاعات دارایی
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  اطلاعات مالی
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  محاسبات استهلاک ({periodType === "monthly" ? "ماهانه" : "سالانه"})
                </th>
                <th className="w-12 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loadingAssets ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">در حال بارگذاری دارایی‌ها...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    {!period ? "لطفاً دوره را انتخاب کنید" : "هیچ دارایی یافت نشد"}
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => {
                  const status = getAssetStatus(asset);
                  const isExpanded = expandedRows.includes(asset.AssetId);
                  const isSelected = selectedIds.includes(asset.AssetId);
                  
                  return (
                    <tbody key={asset.AssetId}>
                      <tr 
                        className={`hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors ${
                          isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        } ${!asset.canDepreciate ? 'opacity-70' : ''}`}
                      >
                        {/* دکمه گسترش */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button
                            onClick={() => toggleRowExpand(asset.AssetId)}
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
                              onChange={() => toggleSelection(asset.AssetId)}
                              className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                              disabled={!asset.canDepreciate}
                            />
                          </div>
                        </td>

                        {/* اطلاعات دارایی */}
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {asset.TitleFa}
                              <span className={`text-xs px-2 py-1 rounded mr-2 ${status.color}`}>
                                {status.text}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              <div className="flex items-center">
                                <span className="ml-2">کد:</span>
                                <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                                  {asset.AssetCode}
                                </span>
                              </div>
                              <div>نوع: {getAssetTypeLabel(asset.AssetType)}</div>
                              <div className="flex items-center">
                                <Package className="h-3 w-3 ml-1" />
                                تعداد: {asset.Quantity} عدد
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* اطلاعات مالی */}
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">بهای تمام‌شده:</span>
                              <span className="font-medium text-green-600 dark:text-green-400">
                                {formatNumber(asset.PurchaseCost)} ریال
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">ارزش اسقاط:</span>
                              <span className="font-medium text-yellow-600 dark:text-yellow-400">
                                {formatNumber(asset.SalvageValue || 0)} ریال
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">عمر مفید:</span>
                              <span>{asset.UsefulLife} سال</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">روش استهلاک:</span>
                              <span>{asset.DepreciationMethod === 'SL' ? 'خط مستقیم' : 'نزولی'}</span>
                            </div>
                          </div>
                        </td>

                        {/* محاسبات استهلاک */}
                        <td className="px-4 py-3">
                          {period ? (
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">استهلاک {periodType === "monthly" ? "ماهانه" : "سالانه"}:</span>
                                <span className="font-bold text-blue-600 dark:text-blue-400">
                                  {formatNumber(asset.periodDepreciation)} ریال
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">دوره‌های گذشته:</span>
                                <span>{asset.periodsElapsed} {periodType === "monthly" ? "ماه" : "سال"}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">ارزش دفتری:</span>
                                <span className="font-medium text-green-600 dark:text-green-400">
                                  {formatNumber(asset.bookValue)} ریال
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center text-gray-500 dark:text-gray-400 text-sm">
                              لطفاً دوره را انتخاب کنید
                            </div>
                          )}
                        </td>

                        {/* دکمه دیباگ */}
                        <td className="px-2 py-3 whitespace-nowrap">
                          <button
                            onClick={() => debugAssetCalculation(asset)}
                            className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                            title="نمایش محاسبات"
                          >
                            🔍
                          </button>
                        </td>
                      </tr>
                      
                      {/* ردیف گسترش‌یافته */}
                      {isExpanded && (
                        <tr className="bg-blue-50 dark:bg-blue-900/10">
                          <td colSpan="6" className="px-4 py-3">
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-inner">
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">ارزش کل</div>
                                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                    {formatNumber(asset.totalCost)} ریال
                                  </div>
                                </div>
                                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">استهلاک انباشته</div>
                                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                    {formatNumber(asset.accumulatedDepreciation * asset.Quantity)} ریال
                                  </div>
                                </div>
                                <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">ارزش دفتری</div>
                                  <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                                    {formatNumber(asset.bookValue * asset.Quantity)} ریال
                                  </div>
                                </div>
                                <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">استهلاک {periodType === "monthly" ? "ماه" : "سال"}</div>
                                  <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                                    {formatNumber(asset.periodDepreciation * asset.Quantity)} ریال
                                  </div>
                                </div>
                              </div>
                              
                              <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 ml-2" />
                                  <span>تاریخ خرید: ${asset.PurchaseDate}</span>
                                  <span className="mr-4">•</span>
                                  <span>مدت گذشته: ${Math.floor(asset.monthsElapsed / 12)} سال و ${asset.monthsElapsed % 12} ماه</span>
                                </div>
                                <div className="mt-2">
                                  <span className="font-medium">توضیحات:</span> استهلاک ${asset.TitleFa} به روش ${asset.DepreciationMethod === 'SL' ? 'خط مستقیم' : 'نزولی'} 
                                  برای دوره ${period} (${periodType === "monthly" ? "ماهانه" : "سالانه"})
                                </div>
                                <div className="mt-2 flex gap-2">
                                  <button
                                    onClick={() => alert(`استهلاک ماهانه: ${formatNumber(asset.monthlyDepreciation)} ریال\nاستهلاک سالانه: ${formatNumber(asset.annualDepreciation)} ریال`)}
                                    className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200"
                                  >
                                    نمایش جزئیات محاسبات
                                  </button>
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

      {/* جمع‌های انتخابی */}
      {selectedIds.length > 0 && period && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl shadow">
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {totals.count}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">تعداد دارایی‌ها</div>
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl shadow">
            <div className="text-center">
              <div className="text-xl font-bold text-green-600 dark:text-green-400">
                {formatNumber(totals.totalCost)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">ارزش کل انتخاب‌شده</div>
            </div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl shadow">
            <div className="text-center">
              <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                {formatNumber(totals.totalPeriodDepreciation)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">استهلاک دوره</div>
            </div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl shadow">
            <div className="text-center">
              <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                {formatNumber(totals.totalAccumulatedDepreciation)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">ذخیره استهلاک</div>
            </div>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl shadow">
            <div className="text-center">
              <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                {formatNumber(totals.totalBookValue)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">ارزش دفتری</div>
            </div>
          </div>
        </div>
      )}

      {/* پیام راهنما */}
      {!period && (
        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 ml-2" />
            <p className="text-yellow-700 dark:text-yellow-300">
              لطفاً ابتدا دوره مالی را انتخاب کنید تا محاسبات استهلاک نمایش داده شوند.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}