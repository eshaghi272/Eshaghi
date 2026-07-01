// 📁 InvoiceForm/ItemSale.jsx
import { useState, useMemo, useRef, useEffect } from 'react';

export default function ItemSale({ items = [], newLine = {}, onItemChange, onFieldChange, onAdd }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedItemDetails, setSelectedItemDetails] = useState(null);
  const dropdownRef = useRef(null);

  // مقادیر پیش‌فرض
  const safeNewLine = {
    itemCode: '',
    itemName: '',
    unit: '',
    quantity: 1,
    unitPrice: 0,
    ...newLine
  };

  const safeItems = Array.isArray(items) ? items : [];

  // بستن dropdown هنگام کلیک خارج
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // فیلتر کردن کالاها
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) {
      return safeItems.slice(0, 15); // فقط 15 مورد اول
    }

    const term = searchTerm.toLowerCase();
    return safeItems.filter(item => {
      if (!item) return false;
      const searchString = `${item.itemCode || ''} ${item.itemName || ''} ${item.itemSpec || ''}`.toLowerCase();
      return searchString.includes(term);
    });
  }, [safeItems, searchTerm]);

  // هنگامی که کالا انتخاب می‌شود
  const handleItemSelect = (item) => {
    if (item && item.itemCode) {
      onItemChange(item.itemCode);
      setSelectedItemDetails(item);
      setIsDropdownOpen(false);
      setSearchTerm('');

      // اگر قیمت کالا وجود دارد، آن را تنظیم کن
      if (item.unitPrice && item.unitPrice > 0) {
        // محاسبه قیمت فروش (مثلاً 35% سود)
        const salePrice = Math.round(item.unitPrice * 1.35);
        onFieldChange("unitPrice", salePrice);
      }
    }
  };

  // هنگامی که مقدار جستجو تغییر می‌کند
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsDropdownOpen(true);

    // اگر کالایی انتخاب شده بود و کاربر شروع به تایپ کرد، انتخاب را پاک کن
    if (value && selectedItemDetails) {
      setSelectedItemDetails(null);
      onItemChange('');
    }
  };

  // افزودن کالا به فاکتور
  const handleAddClick = () => {
    if (!safeNewLine.itemCode || safeNewLine.itemCode === '') {
      alert('لطفا ابتدا کالا را انتخاب کنید');
      return;
    }

    if (safeNewLine.quantity <= 0) {
      alert('تعداد باید بیشتر از صفر باشد');
      return;
    }

    if (safeNewLine.unitPrice <= 0) {
      alert('قیمت واحد باید بیشتر از صفر باشد');
      return;
    }

    onAdd();
    setSelectedItemDetails(null);
    setSearchTerm('');
    setIsDropdownOpen(false);
  };

  // کلید Enter برای جستجو
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && filteredItems.length > 0 && !selectedItemDetails) {
      handleItemSelect(filteredItems[0]);
    }
  };

  // پیدا کردن کالای انتخاب شده
  const getSelectedItem = useMemo(() => {
    if (!safeNewLine.itemCode) return null;
    return safeItems.find(item => item && item.itemCode === safeNewLine.itemCode) || null;
  }, [safeItems, safeNewLine.itemCode]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
          افزودن کالا به فاکتور
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          کالا را انتخاب کنید یا جستجو نمایید
        </p>
      </div>

      <div className="space-y-4">
        {/* جستجوی کالا */}
        <div className="relative" ref={dropdownRef}>
          <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
            جستجو و انتخاب کالا
          </label>

          <div className="relative">
            <input
              type="text"
              value={searchTerm || (getSelectedItem ? `${getSelectedItem.itemCode} - ${getSelectedItem.itemName}` : '')}
              onChange={handleSearchChange}
              onFocus={() => setIsDropdownOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder="کد یا نام کالا را تایپ کنید..."
              className="w-full p-3 pr-10 pl-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />

            {/* آیکون جستجو */}
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* دکمه پاک کردن */}
            {(searchTerm || getSelectedItem) && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  onItemChange('');
                  setSelectedItemDetails(null);
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
                title="پاک کردن"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Dropdown نتایج */}
          {isDropdownOpen && filteredItems.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-80 overflow-y-auto">
              <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {filteredItems.length} کالا یافت شد
                </div>
              </div>

              {filteredItems.map(item => (
                <div
                  key={item.itemCode}
                  onClick={() => handleItemSelect(item)}
                  className={`p-3 cursor-pointer transition border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${safeNewLine.itemCode === item.itemCode
                      ? 'bg-blue-50 dark:bg-blue-900/30'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-gray-800 dark:text-gray-200">
                        {item.itemName}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-3">
                        <span className="font-mono bg-gray-100 dark:bg-gray-900 px-2 py-0.5 rounded">
                          {item.itemCode}
                        </span>
                        {item.unit && <span>واحد: {item.unit}</span>}
                        {item.itemSpec && <span className="truncate" title={item.itemSpec}>
                          مشخصات: {item.itemSpec}
                        </span>}
                      </div>
                    </div>
                    {item.unitPrice && item.unitPrice > 0 && (
                      <div className="text-left">
                        <div className="text-green-600 dark:text-green-400 font-bold">
                          {item.unitPrice.toLocaleString('fa-IR')}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">ریال</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* پیام عدم یافتن */}
          {isDropdownOpen && searchTerm && filteredItems.length === 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg p-4">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <div className="text-xl mb-2">🔍</div>
                <div>کالایی با مشخصات "{searchTerm}" یافت نشد</div>
              </div>
            </div>
          )}
        </div>

        {/* اطلاعات کالای انتخاب شده */}
        {getSelectedItem && !searchTerm && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-300 font-bold">
                    {getSelectedItem.itemName.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="font-bold text-gray-800 dark:text-gray-200">
                    {getSelectedItem.itemName}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="ml-3">کد: <strong>{getSelectedItem.itemCode}</strong></span>
                    {getSelectedItem.unit && <span className="mr-3"> • واحد: {getSelectedItem.unit}</span>}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onItemChange('');
                  setSelectedItemDetails(null);
                }}
                className="px-3 py-1.5 text-sm bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 rounded-lg border border-red-200 dark:border-red-800 transition"
              >
                تغییر کالا
              </button>
            </div>
          </div>
        )}

        {/* فیلدهای تعداد و قیمت */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
              تعداد
            </label>
            <div className="relative">
              <input
                type="number"
                value={safeNewLine.quantity}
                onChange={(e) => onFieldChange("quantity", Math.max(0.001, Number(e.target.value) || 1))}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-left"
                min="0.001"
                step="0.001"
                dir="ltr"
              />
              {getSelectedItem?.unit && (
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                  {getSelectedItem.unit}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
              قیمت واحد (ریال)
            </label>
            <div className="relative">
              <input
                type="number"
                value={safeNewLine.unitPrice}
                onChange={(e) => onFieldChange("unitPrice", Math.max(0, Number(e.target.value) || 0))}
                className="w-full p-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-left"
                min="0"
                step="100"
                dir="ltr"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                ریال
              </div>
            </div>
          </div>
        </div>

        {/* جمع کل ردیف */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">جمع کل این ردیف:</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {((safeNewLine.quantity || 0) * (safeNewLine.unitPrice || 0)).toLocaleString('fa-IR')}
              </div>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {safeNewLine.quantity} × {safeNewLine.unitPrice.toLocaleString('fa-IR')}
            </div>
          </div>
        </div>

        {/* دکمه افزودن */}
        <div className="flex justify-end">
          <button
            onClick={handleAddClick}
            disabled={!safeNewLine.itemCode || safeNewLine.quantity <= 0 || safeNewLine.unitPrice <= 0}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-medium flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            افزودن کالا به فاکتور
          </button>
        </div>
      </div>
    </div>
  );
}