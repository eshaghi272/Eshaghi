import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  EyeOff,
  BarChart3,
  Hash,
  Package,
  AlertCircle,
  RefreshCw,
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  FileSpreadsheet
} from "lucide-react";

export default function KardexTable({ items = [] }) {
  const [selectedCode, setSelectedCode] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: 'تاریخ', direction: 'desc' });
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    minAmount: "",
    maxAmount: ""
  });
  const [visibleColumns, setVisibleColumns] = useState({
    تاریخ: true,
    وارده: true,
    صادره: true,
    سند: true,
    مقدار: true,
    مبلغ: true,
    توضیح: true,
    مانده: true
  });

  // حالت‌های جدید برای select با جستجو
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [selectSearchTerm, setSelectSearchTerm] = useState("");
  const selectRef = useRef(null);
  const dropdownRef = useRef(null);

  // بستن select وقتی کلیک خارج از آن انجام شود
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsSelectOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // واکشی کاردکس کالا
  useEffect(() => {
    if (!selectedCode) {
      setRows([]);
      return;
    }

    const fetchKardexData = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`http://localhost:5000/api/kardex/${selectedCode}`);

        if (!response.ok) {
          throw new Error(`خطا در دریافت اطلاعات کاردکس (کد: ${response.status})`);
        }

        const data = await response.json();
        
        // محاسبه مانده تجمعی
        const processedData = Array.isArray(data) ? data.map((row, index) => {
          const varede = parseFloat(row.وارده || 0) || 0;
          const sader = parseFloat(row.صادره || 0) || 0;
          
          // محاسبه مانده تجمعی (از اول تا این ردیف)
          let cumulativeBalance = 0;
          for (let i = 0; i <= index; i++) {
            cumulativeBalance += (parseFloat(data[i].وارده || 0) - parseFloat(data[i].صادره || 0));
          }
          
          return {
            ...row,
            مانده: cumulativeBalance
          };
        }).reverse() : []; // معکوس کردن ترتیب برای نمایش جدیدترین اول
        
        setRows(processedData);
      } catch (err) {
        setError(err.message || "خطای ناشناخته در دریافت داده‌ها");
      } finally {
        setLoading(false);
      }
    };

    fetchKardexData();
  }, [selectedCode]);

  // فیلتر کردن کالاها برای select با جستجو
  const filteredSelectItems = useMemo(() => {
    if (!selectSearchTerm.trim()) return items;

    const term = selectSearchTerm.toLowerCase();
    return items.filter(item => {
      const code = item.itemCode || item.code || item.کد || "";
      const name = item.itemName || item.name || item.نام || "";
      const brand = item.brand || "";
      const model = item.model || "";

      return (
        code.toString().toLowerCase().includes(term) ||
        name.toLowerCase().includes(term) ||
        brand.toLowerCase().includes(term) ||
        model.toLowerCase().includes(term)
      );
    });
  }, [items, selectSearchTerm]);

  const selectedItem = items.find(item =>
    item.itemCode === selectedCode ||
    item.code === selectedCode ||
    item.کد === selectedCode
  );

  // مرتب سازی داده‌ها
  const sortedRows = useMemo(() => {
    if (!sortConfig.key || rows.length === 0) return rows;

    return [...rows].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;

      if (sortConfig.key === 'تاریخ') {
        try {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        } catch (e) {
          return 0;
        }
      }

      if (!isNaN(aValue) && !isNaN(bValue)) {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [rows, sortConfig]);

  // فیلتر کردن داده‌های جدول
  const filteredRows = useMemo(() => {
    return sortedRows.filter(row => {
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        return Object.values(row).some(value =>
          value !== null && value !== undefined &&
          String(value).toLowerCase().includes(searchLower)
        );
      }

      if (filters.dateFrom && row.تاریخ) {
        try {
          const rowDate = new Date(row.تاریخ);
          const fromDate = new Date(filters.dateFrom);
          if (rowDate < fromDate) return false;
        } catch (e) { }
      }

      if (filters.dateTo && row.تاریخ) {
        try {
          const rowDate = new Date(row.تاریخ);
          const toDate = new Date(filters.dateTo);
          if (rowDate > toDate) return false;
        } catch (e) { }
      }

      return true;
    });
  }, [sortedRows, searchQuery, filters]);

  // محاسبه آمار
  const statistics = useMemo(() => {
    if (filteredRows.length === 0) return null;

    const totalWarede = filteredRows.reduce((sum, row) => {
      const value = parseFloat(row.وارده || 0);
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    const totalSader = filteredRows.reduce((sum, row) => {
      const value = parseFloat(row.صادره || 0);
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    const totalMablagh = filteredRows.reduce((sum, row) => {
      const value = parseFloat(row.مبلغ || 0);
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    // محاسبه مانده آخرین ردیف (جدیدترین تراکنش)
    const lastRow = filteredRows[0]; // اولین ردیف در نمایش (جدیدترین)
    const currentMandeh = lastRow ? parseFloat(lastRow.مانده || 0) : 0;

    return {
      totalWarede,
      totalSader,
      totalMablagh,
      currentMandeh,
      count: filteredRows.length
    };
  }, [filteredRows]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // تابع برای خروجی گرفتن به صورت CSV با UTF-8 BOM
  const handleExportCSV = () => {
    try {
      if (filteredRows.length === 0) {
        alert("داده‌ای برای خروجی گرفتن وجود ندارد");
        return;
      }

      // تعیین هدرها بر اساس ستون‌های قابل مشاهده
      const headers = Object.entries(visibleColumns)
        .filter(([_, isVisible]) => isVisible)
        .map(([column]) => column);

      // تبدیل داده‌ها به فرمت CSV با UTF-8 BOM برای فارسی
      let csvContent = '';
      
      // اضافه کردن BOM برای UTF-8
      const BOM = '\uFEFF';
      csvContent += BOM;
      
      // اضافه کردن هدرها
      csvContent += headers.join(',') + '\r\n';
      
      // اضافه کردن داده‌ها
      filteredRows.forEach(row => {
        const values = headers.map(header => {
          const value = row[header];
          // اگر مقدار خالی یا undefined/null باشد
          if (value === null || value === undefined) {
            return '';
          }
          
          let stringValue = String(value);
          
          // اگر مقدار شامل کاما، خط جدید، یا کوتیشن باشد، آن را در کوتیشن قرار می‌دهیم
          if (stringValue.includes(',') || stringValue.includes('\r') || stringValue.includes('\n') || stringValue.includes('"')) {
            stringValue = stringValue.replace(/"/g, '""'); // فرار کردن کوتیشن‌ها
            return `"${stringValue}"`;
          }
          
          return stringValue;
        });
        csvContent += values.join(',') + '\r\n';
      });

      const exportFileDefaultName = `کاردکس_${selectedCode}_${new Date().toISOString().split('T')[0]}.csv`;

      // ایجاد Blob با charset UTF-8
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (navigator.msSaveBlob) { // برای IE
        navigator.msSaveBlob(blob, exportFileDefaultName);
      } else {
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', exportFileDefaultName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

    } catch (err) {
      console.error("خطا در خروجی گرفتن از داده‌ها:", err);
      alert("خطا در خروجی گرفتن از داده‌ها");
    }
  };

  // تابع برای خروجی گرفتن به صورت Excel (XLSX)
  const handleExportExcel = () => {
    try {
      if (filteredRows.length === 0) {
        alert("داده‌ای برای خروجی گرفتن وجود ندارد");
        return;
      }

      // تعیین هدرها بر اساس ستون‌های قابل مشاهده
      const headers = Object.entries(visibleColumns)
        .filter(([_, isVisible]) => isVisible)
        .map(([column]) => column);

      // ساخت XML برای Excel
      let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\r\n';
      xmlContent += '<?mso-application progid="Excel.Sheet"?>\r\n';
      xmlContent += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\r\n';
      xmlContent += ' xmlns:o="urn:schemas-microsoft-com:office:office"\r\n';
      xmlContent += ' xmlns:x="urn:schemas-microsoft-com:office:excel"\r\n';
      xmlContent += ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"\r\n';
      xmlContent += ' xmlns:html="http://www.w3.org/TR/REC-html40">\r\n';
      xmlContent += ' <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">\r\n';
      xmlContent += '  <Author>سیستم کاردکس</Author>\r\n';
      xmlContent += '  <Created>' + new Date().toISOString() + '</Created>\r\n';
      xmlContent += ' </DocumentProperties>\r\n';
      xmlContent += ' <Styles>\r\n';
      xmlContent += '  <Style ss:ID="Default" ss:Name="Normal">\r\n';
      xmlContent += '   <Alignment ss:Vertical="Center"/>\r\n';
      xmlContent += '   <Font ss:FontName="Tahoma" ss:Size="11"/>\r\n';
      xmlContent += '  </Style>\r\n';
      xmlContent += '  <Style ss:ID="Header">\r\n';
      xmlContent += '   <Font ss:FontName="Tahoma" ss:Size="11" ss:Bold="1"/>\r\n';
      xmlContent += '   <Interior ss:Color="#D9E1F2" ss:Pattern="Solid"/>\r\n';
      xmlContent += '   <Borders>\r\n';
      xmlContent += '    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>\r\n';
      xmlContent += '   </Borders>\r\n';
      xmlContent += '  </Style>\r\n';
      xmlContent += ' </Styles>\r\n';
      xmlContent += ' <Worksheet ss:Name="کاردکس">\r\n';
      xmlContent += '  <Table>\r\n';

      // اضافه کردن هدرها
      xmlContent += '   <Row ss:StyleID="Header">\r\n';
      headers.forEach(header => {
        xmlContent += `    <Cell><Data ss:Type="String">${escapeXML(header)}</Data></Cell>\r\n`;
      });
      xmlContent += '   </Row>\r\n';

      // اضافه کردن داده‌ها
      filteredRows.forEach(row => {
        xmlContent += '   <Row>\r\n';
        headers.forEach(header => {
          const value = row[header];
          let cellContent = '';
          let dataType = 'String';
          
          if (value === null || value === undefined) {
            cellContent = '';
          } else if (!isNaN(value) && value !== '') {
            // اگر عدد باشد
            dataType = 'Number';
            cellContent = value;
          } else {
            // اگر رشته باشد
            cellContent = escapeXML(String(value));
          }
          
          xmlContent += `    <Cell><Data ss:Type="${dataType}">${cellContent}</Data></Cell>\r\n`;
        });
        xmlContent += '   </Row>\r\n';
      });

      xmlContent += '  </Table>\r\n';
      xmlContent += ' </Worksheet>\r\n';
      xmlContent += '</Workbook>';

      const exportFileDefaultName = `کاردکس_${selectedCode}_${new Date().toISOString().split('T')[0]}.xls`;

      // ایجاد Blob با MIME type مناسب برای Excel
      const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
      const link = document.createElement('a');
      
      if (navigator.msSaveBlob) { // برای IE
        navigator.msSaveBlob(blob, exportFileDefaultName);
      } else {
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', exportFileDefaultName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

    } catch (err) {
      console.error("خطا در خروجی گرفتن Excel:", err);
      alert("خطا در خروجی گرفتن فایل Excel");
    }
  };

  // تابع برای فرار کردن کاراکترهای خاص XML
  const escapeXML = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const handleRefresh = () => {
    if (selectedCode) {
      setRows([]);
      setLoading(true);
      fetch(`http://localhost:5000/api/kardex/${selectedCode}`)
        .then(res => res.json())
        .then(data => {
          // محاسبه مانده تجمعی
          const processedData = Array.isArray(data) ? data.map((row, index) => {
            const varede = parseFloat(row.وارده || 0) || 0;
            const sader = parseFloat(row.صادره || 0) || 0;
            
            let cumulativeBalance = 0;
            for (let i = 0; i <= index; i++) {
              cumulativeBalance += (parseFloat(data[i].وارده || 0) - parseFloat(data[i].صادره || 0));
            }
            
            return {
              ...row,
              مانده: cumulativeBalance
            };
          }).reverse() : [];
          
          setRows(processedData);
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  };

  const handleSelectItem = (code) => {
    setSelectedCode(code);
    setIsSelectOpen(false);
    setSelectSearchTerm("");
  };

  const clearSelection = () => {
    setSelectedCode("");
    setRows([]);
    setSelectSearchTerm("");
  };

  return (
    <div className="space-y-4 relative">
      {/* هدر با انتخاب کالا */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-100 dark:border-gray-700 p-3"
      >
        <div className="flex flex-col lg:flex-row gap-3">
          {/* انتخاب کالا با جستجو */}
          <div className="flex-1" ref={selectRef}>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <Package className="inline w-3 h-3 ml-1" />
              انتخاب کالا
            </label>

            {/* Select با جستجو */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSelectOpen(!isSelectOpen)}
                className={`w-full p-2 pr-10 text-right bg-gray-50 dark:bg-gray-700 border ${selectedCode
                    ? 'border-blue-500 dark:border-blue-500'
                    : 'border-gray-200 dark:border-gray-600'
                  } rounded-md focus:outline-none focus:ring-1 focus:ring-blue-200 dark:focus:ring-blue-900 transition-all flex items-center justify-between text-sm`}
              >
                <div className="flex-1 text-right">
                  {selectedItem ? (
                    <div className="text-gray-800 dark:text-gray-200">
                      <span className="font-medium">{selectedItem.itemCode}</span>
                      {" - "}
                      <span className="truncate">{selectedItem.itemName}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400">انتخاب کالا...</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {selectedCode && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearSelection();
                      }}
                      className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                    >
                      <X className="w-3 h-3 text-gray-500" />
                    </button>
                  )}
                  <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${isSelectOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>

              <AnimatePresence>
                {isSelectOpen && (
                  <motion.div
                    ref={dropdownRef}
                    initial={{ opacity: 0, y: -5, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -5, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute z-[9999] w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg"
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0
                    }}
                  >
                    <div className="p-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                      <div className="relative">
                        <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                        <input
                          type="text"
                          placeholder="جستجوی کالا..."
                          value={selectSearchTerm}
                          onChange={(e) => setSelectSearchTerm(e.target.value)}
                          className="w-full pr-8 pl-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>

                    <div className="max-h-40 overflow-y-auto">
                      {filteredSelectItems.length === 0 ? (
                        <div className="p-2 text-center text-gray-500 dark:text-gray-400 text-xs">
                          موردی یافت نشد
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                          {filteredSelectItems.map((item) => (
                            <button
                              key={item.itemCode || item.id}
                              type="button"
                              onClick={() => handleSelectItem(item.itemCode)}
                              className={`w-full px-2 py-1.5 text-right hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between ${selectedCode === (item.itemCode || item.code)
                                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                  : 'text-gray-700 dark:text-gray-300'
                                } text-xs`}
                            >
                              <div className="flex-1 text-right">
                                <div className="font-medium">{item.itemCode}</div>
                                <div className="truncate">{item.itemName}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* اطلاعات کالای انتخاب شده */}
          {selectedItem && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-100 dark:border-blue-800 rounded-md p-2 flex-1"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-1.5">
                  <div className="p-1 bg-blue-100 dark:bg-blue-800 rounded mt-0.5">
                    <Package className="w-3 h-3 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white text-xs line-clamp-1">
                      {selectedItem.itemName}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                      کد: <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-xs">
                        {selectedItem.itemCode}
                      </span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title="بروزرسانی"
                >
                  <RefreshCw className={`w-3 h-3 text-gray-600 dark:text-gray-400 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* جستجو و فیلترها */}
        {selectedCode && (
          <div className="mt-3 space-y-2">
            <div className="flex flex-col md:flex-row gap-2">
              <div className="flex-1 relative">
                <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                <input
                  type="text"
                  placeholder="جستجو در تراکنش‌ها..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-8 pl-2 py-1.5 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none"
                  disabled={loading}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>

              <div className="flex gap-1.5">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowFilters(!showFilters)}
                  disabled={loading}
                  className="flex items-center gap-1 px-2 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors disabled:opacity-50"
                >
                  <Filter className="w-3 h-3" />
                  <span>فیلتر</span>
                </motion.button>

                {/* دکمه خروجی با منوی کشویی */}
                <div className="relative group">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleExportCSV}
                    disabled={loading || filteredRows.length === 0}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded shadow hover:shadow-md transition-shadow disabled:opacity-50"
                  >
                    <Download className="w-3 h-3" />
                    <span>خروجی</span>
                    <ChevronDown className="w-3 h-3" />
                  </motion.button>
                  
                  {/* منوی کشویی برای انتخاب فرمت */}
                  <div className="absolute top-full left-0 mt-1 w-36 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <button
                      onClick={handleExportCSV}
                      className="w-full px-3 py-2 text-xs text-right text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-end gap-2"
                    >
                      <FileSpreadsheet className="w-3 h-3" />
                      خروجی CSV
                    </button>
                    <button
                      onClick={handleExportExcel}
                      className="w-full px-3 py-2 text-xs text-right text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-end gap-2"
                    >
                      <FileSpreadsheet className="w-3 h-3" />
                      خروجی Excel
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded border border-gray-200 dark:border-gray-600">
                    <div className="md:col-span-4">
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        نمایش ستون‌ها
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(visibleColumns).map(([column, isVisible]) => (
                          <button
                            key={column}
                            onClick={() => setVisibleColumns(prev => ({
                              ...prev,
                              [column]: !isVisible
                            }))}
                            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${isVisible
                              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                              }`}
                          >
                            {isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            <span>{column}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* آمار */}
      {selectedCode && statistics && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-1.5"
        >
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border border-blue-200 dark:border-blue-700 rounded p-2">
            <div className="flex items-center gap-1.5">
              <div className="p-1 bg-blue-100 dark:bg-blue-800 rounded">
                <BarChart3 className="w-3 h-3 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">تعداد تراکنش</p>
                <p className="text-base font-bold text-gray-800 dark:text-white">
                  {statistics.count}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border border-green-200 dark:border-green-700 rounded p-2">
            <div className="flex items-center gap-1.5">
              <div className="p-1 bg-green-100 dark:bg-green-800 rounded">
                <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-300" />
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">کل وارده</p>
                <p className="text-base font-bold text-gray-800 dark:text-white">
                  {statistics.totalWarede.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 border border-red-200 dark:border-red-700 rounded p-2">
            <div className="flex items-center gap-1.5">
              <div className="p-1 bg-red-100 dark:bg-red-800 rounded">
                <TrendingDown className="w-3 h-3 text-red-600 dark:text-red-300" />
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">کل صادره</p>
                <p className="text-base font-bold text-gray-800 dark:text-white">
                  {statistics.totalSader.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border border-purple-200 dark:border-purple-700 rounded p-2">
            <div className="flex items-center gap-1.5">
              <div className="p-1 bg-purple-100 dark:bg-purple-800 rounded">
                <Minus className="w-3 h-3 text-purple-600 dark:text-purple-300" />
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">مانده</p>
                <p className="text-base font-bold text-gray-800 dark:text-white">
                  {statistics.currentMandeh.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* نمایش وضعیت */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-8"
          >
            <div className="relative">
              <div className="w-8 h-8 border-2 border-blue-200 dark:border-blue-800 rounded-full"></div>
              <div className="w-8 h-8 border-2 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin absolute top-0"></div>
            </div>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
              در حال دریافت اطلاعات...
            </p>
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800 rounded p-4 text-center"
          >
            <div className="inline-flex items-center justify-center w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full mb-3">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-1">
              خطا در دریافت اطلاعات
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">{error}</p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRefresh}
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gradient-to-r from-red-500 to-orange-500 text-white rounded shadow hover:shadow-md transition-shadow mx-auto"
            >
              <RefreshCw className="w-3 h-3" />
              تلاش مجدد
            </motion.button>
          </motion.div>
        ) : selectedCode && filteredRows.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 border border-gray-200 dark:border-gray-700 rounded p-6 text-center"
          >
            <Package className="w-8 h-8 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
              📦 هیچ تراکنشی یافت نشد
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              هنوز تراکنشی برای این کالا ثبت نشده است
            </p>
          </motion.div>
        ) : filteredRows.length > 0 ? (
          <motion.div
            key="table"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded shadow border border-gray-100 dark:border-gray-700"
          >
            <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
              <div className="flex flex-col md:flex-row justify-between items-center gap-2">
                <h2 className="text-sm font-bold text-gray-800 dark:text-white">
                  تراکنش‌های کاردکس ({filteredRows.length} تراکنش)
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date().toLocaleDateString('fa-IR')}
                  </span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[400px]">
              <table className="w-full min-w-max">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gray-50 dark:bg-gray-700/50">
                    {Object.entries(visibleColumns).map(([column, isVisible]) =>
                      isVisible && (
                        <th
                          key={column}
                          className="px-3 py-2 text-right font-semibold text-gray-700 dark:text-gray-300 text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors sticky top-0 bg-gray-50 dark:bg-gray-700"
                          onClick={() => handleSort(column)}
                        >
                          <div className="flex items-center justify-end gap-1">
                            {column}
                            {sortConfig.key === column && (
                              sortConfig.direction === 'asc'
                                ? <ChevronUp className="w-3 h-3" />
                                : <ChevronDown className="w-3 h-3" />
                            )}
                          </div>
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredRows.map((row, index) => {
                    const warede = parseFloat(row.وارده || 0);
                    const sader = parseFloat(row.صادره || 0);
                    const meghdar = parseFloat(row.مقدار || 0);
                    const mablagh = parseFloat(row.مبلغ || 0);
                    const mandeh = parseFloat(row.مانده || 0);
                    
                    return (
                      <motion.tr
                        key={index}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.01 }}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group"
                      >
                        {Object.entries(visibleColumns).map(([column, isVisible]) =>
                          isVisible && (
                            <td
                              key={column}
                              className="px-3 py-2 text-gray-800 dark:text-gray-200 text-right text-xs"
                            >
                              {column === 'تاریخ' ? (
                                <span className="font-medium">{row[column]}</span>
                              ) : column === 'وارده' ? (
                                <span className="font-medium text-green-600 dark:text-green-400">
                                  {warede > 0 ? `+${warede.toLocaleString()}` : '-'}
                                </span>
                              ) : column === 'صادره' ? (
                                <span className="font-medium text-red-600 dark:text-red-400">
                                  {sader > 0 ? `-${sader.toLocaleString()}` : '-'}
                                </span>
                              ) : column === 'مبلغ' ? (
                                <span className="font-mono">
                                  {mablagh > 0 ? `${mablagh.toLocaleString()} ریال` : '-'}
                                </span>
                              ) : column === 'مانده' ? (
                                <span className={`font-medium ${mandeh > 0 ? 'text-blue-600 dark:text-blue-400' :
                                  mandeh < 0 ? 'text-orange-600 dark:text-orange-400' :
                                    'text-gray-600 dark:text-gray-400'
                                  }`}>
                                  {mandeh !== 0 ? mandeh.toLocaleString() : '-'}
                                </span>
                              ) : (
                                <span className="truncate max-w-[150px] block">
                                  {row[column] || '-'}
                                </span>
                              )}
                            </td>
                          )
                        )}
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : !selectedCode ? (
          <motion.div
            key="no-selection"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 border border-gray-200 dark:border-gray-700 rounded p-6 text-center"
          >
            <Package className="w-8 h-8 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
              🎯 کالایی انتخاب نشده است
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              لطفاً یک کالا را انتخاب کنید
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}