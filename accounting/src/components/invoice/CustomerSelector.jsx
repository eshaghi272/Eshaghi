import { useState, useMemo, useEffect, useRef } from 'react';

export default function CustomerSelector({ customers = [], selectedCode, onChange, customerName }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // پیش‌فرض کردن آرایه خالی اگر customers undefined باشد
  const safeCustomers = Array.isArray(customers) ? customers : [];

  // بستن dropdown هنگام کلیک خارج
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // فیلتر کردن مشتری‌ها با بررسی وجود فیلدها
  const filteredCustomers = useMemo(() => {
    if (!Array.isArray(safeCustomers)) return [];

    if (!searchTerm.trim()) return safeCustomers.slice(0, 10); // فقط 10 مورد اول

    const term = searchTerm.toLowerCase();
    return safeCustomers.filter(c => {
      if (!c) return false;
      return (
        (c.firstName && c.firstName.toLowerCase().includes(term)) ||
        (c.lastName && c.lastName.toLowerCase().includes(term)) ||
        (c.nationalCode && c.nationalCode.includes(term)) ||
        (c.phone && c.phone.includes(term))
      );
    });
  }, [safeCustomers, searchTerm]);

  // پیدا کردن مشتری انتخاب شده با بررسی وجود
  const selectedCustomer = useMemo(() => {
    if (!selectedCode || !Array.isArray(safeCustomers)) return null;
    return safeCustomers.find(c => c && c.nationalCode === selectedCode) || null;
  }, [safeCustomers, selectedCode]);

  const handleSelect = (customer) => {
    if (customer && customer.nationalCode) {
      onChange(customer.nationalCode);
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  // تابع برای گرفتن حروف اول نام و نام خانوادگی
  const getInitials = (customer) => {
    if (!customer) return '??';
    const first = customer.firstName ? customer.firstName.charAt(0) : '';
    const last = customer.lastName ? customer.lastName.charAt(0) : '';
    return (first + last) || '??';
  };

  // تابع برای گرفتن نام کامل
  const getFullName = (customer) => {
    if (!customer) return 'نامشخص';
    return `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'نامشخص';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
        انتخاب مشتری
      </label>

      {/* بخش جستجو */}
      <div className="relative">
        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
          {/* آیکون جستجو */}
          <div className="px-3 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* فیلد ورودی */}
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="جستجوی مشتری بر اساس نام، نام‌خانوادگی یا کد ملی..."
            className="w-full p-3 outline-none bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
            disabled={!Array.isArray(customers)}
          />

          {/* دکمه پاک کردن */}
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="px-3 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* پیام در حال بارگذاری */}
        {!Array.isArray(customers) && (
          <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
              <span className="text-yellow-700 dark:text-yellow-300 text-sm">
                در حال بارگذاری لیست مشتری‌ها...
              </span>
            </div>
          </div>
        )}

        {/* نمایش مشتری انتخاب شده */}
        {selectedCustomer && !searchTerm && (
          <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <span className="font-bold text-blue-600 dark:text-blue-300">
                    {getInitials(selectedCustomer)}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-gray-800 dark:text-gray-200">
                    {getFullName(selectedCustomer)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    کد ملی: {selectedCustomer.nationalCode || 'نامشخص'}
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        )}

        {/* Dropdown نتایج */}
        {isOpen && Array.isArray(filteredCustomers) && filteredCustomers.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-80 overflow-y-auto">
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400 px-2">
                {filteredCustomers.length} مشتری یافت شد
              </div>
            </div>

            {filteredCustomers.map(customer => {
              if (!customer) return null;

              return (
                <div
                  key={customer.nationalCode || Math.random()}
                  onClick={() => handleSelect(customer)}
                  className={`p-3 cursor-pointer transition hover:bg-blue-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${selectedCode === customer.nationalCode ? 'bg-blue-50 dark:bg-gray-700' : ''
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-800 dark:text-gray-200">
                        {getFullName(customer)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        <span className="ml-3">کد ملی: {customer.nationalCode || 'نامشخص'}</span>
                        {customer.phone && <span> • تلفن: {customer.phone}</span>}
                      </div>
                    </div>
                    {selectedCode === customer.nationalCode && (
                      <div className="text-green-600 dark:text-green-400">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* پیام عدم یافتن */}
        {isOpen && searchTerm && Array.isArray(filteredCustomers) && filteredCustomers.length === 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg p-4">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <div className="text-lg mb-2">😔</div>
              <div>مشتری با مشخصات "{searchTerm}" یافت نشد</div>
            </div>
          </div>
        )}

        {/* پیام لیست خالی */}
        {isOpen && !searchTerm && Array.isArray(safeCustomers) && safeCustomers.length === 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg p-4">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <div className="text-lg mb-2">📭</div>
              <div>لیست مشتری‌ها خالی است</div>
              <div className="text-xs mt-2">ابتدا مشتری‌ها را اضافه کنید</div>
            </div>
          </div>
        )}
      </div>

      {/* راهنمای جستجو */}
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <span>💡</span>
          <span>برای جستجو نام، نام‌خانوادگی یا کد ملی را وارد کنید</span>
        </div>
      </div>

          </div>
  );
}