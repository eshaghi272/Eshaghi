// components/assets/FixedAssetList.jsx
import React from "react";
import { Edit2, Trash2, FileText, TrendingDown, Eye } from "lucide-react";

const FixedAssetList = ({ assets, onDelete, onEdit, onGenerateEntry, onGenerateDepEntry }) => {
  const formatNumber = (num) => {
    return new Intl.NumberFormat("fa-IR").format(num || 0);
  };

  const getAssetTypeIcon = (type) => {
    const icons = {
      'land': '🏞️',
      'building': '🏢',
      'facility': '⚙️',
      'machinery': '🏭',
      'vehicle': '🚗',
      'computer': '💻',
      'furniture': '🛋️',
      'software': '📱'
    };
    return icons[type] || '📦';
  };

  const getPaymentMethodLabel = (method) => {
    const labels = {
      'cash': 'نقدی',
      'bank': 'بانک',
      'payable': 'نسیه',
      'capital': 'سرمایه'
    };
    return labels[method] || method;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-medium text-gray-800 flex items-center">
          <Eye className="h-5 w-5 ml-2" />
          لیست دارایی‌های ثبت شده ({assets.length} مورد)
        </h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                اطلاعات دارایی
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                اطلاعات مالی
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                حساب‌ها
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                عملیات
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {assets.map((asset) => (
              <tr key={asset.AssetId} className="hover:bg-gray-50">
                {/* اطلاعات دارایی */}
                <td className="px-4 py-3">
                  <div className="flex items-center">
                    <div className="text-2xl ml-3">
                      {getAssetTypeIcon(asset.AssetType)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{asset.TitleFa}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        <div>کد: <span className="font-mono">{asset.AssetCode}</span></div>
                        <div>تاریخ خرید: {asset.PurchaseDate}</div>
                        <div>تعداد: {asset.Quantity} عدد</div>
                      </div>
                    </div>
                  </div>
                </td>
                
                {/* اطلاعات مالی */}
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-sm">ارزش:</span>
                      <span className="font-medium text-green-600">{formatNumber(asset.PurchaseCost)} ریال</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-sm">ارزش کل:</span>
                      <span className="font-bold">{formatNumber(asset.TotalCost)} ریال</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-sm">عمر مفید:</span>
                      <span>{asset.UsefulLife} سال</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-sm">روش پرداخت:</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        asset.PaymentMethod === 'cash' ? 'bg-green-100 text-green-800' :
                        asset.PaymentMethod === 'bank' ? 'bg-blue-100 text-blue-800' :
                        asset.PaymentMethod === 'payable' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {getPaymentMethodLabel(asset.PaymentMethod)}
                      </span>
                    </div>
                  </div>
                </td>
                
                {/* حساب‌ها */}
                <td className="px-4 py-3">
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs text-gray-500">حساب بدهکار</div>
                      <div className="font-mono text-sm text-red-600">{asset.DebitAccount || '121004'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">حساب بستانکار</div>
                      <div className="font-mono text-sm text-blue-600">{asset.CreditAccount || '211001'}</div>
                    </div>
                    <div className="text-xs text-gray-500">
                      نوع: <span className="font-medium">{asset.AssetType}</span>
                    </div>
                  </div>
                </td>
                
                {/* عملیات */}
                <td className="px-4 py-3">
                  <div className="flex flex-col space-y-2">
                    <div className="flex space-x-2 space-x-reverse">
                      <button
                        onClick={() => onEdit(asset)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        title="ویرایش"
                      >
                        <Edit2 className="h-4 w-4 ml-1" />
                        ویرایش
                      </button>
                      <button
                        onClick={() => onDelete(asset.AssetId)}
                        className="inline-flex items-center px-3 py-1.5 border border-red-300 rounded-lg text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                        title="حذف"
                      >
                        <Trash2 className="h-4 w-4 ml-1" />
                        حذف
                      </button>
                    </div>
                    
                    <div className="flex space-x-2 space-x-reverse">
                      {/* <button
                        onClick={() => onGenerateEntry(asset.AssetId)}
                        className="flex-1 inline-flex items-center justify-center px-2 py-1.5 border border-green-300 rounded-lg text-xs font-medium text-green-700 bg-white hover:bg-green-50"
                        title="صدور سند خرید"
                      >
                        <FileText className="h-3 w-3 ml-1" />
                        سند خرید
                      </button> */}
                      {/* <button
                        onClick={() => onGenerateDepEntry(asset.AssetId)}
                        className="flex-1 inline-flex items-center justify-center px-2 py-1.5 border border-blue-300 rounded-lg text-xs font-medium text-blue-700 bg-white hover:bg-blue-50"
                        title="صدور سند استهلاک"
                      >
                        <TrendingDown className="h-3 w-3 ml-1" />
                        استهلاک
                      </button> */}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FixedAssetList;