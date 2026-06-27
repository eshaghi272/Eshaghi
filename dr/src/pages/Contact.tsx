import React from 'react';
import { useLanguage } from '../hooks/useLanguage';

const Contact: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
        {t('nav.contact')}
      </h1>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Contact Information</h3>
            <p className="text-gray-600 dark:text-gray-300">📞 +971 52 901 1342</p>
            <p className="text-gray-600 dark:text-gray-300">✉️ mabediank@yahoo.com</p>
            <p className="text-gray-600 dark:text-gray-300 mt-4">📍 Burjeel Hospital, Sheikh Zayed Road, Dubai</p>
            <p className="text-gray-600 dark:text-gray-300">📍 Armada Tower 2, Cluster P, JLT, Dubai</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Working Hours</h3>
            <p className="text-gray-600 dark:text-gray-300">Monday - Friday: 9:00 AM - 6:00 PM</p>
            <p className="text-gray-600 dark:text-gray-300">Saturday: 10:00 AM - 2:00 PM</p>
            <p className="text-gray-600 dark:text-gray-300">Sunday: Closed</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
