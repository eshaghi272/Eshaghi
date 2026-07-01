import React, { useState, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { FiscalYearProvider } from "./context/FiscalYearContext";
import Layout from './Layouts/Layout';
import './index.css'
import ErrorBoundary from './pages/ErrorBoundary';
import ConnectionError from './pages/ConnectionError';
import { useServerCheck } from './hooks/useServerCheck';

// Lazy-loaded pages
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Services = lazy(() => import('./pages/Services'));
const Contact = lazy(() => import('./pages/Contact'));
const LoginPage = lazy(() => import('./auth/LoginPage'));
const RegisterPage = lazy(() => import('./auth/RegisterPage'));
const RecoverPage = lazy(() => import('./auth/RecoverPage'));
const CompleteProfileForm = lazy(() => import('./auth/CompleteProfileForm'));
const BankTransactionForm = lazy(() => import('./components/accounts/BankTransactionForm'));
const SystemSettingsPage = lazy(() => import('./components/setting/SystemSettingsPage'));
const JournalEntryForm = lazy(() => import('./components/accounts/JournalEntryForm'));
const LookupAdminPanel = lazy(() => import('./components/accounts/LookupAdminPanel'));
const ItemPage = lazy(() => import('./components/goods/ItemPage'));
const WarehousePage = lazy(() => import('./components/goods/WarehousePage'));
const WarehouseReceiptForm = lazy(() => import('./components/goods/WarehouseReceiptForm'));
const JournalReportPage = lazy(() => import('./components/accounts/JournalReportPage'));
const KardexPage = lazy(() => import('./components/goods/KardexPage'));
const SalesInvoicePage = lazy(() => import('./components/invoice/SalesInvoicePage'));
const PostedPurchases = lazy(() => import('./components/accounts/PostedPurchases'));
const CustomerForm = lazy(() => import('./components/persons/CustomerPage'));
const CompanyPage = lazy(() => import('./components/base/CompanyPage'));
const PurchaseEntryPage = lazy(() => import('./components/purches/PurchaseEntryPage'));
const AutoAccounting = lazy(() => import('./components/accounts/AutoAccounting'));
const BankAccountForm = lazy(() => import('./components/base/BankAccountForm'));
const TrialBalanceTree = lazy(() => import('./components/accounts/TrialBalanceTree'));
const JournalEntryList = lazy(() => import('./components/accounts/JournalEntryList'));
const JournalEntryPrint = lazy(() => import('./components/accounts/JournalEntryPrint'));
const JournalEntryEdit = lazy(() => import('./components/accounts/JournalEntryEdit'));
const AccountingReports = lazy(() => import('./components/accounts/AccountingReports'));
const FiscalYearForm = lazy(() => import('./components/accounts/FiscalYearForm'));
const FinancialStatements = lazy(() => import('./components/accounts/FinancialStatements'));

const LayoutManager = lazy(() => import('./Layouts/LayoutManager'));
const FixedAssetForm = lazy(() => import('./components/assets/FixedAssetForm'));
const DepreciationForm = lazy(() => import('./components/assets/DepreciationForm'));
const FixedAssetListView = lazy(() => import('./components/assets/FixedAssetListView'));
const AutoDepreciation = lazy(() => import('./components/assets/AutoDepreciation'));

const PayrollForm = lazy(() => import('./components/payroll/PayrollForm'));
const PayrollList = lazy(() => import('./components/payroll/PayrollList'));
const PayrollAutoEntry = lazy(() => import('./components/payroll/PayrollAutoEntry'));
const NewPayrollPage = lazy(() => import('./components/payroll/NewPayrollPage'));
const PayrollSettingsPage = lazy(() => import('./components/payroll/PayrollSettingsPage'));
const EmployeeManagementPage = lazy(() => import('./components/payroll/EmployeeManagementPage'));
const OvertimeCalculationPage = lazy(() => import('./components/payroll/OvertimeCalculationPage'));
const OvertimeManagementPage = lazy(() => import('./components/payroll/OvertimeManagementPage'));

const StepwiseClosing = lazy(() => import('./components/closing/StepwiseClosing'));
const StepwiseOpening = lazy(() => import('./components/opening/StepwiseOpening'));

const Dashboard = lazy(() => import('./components/Dashboard/Dashboard'));
const ChartDashboard = lazy(() => import('./components/Dashboard/ChartDashboard'));

const SidebarItemManager = lazy(() => import('./Layouts/SidebarItemManager'));
const ApiTestPage = lazy(() => import('./components/ui/ApiTestPage'));

// کامپوننت‌های موقت
const Profile = () => <div className="p-4">صفحه پروفایل - در حال توسعه</div>;
const Messages = () => <div className="p-4">صفحه پیام‌ها - در حال توسعه</div>;
const Help = () => <div className="p-4">صفحه راهنما - در حال توسعه</div>;

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    <span className="mr-3">در حال بارگذاری...</span>
  </div>
);

