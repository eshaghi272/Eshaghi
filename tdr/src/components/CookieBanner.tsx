import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const CookieBanner: React.FC = () => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 shadow-2xl border-t border-gray-200 dark:border-gray-700 p-3 sm:p-4 z-50">
      <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
        <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 text-center sm:text-left">
          <p>{t('cookie.title')}</p>
          <p className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs mt-0.5 sm:mt-1">
            {t('cookie.description')}
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
          <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 text-xs sm:text-sm underline">
            {t('cookie.settings')}
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm transition"
          >
            {t('cookie.deny')}
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-1 sm:py-2 rounded-full text-xs sm:text-sm transition"
          >
            {t('cookie.allow')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;