import { useState } from "react";
import TableWithEditDialog from "./TableWithEditDialog";

export default function GenericTablePage({
  table,
  apiPath = table,
  fields = [], // مقدار پیش‌فرض
  columns,
  mapResponse,
  refreshTrigger,
  title = null, // prop جدید برای عنوان
  onAddNew = null // prop جدید برای دکمه افزودن
}) {
  const [refreshKey, setRefreshKey] = useState(0);

  // نام نمایشی جدول
  const tableNames = {
    persons: "مشتریان",
    items: "کالاها",
    warehouses: "انبارها",
    sales: "فاکتورها",
    categories: "دسته‌بندی‌ها",
    companies: "شرکت‌ها"
  };

  const tableName = title || tableNames[table] || table;

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900/20 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* هدر صفحه */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
                  مدیریت {tableName}
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm">
                  ثبت، ویرایش و مدیریت اطلاعات {tableName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* دکمه افزودن جدید - اگر prop ارسال شده باشد */}
              {onAddNew && (
                <button
                  onClick={onAddNew}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
                >
                  <span>➕</span>
                  افزودن {tableName.slice(0, -1)} جدید
                </button>
              )}

              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors shadow-sm"
              >
                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-sm font-medium">بروزرسانی</span>
              </button>

              <div className="hidden md:block">
                <div className="text-sm text-gray-500 dark:text-gray-400">تاریخ امروز</div>
                <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                  {new Date().toLocaleDateString('fa-IR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* جدول - کل عرض */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900/20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white">لیست {tableName}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    مدیریت و ویرایش اطلاعات ثبت شده
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6">
            <TableWithEditDialog
              apiUrl={`http://localhost:5000/api/${apiPath}`}
              columns={columns}
              mapResponse={mapResponse}
              refreshTrigger={refreshTrigger || refreshKey}
            />
          </div>
        </div>
      </div>
    </div>
  );
}