import React from 'react';
import { useTranslation } from 'react-i18next';
import { useRTL } from '../hooks/useRTL';
const About: React.FC = () => {
  const { t } = useTranslation();
const isRTL = useRTL();
  return (
<div className={isRTL ? 'text-right' : 'text-left'}>
    <section id="about" className="py-12 sm:py-16 md:py-20">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider">
            {t('about.threeDecades')}
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-light mt-2">
                    {t('about.title')}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-4 text-sm sm:text-base leading-relaxed">
            {t('about.description')}
          </p>
          <div className="flex justify-center gap-4 mt-6">
            <button className="text-blue-600 hover:text-blue-700 font-medium text-sm sm:text-base">
              {t('about.readMore')}
            </button>
            <button className="text-blue-600 hover:text-blue-700 font-medium text-sm sm:text-base">
              {t('about.learnMore')}
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto mt-12 sm:mt-16">
          <h3 className="text-xl sm:text-2xl font-semibold text-center text-gray-800 dark:text-white">
            {t('about.whyChoose')}
          </h3>
          <p className="text-center text-gray-600 dark:text-gray-300 mt-2 text-sm sm:text-base">
            {t('about.tailored')}
          </p>

          <div className="grid sm:grid-cols-2 gap-6 sm:gap-8 mt-8 sm:mt-12">
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
                {t('about.results.title')}
              </h4>
              <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm">
                {t('about.results.desc')}
              </p>
              <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                {t('about.results.desc2')}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
                {t('about.science.title')}
              </h4>
              <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm">
                {t('about.science.desc')}
              </p>
              <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                {t('about.science.desc2')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
    </div>
  );
};

export default About;