import { useState, useEffect } from "react";
import GenericTablePage from "../ui/GenericTablePage";
import ItemModal from "./ItemModal";
import EditModal from "../ui/EditModal";

export default function ItemPage() {
  const [refreshFlag, setRefreshFlag] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const mapResponse = (row) => ({
    ...row,
    _isActive: row.isActive ? "✅" : "❌"
  });

  useEffect(() => {
    fetchData();
  }, [refreshFlag]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/items");
      if (!response.ok) {
        throw new Error(`خطا در دریافت داده‌ها: ${response.status}`);
      }
      const result = await response.json();
      const mappedData = Array.isArray(result) ? result.map(mapResponse) : [];
      setData(mappedData);
      setError(null);
    } catch (err) {
      setError(err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleSuccess = () => {
    setRefreshFlag((f) => f + 1);
    setIsModalOpen(false);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("آیا از حذف این کالا اطمینان دارید؟")) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/items/${id}`, {
        method: "DELETE"
      });

      if (response.ok) {
        alert("✅ کالا با موفقیت حذف شد");
        fetchData();
      } else {
        throw new Error("خطا در حذف");
      }
    } catch (err) {
      console.error("❌ خطا در حذف:", err);
      alert("❌ خطا در حذف کالا");
    }
  };

  const handleSave = async (id, updatedData) => {
    try {
      // تصحیح مقادیر برای کالاها
      const cleanData = { ...updatedData };

      // حذف فیلدهای نمایشی
      Object.keys(cleanData).forEach(key => {
        if (key.startsWith('_')) {
          delete cleanData[key];
        }
      });

      // تبدیل isActive به 0 یا 1
      if (cleanData.isActive === '✅' || cleanData.isActive === true) {
        cleanData.isActive = 1;
      } else if (cleanData.isActive === '❌' || cleanData.isActive === false) {
        cleanData.isActive = 0;
      }

      // اطمینان از اینکه itemType معتبر است
      const validItemTypes = ['product', 'service', 'package'];
      if (!validItemTypes.includes(cleanData.itemType)) {
        cleanData.itemType = 'product';
      }

      // تبدیل مقادیر عددی
      if (cleanData.itemCode) cleanData.itemCode = parseInt(cleanData.itemCode) || 0;
      if (cleanData.basePrice) cleanData.basePrice = parseFloat(cleanData.basePrice) || 0;
      if (cleanData.taxRate) cleanData.taxRate = parseFloat(cleanData.taxRate) || 0;
      if (cleanData.itemGroupId) cleanData.itemGroupId = parseInt(cleanData.itemGroupId) || null;

      console.log("📤 ارسال داده برای ویرایش:", { id, cleanData });

      const response = await fetch(`http://localhost:5000/api/items/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(cleanData)
      });

      console.log("📥 پاسخ سرور:", response.status, response.statusText);

      if (response.ok) {
        alert("✅ تغییرات با موفقیت ذخیره شد");
        fetchData();
        setIsEditModalOpen(false);
      } else {
        let errorMessage = `خطا در ذخیره تغییرات (${response.status})`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.error("❌ جزئیات خطا:", errorData);
        } catch {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }
    } catch (err) {
      console.error("❌ خطا در ذخیره:", err);
      alert(`❌ خطا در ذخیره تغییرات: ${err.message}`);
      throw err;
    }
  };

  const columns = [
    { key: "itemCode", label: "کد کالا" },
    { key: "itemName", label: "نام کالا" },
    { key: "unit", label: "واحد" },
    { key: "barcode", label: "بارکد" },
    { key: "iranCode", label: "ایران‌کد" },
    { key: "brand", label: "برند" },
    { key: "model", label: "مدل" },
    { key: "originCountry", label: "کشور سازنده" },
    { key: "itemType", label: "نوع" },
    { key: "basePrice", label: "قیمت پایه" },
    { key: "taxRate", label: "مالیات" },
    { key: "_isActive", label: "فعال؟" },
    { key: "description", label: "توضیحات" }
  ];

  const renderTable = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">در حال بارگذاری...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-800 rounded-lg">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-red-800 dark:text-red-300">خطا در بارگذاری داده‌ها</h3>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800">
              {columns.map((col, index) => (
                <th
                  key={index}
                  className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider"
                >
                  {col.label}
                </th>
              ))}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                عملیات
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                {columns.map((col, colIndex) => (
                  <td
                    key={colIndex}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200"
                  >
                    {row[col.key] || (
                      <span className="text-gray-400 dark:text-gray-500">-</span>
                    )}
                  </td>
                ))}
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center gap-2">
                    {/* دکمه ویرایش */}
                    <button
                      onClick={() => handleEdit(row)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800/40 transition-colors border border-blue-100 dark:border-blue-800"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      ویرایش
                    </button>

                    {/* دکمه حذف */}
                    <button
                      onClick={() => handleDelete(row.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-800/40 transition-colors border border-red-100 dark:border-red-800"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      حذف
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {data.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">داده‌ای یافت نشد</h3>
            <p className="text-gray-500 dark:text-gray-400">هنوز هیچ کالایی ثبت نشده است.</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* استفاده از GenericTablePage برای layout */}
      <GenericTablePage
        table="items"
        apiPath="items"
        fields={[]}
        columns={columns}
        mapResponse={mapResponse}
        refreshTrigger={refreshFlag}
        title="کالاها"
        onAddNew={handleAddItem}
        customTable={renderTable()} // ارسال جدول سفارشی
      />

      {isModalOpen && (
        <ItemModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSuccess={handleSuccess}
        />
      )}

      {isEditModalOpen && editingItem && (
        <EditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          item={editingItem}
          columns={columns.filter(col => !col.key.startsWith('_'))} // فقط ستون‌های اصلی
          onSave={handleSave}
        />
      )}
    </>
  );
}