import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export const useRTL = () => {
  const { i18n } = useTranslation();
  const [isRTL, setIsRTL] = useState(false);

  useEffect(() => {
    const currentLang = i18n.language;
    const rtl = currentLang === 'fa' || currentLang === 'ar';
    setIsRTL(rtl);
    document.documentElement.dir = rtl ? 'rtl' : 'ltr';
  }, [i18n.language]);

  return isRTL;
};