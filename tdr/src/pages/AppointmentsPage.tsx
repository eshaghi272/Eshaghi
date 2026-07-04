import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next'; // ✅ اصلاح شده
import AuthModal from '../components/AuthModal';
import BookingModal, { BookingData } from '../components/BookingModal';
import AppointmentsList, { Appointment } from '../components/AppointmentsList';
import DataService from '../services/DataService';

interface AppointmentsPageProps {
  onBackToHome?: () => void;
  onNavigateToAdmin?: () => void;
}

const AppointmentsPage: React.FC<AppointmentsPageProps> = ({ onBackToHome, onNavigateToAdmin }) => {
  const { t } = useTranslation();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [user, setUser] = useState<{ phone: string; nationalCode: string; fullName?: string } | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const all = DataService.getAppointments();
    setAllAppointments(all);
    
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        console.log('✅ User restored from localStorage:', parsedUser);
      } catch (e) {
        console.error('Error loading user:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      const userAppointments = allAppointments.filter(
        app => app.phone === user.phone && app.nationalCode === user.nationalCode
      );
      setAppointments(userAppointments);
      console.log(`📋 Found ${userAppointments.length} appointments for user:`, user.phone);
    } else {
      setAppointments([]);
    }
  }, [user, allAppointments]);

  const loadAppointments = () => {
    const all = DataService.getAppointments();
    setAllAppointments(all);
  };

  const handleLogin = (data: { phone: string; nationalCode: string; fullName?: string }) => {
    console.log('✅ Login successful:', data);
    setUser(data);
    localStorage.setItem('currentUser', JSON.stringify(data));
    setIsAuthOpen(false);
    loadAppointments();
    setTimeout(() => {
      setIsBookingOpen(true);
    }, 500);
  };

  const handleRegister = (data: { phone: string; nationalCode: string; fullName: string }) => {
    console.log('✅ Register successful:', data);
    setUser(data);
    localStorage.setItem('currentUser', JSON.stringify(data));
    setIsAuthOpen(false);
    loadAppointments();
    setTimeout(() => {
      setIsBookingOpen(true);
    }, 500);
  };

  const handleBook = (bookingData: any) => {
    console.log('📋 Booking data received in AppointmentsPage:', bookingData);
    
    if (!user) {
      alert('لطفاً ابتدا وارد شوید');
      return;
    }

    loadAppointments();
    setIsBookingOpen(false);
    alert(t('booking.success'));
  };

  const handleConfirm = (id: string) => {
    DataService.confirmAppointment(id);
    loadAppointments();
  };

  const handleCancel = (id: string) => {
    DataService.cancelAppointment(id);
    loadAppointments();
  };

  const handleOpenBooking = () => {
    if (user) {
      console.log('🔓 Opening booking with user:', user);
      setIsBookingOpen(true);
    } else {
      console.log('🔐 No user, opening auth modal');
      setIsAuthOpen(true);
    }
  };

  const handleLogout = () => {
    if (window.confirm('آیا از خروج از حساب کاربری مطمئن هستید؟')) {
      localStorage.removeItem('currentUser');
      setUser(null);
      setAppointments([]);
      console.log('👋 User logged out');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 sm:py-12">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-light text-gray-800 dark:text-white">
              {t('appointments.title')}
            </h1>
            {user && (
              <div className="flex items-center gap-3 mt-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user.fullName} | 📱 {user.phone}
                </p>
                <button
                  onClick={handleLogout}
                  className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition"
                >
                  🚪 خروج
                </button>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleOpenBooking}
              className="bg-primary hover:bg-primary-hover text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-sm sm:text-base transition transform hover:scale-105"
            >
              {t('booking.title')}
            </button>
            <button
              onClick={onBackToHome}
              className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-sm sm:text-base transition"
            >
              🏠 {t('nav.home')}
            </button>
          </div>
        </div>

        <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          {user ? (
            <span>📋 تعداد نوبت‌های شما: {appointments.length}</span>
          ) : (
            <span>🔐 لطفاً وارد شوید تا نوبت‌های خود را مشاهده کنید</span>
          )}
        </div>

        <AppointmentsList
          appointments={appointments}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      </div>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />

      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        onBook={handleBook}
        userData={user || { phone: '', nationalCode: '' }}
      />
    </div>
  );
};

export default AppointmentsPage;