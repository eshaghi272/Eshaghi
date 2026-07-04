import React from 'react';
import { useTranslation } from 'react-i18next';

const SignupBanner: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="bg-gray-100 dark:bg-gray-800 py-4 sm:py-6 px-4 border-y border-gray-200 dark:border-gray-700">
      <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
        <p className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm text-center sm:text-left">
          {t('signup.text')}
        </p>
        <div className="flex gap-2 sm:gap-3">
          <button className="bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 sm:px-6 py-1.5 sm:py-2 rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-50 transition text-xs sm:text-sm">
            {t('signup.continue')}
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-1.5 sm:py-2 rounded-full transition text-xs sm:text-sm">
            {t('signup.button')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignupBanner;