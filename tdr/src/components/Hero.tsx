import React from 'react';
import { useTranslation } from 'react-i18next';
import doctorImage from '../assets/images/dr-tahmineh.jpg';

interface HeroProps {
  onBookAppointment?: () => void;
}

const Hero: React.FC<HeroProps> = ({ onBookAppointment }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'fa' || i18n.language === 'ar';

  return (
    <section className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-20">
      <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
        <div className={`order-2 md:order-1 ${isRTL ? 'text-right' : 'text-left'}`}>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light leading-tight">
            <span className="block text-gray-700 dark:text-gray-300">{t('hero.title1')}</span>
            <span className="block font-medium text-gray-800 dark:text-white">
              {t('hero.title2')}
            </span>
            <span className="block text-primary">{t('hero.title3')}</span>
          </h1>
          <p className={`mt-4 sm:mt-6 text-gray-600 dark:text-gray-400 leading-relaxed text-sm sm:text-base ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('hero.description')}
          </p>
          <div className={`flex gap-3 sm:gap-4 mt-6 sm:mt-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <button
              onClick={onBookAppointment}
              className="bg-primary hover:bg-primary-hover text-white font-medium px-6 sm:px-8 py-2.5 sm:py-3 rounded-full transition transform hover:scale-105 text-sm sm:text-base"
            >
              {t('hero.cta')}
            </button>
            <button className="border-2 border-primary text-primary hover:bg-primary/10 font-medium px-6 sm:px-8 py-2.5 sm:py-3 rounded-full transition text-sm sm:text-base">
              {t('about.learnMore')}
            </button>
          </div>
        </div>
        <div className="relative order-1 md:order-2">
          <div className="aspect-square bg-primary-gradient dark:from-gray-700 dark:to-gray-600 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden">
            <img
              src={doctorImage}
              alt="Dr. Tahmineh Marzban"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;