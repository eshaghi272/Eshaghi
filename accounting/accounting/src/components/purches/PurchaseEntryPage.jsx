import { useState, useEffect } from "react";
import { DateObject } from "react-multi-date-picker";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

export default function PurchaseEntryPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]);
  const [lines, setLines] = useState([]);

  const [purchase, setPurchase] = useState({
    factorNo: "",
    supplierNationalCode: "",
    supplierName: "",
    purchaseDate: "",
    description: ""
  });

  const [newLine, setNewLine] = useState({
    itemCode: "",
    itemName: "",
    itemSpec: "",
    quantity: 1,
    unitPrice: 0
  });

  // دریافت تأمین‌کننده‌ها
  useEffect(() => {
    fetch("http://localhost:5000/api/persons")
      .then(res => {
        if (!res.ok) throw new Error(`خطا: ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          const suppliers = data.filter(p => {
            return p.isSupplier === 1 ||
              p.isSupplier === true ||
              p.isSupplier === "1" ||
              p.isSeller === 1;
          });
          setSuppliers(suppliers);
        }
      })
      .catch(err => {
        console.error("خطا در دریافت تأمین‌کننده‌ها:", err);
        setSuppliers([]);
      });
  }, []);

  // دریافت کالاها
  useEffect(() => {
    fetch("http://localhost:5000/api/items")
      .then(res => {
        if (!res.ok) throw new Error(`خطا: ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setItems(data);
        }
      })
      .catch(err => {
        console.error("خطا در دریافت کالاها:", err);
        setItems([]);
      });
  }, []);

  const handleSupplierChange = (nationalCode) => {
    const selected = suppliers.find(p => p.nationalCode === nationalCode);
    if (selected) {
      setPurchase(prev => ({
        ...prev,
        supplierNationalCode: selected.nationalCode,
        supplierName: `${selected.firstName} ${selected.lastName}`
      }));
    }
  };

  const handleItemCodeChange = (id) => {
    const selected = items.find(i => i.id === Number(id));
    if (!selected) return;

    setNewLine({
      itemCode: selected.itemCode,
      itemName: selected.itemName,
      itemSpec: selected.itemSpec || "",
      quantity: 1,
      unitPrice: 0
    });
  };

  const handleNewLineFieldChange = (field, value) => {
    if (field === 'quantity') {
      value = Math.max(1, Number(value) || 1);
    } else if (field === 'unitPrice') {
      value = Math.max(0, Number(value) || 0);
    }

    setNewLine(prev => ({ ...prev, [field]: value }));
  };

  const addLine = () => {
    const { itemCode, itemName, quantity, unitPrice } = newLine;
    if (!itemCode || !itemName) {
      alert("لطفاً کالا را انتخاب کنید");
      return;
    }
    if (quantity <= 0) {
      alert("تعداد باید بزرگتر از صفر باشد");
      return;
    }
    if (unitPrice <= 0) {
      alert("قیمت واحد باید بزرگتر از صفر باشد");
      return;
    }

    setLines(prev => [...prev, { ...newLine }]);
    setNewLine({
      itemCode: "",
      itemName: "",
      itemSpec: "",
      quantity: 1,
      unitPrice: 0
    });
  };

  const removeLine = (index) => {
    const newLines = [...lines];
    newLines.splice(index, 1);
    setLines(newLines);
  };

  const calculateTotals = () => {
    const subtotal = lines.reduce((sum, l) => sum + (l.quantity * l.unitPrice), 0);
    return { subtotal, total: subtotal };
  };

  const handleSubmitPurchase = async () => {
    if (!purchase.supplierNationalCode) {
      alert("لطفاً تأمین‌کننده را انتخاب کنید");
      return;
    }
    if (lines.length === 0) {
      alert("حداقل یک کالا به سبد خرید اضافه کنید");
      return;
    }

    try {
      let successCount = 0;

      for (const line of lines) {
        const payload = {
          ...purchase,
          ...line,
          warehouseId: 1
        };

        const res = await fetch("http://localhost:5000/api/purchases/full", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          successCount++;
        }
      }

      if (successCount === lines.length) {
        alert(`✅ خرید ${successCount} کالا ثبت شد`);

        setPurchase({
          factorNo: "",
          supplierNationalCode: "",
          supplierName: "",
          purchaseDate: new DateObject({ calendar: persian }).format("YYYY-MM-DD"),
          description: ""
        });
        setLines([]);
        setNewLine({ itemCode: "", itemName: "", itemSpec: "", quantity: 1, unitPrice: 0 });
      }
    } catch (err) {
      alert("❌ خطا در ثبت خرید");
    }
  };

  const { total } = calculateTotals();

  const availableItems = items.filter(item =>
    !lines.some(line => line.itemCode == item.itemCode)
  );

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center border-b pb-3">
        <h2 className="text-xl font-bold text-green-700 dark:text-green-100">🛒 ثبت خرید جدید</h2>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {/* {persian, persian_fa} */}
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4">
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
            {purchase.supplierName && (
              <p className="mt-1 text-xs text-green-600">انتخاب شده: {purchase.supplierName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              تاریخ خرید *
            </label>
            <DatePicker
              value={purchase.purchaseDate}
              onChange={(date) => setPurchase({ ...purchase, purchaseDate: date?.format("YYYY/MM/DD") })}
              format="YYYY/MM/DD"
              calendar={persian}
              locale={persian_fa}
              calendarPosition="bottom-right"
              inputClass="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
              containerClassName="w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              شماره فاکتور
            </label>
            <input
              placeholder="شماره فاکتور خرید"
              type="text"
              value={purchase.factorNo}
              onChange={(e) => setPurchase(prev => ({ ...prev, factorNo: e.target.value }))}
              className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              توضیحات
            </label>
            <textarea
              placeholder="توضیحات خرید"
              value={purchase.description}
              onChange={(e) => setPurchase(prev => ({ ...prev, description: e.target.value }))}
              rows="2"
              className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 resize-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          افزودن کالا *
        </label>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2">
            <select
              value={newLine.itemCode ? availableItems.find(i => i.itemCode == newLine.itemCode)?.id || "" : ""}
              onChange={(e) => handleItemCodeChange(e.target.value)}
              className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm"
            >
              <option value="">انتخاب کالا...</option>
              {availableItems.map(item => (
                <option key={item.id} value={item.id}>
                  {item.itemCode} - {item.itemName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <input
              type="number"
              value={newLine.quantity}
              onChange={(e) => handleNewLineFieldChange('quantity', e.target.value)}
              className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm"
              placeholder="تعداد"
              min="1"
            />
          </div>

          <div>
            <input
              type="number"
              value={newLine.unitPrice}
              onChange={(e) => handleNewLineFieldChange('unitPrice', e.target.value)}
              className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm"
              placeholder="قیمت واحد"
              min="0"
            />
          </div>

          <div>
            <button
              onClick={addLine}
              disabled={!newLine.itemCode}
              className="w-full p-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-sm transition-colors"
            >
              ➕ افزودن
            </button>
          </div>
        </div>

        {newLine.itemName && (
          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/30 rounded text-sm">
            <div className="flex justify-between">
              <span className="text-gray-700 dark:text-gray-300">کالا:</span>
              <span className="font-medium">{newLine.itemName}</span>
            </div>
            {newLine.itemSpec && (
              <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                مشخصات: {newLine.itemSpec}
              </div>
            )}
          </div>
        )}
      </div>

      {lines.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border overflow-hidden">
          <div className="p-3 bg-blue-50 dark:bg-blue-900 border-b">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-blue-700 dark:text-blue-300">سبد خرید ({lines.length} کالا)</h3>
              <button
                onClick={() => setLines([])}
                className="text-xs text-red-600 hover:text-red-800"
              >
                حذف همه
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="p-3 text-right font-medium">کد کالا</th>
                  <th className="p-3 text-right font-medium">نام کالا</th>
                  <th className="p-3 text-right font-medium">تعداد</th>
                  <th className="p-3 text-right font-medium">قیمت واحد</th>
                  <th className="p-3 text-right font-medium">مبلغ</th>
                  <th className="p-3 text-right font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, index) => (
                  <tr key={index} className="border-t hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="p-3 font-mono">{line.itemCode}</td>
                    <td className="p-3">
                      <div>
                        <div className="font-medium">{line.itemName}</div>
                        {line.itemSpec && (
                          <div className="text-xs text-gray-500 mt-1">{line.itemSpec}</div>
                        )}
                      </div>
                    </td>
                    <td className="p-3">{line.quantity.toLocaleString('fa-IR')}</td>
                    <td className="p-3">{line.unitPrice.toLocaleString('fa-IR')}</td>
                    <td className="p-3 font-medium text-green-700">
                      {(line.quantity * line.unitPrice).toLocaleString('fa-IR')}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => removeLine(index)}
                        className="text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded hover:bg-red-50"
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t p-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <span className="text-gray-700">جمع کل:</span>
                  <span className="font-bold text-lg">{total.toLocaleString('fa-IR')} تومان</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={handleSubmitPurchase}
                  disabled={!purchase.supplierNationalCode}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  🛒 ثبت خرید
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-3">🛒</div>
          <p>سبد خرید خالی است</p>
          <p className="text-sm mt-1">کالاها را از بخش بالا اضافه کنید</p>
        </div>
      )}
    </div>
  );
}