import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import DataService from '../services/DataService';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBook: (data: any) => void;
  userData: { phone: string; nationalCode: string; fullName?: string };
}

export interface BookingData {
  phone: string;
  nationalCode: string;
  fullName?: string;
  date: string;
  time: string;
  service: string;
  notes: string;
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, onBook, userData }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'fa' || i18n.language === 'ar';
  
  const [formData, setFormData] = useState<BookingData>({
    phone: userData.phone || '',
    nationalCode: userData.nationalCode || '',
    fullName: userData.fullName || '',
    date: '',
    time: '',
    service: '',
    notes: '',
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // به‌روزرسانی فرم当他 userData تغییر می‌کند
  useEffect(() => {
    if (userData.phone && userData.nationalCode) {
      setFormData(prev => ({
        ...prev,
        phone: userData.phone || '',
        nationalCode: userData.nationalCode || '',
        fullName: userData.fullName || '',
      }));
      console.log('🔄 UserData updated in BookingModal:', userData);
    }
  }, [userData]);

  if (!isOpen) return null;

  const services = [
    { value: 'consultation', label: t('booking.serviceConsultation') },
    { value: 'followup', label: t('booking.serviceFollowUp') },
    { value: 'treatment', label: t('booking.serviceTreatment') },
    { value: 'emergency', label: t('booking.serviceEmergency') },
  ];

  const times = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  ];

  const isDateAvailable = (date: Date) => {
    const day = date.getDay();
    if (day === 5 || day === 6) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 30);
    return date >= today && date <= maxDate;
  };

  const getDateValue = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return date.toLocaleDateString('en-US', options);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!selectedDate) newErrors.date = t('validation.required');
    if (!formData.time) newErrors.time = t('validation.required');
    if (!formData.service) newErrors.service = t('validation.required');
    if (!formData.phone) newErrors.phone = t('booking.phoneRequired');
    if (!formData.nationalCode) newErrors.nationalCode = t('booking.nationalCodeRequired');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ تنها یک تابع handleSubmit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('=== START BOOKING SUBMIT ===');
    console.log('Form data:', formData);
    console.log('Selected date:', selectedDate);
    console.log('User data:', userData);
    
    setSubmitError(null);
    
    // اعتبارسنجی
    if (!validate()) {
      console.log('❌ Validation failed');
      return;
    }
    
    if (!selectedDate) {
      console.log('❌ No date selected');
      setErrors(prev => ({ ...prev, date: t('validation.required') }));
      return;
    }
    
    if (!formData.time) {
      console.log('❌ No time selected');
      setErrors(prev => ({ ...prev, time: t('validation.required') }));
      return;
    }
    
    if (!formData.service) {
      console.log('❌ No service selected');
      setErrors(prev => ({ ...prev, service: t('validation.required') }));
      return;
    }
    
    // بررسی اطلاعات کاربر
    if (!formData.phone || !formData.nationalCode) {
      console.log('❌ User data missing:', { phone: formData.phone, nationalCode: formData.nationalCode });
      setSubmitError('اطلاعات کاربر کامل نیست. لطفاً دوباره وارد شوید.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const dateStr = getDateValue(selectedDate);
      console.log('✅ Date string:', dateStr);
      
      // پیدا کردن کاربر در دیتابیس
      const user = DataService.getUserByPhone(formData.phone);
      console.log('👤 Found user:', user);
      
      if (!user) {
        setSubmitError('کاربر یافت نشد. لطفاً ثبت‌نام کنید.');
        setIsSubmitting(false);
        return;
      }

      const bookingData = {
        userId: user.id,
        phone: formData.phone,
        nationalCode: formData.nationalCode,
        fullName: user.fullName,
        date: dateStr,
        time: formData.time,
        service: formData.service,
        notes: formData.notes || '',
        status: 'pending' as const,
      };
      
      console.log('📋 Booking data to save:', bookingData);
      
      // ذخیره در DataService
      const newAppointment = DataService.addAppointment(bookingData);
      console.log('✅ Appointment saved:', newAppointment);
      
      // فراخوانی تابع onBook
      onBook(newAppointment);
      
      // Reset form
      setFormData({
        phone: userData.phone || '',
        nationalCode: userData.nationalCode || '',
        fullName: userData.fullName || '',
        date: '',
        time: '',
        service: '',
        notes: '',
      });
      setSelectedDate(null);
      setErrors({});
      console.log('=== BOOKING SUCCESS ===');
      
    } catch (error) {
      console.error('❌ Error submitting booking:', error);
      setSubmitError(t('booking.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    if (date) {
      setFormData(prev => ({ ...prev, date: getDateValue(date) }));
    } else {
      setFormData(prev => ({ ...prev, date: '' }));
    }
    if (errors.date) {
      setErrors(prev => ({ ...prev, date: '' }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg mx-auto p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white text-center">
          {t('booking.title')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-1">
          {t('booking.subtitle')}
        </p>

        {submitError && (
          <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('auth.phone')} <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border rounded-lg bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 cursor-not-allowed"
              disabled
              dir="ltr"
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('auth.nationalCode')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="nationalCode"
              value={formData.nationalCode}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border rounded-lg bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 cursor-not-allowed"
              disabled
              dir="ltr"
            />
            {errors.nationalCode && <p className="text-red-500 text-xs mt-1">{errors.nationalCode}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('booking.selectDate')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <DatePicker
                selected={selectedDate}
                onChange={handleDateChange}
                dateFormat="EEEE, MMMM d, yyyy"
                placeholderText={t('booking.selectDate')}
                minDate={new Date()}
                maxDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
                filterDate={isDateAvailable}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition ${
                  errors.date ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                wrapperClassName="w-full"
                popperClassName="react-datepicker-popper"
                calendarClassName="react-datepicker-calendar"
                dayClassName={(date) => {
                  const day = date.getDay();
                  if (day === 5 || day === 6) return 'react-datepicker__day--weekend';
                  return '';
                }}
                formatWeekDay={(day) => day.substring(0, 3)}
                locale="en-US"
                isClearable={false}
                showPopperArrow={false}
                popperPlacement="bottom-start"
                required
              />
              {selectedDate && (
                <div className="mt-2 text-sm text-primary font-medium">
                  📅 {formatDate(selectedDate)}
                </div>
              )}
            </div>
            {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('booking.selectTime')} <span className="text-red-500">*</span>
            </label>
            <select
              name="time"
              value={formData.time}
              onChange={handleChange}
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition ${
                errors.time ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              required
            >
              <option value="">{t('booking.selectTime')}</option>
              {times.map((time) => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
            {errors.time && <p className="text-red-500 text-xs mt-1">{errors.time}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('booking.selectService')} <span className="text-red-500">*</span>
            </label>
            <select
              name="service"
              value={formData.service}
              onChange={handleChange}
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition ${
                errors.service ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              required
            >
              <option value="">{t('booking.selectService')}</option>
              {services.map((service) => (
                <option key={service.value} value={service.value}>{service.label}</option>
              ))}
            </select>
            {errors.service && <p className="text-red-500 text-xs mt-1">{errors.service}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('booking.notes')}
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder={t('booking.notesPlaceholder')}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white transition resize-none"
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full font-medium py-3 rounded-lg transition transform hover:scale-105 text-sm sm:text-base ${
              isSubmitting 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-primary hover:bg-primary-hover text-white'
            }`}
          >
            {isSubmitting ? t('booking.pending') : t('booking.submit')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;