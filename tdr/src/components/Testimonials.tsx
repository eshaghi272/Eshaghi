import React from 'react';
import { useTranslation } from 'react-i18next';

const Testimonials: React.FC = () => {
  const { t } = useTranslation();
  const testimonials = t('testimonials.items', { returnObjects: true }) as Array<{
    quote: string;
    name: string;
    role: string;
  }>;

  return (
    <section id="testimonials" className="py-12 sm:py-16 md:py-20 bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto px-4 sm:px-6">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-center">
          {t('testimonials.title')}
        </h2>
        <p className="text-center text-gray-600 dark:text-gray-300 mt-2 text-sm sm:text-base">
          {t('testimonials.subtitle')}
        </p>

        <div className="max-w-3xl mx-auto mt-8 sm:mt-12">
          {testimonials.map((item, index) => (
            <div key={index} className="bg-white dark:bg-gray-700 p-6 sm:p-8 rounded-2xl shadow-lg">
              <p className="text-gray-700 dark:text-gray-200 text-base sm:text-lg italic leading-relaxed">
                "{item.quote}"
              </p>
              <div className="mt-4">
                <p className="font-semibold text-gray-800 dark:text-white">{item.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{item.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;