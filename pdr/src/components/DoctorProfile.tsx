// src/components/DoctorProfile.tsx

import React from 'react';
import { 
  FaStar, 
  FaStarHalfAlt, 
  FaRegStar, 
  FaUserMd, 
  FaStethoscope, 
  FaUniversity, 
  FaFileAlt,
  FaPhone,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaClock,
  FaInstagram,
  FaTelegram,
  FaWhatsapp,
  FaLink,
  FaEnvelope
} from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';

interface DoctorProfileProps {
  rating: number;
  commentsCount: number;
}

const DoctorProfile: React.FC<DoctorProfileProps> = ({ rating, commentsCount }) => {
  const { t, language } = useLanguage();

  const renderStars = (rate: number) => {
    const stars = [];
    const fullStars = Math.floor(rate);
    const hasHalfStar = rate % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<FaStar key={i} className="text-yellow-400" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<FaStarHalfAlt key={i} className="text-yellow-400" />);
      } else {
        stars.push(<FaRegStar key={i} className="text-yellow-400" />);
      }
    }
    return stars;
  };

  const contactInfo = {
    phone: '۰۱۱-۳۳۳۳-۴۴۴۴',
    mobile: '۰۹۱۲-۱۲۳-۴۵۶۷',
    address: language === 'fa' 
      ? 'ساری، خیابان آزادی، نبش خیابان ۲۲ بهمن، ساختمان پزشکان پارسیان، طبقه ۳، واحد ۵'
      : 'Sari, Azadi St., 22 Bahman St. Corner, PARSIAN Medical Building, Floor 3, Unit 5',
    clinic: language === 'fa' ? 'مطب دکتر پرستو کریمی علی‌آبادی' : 'Dr. Parastoo Karimi Aliabadi Clinic',
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
    <section id="profile" className="bg-white rounded-2xl shadow-xl overflow-hidden">
      <div className="bg-gradient-to-l from-medical to-primary-600 p-6 text-white">
        <h2 className="text-2xl font-bold">{t('profile.title')}</h2>
        <p className="text-primary-100 text-sm mt-1">{t('profile.subtitle')}</p>
      </div>
      
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="w-32 h-32 bg-gradient-to-br from-primary-100 to-primary-300 rounded-full flex items-center justify-center flex-shrink-0">
            <FaUserMd className="text-5xl text-primary-700" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-800">{t('header.title')}</h3>
            <p className="text-medical font-semibold text-lg">{t('profile.specialist')}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm">{t('profile.medicalCode')}: ۱۰۳۷۳۴</span>
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">{t('profile.faculty')}</span>
              <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">{t('profile.university')}</span>
            </div>
          </div>
        </div>

        <div className="bg-primary-50 rounded-xl p-4 flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="flex gap-1 text-xl">
              {renderStars(rating)}
            </div>
            <span className="font-bold text-lg text-gray-800">{rating.toFixed(1)}</span>
          </div>
          <div className="text-gray-600">
            <span className="font-semibold">{commentsCount}</span> {t('profile.reviews')}
          </div>
          <div className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full">
            ⭐ {t('profile.rating')} {commentsCount} {t('profile.reviews')}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
              <FaPhone className="text-medical" />
              {t('contact.phone')}
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3">
                <FaPhone className="text-primary-500 w-4" />
                <span className="text-gray-600">{t('contact.phone')}:</span>
                <span className="font-semibold text-gray-800">{contactInfo.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <FaWhatsapp className="text-green-500 w-4" />
                <span className="text-gray-600">{t('contact.mobile')}:</span>
                <span className="font-semibold text-gray-800">{contactInfo.mobile}</span>
              </div>
              <div className="flex items-center gap-3">
                <FaEnvelope className="text-primary-500 w-4" />
                <span className="text-gray-600">{t('contact.email')}:</span>
                <span className="font-semibold text-gray-800">dr.karimi@clinic.ir</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
              <FaMapMarkerAlt className="text-red-500" />
              {t('contact.address')}
            </h4>
            <div className="space-y-2 text-sm">
              <p className="text-gray-600 leading-relaxed">
                {contactInfo.address}
              </p>
              <div className="mt-2">
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  📍 {t('contact.viewOnMap')}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
            <FaCalendarAlt className="text-primary-500" />
            {t('contact.workingHours')}
          </h4>
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
          <div className="mt-3 text-xs text-gray-500 flex items-center gap-2">
            <FaClock className="text-primary-400" />
            <span>{t('contact.appointment')}</span>
            <span className="text-gray-300">|</span>
            <span>{t('contact.call')}</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-primary-50 to-medical-light rounded-xl p-4">
          <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
            <FaLink className="text-primary-500" />
            {t('contact.socialMedia')}
          </h4>
          <div className="flex flex-wrap gap-4">
            <a 
              href={contactInfo.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all hover:scale-105"
            >
              <FaInstagram className="text-xl" />
              <span className="text-sm font-semibold">Instagram</span>
            </a>
            <a 
              href={contactInfo.social.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all hover:scale-105"
            >
              <FaTelegram className="text-xl" />
              <span className="text-sm font-semibold">Telegram</span>
            </a>
            <a 
              href={contactInfo.social.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all hover:scale-105"
            >
              <FaWhatsapp className="text-xl" />
              <span className="text-sm font-semibold">WhatsApp</span>
            </a>
            <a 
              href={contactInfo.social.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all hover:scale-105"
            >
              <FaLink className="text-xl" />
              <span className="text-sm font-semibold">Website</span>
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
            <FaStethoscope className="text-medical text-2xl" />
            <div>
              <p className="text-sm text-gray-500">{t('profile.specialty')}</p>
              <p className="font-semibold">{t('profile.nephrology')}</p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
            <FaUniversity className="text-primary-600 text-2xl" />
            <div>
              <p className="text-sm text-gray-500">{t('profile.specialty')}</p>
              <p className="font-semibold">{t('profile.university')}</p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
            <FaFileAlt className="text-primary-600 text-2xl" />
            <div>
              <p className="text-sm text-gray-500">{t('profile.articlesCount')}</p>
              <p className="font-semibold">۷ {t('profile.articlesCount')}</p>
            </div>
          </div>
        </div>

        <div className="prose max-w-none text-gray-700 leading-relaxed bg-primary-50/50 rounded-xl p-4">
          <p className="text-sm">{t('profile.bio')}</p>
        </div>

        <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-200">
          <button className="bg-medical hover:bg-primary-600 text-white px-6 py-2.5 rounded-lg transition-all hover:shadow-lg font-semibold text-sm flex items-center gap-2">
            <FaPhone />
            {t('contact.call')}
          </button>
          <button className="bg-primary-100 hover:bg-primary-200 text-primary-700 px-6 py-2.5 rounded-lg transition-all font-semibold text-sm flex items-center gap-2">
            <FaCalendarAlt />
            {t('contact.onlineAppointment')}
          </button>
          <button className="bg-green-100 hover:bg-green-200 text-green-700 px-6 py-2.5 rounded-lg transition-all font-semibold text-sm flex items-center gap-2">
            <FaWhatsapp />
            {t('contact.whatsapp')}
          </button>
        </div>
      </div>
    </section>
  );
};

export default DoctorProfile;