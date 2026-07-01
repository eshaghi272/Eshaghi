import { useState, useEffect } from "react";
import FixedAssetList from "./FixedAssetList";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { DateObject } from "react-multi-date-picker"; // اضافه کردن DateObject

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
  });

  const [assets, setAssets] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [systemConfigError, setSystemConfigError] = useState(false);

  useEffect(() => {
    fetchAssets();
  }, []);

  // 📌 دریافت لیست دارایی‌ها
  const fetchAssets = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/fixedassets");
      
      if (!res.ok) {
        throw new Error(`خطا در دریافت داده: ${res.status}`);
      }
      
      const data = await res.json();
      console.log("📥 داده دریافتی از سرور:", data);

      // تبدیل تاریخ‌های دریافتی از سرور (شمسی) به فرمت مناسب برای DatePicker
      const converted = Array.isArray(data)
        ? data.map((a) => {
            let dateObj = null;
            if (a.PurchaseDate && typeof a.PurchaseDate === "string") {
              try {
                // استفاده از DateObject برای تبدیل رشته تاریخ به DateObject
                // رشته تاریخ شمسی مانند "1403/10/15"
                const dateParts = a.PurchaseDate.split("/");
                if (dateParts.length === 3) {
                  const [year, month, day] = dateParts.map(Number);
                  dateObj = new DateObject({
                    year,
                    month,
                    day,
                    calendar: persian,
                    locale: persian_fa,
                  });
                }
              } catch (error) {
                console.error("❌ خطا در تبدیل تاریخ:", error, a.PurchaseDate);
              }
            }
            return {
              ...a,
              PurchaseDate: dateObj,
            };
          })
        : [];

      setAssets(converted);
    } catch (err) {
      console.error("❌ خطا در دریافت دارایی‌ها:", err);
      alert("❌ خطا در دریافت لیست دارایی‌ها: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 📌 تغییر مقادیر فرم
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setAsset({
      ...asset,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    });
  };

  // 📌 تغییر تاریخ
  const handleDateChange = (date) => {
    console.log("📅 تاریخ انتخاب شده:", date);
    console.log("📅 تاریخ فرمت شده:", date?.format("YYYY/MM/DD"));
    setAsset({ ...asset, PurchaseDate: date });
  };

  // 📌 آماده‌سازی داده برای ارسال به سرور
  const preparePayload = () => {
    const purchaseDateStr = asset.PurchaseDate
      ? asset.PurchaseDate.format("YYYY/MM/DD")
      : "";

    console.log("📤 تاریخ ارسالی به سرور:", purchaseDateStr);

    return {
      AssetCode: asset.AssetCode.trim(),
      TitleFa: asset.TitleFa.trim(),
      PurchaseDate: purchaseDateStr,
      Quantity: Number(asset.Quantity) || 1,
      PurchaseCost: Number(asset.PurchaseCost) || 0,
      UsefulLife: Number(asset.UsefulLife) || 5,
      SalvageValue: Number(asset.SalvageValue) || 0,
      DepreciationMethod: asset.DepreciationMethod,
    };
  };

  // 📌 ثبت یا ویرایش دارایی
  const handleSubmit = async (e) => {
    e.preventDefault();

    // اعتبارسنجی
    if (!asset.AssetCode.trim()) {
      alert("لطفا کد دارایی را وارد کنید.");
      return;
    }
    if (!asset.TitleFa.trim()) {
      alert("لطفا نام دارایی را وارد کنید.");
      return;
    }
    if (!asset.PurchaseDate) {
      alert("لطفا تاریخ خرید را انتخاب کنید.");
      return;
    }
    if (asset.Quantity <= 0) {
      alert("تعداد باید بیشتر از صفر باشد.");
      return;
    }
    if (asset.PurchaseCost <= 0) {
      alert("بهای تمام‌شده باید بیشتر از صفر باشد.");
      return;
    }

    // بررسی تکراری بودن کد دارایی (اگر در حالت ثبت جدید هستیم)
    if (!editingId) {
      const existingAsset = assets.find(
        (a) => a.AssetCode === asset.AssetCode.trim()
      );
      if (existingAsset) {
        alert("❌ کد دارایی تکراری است! لطفا کد دیگری انتخاب کنید.");
        return;
      }
    }

    setLoading(true);
    
    try {
      const payload = preparePayload();
      console.log("📦 پیلود ارسالی:", payload);

      let response;
      let url = "http://localhost:5000/api/fixedassets";
      let method = "POST";

      if (editingId) {
        url = `http://localhost:5000/api/fixedassets/${editingId}`;
        method = "PUT";
      }

      response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      let result;
      
      try {
        result = JSON.parse(responseText);
      } catch {
        result = { message: responseText };
      }

      if (!response.ok) {
        // بررسی خطای تنظیمات سیستم
        if (responseText.includes("حساب‌های خرید دارایی")) {
          setSystemConfigError(true);
          throw new Error(
            "⚠️ تنظیمات حساب‌های خرید دارایی در سیستم تعریف نشده‌اند.\n\n" +
            "لطفا ابتدا حساب‌های زیر را در بخش تنظیمات سیستم تعریف کنید:\n" +
            "1. حساب دارایی ثابت\n" +
            "2. حساب بانک/صندوق/بستانکار\n" +
            "3. حساب استهلاک\n\n" +
            "پس از تعریف حساب‌ها، مجدداً اقدام به ثبت دارایی کنید."
          );
        }
        throw new Error(result.error || `خطا: ${response.status}`);
      }

      console.log("✅ نتیجه ثبت:", result);

      alert(
        editingId
          ? "✅ دارایی با موفقیت ویرایش شد"
          : "✅ دارایی با موفقیت ثبت شد"
      );

      await fetchAssets();
      resetForm();
      setSystemConfigError(false);
      
    } catch (err) {
      console.error("❌ خطا در ثبت دارایی:", err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 📌 حذف دارایی
  const handleDelete = async (id) => {
    if (!window.confirm("آیا از حذف این دارایی اطمینان دارید؟")) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/fixedassets/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(`خطا در حذف: ${response.status}`);
      }

      await fetchAssets();
      alert("✅ دارایی با موفقیت حذف شد");
    } catch (err) {
      console.error("❌ خطا در حذف دارایی:", err);
      alert("❌ خطا در حذف دارایی: " + err.message);
    }
  };

  // 📌 ویرایش دارایی
  const handleEdit = (assetToEdit) => {
    console.log("✏️ ویرایش دارایی:", assetToEdit);

    // آماده‌سازی تاریخ برای DatePicker
    let purchaseDate = null;
    if (assetToEdit.PurchaseDate) {
      try {
        // اگر تاریخ از سرور به صورت رشته شمسی آمده
        if (typeof assetToEdit.PurchaseDate === "string") {
          // استفاده از DateObject برای تبدیل رشته به DateObject
          const dateParts = assetToEdit.PurchaseDate.split("/");
          if (dateParts.length === 3) {
            const [year, month, day] = dateParts.map(Number);
            purchaseDate = new DateObject({
              year,
              month,
              day,
              calendar: persian,
              locale: persian_fa,
            });
          }
        } else if (
          assetToEdit.PurchaseDate &&
          typeof assetToEdit.PurchaseDate.format === "function"
        ) {
          // اگر قبلاً DateObject بوده
          purchaseDate = assetToEdit.PurchaseDate;
        }
      } catch (error) {
        console.error("❌ خطا در بارگذاری تاریخ برای ویرایش:", error);
      }
    }

    setAsset({
      AssetCode: assetToEdit.AssetCode || "",
      TitleFa: assetToEdit.TitleFa || "",
      PurchaseDate: purchaseDate,
      Quantity: Number(assetToEdit.Quantity) || 1,
      PurchaseCost: Number(assetToEdit.PurchaseCost) || 0,
      UsefulLife: Number(assetToEdit.UsefulLife) || 5,
      SalvageValue: Number(assetToEdit.SalvageValue) || 0,
      DepreciationMethod: assetToEdit.DepreciationMethod || "SL",
    });
    setEditingId(assetToEdit.AssetId);
  };

  // 📌 صدور سند خرید
  const handleGenerateEntry = async (assetId) => {
    if (!window.confirm("آیا از صدور سند خرید اطمینان دارید؟")) {
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:5000/api/fixedassets/${assetId}/generate-entry`,
        {
          method: "POST",
        }
      );

      const data = await res.json();
      if (res.ok) {
        alert(data.message || "✅ سند خرید با موفقیت صادر شد");
      } else {
        throw new Error(data.error || "خطا در صدور سند");
      }
    } catch (err) {
      console.error("❌ خطا در صدور سند خرید:", err);
      alert("❌ خطا در صدور سند خرید: " + err.message);
    }
  };

  // 📌 صدور سند استهلاک
  const handleGenerateDepEntry = async (assetId) => {
    if (!window.confirm("آیا از صدور سند استهلاک اطمینان دارید؟")) {
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:5000/api/fixedassets/${assetId}/generate-depreciation`,
        {
          method: "POST",
        }
      );

      const data = await res.json();
      if (res.ok) {
        alert(data.message || "✅ سند استهلاک با موفقیت صادر شد");
      } else {
        throw new Error(data.error || "خطا در صدور سند استهلاک");
      }
    } catch (err) {
      console.error("❌ خطا در صدور سند استهلاک:", err);
      alert("❌ خطا در صدور سند استهلاک: " + err.message);
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
    });
    setEditingId(null);
    setSystemConfigError(false);
  };

  // 📌 لیست فیلدهای فرم
  const formFields = [
    { label: "کد دارایی:", name: "AssetCode", type: "text", required: true },
    { label: "نام دارایی:", name: "TitleFa", type: "text", required: true },
    {
      label: "تعداد:",
      name: "Quantity",
      type: "number",
      min: 1,
      required: true,
    },
    {
      label: "بهای تمام‌شده:",
      name: "PurchaseCost",
      type: "number",
      min: 0,
      required: true,
    },
    {
      label: "عمر مفید (سال):",
      name: "UsefulLife",
      type: "number",
      min: 1,
      required: true,
    },
    {
      label: "ارزش اسقاط:",
      name: "SalvageValue",
      type: "number",
      min: 0,
      required: true,
    },
  ];

  return (
    <div className="w-full p-6 bg-white dark:bg-gray-800 shadow-md rounded-lg">
      <h2 className="text-2xl font-bold text-green-700 dark:text-green-100 mb-6">
        {editingId ? "✏️ ویرایش دارایی ثابت" : "➕ ثبت دارایی ثابت"}
      </h2>

      {/* هشدار تنظیمات سیستم */}
      {systemConfigError && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                تنظیمات سیستم تکمیل نیست
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  برای ثبت دارایی ثابت، ابتدا باید حساب‌های مربوطه را در بخش تنظیمات سیستم تعریف کنید.
                </p>
                <ul className="mt-1 list-disc list-inside">
                  <li>حساب دارایی ثابت</li>
                  <li>حساب بانک/صندوق/بستانکار</li>
                  <li>حساب استهلاک انباشته</li>
                </ul>
                <p className="mt-2">
                  پس از تعریف این حساب‌ها، می‌توانید دارایی جدید ثبت کنید.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* فرم ثبت دارایی */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* فیلدهای معمولی */}
          {formFields.map((field) => (
            <div key={field.name} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {field.label}
                {field.required && <span className="text-red-500 mr-1">*</span>}
              </label>
              <input
                type={field.type}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 
                         focus:ring-2 focus:ring-green-500 focus:border-green-500 
                         dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                name={field.name}
                value={asset[field.name]}
                onChange={handleChange}
                min={field.min}
                required={field.required}
                step={field.type === "number" ? "any" : undefined}
              />
            </div>
          ))}

          {/* روش استهلاک */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              روش استهلاک:
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 
                       focus:ring-2 focus:ring-green-500 focus:border-green-500
                       dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              name="DepreciationMethod"
              value={asset.DepreciationMethod}
              onChange={handleChange}
            >
              <option value="SL">خط مستقیم</option>
              <option value="DB">نزولی</option>
            </select>
          </div>

          {/* تاریخ خرید - DatePicker */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              تاریخ خرید:
              <span className="text-red-500 mr-1">*</span>
            </label>
            <DatePicker
              calendar={persian}
              locale={persian_fa}
              value={asset.PurchaseDate}
              onChange={handleDateChange}
              format="YYYY/MM/DD"
              inputClass="w-full border border-gray-300 rounded-lg px-3 py-2 
                         focus:ring-2 focus:ring-green-500 focus:border-green-500
                         dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="انتخاب تاریخ..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              تاریخ را به صورت شمسی انتخاب کنید (مثلاً: 1403/10/15)
              {asset.PurchaseDate && (
                <span className="block text-green-600">
                  تاریخ انتخاب شده: {asset.PurchaseDate.format("YYYY/MM/DD")}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* دکمه‌های عمل */}
        <div className="flex flex-wrap gap-3 pt-4">
          <button
            type="submit"
            className="flex-1 bg-green-600 hover:bg-green-700 text-white 
                     font-semibold py-2 px-4 rounded-lg transition duration-200
                     disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={loading || systemConfigError}
          >
            {loading
              ? "⏳ در حال پردازش..."
              : editingId
              ? "💾 ذخیره تغییرات"
              : "📥 ثبت دارایی"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white 
                       font-semibold py-2 px-4 rounded-lg transition duration-200"
            >
              ❌ لغو ویرایش
            </button>
          )}

          <button
            type="button"
            onClick={resetForm}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white 
                     font-semibold py-2 px-4 rounded-lg transition duration-200"
          >
            🔄 پاک کردن فرم
          </button>
        </div>
      </form>

      {/* لیست دارایی‌ها */}
      <div className="mt-8">
        {loading ? (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <p className="mt-2 text-gray-600">در حال بارگذاری دارایی‌ها...</p>
          </div>
        ) : (
          <FixedAssetList
            assets={assets}
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