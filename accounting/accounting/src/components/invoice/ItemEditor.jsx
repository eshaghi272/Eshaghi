// 📁 InvoiceForm/ItemEditor.jsx
import { useState, useMemo, useRef, useEffect } from 'react';

export default function ItemEditor({ items = [], newLine = {}, onItemChange, onFieldChange, onAdd }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // مقادیر پیش‌فرض برای newLine
  const safeNewLine = {
    itemCode: '',
    itemName: '',
    unit: '',
    quantity: 1,
    unitPrice: 0,
    itemSpec: '',
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

  // فیلتر کردن کالاها بر اساس جستجو
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) {
      return safeItems.slice(0, 10); // فقط 10 مورد اول
    }

    const term = searchTerm.toLowerCase();
    return safeItems.filter(item => {
      if (!item) return false;
      return (
        (item.itemCode && item.itemCode.toString().toLowerCase().includes(term)) ||
        (item.itemName && item.itemName.toLowerCase().includes(term)) ||
        (item.itemSpec && item.itemSpec.toLowerCase().includes(term))
      );
    });
  }, [safeItems, searchTerm]);

  // پیدا کردن کالای انتخاب شده
  const selectedItem = useMemo(() => {
    if (!safeNewLine.itemCode || safeNewLine.itemCode === '') return null;
    return safeItems.find(item => item && item.itemCode === safeNewLine.itemCode) || null;
  }, [safeItems, safeNewLine.itemCode]);

  // هنگامی که کالا انتخاب می‌شود
  const handleItemSelect = (item) => {
    if (item && item.itemCode) {
      onItemChange(item.itemCode);
      setIsDropdownOpen(false);
      setSearchTerm('');
    }
  };

  // اضافه کردن کالا به فاکتور
  const handleAddClick = () => {
    if (!safeNewLine.itemCode || safeNewLine.itemCode === '') {
      alert('لطفا ابتدا کالا را انتخاب کنید');
      inputRef.current?.focus();
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
  };

  // فرمت قیمت
  const formatPrice = (price) => {
    return price ? price.toLocaleString('fa-IR') : '0';
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      <h3 className="font-bold text-lg text-blue-700 dark:text-blue-300 mb-4">🛒 افزودن کالا به فاکتور</h3>

      <div className="space-y-4">
        {/* بخش جستجو و انتخاب کالا */}
        <div className="relative" ref={dropdownRef}>
          <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
            انتخاب کالا *
          </label>

          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={searchTerm || selectedItem?.itemName || ''}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              placeholder="جستجوی کالا بر اساس کد، نام یا مشخصات..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />

            {/* آیکون جستجو */}
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* دکمه پاک کردن */}
            {(searchTerm || selectedItem) && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  onItemChange('');
                  setIsDropdownOpen(false);
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* نمایش کالای انتخاب شده */}
          {selectedItem && !searchTerm && (
            <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-800 dark:text-gray-200">
                    {selectedItem.itemName}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    <span>کد: {selectedItem.itemCode}</span>
                    {selectedItem.unit && <span className="mr-3"> • واحد: {selectedItem.unit}</span>}
                    {selectedItem.itemSpec && <span> • مشخصات: {selectedItem.itemSpec}</span>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Dropdown نتایج */}
          {isDropdownOpen && filteredItems.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {filteredItems.map(item => (
                <div
                  key={item.itemCode || item.id}
                  onClick={() => handleItemSelect(item)}
                  className={`p-3 cursor-pointer transition hover:bg-blue-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${safeNewLine.itemCode === item.itemCode ? 'bg-blue-50 dark:bg-gray-700' : ''
                    }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-gray-800 dark:text-gray-200">
                        {item.itemName}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        <span>کد: {item.itemCode}</span>
                        {item.unit && <span className="mr-3"> • واحد: {item.unit}</span>}
                        {item.itemSpec && <span> • {item.itemSpec}</span>}
                      </div>
                    </div>
                    {item.unitPrice && (
                      <div className="text-green-600 dark:text-green-400 font-medium">
                        {formatPrice(item.unitPrice)} ریال
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* پیام عدم یافتن */}
          {isDropdownOpen && searchTerm && filteredItems.length === 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg p-4">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <div className="text-lg mb-2">🔍</div>
                <div>کالایی با مشخصات "{searchTerm}" یافت نشد</div>
              </div>
            </div>
          )}
        </div>

        {/* فیلدهای تعداد و قیمت */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
              تعداد *
            </label>
            <div className="relative">
              <input
                type="number"
                value={safeNewLine.quantity || 1}
                onChange={(e) => onFieldChange("quantity", Math.max(0.001, Number(e.target.value) || 0))}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-left"
                min="0.001"
                step="0.001"
                dir="ltr"
              />
              {selectedItem?.unit && (
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                  {selectedItem.unit}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
              قیمت واحد (ریال) *
            </label>
            <div className="relative">
              <input
                type="number"
                value={safeNewLine.unitPrice || 0}
                onChange={(e) => onFieldChange("unitPrice", Math.max(0, Number(e.target.value) || 0))}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-left"
                min="0"
                step="100"
                dir="ltr"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                ریال
              </div>
            </div>
          </div>

          <div>
            <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
              جمع کل این ردیف
            </label>
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-center">
              <div className="text-xl font-bold text-green-600 dark:text-green-400">
                {((safeNewLine.quantity || 0) * (safeNewLine.unitPrice || 0)).toLocaleString('fa-IR')}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">ریال</div>
            </div>
          </div>
        </div>

        {/* دکمه افزودن */}
        <div className="flex justify-end">
          <button
            onClick={handleAddClick}
            disabled={!safeNewLine.itemCode || safeNewLine.quantity <= 0 || safeNewLine.unitPrice <= 0}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            افزودن کالا به فاکتور
          </button>
        </div>

        {/* راهنمای قیمت */}
        {selectedItem && selectedItem.unitPrice && (
          <div className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <span>💡</span>
              <span>
                قیمت پایه کالا: <strong>{formatPrice(selectedItem.unitPrice)} ریال</strong>
                {safeNewLine.unitPrice > selectedItem.unitPrice && (
                  <span className="text-green-600 dark:text-green-400 mr-2">
                    (افزایش {(((safeNewLine.unitPrice / selectedItem.unitPrice) - 1) * 100).toFixed(1)}%)
                  </span>
                )}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}