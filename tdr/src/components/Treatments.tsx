import React from 'react';
import { useTranslation } from 'react-i18next';

const Treatments: React.FC = () => {
  const { t } = useTranslation();
  const treatments = t('treatments.items', { returnObjects: true }) as Array<{
    category: string;
    name: string;
    desc: string;
  }>;

  return (
    <section id="treatments" className="py-12 sm:py-16 md:py-20 bg-primary-light dark:bg-gray-800">
      <div className="container mx-auto px-4 sm:px-6">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-center text-gray-800 dark:text-white">
          {t('treatments.title')}
        </h2>
        <p className="text-xl sm:text-2xl md:text-3xl font-medium text-center text-gray-800 dark:text-white mt-2">
          {t('treatments.subtitle')}
        </p>
        <p className="text-center text-gray-600 dark:text-gray-400 mt-2 text-sm sm:text-base">
          {t('treatments.precision')}
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-8 sm:mt-12">
          {treatments.map((item, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-700 p-4 sm:p-6 rounded-xl shadow-md hover:shadow-xl transition dark:shadow-gray-800 hover:shadow-primary/20"
            >
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                {item.category}
              </span>
              <h3 className="text-base sm:text-lg font-semibold mt-2 text-gray-800 dark:text-white">
                {item.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{item.desc}</p>
              <button className="mt-4 text-primary hover:text-primary-hover text-sm font-medium">
                {t('treatments.explore')}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Treatments;