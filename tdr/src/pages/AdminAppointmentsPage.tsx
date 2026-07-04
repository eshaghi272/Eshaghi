import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DataService, { Appointment } from '../services/DataService';

interface AdminAppointmentsPageProps {
  onBackToHome?: () => void;
}

const AdminAppointmentsPage: React.FC<AdminAppointmentsPageProps> = ({ onBackToHome }) => {
  const { t } = useTranslation();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<any>({});
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    try {
      const allAppointments = DataService.getAllAppointmentsForAdmin();
      setAppointments(allAppointments);
      setStats(DataService.getFullStats());
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  const handleConfirm = (id: string) => {
    if (window.confirm('آیا از تأیید این نوبت مطمئن هستید؟')) {
      DataService.confirmAppointment(id);
      loadData();
      alert('✅ نوبت با موفقیت تأیید شد!');
    }
  };

  const handleReject = (id: string) => {
    if (window.confirm('آیا از رد این نوبت مطمئن هستید؟')) {
      DataService.rejectAppointment(id);
      loadData();
      alert('❌ نوبت با موفقیت رد شد!');
    }
  };

  const handleComplete = (id: string) => {
    if (window.confirm('آیا از انجام این نوبت مطمئن هستید؟')) {
      DataService.completeAppointment(id);
      loadData();
      alert('✅ نوبت به عنوان انجام شده ثبت شد!');
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('آیا از حذف این نوبت مطمئن هستید؟')) {
      DataService.deleteAppointment(id);
      loadData();
      alert('🗑️ نوبت با موفقیت حذف شد!');
    }
  };

  const getStatusBadge = (status: string) => {
    const classes: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      confirmed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      rejected: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };
    return classes[status] || classes.pending;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'در انتظار تأیید',
      confirmed: 'تأیید شده',
      completed: 'انجام شده',
      cancelled: 'لغو شده',
      rejected: 'رد شده',
    };
    return labels[status] || status;
  };

  const getServiceLabel = (service: string) => {
    const labels: Record<string, string> = {
      consultation: 'مشاوره',
      followup: 'پیگیری',
      treatment: 'درمان',
      emergency: 'اورژانس',
    };
    return labels[service] || service;
  };

  const filteredAppointments = filter === 'all' 
    ? appointments 
    : appointments.filter(app => app.status === filter);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 sm:py-12">
      <div className="container mx-auto px-4 sm:px-6">
        {/* header */}
        <div className="flex flex-wrap justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-light text-gray-800 dark:text-white">
              🎯 مدیریت نوبت‌ها
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              مدیریت و تأیید تمام نوبت‌های ثبت شده
            </p>
          </div>
          <button
            onClick={onBackToHome}
            className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-sm sm:text-base transition"
          >
            🏠 بازگشت به صفحه اصلی
          </button>
        </div>

        {/* آمار */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.total || 0}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">کل نوبت‌ها</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending || 0}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">در انتظار</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.confirmed || 0}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">تأیید شده</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.completed || 0}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">انجام شده</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.cancelled || 0}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">لغو شده</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{stats.rejected || 0}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">رد شده</p>
          </div>
        </div>

        {/* فیلتر */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-sm transition ${
              filter === 'all' 
                ? 'bg-primary text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
            }`}
          >
            همه
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-full text-sm transition ${
              filter === 'pending' 
                ? 'bg-yellow-500 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
            }`}
          >
            در انتظار ({stats.pending || 0})
          </button>
          <button
            onClick={() => setFilter('confirmed')}
            className={`px-4 py-2 rounded-full text-sm transition ${
              filter === 'confirmed' 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
            }`}
          >
            تأیید شده ({stats.confirmed || 0})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-full text-sm transition ${
              filter === 'completed' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
            }`}
          >
            انجام شده ({stats.completed || 0})
          </button>
        </div>

        {/* لیست نوبت‌ها */}
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <p className="text-gray-500 dark:text-gray-400">هیچ نوبتی در این دسته یافت نشد</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((app) => (
              <div
                key={app.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 sm:p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition"
              >
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                        {app.fullName}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(app.status)}`}>
                        {getStatusLabel(app.status)}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 text-sm text-gray-600 dark:text-gray-300">
                      <p>📱 {app.phone}</p>
                      <p>🆔 {app.nationalCode}</p>
                      <p>📅 {new Date(app.date).toLocaleDateString('fa-IR')}</p>
                      <p>🕐 {app.time}</p>
                      <p>📋 {getServiceLabel(app.service)}</p>
                      {app.notes && (
                        <p className="col-span-full text-gray-500 dark:text-gray-400">
                          📝 {app.notes}
                        </p>
                      )}
                      <p className="col-span-full text-xs text-gray-400 dark:text-gray-500">
                        ثبت: {new Date(app.createdAt).toLocaleString('fa-IR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {app.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleConfirm(app.id)}
                          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm transition"
                        >
                          ✅ تأیید
                        </button>
                        <button
                          onClick={() => handleReject(app.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition"
                        >
                          ❌ رد
                        </button>
                      </>
                    )}
                    {app.status === 'confirmed' && (
                      <button
                        onClick={() => handleComplete(app.id)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition"
                      >
                        ✅ انجام شد
                      </button>
                    )}
                    {app.status !== 'cancelled' && app.status !== 'rejected' && app.status !== 'completed' && (
                      <button
                        onClick={() => handleDelete(app.id)}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition"
                      >
                        🗑️ حذف
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAppointmentsPage;