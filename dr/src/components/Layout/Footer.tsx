import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../hooks/useLanguage';
import { Phone, Mail, MapPin } from 'lucide-react';

const Footer: React.FC = () => {
  const { t, language } = useLanguage();
  const isRTL = language === 'fa';

  return (
    <footer className="bg-gray-900 text-white mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 ${isRTL ? 'rtl' : 'ltr'}`}>
          {/* About */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center font-bold flex-shrink-0">
                DA
              </div>
              <span className="text-lg font-bold">Dr. Abedian Surgery</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              {t('footer.doctor.description')}
            </p>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold mb-4 text-white">{t('footer.services')}</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link to="/services" className="hover:text-white transition-colors">
                  {t('footer.services.laparoscopic')}
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white transition-colors">
                  {t('footer.services.thyroid')}
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white transition-colors">
                  {t('footer.services.weight')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-4 text-white">{t('footer.resources')}</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  {t('footer.resources.about')}
                </Link>
              </li>
              <li>
                <Link to="/testimonials" className="hover:text-white transition-colors">
                  {t('footer.resources.testimonials')}
                </Link>
              </li>
              <li>
                <Link to="/gallery" className="hover:text-white transition-colors">
                  {t('footer.resources.gallery')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4 text-white">{t('footer.contact')}</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                <div>
                  <p className="font-medium text-gray-300">{t('footer.contact.burjeel')}</p>
                  <p>{t('footer.contact.burjeel.address')}</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                <div>
                  <p className="font-medium text-gray-300">{t('footer.contact.armada')}</p>
                  <p>{t('footer.contact.armada.address')}</p>
                </div>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                <span>+971 52 901 1342</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                <span>mabediank@yahoo.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={`border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500 ${isRTL ? 'rtl' : 'ltr'}`}>
          <p>© 2024 Dr. Mohammad Abedian Surgery. {t('footer.rights')}</p>
          <div className={`flex justify-center gap-4 mt-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Link to="/privacy" className="hover:text-gray-300 transition-colors">
              {t('footer.privacy')}
            </Link>
            <Link to="/terms" className="hover:text-gray-300 transition-colors">
              {t('footer.terms')}
            </Link>
            <Link to="/hipaa" className="hover:text-gray-300 transition-colors">
              {t('footer.hipaa')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
