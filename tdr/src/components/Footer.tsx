import React from 'react';
import { useTranslation } from 'react-i18next';

const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-gray-900 text-white py-8 sm:py-12">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold">{t('footer.name')}</h3>
            <p className="text-xs text-gray-400 mt-1">{t('footer.subname')}</p>
          </div>
          <div>
            <ul className="space-y-2 text-sm">
              {['about', 'treatments', 'articles', 'contact', 'gallery'].map((item) => (
                <li key={item}>
                  <a href={`#${item}`} className="text-gray-400 hover:text-white transition">
                    {t(`footer.${item}`)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="sm:col-span-2 md:col-span-1">
            <p className="text-xs text-gray-400">{t('footer.copyright')}</p>
          </div>
          <div className="sm:col-span-2 md:col-span-1">
            <ul className="flex flex-wrap gap-4 text-xs text-gray-400">
              <li>
                <a href="#" className="hover:text-white transition">{t('footer.privacy')}</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">{t('footer.terms')}</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">{t('footer.cookies')}</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;