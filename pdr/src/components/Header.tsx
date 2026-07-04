// src/components/Header.tsx

import React, { useState } from 'react';
import { 
  FaUserMd, 
  FaBars, 
  FaTimes, 
  FaHome, 
  FaUser, 
  FaNewspaper, 
  FaComment, 
  FaCog, 
  FaPhone, 
  FaInstagram, 
  FaTelegram, 
  FaWhatsapp,
  FaMapMarkerAlt,
  FaClock
} from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

interface HeaderProps {
  onAdminClick: () => void;
  isAdmin: boolean;
}

const Header: React.FC<HeaderProps> = ({ onAdminClick, isAdmin }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { t, language } = useLanguage();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const menuItems = [
    { id: 'home', label: t('header.home'), icon: FaHome, href: '#home' },
    { id: 'profile', label: t('header.profile'), icon: FaUser, href: '#profile' },
    { id: 'contact', label: t('header.contact'), icon: FaPhone, href: '#contact' },
    { id: 'articles', label: t('header.articles'), icon: FaNewspaper, href: '#articles' },
    { id: 'comments', label: t('header.comments'), icon: FaComment, href: '#comments' },
  ];

  const socialItems = [
    { id: 'instagram', label: 'Instagram', icon: FaInstagram, href: 'https://instagram.com/dr.karimi.nefro', color: 'bg-gradient-to-r from-pink-500 to-purple-600' },
    { id: 'telegram', label: 'Telegram', icon: FaTelegram, href: 'https://t.me/drkarimi', color: 'bg-blue-500' },
    { id: 'whatsapp', label: 'WhatsApp', icon: FaWhatsapp, href: 'https://wa.me/989121234567', color: 'bg-green-500' },
  ];

  return (
    <>
      <header className="bg-gradient-to-r from-primary-700 to-primary-900 text-white shadow-lg sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3 cursor-pointer">
              <FaUserMd className="text-3xl text-primary-300" />
              <div>
                <h1 className="text-xl font-bold">{t('header.title')}</h1>
                <p className="text-xs text-primary-200">{t('header.subtitle')}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              
              <nav className="hidden lg:flex items-center gap-6">
                {menuItems.map((item) => (
                  <a
                    key={item.id}
                    href={item.href}
                    className="hover:text-primary-200 transition-colors flex items-center gap-2 text-sm"
                  >
                    <item.icon className="text-sm" />
                    {item.label}
                  </a>
                ))}
                <button
                  onClick={onAdminClick}
                  className="bg-primary-500 hover:bg-primary-400 text-white px-4 py-2 rounded-lg transition-colors text-sm font-semibold flex items-center gap-2"
                >
                  <FaCog />
                  {isAdmin ? t('header.dashboard') : t('header.admin')}
                </button>
              </nav>

              <button
                className="lg:hidden text-2xl p-2 hover:bg-primary-800 rounded-lg transition-colors"
                onClick={toggleSidebar}
                aria-label="باز کردن منو"
              >
                <FaBars />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-50 lg:hidden"
          onClick={closeSidebar}
          style={{ backdropFilter: 'blur(4px)' }}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 ${language === 'fa' ? 'right-0' : 'left-0'} h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
          isSidebarOpen ? 'translate-x-0' : language === 'fa' ? 'translate-x-full' : '-translate-x-full'
        }`}
      >
        <div className="bg-gradient-to-r from-primary-700 to-primary-900 p-4 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <FaUserMd className="text-2xl" />
            </div>
            <div>
              <p className="font-bold text-sm">{t('header.title')}</p>
              <p className="text-xs text-primary-200">{t('header.subtitle')}</p>
            </div>
          </div>
          <button
            onClick={closeSidebar}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4" style={{ height: 'calc(100% - 180px)' }}>
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <a
                key={item.id}
                href={item.href}
                onClick={closeSidebar}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-all group"
              >
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                  <item.icon className="text-primary-600 text-lg" />
                </div>
                <span className="font-medium">{item.label}</span>
              </a>
            ))}

            <div className="border-t border-gray-200 my-4"></div>

            <button
              onClick={() => {
                onAdminClick();
                closeSidebar();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-all group"
            >
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                <FaCog className="text-primary-600 text-lg" />
              </div>
              <span className="font-medium">{isAdmin ? t('header.dashboard') : t('header.admin')}</span>
            </button>
          </nav>

          <div className="mt-6">
            <p className="text-xs text-gray-400 mb-3">{t('contact.socialMedia')}</p>
            <div className="flex flex-wrap gap-2">
              {socialItems.map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${item.color} text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:shadow-lg transition-all hover:scale-105 flex-1 justify-center`}
                >
                  <item.icon />
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-500 space-y-1 text-center">
            <p className="flex items-center justify-center gap-2">
              <FaPhone className="text-primary-500" />
              <span className="font-semibold text-gray-700">۰۱۱-۳۳۳۳-۴۴۴۴</span>
            </p>
            <p className="flex items-center justify-center gap-2">
              <FaMapMarkerAlt className="text-red-500" />
              <span>{language === 'fa' ? 'ساری، خیابان آزادی' : 'Sari, Azadi St.'}</span>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;