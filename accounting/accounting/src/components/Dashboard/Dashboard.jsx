import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line,
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, Package, Building, Users,
  ShoppingCart, CreditCard, BarChart3, PieChart as PieChartIcon,
  AlertTriangle, CheckCircle, RefreshCw, Download, Filter,
  Calendar, ChevronRight, Home, DollarSign as DollarIcon
} from 'lucide-react';

const Dashboard = () => {
  // Stateهای اصلی
  const [stats, setStats] = useState({
    bankTransactions: 0,
    activeAssets: 0,
    activeItems: 0,
    journalEntries: 0,
    payrollCount: 0,
    totalSales: 0,
    totalPurchases: 0,
    totalInvoices: 0,
    costOfGoodsSold: 0,
    grossProfit: 0,
    grossProfitPercentage: 0,
    beginningInventoryValue: 0,
    endingInventoryValue: 0,
    inventoryTurnover: 0,
    inventoryValue: 0,
    inventoryQuantity: 0,
    inventoryItems: 0,
    totalSalesCount: 0,
    totalPurchasesCount: 0,
    invoiceCount: 0
  });
  
  const [bankData, setBankData] = useState([]);
  const [salesPurchasesData, setSalesPurchasesData] = useState([]);
  const [assetsData, setAssetsData] = useState([]);
  const [gaugesData, setGaugesData] = useState({
    grossProfitRatio: 0,
    activeAssetsRatio: 0,
    salesTotal: 0,
    purchasesTotal: 0,
    totalAssets: 0,
    activeAssets: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [drillDown, setDrillDown] = useState(null);
  const [detailData, setDetailData] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [activeTab, setActiveTab] = useState('overview');

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ff6b6b'];

  useEffect(() => {
    fetchAllDashboardData();
  }, []);

  useEffect(() => {
    if (selectedPeriod) {
      fetchTimeSeriesData(selectedPeriod);
    }
  }, [selectedPeriod]);

  const fetchAllDashboardData = async () => {
    try {
      setLoading(true);
      const [
        statsRes,
        bankRes,
        salesRes,
        assetsRes,
        gaugesRes
      ] = await Promise.all([
        axios.get('http://localhost:5000/api/dashboard/stats'),
        axios.get('http://localhost:5000/api/dashboard/bank-transactions'),
        axios.get('http://localhost:5000/api/dashboard/sales-purchases-monthly'),
        axios.get('http://localhost:5000/api/dashboard/fixed-assets'),
        axios.get('http://localhost:5000/api/dashboard/gauges')
      ]);
      
      setStats(statsRes.data);
      setBankData(bankRes.data);
      setSalesPurchasesData(salesRes.data);
      setAssetsData(assetsRes.data);
      setGaugesData(gaugesRes.data);
      
    } catch (error) {
      console.error('❌ خطا در دریافت داده‌های داشبورد:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeSeriesData = async (period) => {
    try {
      // استفاده از داده‌های خرید و فروش ماهانه به عنوان داده‌های سری زمانی
      const salesData = salesPurchasesData
        .filter(d => d.type === 'فروش')
        .slice(0, 12)
        .map(d => ({
          period: d.month,
          sales: d.amount,
          transactions: d.count
        }));
      timeSeriesData(salesData);
    } catch (error) {
      console.error('❌ خطا در دریافت داده‌های سری زمانی:', error);
    }
  };

  const handleDrillDown = async (type, params = {}) => {
    try {
      const queryParams = new URLSearchParams({ limit: 50, ...params }).toString();
      const url = `http://localhost:5000/api/dashboard/detail/${type}${queryParams ? `?${queryParams}` : ''}`;
      const res = await axios.get(url);
      
      setDetailData(res.data.data);
      setDrillDown(type);
    } catch (error) {
      console.error('❌ خطا در دریافت جزئیات:', error);
    }
  };

  const formatCurrency = (value) => {
    if (!value && value !== 0) return '-';
    return new Intl.NumberFormat('fa-IR').format(Math.round(value || 0)) + ' ریال';
  };

  const formatNumber = (value) => {
    if (!value && value !== 0) return '-';
    return new Intl.NumberFormat('fa-IR').format(Math.round(value || 0));
  };

  const getPerformanceColor = (value, threshold = 0) => {
    if (value > threshold) return 'text-green-600';
    if (value < threshold) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getPerformanceIcon = (value, threshold = 0) => {
    if (value > threshold) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (value < threshold) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <TrendingUp className="w-4 h-4 text-yellow-600" />;
  };

  // کامپوننت گیج پیشرفته
  const AdvancedGauge = ({ value, label, min = 0, max = 100, unit = '%', color = 'blue' }) => {
    const percentage = Math.min(Math.max(value, min), max);
    const normalizedValue = ((percentage - min) / (max - min)) * 100;
    const angle = normalizedValue * 1.8;
    
    const colorPalette = {
      blue: { primary: '#3B82F6', secondary: '#60A5FA' },
      green: { primary: '#10B981', secondary: '#34D399' },
      red: { primary: '#EF4444', secondary: '#F87171' },
      purple: { primary: '#8B5CF6', secondary: '#A78BFA' },
      yellow: { primary: '#F59E0B', secondary: '#FBBF24' }
    };
    
    const colors = colorPalette[color] || colorPalette.blue;
    
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <div className="relative w-48 h-24 mb-4">
          <svg width="200" height="120" viewBox="0 0 200 120" className="w-full h-full">
            {/* پس‌زمینه گیج */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="14"
              strokeLinecap="round"
            />
            
            {/* مقدار فعلی */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke={colors.primary}
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={`${angle * 1.396} 251.2`}
              transform="rotate(180 100 100)"
            />
            
            {/* نشانگر */}
            <line
              x1="100"
              y1="100"
              x2={100 + 70 * Math.cos((angle - 90) * Math.PI / 180)}
              y2={100 + 70 * Math.sin((angle - 90) * Math.PI / 180)}
              stroke="#374151"
              strokeWidth="3"
              strokeLinecap="round"
            />
            
            {/* دایره مرکز */}
            <circle cx="100" cy="100" r="8" fill={colors.primary} />
          </svg>
          
          {/* مقدار عددی */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="text-2xl font-bold" style={{ color: colors.primary }}>
              {percentage.toFixed(1)}{unit}
            </div>
          </div>
        </div>
        <div className="text-center">
          <div className="text-gray-700 font-medium text-sm">{label}</div>
          <div className="text-xs text-gray-500 mt-1">
            محدوده: {min} - {max}{unit}
          </div>
        </div>
      </div>
    );
  };

  // کامپوننت نوار پیشرفت
  const ProgressBar = ({ value, label, color = 'blue', showValue = true, max = 100 }) => {
    const percentage = Math.min(Math.max(value, 0), max);
    
    const colorClasses = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      red: 'bg-red-500',
      yellow: 'bg-yellow-500',
      purple: 'bg-purple-500',
      indigo: 'bg-indigo-500',
      pink: 'bg-pink-500'
    };
    
    return (
      <div className="w-full p-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {showValue && (
            <span className="text-sm font-bold text-gray-800">
              {percentage.toFixed(1)}%
            </span>
          )}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
          <div 
            className={`${colorClasses[color]} h-2.5 rounded-full transition-all duration-700 ease-out`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    );
  };

  // کامپوننت کارت متریک
  const MetricCard = ({ 
    title, 
    value, 
    change, 
    icon, 
    color = 'blue',
    onClick,
    unit = ''
  }) => {
    const colorClasses = {
      blue: 'bg-blue-50 border-blue-200 text-blue-700',
      green: 'bg-green-50 border-green-200 text-green-700',
      red: 'bg-red-50 border-red-200 text-red-700',
      purple: 'bg-purple-50 border-purple-200 text-purple-700',
      yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
      indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700'
    };
    
    return (
      <div 
        className={`${colorClasses[color]} border rounded-xl p-4 hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1`}
        onClick={onClick}
      >
        <div className="flex justify-between items-start mb-2">
          <div className="text-sm font-medium text-gray-600">{title}</div>
          <div className="text-2xl opacity-80">{icon}</div>
        </div>
        <div className="flex items-end justify-between">
          <div className="text-2xl font-bold truncate">
            {value} {unit}
          </div>
          {change !== undefined && (
            <div className={`text-sm flex items-center ${getPerformanceColor(change)}`}>
              {getPerformanceIcon(change)}
              <span className="mr-1">{Math.abs(change).toFixed(1)}%</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // کامپوننت ChartCard
  const ChartCard = ({ title, children, action }) => (
    <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-800">{title}</h3>
        {action && <div className="text-sm text-gray-500">{action}</div>}
      </div>
      {children}
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600 text-lg">در حال بارگذاری داشبورد...</p>
        <p className="text-gray-400 text-sm mt-2">لطفاً چند لحظه صبر کنید</p>
      </div>
    );
  }

  if (drillDown) {
    const drillDownTitles = {
      'sales': 'جزئیات فروش',
      'purchases': 'جزئیات خرید',
      'bank-transactions': 'جزئیات تراکنش‌های بانکی',
      'inventory-low-stock': 'کالاهای با موجودی کم'
    };
    
    return (
      <div className="p-4 md:p-6 bg-gray-50 min-h-screen" dir="rtl">
        <div className="max-w-7xl mx-auto">
          {/* هدر */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setDrillDown(null)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ChevronRight className="w-4 h-4 ml-1" />
                بازگشت به داشبورد
              </button>
              <h1 className="text-2xl font-bold text-gray-800">
                {drillDownTitles[drillDown] || 'جزئیات'}
              </h1>
            </div>
            <div className="text-sm text-gray-500">
              تعداد رکوردها: {detailData.length}
            </div>
          </div>
          
          {/* جدول جزئیات */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {detailData.length > 0 && Object.keys(detailData[0]).map(key => (
                      <th 
                        key={key} 
                        className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {detailData.map((row, idx) => (
                    <tr 
                      key={idx} 
                      className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100'}
                    >
                      {Object.entries(row).map(([key, value], i) => (
                        <td key={i} className="px-4 py-3 whitespace-nowrap text-sm">
                          {typeof value === 'number' ? (
                            key.toLowerCase().includes('amount') || key.toLowerCase().includes('price') || key.toLowerCase().includes('value') ? (
                              <span className="font-mono">{formatCurrency(value)}</span>
                            ) : (
                              <span className="font-medium">{formatNumber(value)}</span>
                            )
                          ) : (
                            <span className="text-gray-900">{value || '-'}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // گروه‌بندی داده‌های خرید و فروش
  const salesData = salesPurchasesData.filter(d => d.type === 'فروش');
  const purchaseData = salesPurchasesData.filter(d => d.type === 'خرید');
  const timeSeriesData = salesData.slice(0, 12).map(d => ({
    period: d.month,
    sales: d.amount,
    transactions: d.count
  }));

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* هدر اصلی */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
              <BarChart3 className="text-blue-600" size={28} />
              داشبورد مدیریت مالی
            </h1>
            <p className="text-gray-600">
              نمایش جامع عملکرد مالی شرکت - آخرین بروزرسانی: امروز
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="daily">روزانه</option>
              <option value="weekly">هفتگی</option>
              <option value="monthly">ماهانه</option>
            </select>
            
            <button
              onClick={fetchAllDashboardData}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw size={18} />
              بروزرسانی
            </button>
          </div>
        </div>

        {/* تب‌های ناوبری */}
        <div className="flex flex-wrap gap-2 mb-6">
          {['overview', 'sales', 'inventory', 'assets', 'profit'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab === 'overview' && 'دید کلی'}
              {tab === 'sales' && 'فروش و خرید'}
              {tab === 'inventory' && 'موجودی کالا'}
              {tab === 'assets' && 'دارایی‌ها'}
              {tab === 'profit' && 'سودآوری'}
            </button>
          ))}
        </div>

        {/* کارت‌های متریک */}
        {(activeTab === 'overview' || activeTab === 'profit') && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard
              title="سود ناخالص"
              value={formatCurrency(stats.grossProfit)}
              change={stats.grossProfitPercentage}
              icon={<DollarSign />}
              color="green"
              onClick={() => handleDrillDown('sales')}
            />
            
            <MetricCard
              title="فروش کل"
              value={formatCurrency(stats.totalSales)}
              icon={<TrendingUp />}
              color="blue"
              onClick={() => handleDrillDown('sales')}
            />
            
            <MetricCard
              title="COGS"
              value={formatCurrency(stats.costOfGoodsSold)}
              icon={<Package />}
              color="yellow"
              onClick={() => handleDrillDown('purchases')}
            />
            
            <MetricCard
              title="نرخ سود ناخالص"
              value={`${stats.grossProfitPercentage?.toFixed(1) || '0'}%`}
              change={stats.grossProfitPercentage - 30}
              icon={<PieChartIcon />}
              color="purple"
            />
          </div>
        )}

        {/* دید کلی */}
        {activeTab === 'overview' && (
          <>
            {/* ردیف دوم کارت‌ها */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <MetricCard
                title="خرید کل"
                value={formatCurrency(stats.totalPurchases)}
                icon={<ShoppingCart />}
                color="red"
                onClick={() => handleDrillDown('purchases')}
              />
              
              <MetricCard
                title="ارزش موجودی کالا"
                value={formatCurrency(stats.inventoryValue)}
                icon={<Package />}
                color="indigo"
                onClick={() => handleDrillDown('sales')}
              />
              
              <MetricCard
                title="تراکنش‌های بانکی"
                value={formatNumber(stats.bankTransactions)}
                icon={<CreditCard />}
                color="green"
                onClick={() => handleDrillDown('bank-transactions')}
              />
              
              <MetricCard
                title="دارایی‌های فعال"
                value={formatNumber(stats.activeAssets)}
                icon={<Building />}
                color="blue"
              />
            </div>

            {/* نمودارها و گیج‌ها */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* گیج سود ناخالص */}
              <ChartCard title="سود ناخالص">
                <AdvancedGauge
                  value={stats.grossProfitPercentage || 0}
                  label="نرخ سود ناخالص"
                  min={0}
                  max={50}
                  color="green"
                />
                <div className="mt-4 space-y-3">
                  <ProgressBar
                    value={(stats.totalSales > 0 ? (stats.costOfGoodsSold || 0) / stats.totalSales * 100 : 0)}
                    label="هزینه کالای فروش رفته"
                    color="yellow"
                    max={100}
                  />
                  <ProgressBar
                    value={stats.grossProfitPercentage || 0}
                    label="سود ناخالص"
                    color="green"
                    max={100}
                  />
                </div>
              </ChartCard>

              {/* نمودار خرید و فروش */}
              <ChartCard title="خرید و فروش ماهانه">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={salesData.slice(0, 6).reverse()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => formatCurrency(value)}
                      labelStyle={{ fontFamily: 'Vazir' }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="amount" 
                      name="مبلغ فروش" 
                      fill="#3B82F6" 
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                      dataKey="avgTransaction" 
                      name="میانگین هر تراکنش" 
                      fill="#8B5CF6" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* توزیع تراکنش‌های بانکی */}
              <ChartCard title="تراکنش‌های بانکی بر اساس نوع">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={bankData.slice(0, 5)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ transType, total }) => `${transType}: ${formatCurrency(total)}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="total"
                    >
                      {bankData.slice(0, 5).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => formatCurrency(value)}
                      labelStyle={{ fontFamily: 'Vazir' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* نمودار سری زمانی */}
            <ChartCard title="روند فروش">
              <div className="mb-4">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="border rounded-lg px-3 py-1 text-sm bg-white"
                >
                  <option value="daily">روزانه</option>
                  <option value="weekly">هفتگی</option>
                  <option value="monthly">ماهانه</option>
                </select>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    labelStyle={{ fontFamily: 'Vazir' }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="sales" 
                    name="مبلغ فروش" 
                    stroke="#3B82F6" 
                    fill="#3B82F6" 
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="transactions" 
                    name="تعداد تراکنش‌ها" 
                    stroke="#10B981" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </>
        )}

        {/* تب فروش و خرید */}
        {activeTab === 'sales' && (
          <div className="space-y-6">
            {/* کارت‌های متریک فروش */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard
                title="کل فروش"
                value={formatCurrency(stats.totalSales)}
                icon={<TrendingUp />}
                color="blue"
              />
              <MetricCard
                title="تعداد فروش"
                value={formatNumber(stats.totalSalesCount)}
                icon={<BarChart3 />}
                color="green"
              />
              <MetricCard
                title="میانگین هر فروش"
                value={formatCurrency(stats.totalSalesCount > 0 ? stats.totalSales / stats.totalSalesCount : 0)}
                icon={<DollarIcon />}
                color="purple"
              />
            </div>

            {/* نمودار مقایسه خرید و فروش */}
            <ChartCard title="مقایسه خرید و فروش ماهانه">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={salesPurchasesData.slice(0, 12).reverse()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    labelStyle={{ fontFamily: 'Vazir' }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="amount" 
                    name="مبلغ"
                    radius={[4, 4, 0, 0]}
                  >
                    {salesPurchasesData.slice(0, 12).map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.type === 'فروش' ? '#10B981' : '#EF4444'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}

        {/* تب موجودی کالا */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            {/* کارت‌های متریک موجودی */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <MetricCard
                title="ارزش موجودی"
                value={formatCurrency(stats.inventoryValue)}
                icon={<Package />}
                color="blue"
              />
              <MetricCard
                title="تعداد کالاها"
                value={formatNumber(stats.inventoryItems)}
                icon={<BarChart3 />}
                color="green"
              />
              <MetricCard
                title="گردش موجودی"
                value={stats.inventoryTurnover.toFixed(2)}
                icon={<RefreshCw />}
                color="purple"
                unit="بار"
              />
              <MetricCard
                title="کالاهای فعال"
                value={formatNumber(stats.activeItems)}
                icon={<CheckCircle />}
                color="indigo"
              />
            </div>

            {/* اطلاعات موجودی */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ChartCard title="جزئیات موجودی">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">ارزش موجودی ابتدای دوره:</span>
                    <span className="text-lg font-bold text-blue-600">
                      {formatCurrency(stats.beginningInventoryValue)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">ارزش موجودی انتهای دوره:</span>
                    <span className="text-lg font-bold text-green-600">
                      {formatCurrency(stats.endingInventoryValue)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">تعداد کل کالاها:</span>
                    <span className="text-lg font-bold text-purple-600">
                      {formatNumber(stats.inventoryItems)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">میانگین گردش موجودی:</span>
                    <span className="text-lg font-bold text-yellow-600">
                      {stats.inventoryTurnover.toFixed(2)} بار
                    </span>
                  </div>
                </div>
              </ChartCard>

              <ChartCard title="نسبت‌های موجودی">
                <div className="space-y-4">
                  <ProgressBar
                    value={stats.grossProfitPercentage || 0}
                    label="نرخ سود ناخالص"
                    color="green"
                    max={50}
                  />
                  <ProgressBar
                    value={stats.inventoryTurnover || 0}
                    label="گردش موجودی"
                    color="blue"
                    max={10}
                  />
                  <ProgressBar
                    value={(stats.totalSales > 0 ? (stats.costOfGoodsSold || 0) / stats.totalSales * 100 : 0)}
                    label="نسبت COGS به فروش"
                    color="yellow"
                    max={100}
                  />
                </div>
              </ChartCard>
            </div>
          </div>
        )}

        {/* تب دارایی‌ها */}
        {activeTab === 'assets' && (
          <div className="space-y-6">
            {/* کارت‌های متریک دارایی */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard
                title="دارایی‌های فعال"
                value={formatNumber(stats.activeAssets)}
                icon={<CheckCircle />}
                color="green"
              />
              <MetricCard
                title="کل دارایی‌ها"
                value={formatNumber(assetsData.reduce((sum, item) => sum + item.count, 0))}
                icon={<Building />}
                color="blue"
              />
              <MetricCard
                title="ارزش دارایی‌ها"
                value={formatCurrency(assetsData.reduce((sum, item) => sum + item.totalValue, 0))}
                icon={<DollarSign />}
                color="purple"
              />
            </div>

            {/* نمودار دارایی‌ها */}
            <ChartCard title="توزیع دارایی‌های ثابت بر اساس نوع">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={assetsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="AssetType" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    labelStyle={{ fontFamily: 'Vazir' }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="totalValue" 
                    name="ارزش خرید" 
                    fill="#3B82F6" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="currentValue" 
                    name="ارزش فعلی" 
                    fill="#10B981" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* جدول انواع دارایی */}
            <ChartCard title="انواع دارایی‌های ثابت">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="p-3 text-right">نوع دارایی</th>
                      <th className="p-3 text-right">تعداد</th>
                      <th className="p-3 text-right">ارزش خرید</th>
                      <th className="p-3 text-right">ارزش فعلی</th>
                      <th className="p-3 text-right">دارایی‌های فعال</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assetsData.map((asset, index) => (
                      <tr key={index} className="border-t hover:bg-gray-50">
                        <td className="p-3 font-medium">{asset.AssetType}</td>
                        <td className="p-3 text-center">
                          <span className="font-medium">{formatNumber(asset.count)}</span>
                        </td>
                        <td className="p-3 text-left">{formatCurrency(asset.totalValue)}</td>
                        <td className="p-3 text-left">{formatCurrency(asset.currentValue)}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            asset.activeCount > 0 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {formatNumber(asset.activeCount)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ChartCard>
          </div>
        )}

        {/* تب سودآوری */}
        {activeTab === 'profit' && (
          <div className="space-y-6">
            {/* تحلیل سود */}
            <ChartCard title="تحلیل سود 6 ماه اخیر">
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={salesData.slice(0, 6).reverse()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    labelStyle={{ fontFamily: 'Vazir' }}
                  />
                  <Legend />
                  <Area 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="amount" 
                    name="مبلغ فروش" 
                    stroke="#3B82F6" 
                    fill="#3B82F6" 
                    fillOpacity={0.3}
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="avgTransaction" 
                    name="میانگین هر فروش" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* خلاصه سودآوری */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ChartCard title="میانگین‌های کلیدی">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">میانگین سود ناخالص:</span>
                    <span className="text-xl font-bold text-green-600">
                      {stats.grossProfitPercentage?.toFixed(1) || '0'}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">میانگین مبلغ سود:</span>
                    <span className="text-xl font-bold text-blue-600">
                      {formatCurrency(stats.grossProfit)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">میانگین فروش ماهانه:</span>
                    <span className="text-xl font-bold text-purple-600">
                      {salesData.length > 0 
                        ? formatCurrency(salesData.reduce((sum, item) => sum + item.amount, 0) / salesData.length)
                        : formatCurrency(0)
                      }
                    </span>
                  </div>
                </div>
              </ChartCard>

              <ChartCard title="نسبت‌های مالی">
                <div className="space-y-4">
                  <ProgressBar
                    value={stats.grossProfitPercentage || 0}
                    label="نرخ سود ناخالص"
                    color="green"
                    max={50}
                  />
                  <ProgressBar
                    value={stats.inventoryTurnover || 0}
                    label="گردش موجودی"
                    color="blue"
                    max={10}
                  />
                  <ProgressBar
                    value={(stats.totalSales > 0 ? (stats.costOfGoodsSold || 0) / stats.totalSales * 100 : 0)}
                    label="نسبت COGS به فروش"
                    color="yellow"
                    max={100}
                  />
                </div>
              </ChartCard>
            </div>
          </div>
        )}

        {/* خلاصه پایانی */}
        <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">خلاصه عملکرد مالی</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">
                {formatCurrency(stats.totalSales)}
              </div>
              <div className="text-gray-600 mt-2">کل فروش</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-700">
                {formatCurrency(stats.costOfGoodsSold || 0)}
              </div>
              <div className="text-gray-600 mt-2">COGS</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-700">
                {formatCurrency(stats.grossProfit || 0)}
              </div>
              <div className="text-gray-600 mt-2">سود ناخالص</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-700">
                {stats.grossProfitPercentage?.toFixed(1) || '0'}%
              </div>
              <div className="text-gray-600 mt-2">نرخ سود ناخالص</div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-md font-semibold text-gray-700 mb-3">سایر متریک‌های کلیدی</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-500">گردش موجودی:</div>
                <div className="font-bold">{stats.inventoryTurnover.toFixed(2)} بار</div>
              </div>
              <div>
                <div className="text-gray-500">تعداد تراکنش‌ها:</div>
                <div className={`font-bold ${getPerformanceColor(stats.bankTransactions)}`}>
                  {formatNumber(stats.bankTransactions)}
                </div>
              </div>
              <div>
                <div className="text-gray-500">دارایی‌های فعال:</div>
                <div className="font-bold">{gaugesData.totalAssets > 0 
                  ? ((gaugesData.activeAssets / gaugesData.totalAssets) * 100).toFixed(1) 
                  : '0'}%</div>
              </div>
              <div>
                <div className="text-gray-500">تعداد کالاها:</div>
                <div className="font-bold">{formatNumber(stats.inventoryItems)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;