import { useState, useEffect } from "react";
import Swal from 'sweetalert2';
import DateObject from 'react-date-object';
import DatePicker from "react-multi-date-picker";

import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import CustomerSelector from "./CustomerSelector";
import ItemEditor from "./ItemSale";
import InvoiceLinesTable from "./InvoiceLinesTable";
import InvoiceSummary from "./InvoiceSummary";
import SubmitButton from "./SubmitButton";
// import DateDisplay from "../DateDisplay";
import JournalPrint from "../ui/JournalPrint";
import FdatePicker from "../ui/FdatePicker";
import DocumentNumberInput from "../ui/DocumentNumberInput";

import { persian_en } from 'react-date-object/locales/persian_en';

export default function SalesInvoicePage() {
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [lines, setLines] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  // const [invoiceDate, setFdatePicker] = useState(null);
  // const [factorNo, setFactorNumber] = useState("");
  const today = new DateObject({ calendar: persian });

  


  const [invoice, setInvoice] = useState({
    customerNationalCode: "",
    customerName: "",
    customerId: "",
    customerType: "real",
    customerEconomicCode: "",
    invoiceDate: "",
    factorNo:0,   
    description: "",
    discount: 0,
    vatRate: 9,
    paymentType: "cash",
    warehouseId: 1
  });

  const [newLine, setNewLine] = useState({
    itemCode: "",
    itemName: "",
    unit: "",
    quantity: 1,
    unitPrice: 0,
    itemSpec: ""
  });

  // بارگذاری اولیه داده‌ها
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        const [customersRes, itemsRes, warehousesRes] = await Promise.all([
          fetch("http://localhost:5000/api/persons"),
          fetch("http://localhost:5000/api/items"),
          fetch("http://localhost:5000/api/warehouses")
        ]);

        const [customersData, itemsData, warehousesData] = await Promise.all([
          customersRes.json(),
          itemsRes.json(),
          warehousesRes.json()
        ]);

        setCustomers(customersData || []);
        setItems(itemsData || []);
        setWarehouses(warehousesData || []);

      } catch (err) {
        console.error("❌ خطا در دریافت داده‌ها:", err);
        Swal.fire({
          icon: 'error',
          title: 'خطا در اتصال',
          text: 'خطا در دریافت اطلاعات از سرور',
          confirmButtonText: 'تلاش مجدد',
          allowOutsideClick: false
        }).then(() => {
          fetchData();
          
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    
  }, []);

  const handleDateChange = (value) => {
    const invoiceDate = String(value || "");
    setInvoice(prev => ({ ...prev, invoiceDate: invoiceDate }));
    
  };


  const handleFactorNumberChange = (value) => {
    const factorNo = String(value  || "");
    setInvoice(prev => ({ ...prev, factorNo: factorNo }));
    
  };

  
  // const handleTriggerFactorNumber = (suggestedNumber) => {
    
  //   const stringValue = String(suggestedNumber || "");
  //   setInvoice(stringValue);
  //   };



  // تغییر مشتری
  const handleCustomerChange = (nationalCode) => {
    const selected = customers.find(c => c.nationalCode === nationalCode);
    if (selected) {
      setInvoice(prev => ({
        ...prev,
        customerNationalCode: selected.nationalCode,
        customerName: `${selected.firstName} ${selected.lastName}`.trim(),
        customerId: selected.personId || "",
        customerEconomicCode: selected.economicCode || ""
      }));
    }
  };

  // تغییر کد کالا
  const handleItemCodeChange = async (itemCode) => {
    if (!itemCode) return;

    const selected = items.find(i => String(i.itemCode) === String(itemCode));
    if (!selected) {
      Swal.fire({
        icon: 'warning',
        title: 'کالا یافت نشد',
        text: 'کالای انتخاب شده در سیستم موجود نیست',
        confirmButtonText: 'باشه'
      });
      return;
    }

    try {
      let unitPrice = 0;
      try {
        const res = await fetch(`http://localhost:5000/api/price/${selected.itemCode}`);
        if (res.ok) {
          const priceData = await res.json();
          unitPrice = priceData.unitPrice || 0;
        }
      } catch (priceErr) {
        console.log("⚠️ قیمت از API دریافت نشد، از قیمت کالا استفاده می‌شود");
        unitPrice = selected.unitPrice || 0;
      }

      const salePrice = unitPrice > 0 ? Math.round(unitPrice * 1.35) : 0;

      setNewLine({
        itemCode: selected.itemCode,
        itemName: selected.itemName,
        unit: selected.unit || "عدد",
        quantity: 1,
        unitPrice: salePrice,
        itemSpec: selected.itemSpec || ""
      });
    } catch (err) {
      console.error("❌ خطا در تنظیم کالا:", err);
      setNewLine({
        itemCode: selected.itemCode,
        itemName: selected.itemName,
        unit: selected.unit || "عدد",
        quantity: 1,
        unitPrice: 0,
        itemSpec: selected.itemSpec || ""
      });
    }
  };

  // تغییر فیلدهای کالای جدید
  const handleNewLineFieldChange = (field, value) => {
    setNewLine(prev => ({
      ...prev,
      [field]: field === 'quantity' || field === 'unitPrice' ? Number(value) || 0 : value
    }));
  };

  // افزودن ردیف جدید
  const addLine = async () => {
    const { itemCode, itemName, unit, quantity, unitPrice } = newLine;

    if (!itemCode || !itemName) {
      Swal.fire({
        icon: 'warning',
        title: 'انتخاب کالا',
        text: 'لطفا کالا را از لیست انتخاب کنید',
        confirmButtonText: 'باشه'
      });
      return;
    }

    if (quantity <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'مقدار نامعتبر',
        text: 'تعداد باید بیشتر از صفر باشد',
        confirmButtonText: 'باشه'
      });
      return;
    }

    if (unitPrice <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'قیمت نامعتبر',
        text: 'قیمت واحد باید بیشتر از صفر باشد',
        confirmButtonText: 'باشه'
      });
      return;
    }

    const exists = lines.some(line => line.itemCode === itemCode);
    if (exists) {
      const result = await Swal.fire({
        title: 'تأیید افزودن',
        text: 'این کالا قبلاً اضافه شده است. آیا می‌خواهید مجدداً اضافه کنید؟',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'بله، اضافه کن',
        cancelButtonText: 'لغو',
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        reverseButtons: true
      });

      if (!result.isConfirmed) return;
    }

    setLines(prev => [...prev, { ...newLine }]);
    setNewLine({
      itemCode: "",
      itemName: "",
      unit: "",
      quantity: 1,
      unitPrice: 0,
      itemSpec: ""
    });

    Swal.fire({
      icon: 'success',
      title: 'کالا اضافه شد',
      text: `${itemName} به فاکتور اضافه شد`,
      timer: 1500,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
  };

  // حذف ردیف
  const removeLine = async (index) => {
    const lineToRemove = lines[index];
    const result = await Swal.fire({
      title: 'حذف کالا',
      html: `<div class="text-right">
              <p>آیا از حذف این کالا مطمئن هستید؟</p>
              <p class="mt-2"><strong>${lineToRemove.itemName}</strong></p>
              <p class="text-gray-600">تعداد: ${lineToRemove.quantity} × قیمت: ${lineToRemove.unitPrice.toLocaleString('fa-IR')} ریال</p>
            </div>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'بله، حذف کن',
      cancelButtonText: 'لغو',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      setLines(prev => prev.filter((_, i) => i !== index));
      Swal.fire({
        icon: 'success',
        title: 'حذف شد',
        text: 'کالا از فاکتور حذف شد',
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    }
  };

  // محاسبات مالی
  const totalAmount = lines.reduce((sum, l) => sum + (l.quantity * l.unitPrice), 0);
  const discountAmount = Number(invoice.discount || 0);
  const taxableAmount = Math.max(0, totalAmount - discountAmount);
  const vatAmount = Math.round(taxableAmount * (Number(invoice.vatRate || 0) / 100));
  const finalAmount = taxableAmount + vatAmount;

  // ثبت فاکتور
  const handleSubmitInvoice = async () => {
    if (!invoice.customerNationalCode || !invoice.customerName) {
      await Swal.fire({
        icon: 'warning',
        title: 'مشتری انتخاب نشده',
        text: 'لطفا مشتری فاکتور را انتخاب کنید',
        confirmButtonText: 'باشه'
      });
      return;
    }

    if (lines.length === 0) {
      await Swal.fire({
        icon: 'warning',
        title: 'کالایی اضافه نشده',
        text: 'لطفا حداقل یک کالا به فاکتور اضافه کنید',
        confirmButtonText: 'باشه'
      });
      return;
    }

    if (!invoice.factorNo) {
      await Swal.fire({
        icon: 'warning',
        title: 'شماره فاکتور',
        text: 'لطفا شماره فاکتور را وارد کنید',
        confirmButtonText: 'باشه'
      });
      return;
    }

    
    const confirmResult = await Swal.fire({
      title: 'ثبت نهایی فاکتور',
      html: `<div class="text-right space-y-3">
              <p class="text-lg font-bold text-gray-800">آیا از ثبت این فاکتور مطمئن هستید؟</p>
              <div class="bg-gray-50 p-3 rounded-lg">
                <div class="flex justify-between mb-2">
                  <span class="text-gray-600">شماره فاکتور:</span>
                  <span class="font-bold">${invoice.factorNo}</span>
                </div>
                <div class="flex justify-between mb-2">
                  <span class="text-gray-600">مشتری:</span>
                  <span class="font-bold">${invoice.customerName}</span>
                </div>
                <div class="flex justify-between mb-2">
                  <span class="text-gray-600">تاریخ فاکتور:</span>
                  <span class="font-bold">${invoice.invoiceDate}</span>
                </div>
                <div class="flex justify-between mb-2">
                  <span class="text-gray-600">تعداد کالاها:</span>
                  <span class="font-bold">${lines.length} قلم</span>
                </div>
                <div class="flex justify-between mb-2">
                  <span class="text-gray-600">مبلغ کل:</span>
                  <span class="font-bold text-green-600">${totalAmount.toLocaleString('fa-IR')} ریال</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">مبلغ نهایی:</span>
                  <span class="font-bold text-blue-600">${finalAmount.toLocaleString('fa-IR')} ریال</span>
                </div>
              </div>
            </div>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ثبت فاکتور',
      cancelButtonText: 'ویرایش مجدد',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      reverseButtons: true,
      showCloseButton: true,
      width: 500
    });

    if (!confirmResult.isConfirmed) return;

    try {
      const payload = {
        customerName: invoice.customerName,
        customerNationalCode: invoice.customerNationalCode,
        customerId: invoice.customerId || null,
        saleDate: invoice.invoiceDate, // تاریخ میلادی ذخیره می‌شود
        factorNo: invoice.factorNo,
        description: invoice.description || "",
        warehouseId: invoice.warehouseId,
        discount: invoice.discount || 0,
        vatRate: invoice.vatRate || 0,
        paymentType: invoice.paymentType,
        totalAmount: totalAmount,
        finalAmount: finalAmount,
        lines: lines.map((line, index) => ({
          key: { index },
          lineNumber: index + 1,
          itemCode: line.itemCode,
          itemName: line.itemName,
          itemSpec: line.itemSpec || "",
          unit: line.unit || "عدد",
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          lineTotal: line.quantity * line.unitPrice
        }))
      };

      Swal.fire({
        title: 'در حال ثبت فاکتور...',
        text: 'لطفا منتظر بمانید',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
      });

      const res = await fetch("http://localhost:5000/api/sales/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload)
      });

      Swal.close();

      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = "خطا در ثبت فاکتور";
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorJson.message || errorMessage;
        } catch { }

        await Swal.fire({
          icon: 'error',
          title: 'خطای سرور',
          html: `<div class="text-right">
                  <p class="mb-3">${errorMessage}</p>
                  <div class="bg-red-50 p-3 rounded text-sm">
                    <p class="font-bold mb-1">اطلاعات فاکتور:</p>
                    <p>شماره: ${invoice.factorNo}</p>
                    <p>مشتری: ${invoice.customerName}</p>
                  </div>
                </div>`,
          confirmButtonText: 'متوجه شدم'
        });
        return;
      }

      const result = await res.json();

      await Swal.fire({
        icon: 'success',
        title: 'فاکتور ثبت شد',
        html: `<div class="text-right space-y-3">
                <div class="flex items-center justify-center mb-3">
                  <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <p class="text-xl font-bold text-gray-800">فاکتور با موفقیت ثبت شد</p>
                <div class="bg-green-50 p-4 rounded-lg">
                  <div class="flex justify-between mb-2">
                    <span class="text-gray-600">شماره فاکتور:</span>
                    <span class="font-bold">${invoice.factorNo}</span>
                  </div>
                  <div class="flex justify-between mb-2">
                    <span class="text-gray-600">تاریخ فاکتور:</span>
                    <span class="font-bold">${invoice.invoiceDate}</span>
                  </div>
                  <div class="flex justify-between mb-2">
                    <span class="text-gray-600">شناسه سیستم:</span>
                    <span class="font-mono">${result.invoiceId || result.saleId}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">مبلغ نهایی:</span>
                    <span class="font-bold text-green-600">${finalAmount.toLocaleString('fa-IR')} ریال</span>
                  </div>
                </div>
              </div>`,
        confirmButtonText: 'متوجه شدم',
        showDenyButton: true,
        denyButtonText: 'فاکتور جدید',
        showCancelButton: true,
        cancelButtonText: 'بستن'
      }).then((result) => {
        if (result.isConfirmed || result.isDenied) {
          setInvoice({
            customerNationalCode: "",
            customerName: "",
            customerId: "",
            customerType: "real",
            customerEconomicCode: "",
            invoiceDate: "",
            // factorNo: generateAutoInvoiceNumber(),
             factorNo: 0,
            description: "",
            discount: 0,
            vatRate: 9,
            paymentType: "cash",
            warehouseId: 1
          });
          setLines([]);
          setNewLine({
            itemCode: "",
            itemName: "",
            unit: "",
            quantity: 1,
            unitPrice: 0,
            itemSpec: ""
          });
        }
      });

    } catch (err) {
      console.error("❌ خطای شبکه:", err);
      await Swal.fire({
        icon: 'error',
        title: 'خطای شبکه',
        text: 'خطا در اتصال به سرور. لطفا اتصال اینترنت را بررسی کنید.',
        confirmButtonText: 'باشه'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">در حال بارگذاری</h2>
          <p className="text-gray-600">لطفا چند لحظه صبر کنید...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* هدر */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">صدور فاکتور فروش</h1>
                <p className="text-gray-600 mt-1">سیستم جامع حسابداری    </p>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <div className="text-sm text-gray-500">تاریخ  </div>
              <div className="text-lg font-bold text-blue-600">
              {today.convert(persian, persian_fa).format("YYYY/MM/DD")} 
                                
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ستون سمت راست - اطلاعات پایه */}
          <div className="lg:col-span-1 space-y-6">
            {/* کارت اطلاعات فاکتور */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4 pb-3 border-b border-gray-100 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                اطلاعات فاکتور
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    شماره فاکتور <span className="text-red-500">*</span>
                  </label>

                <DocumentNumberInput
                        apiUrl="http://localhost:5000/api/sales/last"
                        value={invoice.factorNo}
                        onChange={handleFactorNumberChange}
                        className="border rounded px-3 py-2 w-full"
                        placeholder="مثال: 00001"
                   
                />

                  <input
                    type="text"
                    value={invoice.factorNo}
                    onChange={(e) => setInvoice(prev => ({ ...prev, factorNo: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-lg font-medium"
                    placeholder="مثال: 1403-001"
                    dir="ltr"
                    hidden
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    تاریخ فاکتور <span className="text-red-500">*</span>
                  </label>

                  <DatePicker
                                value={invoice.invoiceDate}
                                onChange={(date) => setInvoice({ ...invoice, invoiceDate: date?.format("YYYY-MM-DD") || today.format("YYYY-MM-DD") })}
                                format="YYYY/MM/DD"
                                calendar={persian}
                                locale={persian_fa}
                                calendarPosition="bottom-right"
                                inputClass="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                                containerClassName="w-full"
                                required
                              />

                  {/* <FdatePicker
                    value={invoiceDate}
                    onChange={handleDateChange}
                    placeholder="تاریخ فاکتور را انتخاب کنید"
                    // || today.format("YYYY-MM-DD")

                  /> */}

                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    انبار <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={invoice.warehouseId}
                    onChange={(e) => setInvoice(prev => ({ ...prev, warehouseId: Number(e.target.value) }))}
                    className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition appearance-none"
                  >
                    {warehouses.map(w => (
                      <option key={w.warehouseId} value={w.warehouseId}>
                        {w.warehouseName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* کارت اطلاعات مشتری */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4 pb-3 border-b border-gray-100 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                اطلاعات مشتری
              </h3>

              <CustomerSelector
                customers={customers}
                selectedCode={invoice.customerNationalCode}
                onChange={handleCustomerChange}
                customerName={invoice.customerName}
              />

              {invoice.customerType === "legal" && invoice.customerEconomicCode && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="text-sm text-gray-600">شماره اقتصادی:</div>
                  <div className="font-medium text-gray-800">{invoice.customerEconomicCode}</div>
                </div>
              )}
            </div>

            {/* کارت تنظیمات مالی */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4 pb-3 border-b border-gray-100 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                تنظیمات مالی
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      تخفیف (ریال)
                    </label>
                    <input
                      type="number"
                      value={invoice.discount}
                      onChange={(e) => setInvoice(prev => ({ ...prev, discount: Math.max(0, Number(e.target.value) || 0) }))}
                      className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-left"
                      min="0"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      مالیات (%)
                    </label>
                    <input
                      type="number"
                      value={invoice.vatRate}
                      onChange={(e) => setInvoice(prev => ({ ...prev, vatRate: Math.max(0, Math.min(100, Number(e.target.value) || 0)) }))}
                      className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-left"
                      min="0"
                      max="100"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    نوع پرداخت
                  </label>
                  <select
                    value={invoice.paymentType}
                    onChange={(e) => setInvoice(prev => ({ ...prev, paymentType: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  >
                    <option value="cash">💵 نقدی</option>
                    <option value="credit">💳 اعتباری</option>
                    <option value="check">🧾 چک</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    توضیحات
                  </label>
                  <textarea
                    value={invoice.description}
                    onChange={(e) => setInvoice(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none"
                    rows="3"
                    placeholder="توضیحات اضافی فاکتور..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ستون وسط و چپ - کالاها و جمع‌بندی */}
          <div className="lg:col-span-2 space-y-6">
            {/* کارت افزودن کالا */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <ItemEditor
                items={items}
                newLine={newLine}
                onItemChange={handleItemCodeChange}
                onFieldChange={handleNewLineFieldChange}
                onAdd={addLine}
              />
            </div>

            {/* کارت لیست کالاها */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <InvoiceLinesTable
                lines={lines}
                onRemove={removeLine}
              />
            </div>

            {/* کارت جمع‌بندی مالی */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <InvoiceSummary
                total={totalAmount}
                discount={discountAmount}
                vat={vatAmount}
                final={finalAmount}
                vatRate={invoice.vatRate}
              />
            </div>

            {/* دکمه ثبت نهایی */}
            <div className="sticky bottom-6 z-10">
              <SubmitButton
                onSubmit={handleSubmitInvoice}
                disabled={!invoice.customerNationalCode || lines.length === 0 || !invoice.factorNo}
                invoice={invoice}
                linesCount={lines.length}
              />
            </div>
          </div>
        </div>

       
      </div>
    </div>
  );
}