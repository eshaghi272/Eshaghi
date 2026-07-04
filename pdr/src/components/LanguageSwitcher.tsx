// src/components/LanguageSwitcher.tsx

import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { FaGlobe } from 'react-icons/fa';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <button
      onClick={() => setLanguage(language === 'fa' ? 'en' : 'fa')}
      className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg transition-colors text-sm font-medium"
      aria-label="تغییر زبان / Change Language"
    >
      <FaGlobe />
      <span>{language === 'fa' ? 'EN' : 'FA'}</span>
    </button>
  );
};

export default LanguageSwitcher;