export default function App() {
  const [primaryColor, setPrimaryColor] = useState('blue');
  const { user } = useAuth();
  
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const { isServerAvailable, loading } = useServerCheck(`${apiUrl}/api/health`);

  const colorOptions = [
    { value: 'blue', name: 'آبی', class: 'bg-blue-600' },
    { value: 'teal', name: 'فیروزه‌ای', class: 'bg-teal-600' },
    { value: 'red', name: 'قرمز', class: 'bg-red-600' },
    { value: 'orange', name: 'نارنجی', class: 'bg-orange-500' }
  ];

  // اگر در حال بررسی است، لودینگ نشان بده
  if (loading) {
    return <LoadingSpinner />;
  }

  // اگر سرور در دسترس نیست، صفحه خطا نشان بده
  if (!isServerAvailable) {
    return <ConnectionError />;
  }

  // اگر سرور در دسترس است، اپلیکیشن را نشان بده
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100" dir="rtl">
      <ErrorBoundary>
        <FiscalYearProvider>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route
                path="/"
                element={
                  <Layout
                    onColorChange={setPrimaryColor}
                    colorOptions={colorOptions}
                    primaryColor={primaryColor}
                  />
                }
              >
                <Route index element={<Home />} />
                <Route path="home" element={<Home />} />
                <Route path="about" element={<About />} />
                <Route path="services" element={<Services />} />
                <Route path="contact" element={<Contact />} />
                <Route path="login" element={<LoginPage />} />
                <Route path="register" element={<RegisterPage />} />
                <Route path="recover" element={<RecoverPage />} />
                <Route path="completeprofile" element={<CompleteProfileForm />} />
                <Route path="profile/:role/:id" element={<CompleteProfileForm />} />
                <Route path="test" element={<ApiTestPage />} />

                {/* داشبورد */}
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="chartdashboard" element={<ChartDashboard />} />

                {/* دارایی‌ها */}
                <Route path="assets" element={<FixedAssetForm />} />
                <Route path="depreciation" element={<DepreciationForm />} />
                <Route path="autodepreciation" element={<AutoDepreciation />} />
                <Route path="depreciationlist" element={<FixedAssetListView />} />
                
                {/* حسابداری */}
                <Route path="accounting" element={<JournalEntryForm />} />
                <Route path="ledger" element={<JournalEntryForm />} />
                <Route path="autoledger" element={<AutoAccounting />} />
                <Route path="receiptform" element={<WarehouseReceiptForm />} />
                <Route path="journal" element={<JournalReportPage />} />
                <Route path="pays" element={<BankTransactionForm />} />
                <Route path="journalreport" element={<AccountingReports />} />
                <Route path="journalentries" element={<JournalEntryList />} />
                <Route path="journalentries/:id/print" element={<JournalEntryPrint />} />
                <Route path="journalentries/:id/edit" element={<JournalEntryEdit />} />
                
                {/* کالاها */}
                <Route path="goods" element={<ItemPage />} />
                <Route path="Purchase" element={<PurchaseEntryPage />} />
                <Route path="SalesForm" element={<SalesInvoicePage />} />
                <Route path="Kardex" element={<KardexPage />} />
                <Route path="wherehouse" element={<WarehousePage />} />
                
                {/* اطلاعات حقوق */}
                <Route path="payroll" element={<PayrollForm />} />
                <Route path="payrollform" element={<PayrollForm />} />
                <Route path="payrolllist" element={<PayrollList />} />
                <Route path="autopayrolldoc" element={<PayrollAutoEntry />} />
                <Route path="payroll-new" element={<NewPayrollPage />} />
                <Route path="payroll-settings" element={<PayrollSettingsPage />} />
                <Route path="payroll-employees" element={<EmployeeManagementPage />} />
                <Route path="OvertimeCalculation" element={<OvertimeCalculationPage />} />
                <Route path="OvertimeManagement" element={<OvertimeManagementPage />} />

                {/* اطلاعات پایه */}
                <Route path="fiscal" element={<FiscalYearForm />} />
                <Route path="base" element={<CompanyPage />} />
                <Route path="companies" element={<CompanyPage />} />
                <Route path="persons" element={<CustomerForm />} />
                <Route path="banks" element={<BankAccountForm />} />
                
                {/* گزارشات */}
                <Route path="reports" element={<JournalReportPage />} />
                <Route path="balance" element={<TrialBalanceTree />} />
                <Route path="financialStatements" element={<FinancialStatements />} />

                {/* تنظیمات */}
                <Route path="settings" element={<SystemSettingsPage />} />
                <Route path="help1" element={<PostedPurchases />} />
                <Route path="setPanel" element={<LookupAdminPanel />} />
                <Route path="tabmanager" element={<LayoutManager />} />
                <Route path="SidebarManager" element={<SidebarItemManager />} />
                <Route path="closing" element={<StepwiseClosing />} />
                <Route path="opening" element={<StepwiseOpening />} />
                
                {/* صفحات سایدبار */}
                <Route path="profile" element={<Profile />} />
                <Route path="messages" element={<Messages />} />
                <Route path="help" element={<Help />} />
              </Route>

              {/* مسیرهای نامعتبر */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </FiscalYearProvider>
      </ErrorBoundary>
    </div>
  );
}

