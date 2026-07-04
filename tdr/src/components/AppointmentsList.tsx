import React from 'react';
import { useTranslation } from 'react-i18next';

export interface Appointment {
  id: string;
  userId: string;
  phone: string;
  nationalCode: string;
  fullName: string;
  date: string;
  time: string;
  service: string;
  notes: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';
  createdAt: string;
  updatedAt?: string;
}

interface AppointmentsListProps {
  appointments: Appointment[];
  onConfirm?: (id: string) => void;
  onCancel?: (id: string) => void;
  isAdmin?: boolean; // ✅ اضافه شده
}

const AppointmentsList: React.FC<AppointmentsListProps> = ({ 
  appointments, 
  onConfirm, 
  onCancel,
  isAdmin = false 
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'fa' || i18n.language === 'ar';

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isRTL) {
        return date.toLocaleDateString('fa-IR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  if (appointments.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
        <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-gray-500 dark:text-gray-400 mt-4">{t('appointments.noAppointments')}</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
          برای رزرو نوبت جدید، روی دکمه "رزرو نوبت" کلیک کنید
        </p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'rejected': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
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

  return (
    <div className="space-y-4">
      {appointments.map((appointment) => (
        <div
          key={appointment.id}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 sm:p-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition"
        >
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  {appointment.fullName}
                </h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                  {getStatusLabel(appointment.status)}
                </span>
                {/* ✅ نمایش شماره تلفن برای ادمین */}
                {isAdmin && (
                  <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                    📱 {appointment.phone}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-3 text-sm text-gray-600 dark:text-gray-300">
                <p>📱 {appointment.phone}</p>
                <p>🆔 {appointment.nationalCode}</p>
                <p>📅 {formatDate(appointment.date)}</p>
                <p>🕐 {appointment.time}</p>
                <p>📋 {getServiceLabel(appointment.service)}</p>
                {appointment.notes && (
                  <p className="col-span-full text-gray-500 dark:text-gray-400">
                    📝 {appointment.notes}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {appointment.status === 'pending' && (
                <>
                  {onConfirm && (
                    <button
                      onClick={() => onConfirm(appointment.id)}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm transition"
                    >
                      ✅ {t('appointments.confirm')}
                    </button>
                  )}
                  {onCancel && (
                    <button
                      onClick={() => onCancel(appointment.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition"
                    >
                      ❌ {t('appointments.cancel')}
                    </button>
                  )}
                </>
              )}
              {appointment.status === 'confirmed' && (
                <button className="text-primary hover:text-primary-hover text-sm transition px-4 py-2 border border-primary rounded-lg">
                  {t('appointments.reschedule')}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AppointmentsList;