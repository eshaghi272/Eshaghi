import { useState, useEffect } from 'react';
import { DateObject } from "react-multi-date-picker";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

export default function WarehouseReceiptForm() {
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshFlag, setRefreshFlag] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    itemCode: "",
    warehouseId: "",
    quantity: "",
    transDate: new DateObject({ calendar: persian }).format("YYYY-MM-DD"),
    reference: "",
    description: "",
    transType: "ورود"
  });

  // دریافت داده‌ها
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [itemsRes, warehousesRes, transactionsRes] = await Promise.all([
          fetch("http://localhost:5000/api/items"),
          fetch("http://localhost:5000/api/warehouses"),
          fetch("http://localhost:5000/api/stocktransactions")
        ]);

        const itemsData = await itemsRes.json();
        const warehousesData = await warehousesRes.json();
        const transactionsData = await transactionsRes.json();

        setItems(Array.isArray(itemsData) ? itemsData : []);
        setWarehouses(Array.isArray(warehousesData) ? warehousesData : []);
        setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
      } catch (err) {
        console.error("خطا در دریافت داده‌ها:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refreshFlag]);

  // پیدا کردن نام کالا
  const findItemName = (itemCode) => {
    const item = items.find(i => i.itemCode == itemCode);
    return item ? item.itemName : "-";
  };

  // پیدا کردن نام انبار
  const findWarehouseName = (warehouseId) => {
    const warehouse = warehouses.find(w => w.id == warehouseId || w.warehouseId == warehouseId);
    return warehouse ? warehouse.warehouseName : "-";
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      itemCode: "",
      warehouseId: "",
      quantity: "",
      transDate: new DateObject({ calendar: persian }).format("YYYY-MM-DD"),
      reference: "",
      description: "",
      transType: "ورود"
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.itemCode || !formData.warehouseId || !formData.quantity) {
      alert("لطفاً فیلدهای ضروری را پر کنید");
      return;
    }

    try {
      const payload = {
        ...formData,
        quantity: Number(formData.quantity),
        transDate: formData.transDate
      };

      let response;
      if (editingId) {
        // ویرایش
        response = await fetch(`http://localhost:5000/api/stocktransactions/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        // ایجاد جدید
        response = await fetch("http://localhost:5000/api/stocktransactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      if (response.ok) {
        alert(editingId ? "✅ رسید با موفقیت ویرایش شد" : "✅ رسید جدید ثبت شد");
        setIsModalOpen(false);
        resetForm();
        setRefreshFlag(prev => prev + 1);
      } else {
        const error = await response.text();
        throw new Error(error);
      }
    } catch (err) {
      console.error("❌ خطا:", err);
      alert("❌ خطا در ثبت رسید");
    }
  };

  const handleEdit = (transaction) => {
    setEditingId(transaction.id);
    setFormData({
      itemCode: transaction.itemCode,
      warehouseId: transaction.warehouseId,
      quantity: transaction.quantity,
      transDate: transaction.transDate,
      reference: transaction.reference || "",
      description: transaction.description || "",
      transType: transaction.transType || "ورود"
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("آیا از حذف این رسید اطمینان دارید؟")) return;

    try {
      const response = await fetch(`http://localhost:5000/api/stocktransactions/${id}`, {
        method: "DELETE"
      });

      if (response.ok) {
        alert("✅ رسید با موفقیت حذف شد");
        setRefreshFlag(prev => prev + 1);
      }
    } catch (err) {
      console.error("❌ خطا در حذف:", err);
      alert("❌ خطا در حذف رسید");
    }
  };

  // فرمت تاریخ شمسی
  const formatPersianDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return new DateObject(dateString).convert(persian, persian_fa).format("YYYY/MM/DD");
    } catch {
      return dateString.slice(0, 10);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* هدر */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">📦 رسیدهای انبار</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">مدیریت و ویرایش اطلاعات ثبت شده</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
        >
          <span>➕</span>
          ثبت رسید جدید
        </button>
      </div>

      {/* آمار */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
          <div className="text-sm text-blue-700 dark:text-blue-300">تعداد کل رسیدها</div>
          <div className="text-2xl font-bold mt-1">{transactions.length}</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
          <div className="text-sm text-green-700 dark:text-green-300">ورودی</div>
          <div className="text-2xl font-bold mt-1">
            {transactions.filter(t => t.transType === "ورود").length}
          </div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg">
          <div className="text-sm text-red-700 dark:text-red-300">خروجی</div>
          <div className="text-2xl font-bold mt-1">
            {transactions.filter(t => t.transType === "خروج").length}
          </div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg">
          <div className="text-sm text-purple-700 dark:text-purple-300">انبارها</div>
          <div className="text-2xl font-bold mt-1">{warehouses.length}</div>
        </div>
      </div>

      {/* جدول رسیدها */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* هدر جدول */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-800 dark:text-white">لیست رسیدها</h3>
            <button
              onClick={() => setRefreshFlag(prev => prev + 1)}
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
            >
              🔄 بروزرسانی
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">در حال بارگذاری...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-gray-500 dark:text-gray-400">هیچ رسیدی ثبت نشده است</p>
            <p className="text-sm text-gray-400 mt-1">برای شروع، رسید جدید ثبت کنید</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300">کد کالا</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300">نام کالا</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300">انبار</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300">تعداد</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300">تاریخ</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300">نوع</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300">مرجع</th>
                  <th className="px6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300">توضیحات</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-gray-200">
                      {transaction.itemCode}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800 dark:text-gray-200">
                      {findItemName(transaction.itemCode)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800 dark:text-gray-200">
                      {findWarehouseName(transaction.warehouseId)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800 dark:text-gray-200">
                      {transaction.quantity?.toLocaleString('fa-IR')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800 dark:text-gray-200">
                      {formatPersianDate(transaction.transDate)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${transaction.transType === "ورود"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                        }`}>
                        {transaction.transType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800 dark:text-gray-200">
                      {transaction.reference || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800 dark:text-gray-200 max-w-xs truncate">
                      {transaction.description || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(transaction)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
                        >
                          ویرایش
                        </button>
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* فوتر جدول */}
        <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            نمایش {transactions.length} رسید
          </div>
        </div>
      </div>

      {/* مودال ثبت/ویرایش */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-200 dark:border-gray-700 px-5 py-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <span>{editingId ? "✏️" : "📦"}</span>
                  {editingId ? "ویرایش رسید" : "ثبت رسید جدید"}
                </h3>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-lg"
                >
                  ×
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-5">
              <div className="space-y-4">
                {/* کالا */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    کالا *
                  </label>
                  <select
                    value={formData.itemCode}
                    onChange={(e) => handleChange("itemCode", e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                    required
                  >
                    <option value="">انتخاب کالا...</option>
                    {items.map(item => (
                      <option key={item.itemCode || item.id} value={item.itemCode}>
                        {item.itemCode} - {item.itemName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* انبار */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    انبار *
                  </label>
                  <select
                    value={formData.warehouseId}
                    onChange={(e) => handleChange("warehouseId", e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                    required
                  >
                    <option value="">انتخاب انبار...</option>
                    {warehouses.map(warehouse => (
                      <option key={warehouse.id || warehouse.warehouseId} value={warehouse.id || warehouse.warehouseId}>
                        {warehouse.warehouseName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* نوع تراکنش */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    نوع تراکنش *
                  </label>
                  <select
                    value={formData.transType}
                    onChange={(e) => handleChange("transType", e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                    required
                  >
                    <option value="ورود">ورود</option>
                    <option value="خروج">خروج</option>
                    <option value="تعدیل">تعدیل</option>
                  </select>
                </div>

                {/* تعداد */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    تعداد *
                  </label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => handleChange("quantity", e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                    placeholder="تعداد"
                    min="1"
                    required
                  />
                </div>

                {/* تاریخ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    تاریخ *
                  </label>
                  <DatePicker
                    value={formData.transDate}
                    onChange={(date) => handleChange("transDate", date?.format("YYYY-MM-DD") || "")}
                    format="YYYY/MM/DD"
                    calendar={persian}
                    locale={persian_fa}
                    calendarPosition="bottom-right"
                    inputClass="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                    required
                  />
                </div>

                {/* مرجع */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    شماره مرجع
                  </label>
                  <input
                    type="text"
                    value={formData.reference}
                    onChange={(e) => handleChange("reference", e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                    placeholder="شماره مرجع"
                  />
                </div>

                {/* توضیحات */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    توضیحات
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 resize-none"
                    placeholder="توضیحات"
                    rows="3"
                  />
                </div>
              </div>

              {/* دکمه‌ها */}
              <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  لغو
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingId ? "ذخیره تغییرات" : "ثبت رسید"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}