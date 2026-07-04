import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggle from './ThemeToggle';
import ColorThemeSelector from './ColorThemeSelector';

interface NavigationProps {
  onNavigateToAppointments?: () => void;
  onOpenAuth?: () => void;
  onNavigateToAdmin?: () => void; // ✅ اضافه شده
}

const Navigation: React.FC<NavigationProps> = ({ 
  onNavigateToAppointments, 
  onOpenAuth, 
  onNavigateToAdmin // ✅ دریافت prop
}) => {
  const { t, i18n } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const isRTL = i18n.language === 'fa' || i18n.language === 'ar';

  // آیتم‌های منو
  const menuItems = [
    { key: 'home', label: t('nav.home') },
    { key: 'about', label: t('nav.about') },
    { key: 'treatments', label: t('nav.treatments') },
    { key: 'resources', label: t('nav.resources') },
    { key: 'appointments', label: t('appointments.title'), isSpecial: true },
  ];

  const handleMenuClick = (key: string) => {
    setIsMobileMenuOpen(false);
    if (key === 'appointments') {
      if (onNavigateToAppointments) {
        onNavigateToAppointments();
      }
    } else {
      const element = document.getElementById(key);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleSignupClick = () => {
    setIsMobileMenuOpen(false);
    if (onOpenAuth) {
      onOpenAuth();
    }
  };

  return (
    <nav className="container mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
      <div className={`text-xl sm:text-2xl font-light tracking-wider text-gray-800 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}>
        Dr. Tahmineh
      </div>

      {/* منوی دسکتاپ */}
      <ul className={`hidden md:flex ${isRTL ? 'space-x-reverse' : ''} space-x-8 text-gray-600 dark:text-gray-300`}>
        {['home', 'about', 'treatments', 'resources'].map((item) => (
          <li key={item}>
            <a href={`#${item}`} className="hover:text-primary transition text-sm">
              {t(`nav.${item}`)}
            </a>
          </li>
        ))}
        {/* لینک نوبت‌ها */}
        <li>
          <button
            onClick={onNavigateToAppointments}
            className="hover:text-primary transition text-sm bg-primary/10 px-4 py-1 rounded-full"
          >
            {t('appointments.title')}
          </button>
        </li>
        {/* ✅ لینک مدیریت - فقط اگر onNavigateToAdmin وجود داشته باشد */}
        {onNavigateToAdmin && (
          <li>
            <button
              onClick={onNavigateToAdmin}
              className="hover:text-primary transition text-sm bg-primary/10 px-4 py-1 rounded-full"
            >
              🎯 مدیریت
            </button>
          </li>
        )}
      </ul>

      <div className="flex items-center gap-2 sm:gap-4">
        <ColorThemeSelector />
        <ThemeToggle />
        <LanguageSwitcher />
        <button 
          onClick={onOpenAuth}
          className="hidden sm:block bg-primary hover:bg-primary-hover text-white px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm transition"
        >
          {t('signup.button')}
        </button>
        {/* دکمه منوی موبایل */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 text-gray-600 dark:text-gray-300"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* منوی موبایل */}
      {isMobileMenuOpen && (
        <div className="absolute top-20 left-0 right-0 bg-white dark:bg-gray-900 shadow-lg p-4 md:hidden z-50">
          <ul className="space-y-3 text-center">
            {menuItems.map((item) => (
              <li key={item.key}>
                <button
                  onClick={() => handleMenuClick(item.key)}
                  className={`w-full block hover:text-primary transition ${
                    item.isSpecial ? 'text-primary font-medium' : 'text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {item.label}
                </button>
              </li>
            ))}
            {/* ✅ لینک مدیریت در منوی موبایل */}
            {onNavigateToAdmin && (
              <li>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onNavigateToAdmin();
                  }}
                  className="w-full block text-primary font-medium hover:text-primary-hover transition"
                >
                  🎯 مدیریت
                </button>
              </li>
            )}
            <li>
              <button 
                onClick={handleSignupClick}
                className="w-full bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-full text-sm transition"
              >
                {t('signup.button')}
              </button>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Navigation;