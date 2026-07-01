import { useState, useEffect } from "react";

export default function SalesInvoicePage() {
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [lines, setLines] = useState([]);

  const [invoice, setInvoice] = useState({
    customerNationalCode: "",
    customerName: "",
    invoiceDate: new Date().toISOString().slice(0, 10),
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

  const inputClass = "w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500";
  const buttonClass = "px-4 py-2 rounded text-white font-semibold transition";
  const buttonPrimary = `${buttonClass} bg-blue-700 hover:bg-blue-800`;
  const buttonSuccess = `${buttonClass} bg-green-600 hover:bg-green-700`;

  const totalAmount = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
  const finalAmount = totalAmount - Number(invoice.discount || 0);

  useEffect(() => {
    fetch("http://localhost:5000/api/tblpersons")
      .then(res => res.json())
      .then(setCustomers)
      .catch(err => console.error("❌ خطا در دریافت مشتریان:", err));

    fetch("http://localhost:5000/api/tblItems")
      .then(res => res.json())
      .then(setItems)
      .catch(err => console.error("❌ خطا در دریافت کالاها:", err));
  }, []);

  const handleCustomerChange = (nationalCode) => {
    const selected = customers.find(c => c.nationalCode === nationalCode);
    if (selected) {
      setInvoice(prev => ({
        ...prev,
        customerNationalCode: selected.nationalCode,
        customerName: `${selected.firstName} ${selected.lastName}`
      }));
    }
  };

  const handleItemCodeChange = async (code) => {
    const selected = items.find(i => i.itemCode === code);
    if (!selected) return;

    try {
      const res = await fetch(`http://localhost:5000/api/price/${code}`);
      const { unitPrice } = await res.json();

      setNewLine({
        itemCode: selected.itemCode,
        itemName: selected.itemName,
        unit: selected.unit || "",
        quantity: 1,
        unitPrice: unitPrice || 0
      });
    } catch (err) {
      console.error("❌ خطا در دریافت قیمت:", err);
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
    if (!itemCode || !itemName || !unit || !quantity || !unitPrice) {
      alert("اطلاعات کالا ناقص است");
      return;
    }
    setLines([...lines, newLine]);
    setNewLine({ itemCode: "", itemName: "", unit: "", quantity: 1, unitPrice: 0 });
  };

  const removeLine = (index) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleSubmitInvoice = async () => {
    if (!invoice.customerNationalCode || lines.length === 0) {
      alert("اطلاعات مشتری یا اقلام فاکتور ناقص است");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/tblSalesInvoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...invoice, totalAmount: finalAmount })
      });

      const { invoiceId } = await res.json();

      for (const line of lines) {
        const { itemCode, itemName, unit, quantity, unitPrice } = line;

        // ثبت در tblSalesLines
        await fetch("http://localhost:5000/api/tblSalesLines", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invoiceId, itemCode, itemName, unit, quantity, unitPrice })
        });

        // ثبت در tblStockTransaction
        await fetch("http://localhost:5000/api/tblStockTransaction", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transType: "خروج",
            transDate: invoice.invoiceDate,
            itemCode,
            warehouseId: 1,
            quantity,
            reference: `فاکتور فروش ${invoiceId}`,
            description: `خروج کالا بابت فروش ${itemName}`
          })
        });

        // ثبت در tblSale
        await fetch("http://localhost:5000/api/tblSale", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            itemCode,
            itemName,
            itemSpec: "", // اگر داری از tblItems واکشی کن
            customerName: invoice.customerName,
            customerNationalCode: invoice.customerNationalCode,
            quantity,
            unitPrice,
            saleDate: invoice.invoiceDate,
            description: `فروش ${itemName} به ${invoice.customerName}`
          })
        });
      }

      alert("✅ فاکتور با موفقیت ثبت شد");
      setInvoice({
        customerNationalCode: "",
        customerName: "",
        invoiceDate: new Date().toISOString().slice(0, 10),
        description: "",
        discount: 0
      });
      setLines([]);
    } catch (err) {
      console.error("❌ خطا در ثبت فاکتور:", err);
      alert("❌ خطا در ثبت فاکتور");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100">
      <h2 className="text-xl font-bold text-blue-700 dark:text-blue-100">🧾 صدور فاکتور فروش</h2>

      {/* اطلاعات مشتری */}
      <div className="grid grid-cols-2 gap-4">
        <select value={invoice.customerNationalCode} onChange={(e) => handleCustomerChange(e.target.value)} className={inputClass}>
          <option value="">انتخاب مشتری</option>
          {customers.map(c => (
            <option key={c.nationalCode} value={c.nationalCode}>
              {c.firstName} {c.lastName} - {c.nationalCode}
            </option>
          ))}
        </select>
        <div className="flex items-center px-2 text-sm text-gray-600 dark:text-gray-300">
          {invoice.customerName && `نام مشتری: ${invoice.customerName}`}
        </div>
        <input type="date" value={invoice.invoiceDate} onChange={(e) => setInvoice({ ...invoice, invoiceDate: e.target.value })} className={inputClass} />
        <input type="number" placeholder="تخفیف (تومان)" value={invoice.discount} onChange={(e) => setInvoice({ ...invoice, discount: e.target.value })} className={inputClass} />
        <textarea placeholder="توضیحات فاکتور" value={invoice.description} onChange={(e) => setInvoice({ ...invoice, description: e.target.value })} className={`${inputClass} col-span-2`} />
      </div>

      {/* افزودن کالا */}
      <div className="grid grid-cols-6 gap-4 items-end">
        <select value={newLine.itemCode} onChange={(e) => handleItemCodeChange(e.target.value)} className={`${inputClass} col-span-2`}>
          <option value="">انتخاب کالا</option>
          {items.map(item => (
            <option key={item.itemCode} value={item.itemCode}>
              {item.itemCode} - {item.itemName}
            </option>
          ))}
        </select>
        <input type="text" value={newLine.itemName} onChange={(e) => setNewLine({ ...newLine, itemName: e.target.value })} className={inputClass} />
        <input type="number" value={newLine.quantity} onChange={(e) => setNewLine({ ...newLine, quantity: Number(e.target.value) })} className={inputClass} />
        <input type="number" value={newLine.unitPrice} onChange={(e) => setNewLine({ ...newLine, unitPrice: Number(e.target.value) })} className={inputClass} />
        <button onClick={addLine} className={buttonSuccess}>➕ افزودن کالا</button>
      </div>

      {/* جدول کالاها */}
      <table className="min-w-full text-sm text-right bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded mt-4">
        <thead className="bg-blue-50 dark:bg-blue-800 text-blue-700 dark:text-blue-100">
          <tr>
            <th className="px-4 py-2 border-b">کد کالا</th>
            <th className="px-4 py-2 border-b">نام کالا</th>
            <th className="px-4 py-2 border-b">واحد</th>
            <th className="px-4 py-2 border-b">تعداد</th>
            <th className="px-4 py-2 border-b">قیمت واحد</th>
            <th className="px-4 py-2 border-b">قیمت کل</th>
            <th className="px-4 py-2 border-b">❌</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l, i) => (
            <tr key={i}>
              <td className="px-4 py-2 border-b">{l.itemCode}</td>
              <td className="px-4 py-2 border-b">{l.itemName}</td>
              <td className="px-4 py-2 border-b">{l.unit}</td>
              <td className="px-4 py-2 border-b">{l.quantity}</td>
              <td className="px-4 py-2 border-b">{l.unitPrice.toLocaleString("fa-IR")}</td>
              <td className="px-4 py-2 border-b">{(l.quantity * l.unitPrice).toLocaleString("fa-IR")}</td>
              <td className="px-4 py-2 border-b">
                <button onClick={() => removeLine(i)} className="text-red-600 hover:text-red-800">حذف</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* جمع فاکتور */}
      <div className="text-right mt-4 space-y-2">
        <p>جمع کل: <strong>{totalAmount.toLocaleString("fa-IR")} تومان</strong></p>
        <p>تخفیف: <strong>{Number(invoice.discount).toLocaleString("fa-IR")} تومان</strong></p>
        <p>مبلغ نهایی: <strong>{finalAmount.toLocaleString("fa-IR")} تومان</strong></p>
      </div>

      {/* دکمه ثبت */}
      <div className="text-left mt-6">
        <button onClick={handleSubmitInvoice} className={buttonPrimary}>
          🧾 ثبت فاکتور فروش
        </button>
      </div>
    </div>
  );
}
