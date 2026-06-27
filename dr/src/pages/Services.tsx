import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { 
  Scissors, 
  Scale, 
  Activity, 
  Stethoscope, 
  Heart, 
  Shield, 
  Microscope, 
  Zap,
  Sparkles,
  ClipboardList,
  Users,
  Target,
  Brain,
  Droplets,
  Bone,
  Eye,
  FileText,
  Syringe,
  Pill,
  Thermometer,
  Watch,
  Clock,
  AlertCircle,
  CheckCircle,
  Star
} from 'lucide-react';

const Services: React.FC = () => {
  const { t, language } = useLanguage();
  const isRTL = language === 'fa';

  const serviceCategories = [
    {
      id: 'aesthetic',
      icon: Sparkles,
      title: 'services.aesthetic',
      color: 'from-pink-500 to-rose-500',
      items: t('services.aesthetic.items').split(',')
    },
    {
      id: 'weight',
      icon: Scale,
      title: 'services.weight',
      color: 'from-blue-500 to-cyan-500',
      items: t('services.weight.items').split(',')
    },
    {
      id: 'hernia',
      icon: Shield,
      title: 'services.hernia',
      color: 'from-orange-500 to-amber-500',
      items: t('services.hernia.items').split(',')
    },
    {
      id: 'gastrointestinal',
      icon: Activity,
      title: 'services.gastrointestinal',
      color: 'from-green-500 to-emerald-500',
      items: t('services.gastrointestinal.items').split(',')
    },
    {
      id: 'healthcare',
      icon: ClipboardList,
      title: 'services.healthcare',
      color: 'from-indigo-500 to-purple-500',
      items: t('services.healthcare.items').split(',')
    },
    {
      id: 'breast',
      icon: Heart,
      title: 'services.breast',
      color: 'from-rose-500 to-pink-500',
      items: t('services.breast.items').split(',')
    },
    {
      id: 'thyroid',
      icon: Target,
      title: 'services.thyroid',
      color: 'from-purple-500 to-violet-500',
      items: t('services.thyroid.items').split(',')
    },
    {
      id: 'robotic',
      icon: Microscope,
      title: 'services.robotic',
      color: 'from-cyan-500 to-blue-500',
      items: t('services.robotic.items').split(',')
    },
    {
      id: 'laser',
      icon: Zap,
      title: 'services.laser',
      color: 'from-yellow-500 to-orange-500',
      items: t('services.laser.items').split(',')
    }
  ];

  return (
    <div className={`max-w-6xl mx-auto space-y-8 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <section className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-4">
          {t('services.title')}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          {t('services.subtitle')}
        </p>
      </section>

      {/* Services Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {serviceCategories.map((category) => {
          const Icon = category.icon;
          return (
            <div
              key={category.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700"
            >
              {/* Header with gradient */}
              <div className={`bg-gradient-to-r ${category.color} p-4 text-white`}>
                <div className="flex items-center gap-3">
                  <Icon className="w-6 h-6" />
                  <h2 className="text-lg font-semibold">{t(category.title)}</h2>
                </div>
              </div>

              {/* Items List */}
              <div className="p-4 max-h-64 overflow-y-auto">
                <ul className="space-y-2">
                  {category.items.map((item: string, index: number) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      <span className="text-primary mt-1 text-xs">◆</span>
                      <span className="leading-relaxed">{item.trim()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary to-purple-600 rounded-2xl p-8 text-white text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">
          {t('home.cta.title')}
        </h2>
        <p className="text-blue-100 max-w-2xl mx-auto mb-6">
          Take the first step toward better health. Book your consultation with Dr. Abedian today.
        </p>
        <a
          href="/book"
          className="inline-block px-8 py-3 bg-white text-primary rounded-lg font-semibold hover:bg-blue-50 transition-colors"
        >
          {t('home.cta.button')}
        </a>
      </section>
    </div>
  );
};

export default Services;
