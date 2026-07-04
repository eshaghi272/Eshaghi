import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DataService, { Appointment, User } from '../services/DataService';

const AdminPanel: React.FC = () => {
  const { t } = useTranslation();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<any>({});
  const [selectedTab, setSelectedTab] = useState<'appointments' | 'users' | 'stats'>('appointments');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    try {
      setAppointments(DataService.getAppointments());
      setUsers(DataService.getUsers());
      setStats(DataService.getStats());
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  const handleConfirmAppointment = (id: string) => {
    if (window.confirm('آیا از تأیید این نوبت مطمئن هستید؟')) {
      DataService.confirmAppointment(id);
      loadData();
      alert('نوبت با موفقیت تأیید شد!');
    }
  };

  const handleRejectAppointment = (id: string) => {
    if (window.confirm('آیا از رد این نوبت مطمئن هستید؟')) {
      DataService.rejectAppointment(id);
      loadData();
      alert('نوبت با موفقیت رد شد!');
    }
  };

  const handleCompleteAppointment = (id: string) => {
    if (window.confirm('آیا از انجام این نوبت مطمئن هستید؟')) {
      DataService.completeAppointment(id);
      loadData();
      alert('نوبت به عنوان انجام شده ثبت شد!');
    }
  };

  const handleDeleteAppointment = (id: string) => {
    if (window.confirm('آیا از حذف این نوبت مطمئن هستید؟')) {
      DataService.deleteAppointment(id);
      loadData();
      alert('نوبت با موفقیت حذف شد!');
    }
  };

  const getStatusBadge = (status: string) => {
    const classes = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      confirmed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      rejected: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };
    return classes[status as keyof typeof classes] || classes.pending;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'در انتظار تأیید',
      confirmed: 'تأیید شده',
      completed: 'انجام شده',
      cancelled: 'لغو شده',
      rejected: 'رد شده',
    };
    return labels[status as keyof typeof labels] || status;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-3xl font-light text-gray-800 dark:text-white mb-8">
          🎯 پنل مدیریت
        </h1>

        {/* آمار */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalUsers || 0}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">کاربران</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.totalAppointments || 0}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">کل نوبت‌ها</p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl">
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pendingAppointments || 0}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">در انتظار</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.confirmedAppointments || 0}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">تأیید شده</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.completedAppointments || 0}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">انجام شده</p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.cancelledAppointments || 0}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">لغو/رد</p>
          </div>
        </div>

        {/* تب‌ها */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setSelectedTab('appointments')}
            className={`px-4 py-2 text-sm font-medium transition ${
              selectedTab === 'appointments'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            📋 نوبت‌ها
          </button>
          <button
            onClick={() => setSelectedTab('users')}
            className={`px-4 py-2 text-sm font-medium transition ${
              selectedTab === 'users'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            👤 کاربران
          </button>
          <button
            onClick={() => setSelectedTab('stats')}
            className={`px-4 py-2 text-sm font-medium transition ${
              selectedTab === 'stats'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            📊 آمار
          </button>
        </div>

        {/* محتوای تب‌ها */}
        {selectedTab === 'appointments' && (
          <div className="space-y-4">
            {appointments.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                هیچ نوبتی ثبت نشده است
              </div>
            ) : (
              appointments.map((app) => (
                <div
                  key={app.id}
                  className="bg-gray-50 dark:bg-gray-800 p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                        {app.fullName}
                      </h3>
                      <div className="space-y-1 mt-2 text-sm text-gray-600 dark:text-gray-300">
                        <p>📱 {app.phone}</p>
                        <p>🆔 {app.nationalCode}</p>
                        <p>📅 {new Date(app.date).toLocaleDateString('fa-IR')}</p>
                        <p>🕐 {app.time}</p>
                        <p>📋 {app.service}</p>
                        {app.notes && <p className="text-gray-500 dark:text-gray-400">📝 {app.notes}</p>}
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          ثبت: {new Date(app.createdAt).toLocaleString('fa-IR')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(app.status)}`}>
                        {getStatusLabel(app.status)}
                      </span>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {app.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleConfirmAppointment(app.id)}
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs transition"
                            >
                              ✅ تأیید
                            </button>
                            <button
                              onClick={() => handleRejectAppointment(app.id)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs transition"
                            >
                              ❌ رد
                            </button>
                          </>
                        )}
                        {app.status === 'confirmed' && (
                          <button
                            onClick={() => handleCompleteAppointment(app.id)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs transition"
                          >
                            ✅ انجام شد
                          </button>
                        )}
                        {app.status !== 'cancelled' && app.status !== 'rejected' && app.status !== 'completed' && (
                          <button
                            onClick={() => handleDeleteAppointment(app.id)}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-xs transition"
                          >
                            🗑️ حذف
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {selectedTab === 'users' && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
                هیچ کاربری ثبت نشده است
              </div>
            ) : (
              users.map((user) => (
                <div
                  key={user.id}
                  className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700"
                >
                  <h4 className="font-semibold text-gray-800 dark:text-white">{user.fullName}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">📱 {user.phone}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">🆔 {user.nationalCode}</p>
                  {user.email && <p className="text-sm text-gray-600 dark:text-gray-300">📧 {user.email}</p>}
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    {user.isAdmin ? '👑 مدیر' : '👤 کاربر'}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    ثبت: {new Date(user.createdAt).toLocaleString('fa-IR')}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {selectedTab === 'stats' && (
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              📊 گزارش جامع
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">کل کاربران</p>
                <p className="text-2xl font-bold text-primary">{stats.totalUsers || 0}</p>
              </div>
              <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">کل نوبت‌ها</p>
                <p className="text-2xl font-bold text-primary">{stats.totalAppointments || 0}</p>
              </div>
              <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">نوبت‌های در انتظار</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingAppointments || 0}</p>
              </div>
              <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">نوبت‌های تأیید شده</p>
                <p className="text-2xl font-bold text-green-600">{stats.confirmedAppointments || 0}</p>
              </div>
              <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">نوبت‌های انجام شده</p>
                <p className="text-2xl font-bold text-blue-600">{stats.completedAppointments || 0}</p>
              </div>
              <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">نوبت‌های لغو/رد شده</p>
                <p className="text-2xl font-bold text-red-600">{(stats.cancelledAppointments || 0) + (stats.rejectedAppointments || 0)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;