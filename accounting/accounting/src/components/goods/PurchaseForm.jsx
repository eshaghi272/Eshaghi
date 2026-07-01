import { useState, useEffect } from "react";
import { DateObject } from "react-multi-date-picker";
import persian from "react-multi-date-picker/plugins/persian_fa";
import DatePicker from "react-multi-date-picker";

export default function PurchaseForm() {
  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [lines, setLines] = useState([]);

  const [purchase, setPurchase] = useState({
    supplierNationalCode: "",
    supplierName: "",
    purchaseDate: new DateObject().format("YYYY-MM-DD"),
    description: "",
    discount: 0
  });

  const [newLine, setNewLine] = useState({
    itemCode: "",
    itemName: "",
    unit: "",
    quantity: 1,
    unitPrice: 0
  });

  // دریافت لیست تأمین‌کنندگان و کالاها
  useEffect(() => {
    fetch("http://localhost:5000/api/persons")
      .then(res => res.json())
      .then(data => {
        const suppliers = data.filter(p => p.isSupplier === 1);
        setSuppliers(suppliers);
      })
      .catch(err => console.error("❌ خطا در دریافت تأمین‌کنندگان:", err));

    fetch("http://localhost:5000/api/items")
      .then(res => res.json())
      .then(setItems)
      .catch(err => console.error("❌ خطا در دریافت کالاها:", err));

    // دریافت لیست خریدهای قبلی
    fetch("http://localhost:5000/api/purchases")
      .then(res => res.json())
      .then(data => Array.isArray(data) ? setPurchases(data) : setPurchases([]))
      .catch(err => console.error("❌ خطا در دریافت لیست خریدها:", err));
  }, []);

  const handleSupplierChange = (nationalCode) => {
    const selected = suppliers.find(s => s.nationalCode === nationalCode);
    if (selected) {
      setPurchase(prev => ({
        ...prev,
        supplierNationalCode: selected.nationalCode,
        supplierName: `${selected.firstName} ${selected.lastName}`
      }));
    }
  };

  const handleItemCodeChange = (code) => {
    const selected = items.find(i => i.itemCode == code); // استفاده از == برای تطبیق رشته و عدد
    if (selected) {
      setNewLine({
        itemCode: selected.itemCode,
        itemName: selected.itemName,
        unit: selected.unit || "",
        quantity: 1,
        unitPrice: 0
      });
    }
  };

  const handleItemSelect = (item) => {
    const selected = items.find(i => i.itemCode == item.itemCode);
    if (selected) {
      setNewLine({
        itemCode: selected.itemCode,
        itemName: selected.itemName,
        unit: selected.unit || "",
        quantity: 1,
        unitPrice: 0
      });
    }
  };

  const addLine = () => {
    const { itemCode, itemName, unit, quantity, unitPrice } = newLine;
    if (!itemCode || !itemName || !unit || !quantity || unitPrice <= 0) {
      alert("لطفاً تمام اطلاعات کالا را تکمیل کنید");
      return;
    }
    setLines([...lines, newLine]);
    setNewLine({ itemCode: "", itemName: "", unit: "", quantity: 1, unitPrice: 0 });
  };

  const removeLine = (index) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = lines.reduce((sum, l) => sum + (l.quantity * l.unitPrice), 0);
    const discount = Number(purchase.discount) || 0;
    const total = subtotal - discount;
    return { subtotal, discount, total };
  };

  const handleSubmitPurchase = async () => {
    if (!purchase.supplierNationalCode || lines.length === 0) {
      alert("لطفاً تأمین‌کننده و حداقل یک کالا انتخاب کنید");
      return;
    }

    try {
      const { total } = calculateTotals();

      // ثبت هر خط خرید
      for (const line of lines) {
        const { itemCode, itemName, unit, quantity, unitPrice } = line;

        // ثبت خرید
        await fetch("http://localhost:5000/api/purchases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            itemCode,
            itemName,
            itemSpec: "",
            supplierName: purchase.supplierName,
            supplierNationalCode: purchase.supplierNationalCode,
            quantity,
            unitPrice,
            purchaseDate: purchase.purchaseDate,
            description: purchase.description || `خرید ${itemName}`
          })
        });

        // ثبت رسید انبار
        await fetch("http://localhost:5000/api/stocktransaction", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transType: "ورود",
            transDate: purchase.purchaseDate,
            itemCode,
            warehouseId: 1,
            quantity,
            reference: `خرید از ${purchase.supplierName}`,
            description: `ورود کالا بابت خرید ${itemName}`
          })
        });
      }

      alert(`✅ خرید با مبلغ ${total.toLocaleString('fa-IR')} تومان ثبت شد`);

      // ریست فرم
      setPurchase({
        supplierNationalCode: "",
        supplierName: "",
        purchaseDate: new DateObject().format("YYYY-MM-DD"),
        description: "",
        discount: 0
      });
      setLines([]);

      // بروزرسانی لیست خریدها
      const res = await fetch("http://localhost:5000/api/purchases");
      const data = await res.json();
      setPurchases(Array.isArray(data) ? data : []);

    } catch (err) {
      console.error("❌ خطا در ثبت خرید:", err);
      alert("❌ خطا در ثبت خرید");
    }
  };

  const { subtotal, discount, total } = calculateTotals();

  // فیلتر کالاهایی که در لیست نیستند
  const availableItems = items.filter(item =>
    !lines.some(line => line.itemCode == item.itemCode)
  );

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* هدر */}
      <div className="flex justify-between items-center border-b pb-3">
        <h2 className="text-xl font-bold text-blue-700 dark:text-blue-100">🛒 ثبت خرید جدید</h2>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {new DateObject().format("YYYY/MM/DD")}
        </div>
      </div>

      {/* اطلاعات اصلی */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4">
        {/* تأمین‌کننده */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              تأمین‌کننده *
            </label>
            <select
              value={purchase.supplierNationalCode}
              onChange={(e) => handleSupplierChange(e.target.value)}
              className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
              required
            >
              <option value="">انتخاب تأمین‌کننده...</option>
              {suppliers.map(s => (
                <option key={s.nationalCode} value={s.nationalCode}>
                  {s.firstName} {s.lastName} ({s.nationalCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              تاریخ خرید *
            </label>
            <DatePicker
              value={purchase.purchaseDate}
              onChange={(date) => setPurchase({ ...purchase, purchaseDate: date?.format("YYYY-MM-DD") || "" })}
              format="YYYY/MM/DD"
              calendar="persian"
              locale="fa"
              plugins={[persian()]}
              inputClass="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
              required
            />
          </div>
        </div>

        {/* افزودن کالا */}
        <div className="border-t pt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            افزودن کالا *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="md:col-span-2">
              <select
                value={newLine.itemCode}
                onChange={(e) => handleItemCodeChange(e.target.value)}
                className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm"
              >
                <option value="">انتخاب کالا...</option>
                {availableItems.map(item => (
                  <option key={item.itemCode} value={item.itemCode}>
                    {item.itemCode} - {item.itemName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <input
                type="number"
                value={newLine.quantity}
                onChange={(e) => setNewLine({ ...newLine, quantity: Math.max(1, Number(e.target.value)) })}
                className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm"
                placeholder="تعداد"
                min="1"
              />
            </div>

            <div>
              <input
                type="number"
                value={newLine.unitPrice}
                onChange={(e) => setNewLine({ ...newLine, unitPrice: Math.max(0, Number(e.target.value)) })}
                className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm"
                placeholder="قیمت واحد"
                min="0"
              />
            </div>

            <div>
              <button
                onClick={addLine}
                className="w-full p-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
              >
                ➕ افزودن
              </button>
            </div>
          </div>

          {newLine.itemName && (
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              <span>کالا: {newLine.itemName}</span>
              {newLine.unit && <span className="mr-4"> | واحد: {newLine.unit}</span>}
            </div>
          )}
        </div>
      </div>

      {/* لیست کالاها */}
      {lines.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-blue-50 dark:bg-blue-900">
                <tr>
                  <th className="p-3 text-right">کد کالا</th>
                  <th className="p-3 text-right">نام کالا</th>
                  <th className="p-3 text-right">واحد</th>
                  <th className="p-3 text-right">تعداد</th>
                  <th className="p-3 text-right">قیمت واحد</th>
                  <th className="p-3 text-right">مبلغ</th>
                  <th className="p-3 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, index) => (
                  <tr key={index} className="border-t hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="p-3">{line.itemCode}</td>
                    <td className="p-3">{line.itemName}</td>
                    <td className="p-3">{line.unit}</td>
                    <td className="p-3">{line.quantity.toLocaleString('fa-IR')}</td>
                    <td className="p-3">{line.unitPrice.toLocaleString('fa-IR')}</td>
                    <td className="p-3 font-medium">
                      {(line.quantity * line.unitPrice).toLocaleString('fa-IR')}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => removeLine(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* جمع‌بندی */}
          <div className="border-t p-4">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <span className="text-gray-600 dark:text-gray-400">جمع کل:</span>
                  <span className="font-bold text-lg">{subtotal.toLocaleString('fa-IR')} تومان</span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 dark:text-gray-400">تخفیف:</span>
                    <input
                      type="number"
                      value={purchase.discount}
                      onChange={(e) => setPurchase({ ...purchase, discount: Math.max(0, Number(e.target.value)) })}
                      className="w-32 p-1 border rounded text-sm"
                      placeholder="مبلغ تخفیف"
                      min="0"
                    />
                  </div>
                  {discount > 0 && (
                    <span className="text-red-600">({discount.toLocaleString('fa-IR')} تومان)</span>
                  )}
                </div>

                <div className="flex items-center gap-4 mt-2 pt-2 border-t">
                  <span className="text-gray-600 dark:text-gray-400">مبلغ قابل پرداخت:</span>
                  <span className="font-bold text-xl text-green-600">
                    {total.toLocaleString('fa-IR')} تومان
                  </span>
                </div>
              </div>

              <div>
                <button
                  onClick={handleSubmitPurchase}
                  disabled={!purchase.supplierNationalCode || lines.length === 0}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  ثبت خرید
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* لیست خریدهای قبلی (در صورت نیاز) */}
      {purchases.length > 0 && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">📋 خریدهای اخیر</h3>
            <span className="text-sm text-gray-500">{purchases.length} مورد</span>
          </div>
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="p-2 text-right">تاریخ</th>
                  <th className="p-2 text-right">کالا</th>
                  <th className="p-2 text-right">تأمین‌کننده</th>
                  <th className="p-2 text-right">تعداد</th>
                  <th className="p-2 text-right">مبلغ</th>
                </tr>
              </thead>
              <tbody>
                {purchases.slice(0, 5).map((p, i) => (
                  <tr key={i} className="border-t hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="p-2">
                      {p.PurchaseDate ? new DateObject(p.PurchaseDate).format("YYYY/MM/DD") : "-"}
                    </td>
                    <td className="p-2">{p.ItemName || "-"}</td>
                    <td className="p-2">{p.SupplierName || "-"}</td>
                    <td className="p-2">{p.Quantity?.toLocaleString('fa-IR') || "-"}</td>
                    <td className="p-2">
                      {p.unitPrice && p.Quantity ?
                        (p.unitPrice * p.Quantity).toLocaleString('fa-IR') : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}