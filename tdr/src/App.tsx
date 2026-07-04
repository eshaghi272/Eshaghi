import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeProvider } from './components/ThemeProvider';
import { ColorThemeProvider } from './context/ThemeContext';
import HomePage from './pages/HomePage';
import AppointmentsPage from './pages/AppointmentsPage';
import AdminAppointmentsPage from './pages/AdminAppointmentsPage';
import DataService from './services/DataService';
import './i18n';

function App() {
  const { i18n } = useTranslation();
  const [currentPage, setCurrentPage] = useState<'home' | 'appointments' | 'admin'>('home');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const currentLang = i18n.language;
    const isRTL = currentLang === 'fa' || currentLang === 'ar';
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLang;
    
    if (isRTL) {
      document.documentElement.classList.add('rtl');
    } else {
      document.documentElement.classList.remove('rtl');
    }

    // بررسی ادمین
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        const admin = DataService.isAdmin(user.phone);
        setIsAdmin(admin);
      } catch (e) {
        console.error('Error checking admin:', e);
      }
    }
  }, [i18n.language]);

  return (
    <ThemeProvider>
      <ColorThemeProvider>
        {currentPage === 'home' && (
          <HomePage 
            onNavigateToAppointments={() => setCurrentPage('appointments')}
            onNavigateToAdmin={() => isAdmin && setCurrentPage('admin')}
          />
        )}
        {currentPage === 'appointments' && (
          <AppointmentsPage 
            onBackToHome={() => setCurrentPage('home')}
            onNavigateToAdmin={() => isAdmin && setCurrentPage('admin')}
          />
        )}
        {currentPage === 'admin' && (
          <AdminAppointmentsPage 
            onBackToHome={() => setCurrentPage('home')}
          />
        )}
      </ColorThemeProvider>
    </ThemeProvider>
  );
}

export default App;