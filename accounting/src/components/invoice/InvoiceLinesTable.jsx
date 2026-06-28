import { useState } from 'react';

export default function InvoiceLinesTable({ lines = [], onRemove }) {
  const [hoveredRow, setHoveredRow] = useState(null);

  // محاسبه جمع کل
  const totalAmount = lines.reduce((sum, line) => {
    const quantity = parseFloat(line.quantity) || 0;
    const unitPrice = parseFloat(line.unitPrice) || 0;
    return sum + (quantity * unitPrice);
  }, 0);

  // فرمت اعداد فارسی
  const formatNumber = (num) => {
    if (num === null || num === undefined) return '۰';
    return Number(num).toLocaleString('fa-IR');
  };

  // فرمت پول
  const formatCurrency = (amount) => {
    return `${formatNumber(amount)} ریال`;
  };

  // بررسی خالی بودن آرایه
  if (!Array.isArray(lines) || lines.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
        <div className="text-4xl mb-4">🛒</div>
        <div className="text-gray-600 dark:text-gray-400 text-lg mb-2">
          هنوز کالایی به فاکتور اضافه نشده است
        </div>
        <div className="text-gray-500 dark:text-gray-500 text-sm">
          از بخش "افزودن کالا" کالاهای مورد نظر را انتخاب کنید
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">
                لیست کالاهای فاکتور
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {lines.length} کالا - مجموع: {formatCurrency(totalAmount)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-full font-medium">
              پیش‌نویس
            </span>
          </div>
        </div>
      </div>

      {/* جدول */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <th className="px-6 py-4 text-right font-semibold text-gray-700 dark:text-gray-300">ردیف</th>
              <th className="px-6 py-4 text-right font-semibold text-gray-700 dark:text-gray-300">کد کالا</th>
              <th className="px-6 py-4 text-right font-semibold text-gray-700 dark:text-gray-300">نام کالا</th>
              <th className="px-6 py-4 text-right font-semibold text-gray-700 dark:text-gray-300">واحد</th>
              <th className="px-6 py-4 text-right font-semibold text-gray-700 dark:text-gray-300">تعداد</th>
              <th className="px-6 py-4 text-right font-semibold text-gray-700 dark:text-gray-300">قیمت واحد</th>
              <th className="px-6 py-4 text-right font-semibold text-gray-700 dark:text-gray-300">قیمت کل</th>
              <th className="px-6 py-4 text-right font-semibold text-gray-700 dark:text-gray-300">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => {
              const lineTotal = (parseFloat(line.quantity) || 0) * (parseFloat(line.unitPrice) || 0);
              const isHovered = hoveredRow === index;

              return (
                <tr
                  key={index}
                  className={`border-b border-gray-100 dark:border-gray-800 transition-all ${isHovered
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : index % 2 === 0
                        ? 'bg-white dark:bg-gray-900'
                        : 'bg-gray-50 dark:bg-gray-800'
                    }`}
                  onMouseEnter={() => setHoveredRow(index)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  {/* شماره ردیف */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index % 3 === 0
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                          : index % 3 === 1
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                            : 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                        }`}>
                        {index + 1}
                      </span>
                    </div>
                  </td>

                  {/* کد کالا */}
                  <td className="px-6 py-4">
                    <div className="font-mono text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded inline-block">
                      {line.itemCode || '—'}
                    </div>
                  </td>

                  {/* نام کالا */}
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      <div className="font-medium text-gray-800 dark:text-gray-200">
                        {line.itemName || 'نامشخص'}
                      </div>
                      {line.itemSpec && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate" title={line.itemSpec}>
                          {line.itemSpec}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* واحد */}
                  <td className="px-6 py-4">
                    <span className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm">
                      {line.unit || 'عدد'}
                    </span>
                  </td>

                  {/* تعداد */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <span className="font-medium text-gray-800 dark:text-gray-200 text-left">
                        {formatNumber(line.quantity)}
                      </span>
                      {line.unit && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {line.unit}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* قیمت واحد */}
                  <td className="px-6 py-4">
                    <div className="text-left">
                      <div className="font-medium text-green-600 dark:text-green-400">
                        {formatNumber(line.unitPrice)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">ریال</div>
                    </div>
                  </td>

                  {/* قیمت کل */}
                  <td className="px-6 py-4">
                    <div className="text-left">
                      <div className="font-bold text-blue-600 dark:text-blue-400">
                        {formatNumber(lineTotal)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">ریال</div>
                    </div>
                  </td>

                  {/* عملیات */}
                  <td className="px-6 py-4">
                    <button
                      onClick={() => {
                        if (window.confirm(`آیا از حذف "${line.itemName}" مطمئن هستید؟`)) {
                          onRemove(index);
                        }
                      }}
                      className="px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg border border-red-200 dark:border-red-800 flex items-center gap-2 transition-all hover:scale-105"
                      title="حذف این کالا"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      حذف
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* فوتر و جمع کل */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                تعداد کالاها: <strong className="text-gray-800 dark:text-gray-200">{lines.length}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                کل اقلام: <strong className="text-gray-800 dark:text-gray-200">
                  {formatNumber(lines.reduce((sum, line) => sum + (parseFloat(line.quantity) || 0), 0))}
                </strong>
              </span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">جمع کل فاکتور:</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(totalAmount)}
            </div>
          </div>
        </div>

        {/* ریز محاسبات */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">میانگین قیمت</div>
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {lines.length > 0 ? formatNumber(totalAmount / lines.reduce((sum, line) => sum + (parseFloat(line.quantity) || 0), 0)) : 0}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">ریال</div>
            </div>

            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">بیشترین قیمت</div>
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                {formatNumber(Math.max(...lines.map(line => parseFloat(line.unitPrice) || 0)))}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">ریال</div>
            </div>

            <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">کمترین قیمت</div>
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {formatNumber(Math.min(...lines.map(line => parseFloat(line.unitPrice) || 0)))}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">ریال</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}