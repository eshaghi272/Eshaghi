// components/SystemSettingsManager.jsx
import React, { useState, useEffect } from 'react';
import {
  Save, Search, RefreshCw, Trash2, Edit2,
  PlusCircle, Eye, Filter, Download, Upload, X, Check
} from 'lucide-react';
import axios from 'axios';
import AccountTreeSelector from '../accounts/AccountTreeSelector';

const SystemSettingsManager = () => {
  const [settings, setSettings] = useState([]);
  const [filteredSettings, setFilteredSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('add');
  const [currentSetting, setCurrentSetting] = useState({
    settingKey: '',
    settingValue: '',
    accTitle: '',
    description: ''
  });
  const [showAccountSelector, setShowAccountSelector] = useState(false);
  const [accountSelectorFor, setAccountSelectorFor] = useState(null);
  const [bulkUpdates, setBulkUpdates] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [expandedRows, setExpandedRows] = useState({});

  // دسته‌بندی تنظیمات
  const categories = [
    { id: 'all', name: 'همه تنظیمات', color: 'bg-gray-100 text-gray-800', activeColor: 'bg-gray-800 text-white' },
    { id: 'asset', name: 'دارایی ثابت', color: 'bg-blue-100 text-blue-800', activeColor: 'bg-blue-600 text-white' },
    { id: 'transaction', name: 'خرید و فروش', color: 'bg-green-100 text-green-800', activeColor: 'bg-green-600 text-white' },
    { id: 'salary', name: 'حقوق و دستمزد', color: 'bg-yellow-100 text-yellow-800', activeColor: 'bg-yellow-600 text-white' },
    { id: 'payable', name: 'حساب‌های پرداختنی', color: 'bg-red-100 text-red-800', activeColor: 'bg-red-600 text-white' },
    { id: 'other', name: 'سایر', color: 'bg-indigo-100 text-indigo-800', activeColor: 'bg-indigo-600 text-white' }
  ];

  // دریافت تنظیمات
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/system-settings/grouped');
      const allSettings = Object.values(response.data).flat();
      setSettings(allSettings);
      setFilteredSettings(allSettings);
    } catch (error) {
      console.error('خطا در دریافت تنظیمات:', error);
      setMessage({ type: 'error', text: 'خطا در دریافت تنظیمات' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // اعمال فیلتر
  useEffect(() => {
    let filtered = settings;
    
    if (searchTerm) {
      filtered = filtered.filter(setting =>
        setting.settingKey?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        setting.settingValue?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        setting.accTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        setting.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterCategory !== 'all') {
      filtered = filtered.filter(setting => {
        const key = setting.settingKey;
        switch(filterCategory) {
          case 'asset':
            return key.includes('asset_') || key.includes('depreciation_');
          case 'transaction':
            return key.includes('purchase') || key.includes('sale') || key.includes('pay');
          case 'salary':
            return key.includes('salary') || (key.includes('Expense') && !key.includes('depreciation'));
          case 'payable':
            return key.includes('Payable');
          default:
            return true;
        }
      });
    }
    
    setFilteredSettings(filtered);
  }, [searchTerm, filterCategory, settings]);

  // باز کردن مودال
  const handleOpenModal = (type, setting = null) => {
    setModalType(type);
    setCurrentSetting(setting || {
      settingKey: '',
      settingValue: '',
      accTitle: '',
      description: ''
    });
    setShowModal(true);
  };

  // ذخیره تنظیم
  const handleSaveSetting = async () => {
    if (!currentSetting.settingKey || !currentSetting.settingValue) {
      setMessage({ type: 'warning', text: 'کلید و مقدار تنظیم الزامی است' });
      return;
    }

    setSaving(true);
    try {
      if (modalType === 'add') {
        await axios.post('http://localhost:5000/api/system-settings', currentSetting);
        setMessage({ type: 'success', text: 'تنظیم جدید با موفقیت ثبت شد' });
      } else {
        await axios.put(`http://localhost:5000/api/system-settings/${currentSetting.settingKey}`, currentSetting);
        setMessage({ type: 'success', text: 'تنظیم با موفقیت به‌روزرسانی شد' });
      }
      
      setShowModal(false);
      fetchSettings();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'خطا در ذخیره تنظیم' 
      });
    } finally {
      setSaving(false);
    }
  };

  // حذف تنظیم
  const handleDeleteSetting = async (settingKey) => {
    if (!window.confirm('آیا از حذف این تنظیم اطمینان دارید؟')) return;

    try {
      await axios.delete(`http://localhost:5000/api/system-settings/${settingKey}`);
      setMessage({ type: 'success', text: 'تنظیم با موفقیت حذف شد' });
      fetchSettings();
    } catch (error) {
      setMessage({ type: 'error', text: 'خطا در حذف تنظیم' });
    }
  };

  // بازنشانی تنظیمات پیش‌فرض
  const handleResetDefaults = async () => {
    if (!window.confirm('آیا از بازنشانی تنظیمات به حالت پیش‌فرض اطمینان دارید؟')) return;

    try {
      await axios.post('http://localhost:5000/api/system-settings/reset-defaults');
      setMessage({ type: 'success', text: 'تنظیمات پیش‌فرض با موفقیت بازنشانی شدند' });
      fetchSettings();
    } catch (error) {
      setMessage({ type: 'error', text: 'خطا در بازنشانی تنظیمات' });
    }
  };

  // به‌روزرسانی دسته‌ای
  const handleBulkUpdate = async () => {
    const updates = Object.entries(bulkUpdates).map(([key, value]) => ({
      settingKey: key,
      settingValue: value
    }));

    if (updates.length === 0) {
      setMessage({ type: 'warning', text: 'هیچ تغییری برای ذخیره وجود ندارد' });
      return;
    }

    setSaving(true);
    try {
      await axios.put('http://localhost:5000/api/system-settings', updates);
      setMessage({ type: 'success', text: `${updates.length} تنظیم با موفقیت به‌روزرسانی شدند` });
      setBulkUpdates({});
      fetchSettings();
    } catch (error) {
      setMessage({ type: 'error', text: 'خطا در به‌روزرسانی تنظیمات' });
    } finally {
      setSaving(false);
    }
  };

  // باز کردن انتخابگر حساب
  const openAccountSelector = (settingKey, currentValue) => {
    setAccountSelectorFor(settingKey);
    setCurrentSetting(prev => ({
      ...prev,
      settingKey,
      settingValue: currentValue
    }));
    setShowAccountSelector(true);
  };

  // انتخاب حساب از درخت
  const handleAccountSelect = (account) => {
    if (accountSelectorFor) {
      const newValue = account.AccountCode;
      
      if (showModal) {
        setCurrentSetting(prev => ({
          ...prev,
          settingValue: newValue,
          accTitle: account.TitleFa
        }));
      } else {
        setBulkUpdates(prev => ({
          ...prev,
          [accountSelectorFor]: newValue
        }));
      }
    }
    setShowAccountSelector(false);
  };

  // فرمت نمایش کلید تنظیم
  const formatSettingKey = (key) => {
    if (!key) return '';
    const translations = {
      'debit': 'بدهکار',
      'credit': 'بستانکار',
      'asset': 'دارایی',
      'depreciation': 'استهلاک',
      'expense': 'هزینه',
      'accumulated': 'انباشته',
      'purchase': 'خرید',
      'sale': 'فروش',
      'payable': 'پرداختنی',
      'salary': 'حقوق',
      'default': 'پیش‌فرض'
    };
    
    return key.split('_')
      .map(part => translations[part] || part)
      .join(' / ');
  };

  // گروه‌بندی تنظیمات برای نمایش
  const getCategoryForSetting = (settingKey) => {
    if (!settingKey) return { name: 'سایر', color: 'bg-gray-100 text-gray-800' };
    
    if (settingKey.includes('asset_') || settingKey.includes('depreciation_')) {
      return { name: 'دارایی ثابت', color: 'bg-blue-100 text-blue-800' };
    }
    if (settingKey.includes('purchase') || settingKey.includes('sale') || settingKey.includes('pay')) {
      return { name: 'خرید و فروش', color: 'bg-green-100 text-green-800' };
    }
    if (settingKey.includes('salary') || (settingKey.includes('Expense') && !settingKey.includes('depreciation'))) {
      return { name: 'حقوق و دستمزد', color: 'bg-yellow-100 text-yellow-800' };
    }
    if (settingKey.includes('Payable')) {
      return { name: 'حساب‌های پرداختنی', color: 'bg-red-100 text-red-800' };
    }
    return { name: 'سایر', color: 'bg-gray-100 text-gray-800' };
  };

  // رندر جدول تنظیمات
  const renderSettingsTable = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">در حال دریافت تنظیمات...</p>
        </div>
      );
    }

    if (filteredSettings.length === 0) {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-blue-700">هیچ تنظیمی یافت نشد</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                کلید تنظیم
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                دسته‌بندی
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                کد حساب
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                عنوان حساب
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                توضیحات
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                عملیات
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSettings.map((setting, index) => {
              const category = getCategoryForSetting(setting.settingKey);
              const isChanged = bulkUpdates[setting.settingKey] !== undefined;
              const isExpanded = expandedRows[setting.settingKey];
              
              return (
                <React.Fragment key={index}>
                  <tr className={isChanged ? 'bg-yellow-50 hover:bg-yellow-100' : 'hover:bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <button
                          onClick={() => setExpandedRows(prev => ({
                            ...prev,
                            [setting.settingKey]: !prev[setting.settingKey]
                          }))}
                          className="mr-2 text-gray-400 hover:text-gray-600"
                        >
                          {isExpanded ? '▼' : '▶'}
                        </button>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatSettingKey(setting.settingKey)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {setting.settingKey}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${category.color}`}>
                        {category.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <input
                          type="text"
                          value={bulkUpdates[setting.settingKey] !== undefined ? 
                                 bulkUpdates[setting.settingKey] : setting.settingValue}
                          onChange={(e) => setBulkUpdates(prev => ({
                            ...prev,
                            [setting.settingKey]: e.target.value
                          }))}
                          className="block w-32 px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                        <button
                          onClick={() => openAccountSelector(setting.settingKey, setting.settingValue)}
                          className="inline-flex items-center p-1.5 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          title="انتخاب از درخت حساب‌ها"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {setting.accTitle || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {setting.description || 'بدون توضیح'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <button
                          onClick={() => handleOpenModal('edit', setting)}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          title="ویرایش"
                        >
                          <Edit2 className="h-4 w-4 ml-1" />
                          ویرایش
                        </button>
                        <button
                          onClick={() => handleDeleteSetting(setting.settingKey)}
                          className="inline-flex items-center px-3 py-1.5 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          title="حذف"
                        >
                          <Trash2 className="h-4 w-4 ml-1" />
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {/* ردیف توضیحات گسترده */}
                  {isExpanded && (
                    <tr className="bg-gray-50">
                      <td colSpan="6" className="px-6 py-4">
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-2">جزئیات تنظیم</h4>
                              <dl className="grid grid-cols-1 gap-2">
                                <div className="flex">
                                  <dt className="text-sm font-medium text-gray-500 w-24">کلید:</dt>
                                  <dd className="text-sm text-gray-900">{setting.settingKey}</dd>
                                </div>
                                <div className="flex">
                                  <dt className="text-sm font-medium text-gray-500 w-24">کد حساب:</dt>
                                  <dd className="text-sm text-gray-900 font-mono">{setting.settingValue}</dd>
                                </div>
                                <div className="flex">
                                  <dt className="text-sm font-medium text-gray-500 w-24">عنوان:</dt>
                                  <dd className="text-sm text-gray-900">{setting.accTitle || 'تعریف نشده'}</dd>
                                </div>
                              </dl>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-2">توضیحات کامل</h4>
                              <p className="text-sm text-gray-600">
                                {setting.description || 'توضیحی برای این تنظیم ثبت نشده است.'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* هدر */}
      <div className="mb-6">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">
                مدیریت تنظیمات حساب‌های اتوماتیک
              </h1>
              <p className="text-blue-100 mt-2">
                تنظیم حساب‌های پیش‌فرض برای اسناد اتوماتیک
              </p>
            </div>
            <div className="flex items-center space-x-3 space-x-reverse mt-4 md:mt-0">
              <button
                onClick={handleResetDefaults}
                className="inline-flex items-center px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg transition-colors"
                title="بازنشانی تنظیمات پیش‌فرض"
              >
                <RefreshCw className="h-5 w-5 ml-2" />
                بازنشانی پیش‌فرض
              </button>
              <button
                onClick={() => handleOpenModal('add')}
                className="inline-flex items-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                <PlusCircle className="h-5 w-5 ml-2" />
                تنظیم جدید
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* پیام‌ها */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' :
          message.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' :
          'bg-yellow-50 border border-yellow-200 text-yellow-700'
        }`}>
          <div className="flex justify-between items-center">
            <span>{message.text}</span>
            <button
              onClick={() => setMessage({ type: '', text: '' })}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* فیلتر و جستجو */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* جستجو */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              جستجو در تنظیمات
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="جستجو بر اساس کلید، عنوان یا توضیحات..."
                className="block w-full pr-10 pl-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 left-0 pl-3 flex items-center"
                >
                  <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </div>

          {/* فیلتر دسته‌بندی */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              فیلتر بر اساس دسته
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setFilterCategory(cat.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterCategory === cat.id ? cat.activeColor : cat.color + ' hover:opacity-90'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* بخش اصلی - جدول تنظیمات */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                لیست تنظیمات
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {filteredSettings.length} تنظیم یافت شد
              </p>
            </div>
            
            {Object.keys(bulkUpdates).length > 0 && (
              <button
                onClick={handleBulkUpdate}
                disabled={saving}
                className="inline-flex items-center px-5 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors mt-4 md:mt-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                    در حال ذخیره...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 ml-2" />
                    ذخیره تغییرات ({Object.keys(bulkUpdates).length} مورد)
                  </>
                )}
              </button>
            )}
          </div>
        </div>
        
        <div className="p-6">
          {renderSettingsTable()}
        </div>
      </div>

      {/* مودال افزودن/ویرایش */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {modalType === 'add' ? 'ثبت تنظیم جدید' : 'ویرایش تنظیم'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    کلید تنظیم *
                  </label>
                  <input
                    type="text"
                    value={currentSetting.settingKey}
                    onChange={(e) => setCurrentSetting(prev => ({
                      ...prev,
                      settingKey: e.target.value
                    }))}
                    disabled={modalType === 'edit'}
                    placeholder="مثال: asset_debit_machinery"
                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    کلید باید منحصر به فرد باشد و با کاراکترهای انگلیسی و underline نوشته شود
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    کد حساب *
                  </label>
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <input
                      type="text"
                      value={currentSetting.settingValue}
                      onChange={(e) => setCurrentSetting(prev => ({
                        ...prev,
                        settingValue: e.target.value
                      }))}
                      placeholder="مثال: 121004"
                      className="block flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={() => {
                        setAccountSelectorFor(currentSetting.settingKey);
                        setShowAccountSelector(true);
                      }}
                      className="inline-flex items-center px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Eye className="h-5 w-5 ml-2" />
                      انتخاب حساب
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    عنوان حساب
                  </label>
                  <input
                    type="text"
                    value={currentSetting.accTitle || ''}
                    onChange={(e) => setCurrentSetting(prev => ({
                      ...prev,
                      accTitle: e.target.value
                    }))}
                    placeholder="عنوان حساب به فارسی"
                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    توضیحات
                  </label>
                  <textarea
                    value={currentSetting.description || ''}
                    onChange={(e) => setCurrentSetting(prev => ({
                      ...prev,
                      description: e.target.value
                    }))}
                    rows={3}
                    placeholder="توضیحات مربوط به این تنظیم..."
                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 space-x-reverse mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  لغو
                </button>
                <button
                  onClick={handleSaveSetting}
                  disabled={saving}
                  className="inline-flex items-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                      در حال ذخیره...
                    </>
                  ) : (
                    <>
                      <Check className="h-5 w-5 ml-2" />
                      ذخیره
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* مودال انتخاب حساب */}
      {showAccountSelector && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">
                  انتخاب حساب
                </h3>
                <button
                  onClick={() => setShowAccountSelector(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-hidden p-6">
              <AccountTreeSelector onSelect={handleAccountSelect} />
            </div>
            
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowAccountSelector(false)}
                className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemSettingsManager;