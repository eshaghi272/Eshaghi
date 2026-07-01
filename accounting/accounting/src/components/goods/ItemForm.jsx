import { useState, useEffect } from "react";

export default function ItemForm({ initialData = null, onSubmit }) {
  const [item, setItem] = useState({
    itemCode: "",
    itemName: "",
    itemGroupId: "",
    unit: "",
    description: "",
    isActive: true
  });

  const [groupOptions, setGroupOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  // مقداردهی اولیه در حالت ویرایش
  useEffect(() => {
    if (initialData) {
      setItem({
        itemCode: initialData.itemCode ?? "",
        itemName: initialData.itemName ?? "",
        itemGroupId: initialData.itemGroupId ?? "",
        unit: initialData.unit ?? "",
        description: initialData.description ?? "",
        isActive: initialData.isActive ?? true
      });
    }
  }, [initialData]);

  // دریافت گروه‌ها از API
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/itemgroups");
        const data = await res.json();
        setGroupOptions(data);
      } catch (err) {
        console.error("❌ خطا در دریافت گروه‌ها:", err);
      }
    };
    fetchGroups();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setItem((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!item.itemCode || !item.itemName || !item.itemGroupId) {
      alert("کد کالا، نام و گروه کالا الزامی است");
      return;
    }

    setLoading(true);
    try {
      const method = initialData?.itemId ? "PUT" : "POST";
      const url = initialData?.itemId
        ? `http://localhost:5000/api/items/${initialData.itemId}`
        : "http://localhost:5000/api/items";

      const payload = {
        table: "tblItems",
        data: {
          ...item,
          itemCode: Number(item.itemCode),
          isActive: item.isActive ? 1 : 0
        }
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "خطا در ثبت کالا");

      onSubmit?.(result);

      if (!initialData) {
        setItem({
          itemCode: "",
          itemName: "",
          itemGroupId: "",
          unit: "",
          description: "",
          isActive: true
        });
      }
    } catch (err) {
      console.error("❌ خطا در ثبت کالا:", err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-3xl mx-auto p-6 bg-white dark:bg-gray-900 shadow rounded space-y-6"
    >
      <h2 className="text-xl font-bold text-blue-700 dark:text-blue-100">
        {initialData ? "ویرایش کالا" : "ثبت کالا جدید"}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* کد کالا */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            کد کالا
          </label>
          <input
            name="itemCode"
            value={item.itemCode}
            onChange={handleChange}
            placeholder="کد کالا"
            className="w-full border p-2 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
            required
          />
        </div>

        {/* نام کالا */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            نام کالا
          </label>
          <input
            name="itemName"
            value={item.itemName}
            onChange={handleChange}
            placeholder="نام کالا"
            className="w-full border p-2 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
            required
          />
        </div>

        {/* گروه کالا */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            گروه کالا
          </label>
          <select
            name="itemGroupId"
            value={item.itemGroupId}
            onChange={handleChange}
            className="w-full border p-2 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
            required
          >
            <option value="">انتخاب گروه</option>
            {groupOptions.map((g) => (
              <option key={g.groupId} value={g.groupId}>
                {g.groupName}
              </option>
            ))}
          </select>
        </div>

        {/* واحد */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            واحد
          </label>
          <input
            name="unit"
            value={item.unit}
            onChange={handleChange}
            placeholder="واحد (مثلاً عدد، کیلوگرم)"
            className="w-full border p-2 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
          />
        </div>

        {/* توضیحات */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            توضیحات
          </label>
          <textarea
            name="description"
            value={item.description}
            onChange={handleChange}
            placeholder="توضیحات"
            className="w-full border p-2 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
          />
        </div>

        {/* فعال باشد */}
        <div className="md:col-span-2 flex items-center space-x-2">
          <input
            type="checkbox"
            name="isActive"
            checked={item.isActive}
            onChange={handleChange}
            className="h-4 w-4"
          />
          <label className="text-sm text-gray-700 dark:text-gray-300">
            فعال باشد
          </label>
        </div>
      </div>

      {/* دکمه ثبت */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
        >
          {loading ? "در حال ارسال..." : initialData ? "ذخیره تغییرات" : "ثبت کالا"}
        </button>
      </div>
    </form>
  );
}
