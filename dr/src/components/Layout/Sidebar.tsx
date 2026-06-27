import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { X, Home, User, Stethoscope, Image, MessageSquare, Newspaper, GraduationCap, Phone } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();

  const navItems = [
    { to: '/', icon: Home, label: 'nav.home' },
    { to: '/about', icon: User, label: 'nav.about' },
    { to: '/services', icon: Stethoscope, label: 'nav.services' },
    { to: '/gallery', icon: Image, label: 'nav.gallery' },
    { to: '/testimonials', icon: MessageSquare, label: 'nav.testimonials' },
    { to: '/news', icon: Newspaper, label: 'nav.news' },
    { to: '/education', icon: GraduationCap, label: 'nav.education' },
    { to: '/contact', icon: Phone, label: 'nav.contact' },
  ];

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside className={`fixed top-0 left-0 h-full w-72 bg-white dark:bg-gray-800 shadow-xl z-50 transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static lg:shadow-none lg:w-64`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 lg:hidden">
          <span className="text-lg font-bold text-gray-800 dark:text-white">Menu</span>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <item.icon className="w-5 h-5" />
              <span>{t(item.label)}</span>
            </Link>
          ))}

          <Link
            to="/book"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-3 mt-4 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            <span>{t('nav.book')}</span>
          </Link>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
