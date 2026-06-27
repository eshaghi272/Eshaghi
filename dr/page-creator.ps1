# ============================================
# اصلاح فایل page-creator.ps1 با encoding صحیح
# ============================================

Write-Host "🔧 اصلاح فایل page-creator.ps1..." -ForegroundColor Cyan

# 1. ایجاد فایل جدید با encoding صحیح
$content = @'
# ============================================
# بهبود هدر صفحه - خط باریک و ظریف
# ============================================

Write-Host "🎨 بهبود هدر با خط باریک و ظریف..." -ForegroundColor Cyan

# 1. به‌روزرسانی صفحه Home با هدر بسیار ظریف و باریک
@'
import React from 'react';
import { Link } from 'react-router-dom';
import { useDB } from '../hooks/useDB';
import { useLanguage } from '../hooks/useLanguage';
import { Calendar, ArrowRight, Star, ChevronRight } from 'lucide-react';

const Home: React.FC = () => {
  const { articles, loading } = useDB();
  const { t, language } = useLanguage();
  const isRTL = language === 'fa';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-16 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Hero Section - Elegant & Minimal */}
      <section className="relative rounded-2xl overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-purple-600 to-indigo-700"></div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 bg-white/5 rounded-full blur-2xl"></div>

        {/* Content */}
        <div className="relative z-10 px-6 py-20 md:py-28 text-white">
          {/* Thin decorative line - top */}
          <div className="flex items-center gap-3 mb-4">
            <span className="w-16 h-[1px] bg-white/30"></span>
            <span className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-light">
              {language === 'fa' ? 'جراحی هنرمندانه' : 'Artful Surgery'}
            </span>
            <span className="w-16 h-[1px] bg-white/30"></span>
          </div>

          {/* Main title - large but elegant */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight mb-3 leading-[1.1]">
            Artful surgery, trusted hands,<br />
            <span className="font-medium">nested in science research</span>
          </h1>
          
          {/* Thin separator line */}
          <div className="w-24 h-[1px] bg-white/40 my-4"></div>

          {/* Subtitle */}
          <p className="text-base md:text-lg text-white/70 max-w-2xl font-light tracking-wide leading-relaxed">
            Dr. Mohammad Abedian - Board-certified surgeon with over 3 decades of experience
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 mt-8">
            <Link
              to="/about"
              className="group px-6 py-2.5 bg-white text-primary rounded-lg font-medium hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 text-sm flex items-center gap-2"
            >
              Learn More
              <ChevronRight className={`w-4 h-4 group-hover:translate-x-1 transition-transform ${isRTL ? 'rotate-180' : ''}`} />
            </Link>
            <Link
              to="/book"
              className="px-6 py-2.5 bg-white/10 backdrop-blur-sm text-white rounded-lg font-medium hover:bg-white/20 transition-all duration-300 border border-white/20 hover:border-white/40 text-sm"
            >
              {t('nav.book')}
            </Link>
          </div>

          {/* Decorative dots - bottom right */}
          <div className="absolute bottom-4 right-6 flex gap-1.5">
            <span className="w-1 h-1 rounded-full bg-white/20"></span>
            <span className="w-1 h-1 rounded-full bg-white/40"></span>
            <span className="w-1 h-1 rounded-full bg-white/60"></span>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm text-center hover:shadow-md transition-shadow">
          <p className="text-3xl font-bold text-primary">30+</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('home.stats.experience')}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm text-center hover:shadow-md transition-shadow">
          <p className="text-3xl font-bold text-primary">10,000+</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('home.stats.patients')}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm text-center hover:shadow-md transition-shadow">
          <p className="text-3xl font-bold text-primary">100%</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('home.stats.certified')}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm text-center hover:shadow-md transition-shadow">
          <p className="text-3xl font-bold text-primary">5.0</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('home.stats.rating')}</p>
        </div>
      </section>

      {/* News Section */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
            {t('home.news.title')}
          </h2>
          <Link to="/news" className="text-primary hover:underline flex items-center gap-1 text-sm">
            {t('home.news.viewAll')} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.slice(0, 3).map((article) => (
            <div key={article.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
              <div className="p-6">
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                    {article.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(article.date).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {article.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3">
                  {article.excerpt}
                </p>
                <Link to={`/news/${article.id}`} className="text-primary text-sm hover:underline inline-flex items-center gap-1">
                  Read More <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary to-purple-600 rounded-2xl p-8 md:p-12 text-white text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-2xl"></div>
        <div className="relative z-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            {t('home.cta.title')}
          </h2>
          <p className="text-blue-100 max-w-2xl mx-auto mb-6">
            Take the first step toward better health. Book your consultation with Dr. Abedian today.
          </p>
          <Link to="/book" className="inline-block px-8 py-3 bg-white text-primary rounded-lg font-semibold hover:shadow-lg transition-all hover:-translate-y-0.5">
            {t('home.cta.button')}
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
'@ | Out-File -FilePath "src\pages\Home.tsx" -Encoding UTF8

Write-Host "✅ صفحه Home با هدر باریک و ظریف به‌روزرسانی شد!" -ForegroundColor Green

# 2. به‌روزرسانی About با هدر باریک مشابه
@'
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
              {language === 'fa' ? 'درباره ما' : 'About Us'}
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
              {isRTL ? 'د.ع' : 'DA'}
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
'@ | Out-File -FilePath "src\pages\About.tsx" -Encoding UTF8

Write-Host "✅ صفحه About با هدر باریک به‌روزرسانی شد!" -ForegroundColor Green
Write-Host "🔄 Refresh the page (Ctrl+Shift+R)" -ForegroundColor Yellow
'@

# ذخیره فایل با encoding UTF-8 بدون BOM
$content | Out-File -FilePath "page-creator.ps1" -Encoding UTF8 -NoNewline

Write-Host "✅ فایل page-creator.ps1 با encoding صحیح بازنویسی شد!" -ForegroundColor Green
Write-Host "🔄 حالا فایل را اجرا کنید: .\page-creator.ps1" -ForegroundColor Yellow