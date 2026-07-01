import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import KardexTable from "./KardexTable";
import {
  Package,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  Filter,
  Download,
  Search
} from "lucide-react";

export default function KardexPage() {
  const [itemsList, setItemsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchItems = async () => {
    setRefreshing(true);
    setError("");
    try {
      const res = await fetch("http://localhost:5000/api/items");

      if (!res.ok) {
        throw new Error("خطا در دریافت لیست کالاها");
      }

      const data = await res.json();
      setItemsList(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const filteredItems = itemsList.filter(item => {
    if (!searchTerm.trim()) return true;

    const term = searchTerm.toLowerCase();
    return (
      (item.itemName && item.itemName.toLowerCase().includes(term)) ||
      (item.itemCode && item.itemCode.toString().toLowerCase().includes(term)) ||
      (item.barcode && item.barcode.toString().toLowerCase().includes(term)) ||
      (item.iranCode && item.iranCode.toString().toLowerCase().includes(term)) ||
      (item.brand && item.brand.toLowerCase().includes(term)) ||
      (item.model && item.model.toLowerCase().includes(term))
    );
  });

  const stats = {
    totalItems: itemsList.length,
    lowStock: itemsList.filter(item => {
      const stock = item.stock || 0;
      const minStock = item.minStock || 0;
      return stock < minStock;
    }).length,
    totalValue: itemsList.reduce((sum, item) => {
      const stock = item.stock || 0;
      const unitPrice = item.unitPrice || item.basePrice || 0;
      return sum + (stock * unitPrice);
    }, 0)
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(itemsList, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `kardex-items-${new Date().toISOString().split('T')[0]}.json`);
    linkElement.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Main Content */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 rounded-full"></div>
                <div className="w-16 h-16 border-4 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin absolute top-0"></div>
              </div>
              <p className="mt-6 text-lg text-gray-600 dark:text-gray-300">
                در حال دریافت لیست کالاها از سرور...
              </p>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-8 text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mb-6">
                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3">
                خطا در دریافت اطلاعات
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={fetchItems}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl shadow-md hover:shadow-lg transition-shadow"
              >
                تلاش مجدد
              </motion.button>
            </motion.div>
          ) : itemsList.length === 0 ? (
            <motion.div
              key="no-items"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 border border-gray-200 dark:border-gray-700 rounded-2xl p-12 text-center"
            >
              <Package className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-6" />
              <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-3">
                📦 هیچ کالایی یافت نشد
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                در حال حاضر هیچ کالایی در سیستم ثبت نشده است.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={fetchItems}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow-md hover:shadow-lg transition-shadow"
              >
                بررسی مجدد
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                        لیست کالاها برای کاردکس
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        یک کالا را انتخاب کنید تا کاردکس آن نمایش داده شود
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {filteredItems.length} مورد یافت شد
                      </span>
                      <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        کل: {itemsList.length} کالا
                      </span>
                    </div>
                  </div>
                </div>

                <KardexTable items={filteredItems} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}