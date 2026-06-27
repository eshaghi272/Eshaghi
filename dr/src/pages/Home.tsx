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
              {language === 'fa' ? 'Ø¬Ø±Ø§Ø­ÛŒ Ù‡Ù†Ø±Ù…Ù†Ø¯Ø§Ù†Ù‡' : 'Artful Surgery'}
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
