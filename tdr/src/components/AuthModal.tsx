import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import DataService from '../services/DataService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (data: { phone: string; nationalCode: string; fullName?: string }) => void;
  onRegister: (data: { phone: string; nationalCode: string; fullName: string }) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin, onRegister }) => {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    phone: '',
    nationalCode: '',
    fullName: '',
    password: '',
    confirmPassword: '',
    email: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.phone) {
      newErrors.phone = t('validation.required');
    } else if (!/^09[0-9]{9}$/.test(formData.phone)) {
      newErrors.phone = t('validation.phone');
    }

    if (!formData.nationalCode) {
      newErrors.nationalCode = t('validation.required');
    } else if (!/^[0-9]{10}$/.test(formData.nationalCode)) {
      newErrors.nationalCode = t('validation.nationalCode');
    }

    if (!isLogin) {
      if (!formData.fullName) {
        newErrors.fullName = t('validation.required');
      }
      if (!formData.password) {
        newErrors.password = t('validation.required');
      } else if (formData.password.length < 6) {
        newErrors.password = t('validation.minLength', { count: 6 });
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = t('validation.passwordMatch');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    if (isLogin) {
      // بررسی وجود کاربر در DataService
      const user = DataService.getUserByPhone(formData.phone);
      if (user && user.nationalCode === formData.nationalCode) {
        // ارسال اطلاعات کامل کاربر
        onLogin({
          phone: user.phone,
          nationalCode: user.nationalCode,
          fullName: user.fullName,
        });
        setIsSubmitting(false);
        onClose(); // بستن مودال بعد از ورود موفق
      } else {
        setErrors({ ...errors, phone: t('auth.loginError') });
        setIsSubmitting(false);
      }
    } else {
      // ثبت‌نام کاربر جدید
      const existingUser = DataService.getUserByPhone(formData.phone);
      if (existingUser) {
        setErrors({ ...errors, phone: 'این شماره تلفن قبلاً ثبت شده است' });
        setIsSubmitting(false);
        return;
      }
      
      const existingNational = DataService.getUserByNationalCode(formData.nationalCode);
      if (existingNational) {
        setErrors({ ...errors, nationalCode: 'این کد ملی قبلاً ثبت شده است' });
        setIsSubmitting(false);
        return;
      }

      const newUser = DataService.addUser({
        phone: formData.phone,
        nationalCode: formData.nationalCode,
        fullName: formData.fullName,
        password: formData.password,
        email: formData.email || '',
      });

      // ارسال اطلاعات کامل کاربر جدید
      onRegister({
        phone: newUser.phone,
        nationalCode: newUser.nationalCode,
        fullName: newUser.fullName,
      });
      setIsSubmitting(false);
      onClose(); // بستن مودال بعد از ثبت‌نام موفق
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white text-center">
          {isLogin ? t('auth.loginTitle') : t('auth.registerTitle')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-1">
          {isLogin ? t('auth.loginSubtitle') : t('auth.registerSubtitle')}
        </p>

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
              placeholder={t('auth.phonePlaceholder')}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition ${
                errors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
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
              placeholder={t('auth.nationalCodePlaceholder')}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition ${
                errors.nationalCode ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              dir="ltr"
              maxLength={10}
            />
            {errors.nationalCode && <p className="text-red-500 text-xs mt-1">{errors.nationalCode}</p>}
          </div>

          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('auth.fullName')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder={t('auth.fullNamePlaceholder')}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition ${
                    errors.fullName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('auth.password')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={t('auth.passwordPlaceholder')}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition ${
                    errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('auth.confirmPassword')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder={t('auth.confirmPassword')}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full font-medium py-2.5 rounded-lg transition transform hover:scale-105 ${
              isSubmitting 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-primary hover:bg-primary-hover text-white'
            }`}
          >
            {isSubmitting ? 'در حال ارسال...' : (isLogin ? t('auth.login') : t('auth.register'))}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary hover:text-primary-hover text-sm transition"
          >
            {isLogin ? t('auth.noAccount') : t('auth.hasAccount')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;