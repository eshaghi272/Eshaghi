import React from 'react';
import { useTranslation } from 'react-i18next';

const Consultation: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-primary-gradient">
      <div className="container mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-white">
          {t('consultation.title')}
        </h2>
        <p className="text-white/90 text-sm sm:text-base max-w-2xl mx-auto mt-3 sm:mt-4">
          {t('consultation.subtitle')}
        </p>
        <div className="flex justify-center gap-3 sm:gap-4 mt-6 sm:mt-8">
          <button className="bg-white text-primary hover:bg-gray-100 font-medium px-6 sm:px-8 py-2.5 sm:py-3 rounded-full transition text-sm sm:text-base">
            {t('consultation.book')}
          </button>
          <button className="border-2 border-white text-white hover:bg-white/10 font-medium px-6 sm:px-8 py-2.5 sm:py-3 rounded-full transition text-sm sm:text-base">
            {t('consultation.message')}
          </button>
        </div>
      </div>
    </section>
  );
};

export default Consultation;