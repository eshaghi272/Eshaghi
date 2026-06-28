import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Swal from 'sweetalert2';

export default function GenericForm({
  table,
  apiPath = table,
  fields,
  initialData = null,
  onSubmit
}) {
  const [loading, setLoading] = useState(false);
  const [externalOptions, setExternalOptions] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);

  const tableNames = {
    persons: "مشتری",
    items: "کالا",
    warehouses: "انبار",
    sales: "فاکتور",
    categories: "دسته‌بندی"
  };

  const tableName = tableNames[table] || table;

  // استفاده از React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: initialData || {}
  });

  // مقداردهی اولیه فرم
  useEffect(() => {
    if (initialData) {
      setIsEditMode(true);
      // تنظیم مقادیر اولیه برای Hook Form
      Object.keys(initialData).forEach(key => {
        setValue(key, initialData[key]);
      });
    } else {
      setIsEditMode(false);
    }
  }, [initialData, setValue]);

  // دریافت داده‌های خارجی
  useEffect(() => {
    const sources = fields.filter(f => f.source).map(f => f.source);

    sources.forEach(source => {
      if (!externalOptions[source]) {
        fetch(`http://localhost:5000/api/${source}`)
          .then(res => res.json())
          .then(data => {
            setExternalOptions(prev => ({
              ...prev,
              [source]: Array.isArray(data) ? data : []
            }));
          })
          .catch(err => {
            console.error(`❌ خطا در دریافت داده‌های ${source}:`, err);
          });
      }
    });
  }, [fields, externalOptions]);

  // مدیریت ارسال فرم
  const onSubmitForm = async (data) => {
    setLoading(true);

    try {
      const primaryKeyField = Object.keys(initialData || {}).find(k =>
        k.toLowerCase().endsWith("id")
      );
      const primaryKeyValue = initialData?.[primaryKeyField];

      const method = primaryKeyValue ? "PUT" : "POST";
      const url = primaryKeyValue
        ? `http://localhost:5000/api/${apiPath}/${primaryKeyValue}`
        : `http://localhost:5000/api/${apiPath}`;

      // تبدیل checkbox به عدد برای دیتابیس
      const dataToSend = { ...data };
      fields.forEach(field => {
        if (field.type === "checkbox" && dataToSend[field.name] !== undefined) {
          dataToSend[field.name] = dataToSend[field.name] ? 1 : 0;
        }
      });

      // نمایش وضعیت لودینگ
      Swal.fire({
        title: isEditMode ? 'در حال ویرایش...' : 'در حال ثبت...',
        text: 'لطفاً منتظر بمانید',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(dataToSend)
      });

      Swal.close();

      if (!res.ok) {
        let errorMessage = `خطا در ${isEditMode ? 'ویرایش' : 'ثبت'} داده`;

        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // خطای JSON
        }

        throw new Error(errorMessage);
      }

      const result = await res.json();

      // نمایش پیام موفقیت
      Swal.fire({
        icon: 'success',
        title: isEditMode ? 'ویرایش موفق' : 'ثبت موفق',
        text: `${tableName} با موفقیت ${isEditMode ? 'ویرایش' : 'ثبت'} شد`,
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });

      onSubmit?.(result);

      // ریست فرم اگر حالت ثبت جدید باشد
      if (!isEditMode) {
        reset();
      }

    } catch (err) {
      console.error("❌ خطا در ارسال:", err);
      Swal.fire({
        icon: 'error',
        title: 'خطا',
        text: err.message || 'خطای نامشخصی رخ داده است',
        confirmButtonText: 'متوجه شدم'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    reset();
    setIsEditMode(false);
  };

  // رندر فیلدها
  const renderField = (field) => {
    const fieldId = `${field.name}-${Date.now()}`;

    // فیلد select
    if (field.type === "select" || field.type === "search-select") {
      const options = field.options ||
        (field.source ? externalOptions[field.source] : []) ||
        [];

      return (
        <div key={fieldId} className="space-y-1.5">
          <label htmlFor={fieldId} className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            {field.label}
            {field.required && <span className="text-red-500 mr-1">*</span>}
          </label>
          <div className="relative">
            <select
              id={fieldId}
              {...register(field.name, {
                required: field.required ? `${field.label} الزامی است` : false
              })}
              className="w-full p-2 h-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none cursor-pointer text-sm"
              disabled={field.disabled || loading}
            >
              <option value="" className="text-gray-400 text-sm">انتخاب کنید</option>
              {options.map((opt, index) => {
                const optionValue = field.optionValue ? opt[field.optionValue] :
                  field.valueField ? opt[field.valueField] :
                    opt.value || opt.id || index;
                const optionLabel = field.optionLabel ? field.optionLabel(opt) :
                  opt.label || opt.name || `گزینه ${index + 1}`;

                return (
                  <option
                    key={optionValue}
                    value={optionValue}
                    className="text-sm dark:bg-gray-800"
                  >
                    {optionLabel}
                  </option>
                );
              })}
            </select>
            <div className="absolute left-2.5 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          {errors[field.name] && (
            <p className="text-red-500 text-xs mt-1">{errors[field.name].message}</p>
          )}
        </div>
      );
    }

    // فیلد textarea
    if (field.type === "textarea") {
      return (
        <div key={fieldId} className="md:col-span-2 space-y-1.5">
          <label htmlFor={fieldId} className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            {field.label}
            {field.required && <span className="text-red-500 mr-1">*</span>}
          </label>
          <textarea
            id={fieldId}
            {...register(field.name, {
              required: field.required ? `${field.label} الزامی است` : false
            })}
            placeholder={field.placeholder || field.label}
            rows="3"
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none text-sm min-h-[80px]"
            disabled={field.disabled || loading}
          />
          {errors[field.name] && (
            <p className="text-red-500 text-xs mt-1">{errors[field.name].message}</p>
          )}
        </div>
      );
    }

    // فیلد checkbox
    if (field.type === "checkbox") {
      return (
        <div key={fieldId} className="md:col-span-2">
          <div className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
            <div className="relative">
              <input
                id={fieldId}
                type="checkbox"
                {...register(field.name)}
                className="sr-only peer"
                disabled={field.disabled || loading}
              />
              <div className="w-9 h-5 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </div>
            <label htmlFor={fieldId} className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              {field.label}
            </label>
          </div>
        </div>
      );
    }

    // فیلدهای دیگر (text, number, date, etc.)
    return (
      <div key={fieldId} className="space-y-1.5">
        <label htmlFor={fieldId} className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
          {field.label}
          {field.required && <span className="text-red-500 mr-1">*</span>}
        </label>
        <input
          id={fieldId}
          type={field.type || "text"}
          {...register(field.name, {
            required: field.required ? `${field.label} الزامی است` : false,
            min: field.min !== undefined ? {
              value: field.min,
              message: `حداقل مقدار ${field.min} است`
            } : undefined,
            max: field.max !== undefined ? {
              value: field.max,
              message: `حداکثر مقدار ${field.max} است`
            } : undefined,
            pattern: field.pattern ? {
              value: field.pattern,
              message: `فرمت ${field.label} صحیح نیست`
            } : undefined
          })}
          placeholder={field.placeholder || field.label}
          className={`w-full p-2 h-10 border ${field.disabled ? 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-800'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm`}
          disabled={field.disabled || loading}
          step={field.step}
        />
        {errors[field.name] && (
          <p className="text-red-500 text-xs mt-1">{errors[field.name].message}</p>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-5">
      {/* وضعیت */}
      <div className={`px-3 py-2 rounded-lg ${isEditMode ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700' : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-md ${isEditMode ? 'bg-yellow-100 dark:bg-yellow-800' : 'bg-green-100 dark:bg-green-800'}`}>
              <svg className={`w-4 h-4 ${isEditMode ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isEditMode ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                )}
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {isEditMode ? 'حالت ویرایش' : 'حالت ثبت جدید'}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {isEditMode ? 'در حال ویرایش رکورد انتخاب شده' : 'در حال ثبت رکورد جدید'}
              </p>
            </div>
          </div>
          {isEditMode && (
            <button
              type="button"
              onClick={resetForm}
              disabled={loading}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors text-xs"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              ثبت جدید
            </button>
          )}
        </div>
      </div>

      {/* فیلدهای فرم */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {fields.map(field => renderField(field))}
      </div>

      {/* دکمه‌های اکشن */}
      <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className={`flex-1 py-2.5 px-5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm ${loading
              ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
              : isEditMode
                ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white shadow hover:shadow-md'
                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow hover:shadow-md'}`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                در حال پردازش...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isEditMode ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  )}
                </svg>
                {isEditMode ? 'ویرایش' : 'ثبت'} {tableName}
              </>
            )}
          </button>

          {isEditMode && (
            <button
              type="button"
              onClick={resetForm}
              disabled={loading}
              className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200 rounded-lg font-medium transition-colors text-sm"
            >
              انصراف
            </button>
          )}
        </div>
      </div>
    </form>
  );
}