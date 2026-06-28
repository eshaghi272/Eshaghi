import { useEffect, useState } from "react";
import GenericForm from "../ui/GenericForm";

export default function PurchaseFormWithList() {
  const [purchases, setPurchases] = useState([]);
  const [refreshFlag, setRefreshFlag] = useState(0);

  // دریافت لیست خریدها
  useEffect(() => {
    fetch("http://localhost:5000/api/purchases")
      .then((res) => res.json())
      .then((data) => Array.isArray(data) ? setPurchases(data) : setPurchases([]))
      .catch((err) => {
        console.error("❌ خطا در دریافت لیست خریدها:", err);
        setPurchases([]);
      });
  }, [refreshFlag]);

  // ثبت خرید کامل (خرید + رسید انبار + افزایش موجودی)
  const handleSubmit = async (formData) => {
    try {
      const payload = {
        ...formData,
        warehouseId: 1 // انبار پیش‌فرض
      };

      const res = await fetch("http://localhost:5000/api/purchases/full", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert("✅ خرید و رسید انبار با موفقیت ثبت شد");
        setRefreshFlag((f) => f + 1);
      } else {
        const error = await res.text();
        console.error("❌ خطا در ثبت خرید:", error);
        alert("❌ خطا در ثبت خرید");
      }
    } catch (err) {
      console.error("❌ خطای شبکه:", err);
      alert("❌ خطای شبکه یا سرور");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <h2 className="text-xl font-bold text-blue-700 dark:text-blue-100">🛒 ثبت خرید کالا</h2>

      {/* فرم ثبت خرید */}
      <GenericForm
        table="tblPurchase"
        apiPath="tblPurchase"
        initialData={null}
        fields={[
          {
            name: "ItemCode",
            label: "کالا",
            type: "search-select",
            source: "tblItems",
            optionLabel: (row) => `${row.itemCode} - ${row.itemName}`,
            optionValue: "itemCode",
            required: true,
            onSelect: (row, setForm) => {
              setForm((prev) => ({
                ...prev,
                ItemName: row.itemName,
                ItemSpec: row.itemSpec || ""
              }));
            }
          },
          {
            name: "ItemName",
            label: "نام کالا",
            type: "text",
            disabled: true
          },
          {
            name: "ItemSpec",
            label: "مشخصات کالا",
            type: "text",
            disabled: true
          },
          {
            name: "SupplierNationalCode",
            label: "فروشنده",
            type: "search-select",
            source: "tblpersons",
            optionLabel: (row) => `${row.nationalCode} - ${row.firstName} ${row.lastName}`,
            optionValue: "nationalCode",
            required: true,
            onSelect: (row, setForm) => {
              setForm((prev) => ({
                ...prev,
                SupplierName: `${row.firstName} ${row.lastName}`
              }));
            }
          },
          {
            name: "SupplierName",
            label: "نام فروشنده",
            type: "text",
            disabled: true
          },
          {
            name: "Quantity",
            label: "تعداد",
            type: "number",
            required: true
          },
          {
            name: "unitPrice", // ← با حرف کوچک
            label: "قیمت واحد",
            type: "number",
            required: true
          },
          {
            name: "PurchaseDate",
            label: "تاریخ خرید",
            type: "date",
            required: true
          },
          {
            name: "Description",
            label: "شرح مختصر",
            type: "textarea"
          }
        ]}
        onSubmit={handleSubmit}
      />

      {/* لیست خریدها */}
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mt-8">📋 لیست خریدهای ثبت‌شده</h3>

      <div className="overflow-x-auto border border-gray-300 dark:border-gray-700 rounded">
        <table className="min-w-full text-sm text-right bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">
          <thead className="bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-100">
            <tr>
              <th className="px-4 py-2 border-b">کد کالا</th>
              <th className="px-4 py-2 border-b">نام کالا</th>
              <th className="px-4 py-2 border-b">مشخصات</th>
              <th className="px-4 py-2 border-b">فروشنده</th>
              <th className="px-4 py-2 border-b">کد ملی</th>
              <th className="px-4 py-2 border-b">تعداد</th>
              <th className="px-4 py-2 border-b">قیمت واحد</th>
              <th className="px-4 py-2 border-b">تاریخ خرید</th>
              <th className="px-4 py-2 border-b">شرح</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((p) => (
              <tr key={p.PurchaseId} className="hover:bg-blue-50 dark:hover:bg-blue-800 transition">
                <td className="px-4 py-2 border-b">{p.ItemCode}</td>
                <td className="px-4 py-2 border-b">{p.ItemName}</td>
                <td className="px-4 py-2 border-b">{p.ItemSpec || "-"}</td>
                <td className="px-4 py-2 border-b">{p.SupplierName}</td>
                <td className="px-4 py-2 border-b">{p.SupplierNationalCode || "-"}</td>
                <td className="px-4 py-2 border-b">{p.Quantity}</td>
                <td className="px-4 py-2 border-b">{p.unitPrice}</td>
                <td className="px-4 py-2 border-b">{p.PurchaseDate?.slice(0, 10)}</td>
                <td className="px-4 py-2 border-b">{p.Description || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
