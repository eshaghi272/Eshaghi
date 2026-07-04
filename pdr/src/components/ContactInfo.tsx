// src/components/ContactInfo.tsx

import React from 'react';
import { 
  FaPhone, 
  FaMapMarkerAlt, 
  FaClock, 
  FaInstagram, 
  FaTelegram, 
  FaWhatsapp, 
  FaLink, 
  FaEnvelope,
  FaCalendarCheck
} from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';

const ContactInfo: React.FC = () => {
  const { t, language } = useLanguage();

  const contactInfo = {
    phone: '۰۱۱-۳۳۳۳-۴۴۴۴',
    mobile: '۰۹۱۲-۱۲۳-۴۵۶۷',
    email: 'dr.karimi@clinic.ir',
    address: language === 'fa' 
      ? 'ساری، خیابان آزادی، نبش خیابان ۲۲ بهمن، ساختمان پزشکان پارسیان، طبقه ۳، واحد ۵'
      : 'Sari, Azadi St., 22 Bahman St. Corner, PARSIAN Medical Building, Floor 3, Unit 5',
    workingHours: {
      saturday: '۸:۰۰ - ۱۴:۰۰',
      sunday: '۸:۰۰ - ۱۴:۰۰',
      monday: '۸:۰۰ - ۲۰:۰۰',
      tuesday: '۸:۰۰ - ۱۴:۰۰',
      wednesday: '۸:۰۰ - ۲۰:۰۰',
      thursday: '۸:۰۰ - ۱۴:۰۰',
      friday: language === 'fa' ? 'تعطیل' : 'Closed',
    },
    social: {
      instagram: 'https://instagram.com/dr.karimi.nefro',
      telegram: 'https://t.me/drkarimi',
      whatsapp: 'https://wa.me/989121234567',
      website: 'https://drkarimi.ir',
    }
  };

  const weekDays = {
    saturday: t('weekDays.saturday'),
    sunday: t('weekDays.sunday'),
    monday: t('weekDays.monday'),
    tuesday: t('weekDays.tuesday'),
    wednesday: t('weekDays.wednesday'),
    thursday: t('weekDays.thursday'),
    friday: t('weekDays.friday'),
  };

  return (
    <section id="contact" className="bg-white rounded-2xl shadow-xl overflow-hidden">
      <div className="bg-gradient-to-l from-primary-600 to-primary-800 p-6 text-white">
        <h2 className="text-2xl font-bold">{t('contact.title')}</h2>
        <p className="text-primary-200 text-sm mt-1">{t('contact.subtitle')}</p>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 rounded-xl p-4 flex items-start gap-4">
            <div className="bg-green-100 p-3 rounded-full">
              <FaPhone className="text-green-600 text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('contact.phone')}</p>
              <p className="font-bold text-lg text-gray-800">{contactInfo.phone}</p>
              <p className="text-sm text-gray-400">{t('contact.mobile')}: {contactInfo.mobile}</p>
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl p-4 flex items-start gap-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <FaEnvelope className="text-blue-600 text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('contact.email')}</p>
              <p className="font-bold text-gray-800">{contactInfo.email}</p>
              <p className="text-sm text-gray-400">24/7 {language === 'fa' ? 'پاسخگویی' : 'Support'}</p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 rounded-xl p-4 flex items-start gap-4">
          <div className="bg-red-100 p-3 rounded-full">
            <FaMapMarkerAlt className="text-red-600 text-xl" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{t('contact.address')}</p>
            <p className="font-semibold text-gray-800">{contactInfo.address}</p>
            <button className="mt-2 text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200 transition-colors">
              📍 {t('contact.viewOnMap')}
            </button>
          </div>
        </div>

        <div className="bg-purple-50 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-purple-100 p-2 rounded-full">
              <FaClock className="text-purple-600 text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('contact.workingHours')}</p>
              <p className="font-semibold text-gray-800">{t('contact.appointment')}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(contactInfo.workingHours).map(([day, hours]) => (
              <div 
                key={day} 
                className={`p-3 rounded-lg text-center ${
                  day === 'friday' 
                    ? 'bg-red-50 border border-red-200' 
                    : 'bg-white border border-gray-200'
                }`}
              >
                <p className={`font-semibold text-sm ${
                  day === 'friday' ? 'text-red-600' : 'text-gray-700'
                }`}>
                  {weekDays[day as keyof typeof weekDays]}
                </p>
                <p className={`text-xs mt-1 ${
                  day === 'friday' ? 'text-red-500' : 'text-primary-600'
                }`}>
                  {hours}
                </p>
                {day === 'friday' && (
                  <span className="text-xs text-red-400">🕌 {t('common.closed')}</span>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <FaCalendarCheck className="text-primary-400" />
              {language === 'fa' ? 'نوبت‌دهی: شنبه تا چهارشنبه' : 'Appointments: Sat - Wed'}
            </span>
            <span className="text-gray-300">|</span>
            <span>{t('contact.call')}: {contactInfo.phone}</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4">
          <p className="text-sm text-gray-500 mb-3">{t('contact.socialMedia')}</p>
          <div className="flex flex-wrap gap-3">
            <a 
              href={contactInfo.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all hover:scale-105 text-sm"
            >
              <FaInstagram className="text-lg" />
              Instagram
            </a>
            <a 
              href={contactInfo.social.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all hover:scale-105 text-sm"
            >
              <FaTelegram className="text-lg" />
              Telegram
            </a>
            <a 
              href={contactInfo.social.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all hover:scale-105 text-sm"
            >
              <FaWhatsapp className="text-lg" />
              WhatsApp
            </a>
            <a 
              href={contactInfo.social.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all hover:scale-105 text-sm"
            >
              <FaLink className="text-lg" />
              Website
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button className="bg-medical hover:bg-primary-600 text-white px-4 py-3 rounded-lg transition-all hover:shadow-lg font-semibold text-sm flex items-center justify-center gap-2">
            <FaPhone />
            {t('contact.call')}
          </button>
          <button className="bg-primary-100 hover:bg-primary-200 text-primary-700 px-4 py-3 rounded-lg transition-all font-semibold text-sm flex items-center justify-center gap-2">
            <FaCalendarCheck />
            {t('contact.onlineAppointment')}
          </button>
          <button className="bg-green-100 hover:bg-green-200 text-green-700 px-4 py-3 rounded-lg transition-all font-semibold text-sm flex items-center justify-center gap-2">
            <FaWhatsapp />
            {t('contact.whatsapp')}
          </button>
        </div>
      </div>
    </section>
  );
};

export default ContactInfo;