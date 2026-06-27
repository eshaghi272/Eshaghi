import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { Link } from 'react-router-dom';
import { 
  User, 
  GraduationCap, 
  Stethoscope, 
  Award, 
  Calendar, 
  MapPin, 
  BookOpen, 
  Heart, 
  Target,
  Clock,
  Users,
  Microscope,
  Activity,
  ChevronRight
} from 'lucide-react';

const About: React.FC = () => {
  const { t, language } = useLanguage();
  const isRTL = language === 'fa';

  return (
    <div className={`max-w-6xl mx-auto space-y-12 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Hero Section - Elegant & Minimal */}
      <section className="relative rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-purple-600 to-indigo-700"></div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 px-6 py-20 md:py-28 text-white">
          {/* Thin decorative line */}
          <div className="flex items-center gap-3 mb-4">
            <span className="w-16 h-[1px] bg-white/30"></span>
            <span className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-light">
              {language === 'fa' ? 'Ø¯Ø±Ø¨Ø§Ø±Ù‡ Ù…Ø§' : 'About Us'}
            </span>
            <span className="w-16 h-[1px] bg-white/30"></span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight mb-3 leading-[1.1]">
            {t('about.title')}
          </h1>
          
          <div className="w-24 h-[1px] bg-white/40 my-4"></div>
          
          <p className="text-base md:text-lg text-white/70 max-w-2xl font-light tracking-wide leading-relaxed">
            {t('about.subtitle')}
          </p>
          
          <p className="text-sm text-white/40 max-w-2xl mt-2 tracking-wide">
            {t('home.hero.title')}
          </p>
        </div>
      </section>

      {/* Rest of the About page content... */}
      <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              {t('about.title')}
            </h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-300 leading-relaxed">
              <p>{t('about.bio.p1')}</p>
              <p>{t('about.bio.p2')}</p>
              <p>{t('about.bio.p3')}</p>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="w-48 h-48 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center text-white text-6xl font-bold shadow-lg">
              {isRTL ? 'Ø¯.Ø¹' : 'DA'}
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">
          {t('about.journey.title')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border-t-4 border-primary">
            <div className="flex items-center gap-3 mb-3">
              <Calendar className="w-6 h-6 text-primary" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">1990-1997</h3>
            </div>
            <h4 className="font-medium text-gray-700 dark:text-gray-200 mb-2">
              {t('about.journey.early.title')}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('about.journey.early.desc')}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border-t-4 border-purple-500">
            <div className="flex items-center gap-3 mb-3">
              <GraduationCap className="w-6 h-6 text-purple-500" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">1997</h3>
            </div>
            <h4 className="font-medium text-gray-700 dark:text-gray-200 mb-2">
              {t('about.journey.specialty.title')}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('about.journey.specialty.desc')}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border-t-4 border-green-500">
            <div className="flex items-center gap-3 mb-3">
              <Activity className="w-6 h-6 text-green-500" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">2010-Present</h3>
            </div>
            <h4 className="font-medium text-gray-700 dark:text-gray-200 mb-2">
              {t('about.journey.uae.title')}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('about.journey.uae.desc')}
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
          {t('about.education.title')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 dark:text-white">{t('about.education.md')}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('about.education.md.uni')}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">{t('about.education.md.year')}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 dark:text-white">{t('about.education.specialty')}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('about.education.specialty.uni')}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">{t('about.education.specialty.year')}</p>
            </div>
          </div>

          <div className="flex items-start gap-4 md:col-span-2">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <Target className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 dark:text-white">{t('about.education.continuing')}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('about.education.continuing.desc')}</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">
          {t('about.leadership.title')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h4 className="font-semibold text-gray-800 dark:text-white text-sm">{t('about.leadership.faculty')}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('about.leadership.faculty.desc')}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 text-center">
            <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <BookOpen className="w-6 h-6 text-purple-500" />
            </div>
            <h4 className="font-semibold text-gray-800 dark:text-white text-sm">{t('about.leadership.department')}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('about.leadership.department.desc')}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 text-center">
            <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Stethoscope className="w-6 h-6 text-green-500" />
            </div>
            <h4 className="font-semibold text-gray-800 dark:text-white text-sm">{t('about.leadership.founder')}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('about.leadership.founder.desc')}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 text-center">
            <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Award className="w-6 h-6 text-orange-500" />
            </div>
            <h4 className="font-semibold text-gray-800 dark:text-white text-sm">{t('about.leadership.deputy')}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('about.leadership.deputy.desc')}</p>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-primary/5 to-purple-600/5 rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">
          {t('about.expertise.title')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
              <Microscope className="w-7 h-7 text-primary" />
            </div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
              {t('about.expertise.laparoscopic')}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('about.expertise.laparoscopic.desc')}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-4">
              <Heart className="w-7 h-7 text-purple-500" />
            </div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
              {t('about.expertise.thyroid')}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('about.expertise.thyroid.desc')}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <Target className="w-7 h-7 text-green-500" />
            </div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
              {t('about.expertise.weight')}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('about.expertise.weight.desc')}
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">
          {t('about.philosophy.title')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="w-8 h-8 text-primary" />
            </div>
            <h4 className="font-semibold text-gray-800 dark:text-white mb-2">
              {t('about.philosophy.thoughtful')}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('about.philosophy.thoughtful.desc')}
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Heart className="w-8 h-8 text-purple-500" />
            </div>
            <h4 className="font-semibold text-gray-800 dark:text-white mb-2">
              {t('about.philosophy.holistic')}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('about.philosophy.holistic.desc')}
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-8 h-8 text-green-500" />
            </div>
            <h4 className="font-semibold text-gray-800 dark:text-white mb-2">
              {t('about.philosophy.education')}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('about.philosophy.education.desc')}
            </p>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-primary to-purple-600 rounded-2xl p-8 text-white">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {t('about.locations.title')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <MapPin className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t('about.locations.burjeel')}</h3>
            <p className="text-blue-100">{t('about.locations.burjeel.desc')}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Stethoscope className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t('about.locations.armada')}</h3>
            <p className="text-blue-100">{t('about.locations.armada.desc')}</p>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link
            to="/book"
            className="inline-block px-8 py-3 bg-white text-primary rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            {t('about.locations.book')}
          </Link>
        </div>
      </section>
    </div>
  );
};

export default About;
