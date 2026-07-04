import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    
    // ✅ فقط برای فارسی و عربی RTL فعال شود
    const isRTL = lang === 'fa' || lang === 'ar';
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    
    // ذخیره در localStorage
    localStorage.setItem('preferred-language', lang);
    localStorage.setItem('preferred-direction', isRTL ? 'rtl' : 'ltr');
  };

  // بازیابی زبان در اولین بار
  useEffect(() => {
    const savedLang = localStorage.getItem('preferred-language');
    if (savedLang && savedLang !== i18n.language) {
      const isRTL = savedLang === 'fa' || savedLang === 'ar';
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
      document.documentElement.lang = savedLang;
      i18n.changeLanguage(savedLang);
    }
  }, [i18n]);

  return (
    <div className="flex gap-1 text-sm bg-gray-100 dark:bg-gray-800 p-1 rounded-full">
      {[
        { code: 'en', label: 'EN', flag: '🇬🇧' },
        { code: 'fa', label: 'فا', flag: '🇮🇷' },
        { code: 'ar', label: 'ع', flag: '🇸🇦' },
      ].map((lang) => (
        <button
          key={lang.code}
          onClick={() => changeLanguage(lang.code)}
          className={`px-3 py-1 rounded-full transition text-xs font-medium ${
            i18n.language === lang.code
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <span className="hidden sm:inline">{lang.flag} </span>
          {lang.label}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;