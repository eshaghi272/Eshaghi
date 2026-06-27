import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { Menu, Globe, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { t, language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50 transition-colors duration-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <button
              onClick={onMenuClick}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden"
              aria-label="Toggle menu"
            >
              <Menu className="w-6 h-6 text-gray-700 dark:text-gray-200" />
            </button>
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                DA
              </div>
              <span className="text-lg font-bold text-gray-800 dark:text-white hidden sm:block">
                Dr. Abedian Surgery
              </span>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-6">
            <Link to="/" className="text-gray-600 dark:text-gray-300 hover:text-primary transition-colors text-sm font-medium">
              {t('nav.home')}
            </Link>
            <Link to="/about" className="text-gray-600 dark:text-gray-300 hover:text-primary transition-colors text-sm font-medium">
              {t('nav.about')}
            </Link>
            <Link to="/services" className="text-gray-600 dark:text-gray-300 hover:text-primary transition-colors text-sm font-medium">
              {t('nav.services')}
            </Link>
            <Link to="/gallery" className="text-gray-600 dark:text-gray-300 hover:text-primary transition-colors text-sm font-medium">
              {t('nav.gallery')}
            </Link>
            <Link to="/testimonials" className="text-gray-600 dark:text-gray-300 hover:text-primary transition-colors text-sm font-medium">
              {t('nav.testimonials')}
            </Link>
            <Link to="/news" className="text-gray-600 dark:text-gray-300 hover:text-primary transition-colors text-sm font-medium">
              {t('nav.news')}
            </Link>
            <Link to="/education" className="text-gray-600 dark:text-gray-300 hover:text-primary transition-colors text-sm font-medium">
              {t('nav.education')}
            </Link>
            <Link to="/contact" className="text-gray-600 dark:text-gray-300 hover:text-primary transition-colors text-sm font-medium">
              {t('nav.contact')}
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/book"
              className="hidden md:block px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
            >
              {t('nav.book')}
            </Link>

            <button
              onClick={toggleLanguage}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle language"
            >
              <Globe className="w-5 h-5 text-gray-700 dark:text-gray-200" />
              <span className="sr-only">{language === 'en' ? 'فارسی' : 'English'}</span>
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5 text-gray-700" />
              ) : (
                <Sun className="w-5 h-5 text-yellow-400" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
