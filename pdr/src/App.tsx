

import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import DoctorProfile from './components/DoctorProfile';
import Articles from './components/Articles';
import Comments from './components/Comments';
import AdminPanel from './components/AdminPanel';
import Stats from './components/Stats';
import ContactInfo from './components/ContactInfo';
import { Comment, Article, SiteStats } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useLanguage } from './context/LanguageContext';
import './index.css';


const defaultArticles: Article[] = [
  {
    id: '1',
    title: 'ارزیابی کیفیت کنترل دیابت در جمعیت تحت نظارت پزشک خانواده',
    summary: 'این مطالعه به بررسی وضعیت کنترل قند خون در بیماران دیابتی تحت پوشش پزشک خانواده در شهر ساری پرداخته و میزان موفقیت در دستیابی به اهداف درمانی را ارزیابی کرده است.',
    fullText: 'مطالعه مقطعی بر روی ۳۰۰ بیمار دیابتی نوع ۲ انجام شد. نتایج نشان داد که ۶۵٪ بیماران به کنترل مطلوب قند خون دست یافته‌اند. عواملی مانند سن، مدت زمان ابتلا به دیابت و سطح سواد با کنترل قند خون ارتباط معنی‌داری داشتند.',
    date: '2024-01-15',
    views: 245,
    category: 'دیابت',
  },
  {
    id: '2',
    title: 'سندرم نشت مویرگی سیستمیک متعاقب واکسن آسترازنکا',
    summary: 'گزارش موردی از یک بیمار با شوک هیپوولمیک و ادم گسترده متعاقب تزریق واکسن آسترازنکا که با تشخیص سندرم نشت مویرگی سیستمیک تحت درمان قرار گرفت.',
    fullText: 'بیمار ۴۵ ساله با سابقه فشار خون بالا، ۲۴ ساعت پس از تزریق واکسن با علائم شوک، ادم و افزایش هماتوکریت مراجعه کرد. با تشخیص سندرم نشت مویرگی، درمان حمایتی آغاز شد و بیمار پس از ۷ روز با بهبود کامل ترخیص گردید.',
    date: '2024-02-20',
    views: 189,
    category: 'بیماری‌های کلیوی',
  },
  {
    id: '3',
    title: 'رابدومیولیز ناشی از مصرف همزمان وارفارین و آتورواستاتین',
    summary: 'بررسی تداخل دارویی خطرناک بین وارفارین و آتورواستاتین که منجر به رابدومیولیز و آسیب کلیوی حاد در یک بیمار مسن گردید.',
    fullText: 'بیمار ۷۲ ساله با مصرف همزمان وارفارین و آتورواستاتین دچار درد شدید عضلانی، افزایش CK و نارسایی کلیوی شد. پس از قطع داروها و درمان حمایتی، عملکرد کلیوی بیمار به تدریج بهبود یافت.',
    date: '2022-11-10',
    views: 156,
    category: 'تداخلات دارویی',
  },
];


const defaultComments: Comment[] = [
  {
    id: '1',
    patientName: 'احمد رضایی',
    rating: 5,
    text: 'دکتر کریمی بسیار حرفه‌ای و با حوصله هستند. توضیحات کامل و دقیقی درباره بیماری من دادند و روند درمان را به خوبی پیگیری کردند. بسیار سپاسگزارم.',
    date: '2024-03-01',
    isVerified: true,
    isApproved: true,
  },
  {
    id: '2',
    patientName: 'مریم حسینی',
    rating: 4,
    text: 'پزشک متعهد و خوش‌برخوردی هستند. تنها مشکل زمان انتظار نسبتاً طولانی بود که به دلیل استقبال بالای بیماران است.',
    date: '2024-02-15',
    isVerified: false,
    isApproved: true,
  },
];

function App() {
  const { language, dir, t } = useLanguage();
  

  const [articles, setArticles] = useLocalStorage<Article[]>('articles', defaultArticles);
  const [comments, setComments] = useLocalStorage<Comment[]>('comments', defaultComments);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [stats, setStats] = useLocalStorage<SiteStats>('stats', {
    totalVisits: 1250,
    totalComments: defaultComments.length,
    totalArticles: defaultArticles.length,
    averageRating: 4.7,
  });


  useEffect(() => {
    const approvedComments = comments.filter(c => c.isApproved);
    const avgRating = approvedComments.length > 0
      ? approvedComments.reduce((sum, c) => sum + c.rating, 0) / approvedComments.length
      : 0;
    
    setStats({
      ...stats,
      totalComments: approvedComments.length,
      totalArticles: articles.length,
      averageRating: avgRating,
    });
  }, [comments, articles]);


  useEffect(() => {
    setStats({
      ...stats,
      totalVisits: stats.totalVisits + 1,
    });
  }, []);


  const handleAddComment = (newComment: Omit<Comment, 'id' | 'date' | 'isApproved'>) => {
    const comment: Comment = {
      ...newComment,
      id: Date.now().toString(),
      date: new Date().toISOString(),
      isApproved: false,
    };
    setComments([comment, ...comments]);
  };

  const handleApproveComment = (id: string) => {
    setComments(comments.map(c => 
      c.id === id ? { ...c, isApproved: true } : c
    ));
  };

  const handleDeleteComment = (id: string) => {
    setComments(comments.filter(c => c.id !== id));
  };


  const handleAddArticle = (newArticle: Omit<Article, 'id' | 'date' | 'views'>) => {
    const article: Article = {
      ...newArticle,
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      views: 0,
    };
    setArticles([article, ...articles]);
  };

  const handleDeleteArticle = (id: string) => {
    setArticles(articles.filter(a => a.id !== id));
  };

  const handleArticleView = (id: string) => {
    setArticles(articles.map(a => 
      a.id === id ? { ...a, views: a.views + 1 } : a
    ));
  };


  const handleAdminLogin = () => {
    if (!isAdmin) {
      const password = prompt(language === 'fa' ? 'لطفاً رمز عبور مدیریت را وارد کنید:' : 'Please enter admin password:');
      if (password === 'payman1382') {
        setIsAdmin(true);
        setShowAdmin(true);
      } else if (password !== null) {
        alert(language === 'fa' ? 'رمز عبور اشتباه است' : 'Wrong password');
      }
    } else {
      setShowAdmin(!showAdmin);
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setShowAdmin(false);
  };

  return (
    <div className={`min-h-screen bg-gray-50 font-vazir ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
      <Header onAdminClick={handleAdminLogin} isAdmin={isAdmin} />
      
      <main className={`container mx-auto px-4 py-8 max-w-5xl ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
        <div className="space-y-8">
          <section id="home">
            <Stats stats={stats} />
          </section>
          
          <section id="profile">
            <DoctorProfile 
              rating={stats.averageRating} 
              commentsCount={stats.totalComments} 
            />
          </section>
          
          <section id="contact">
            <ContactInfo />
          </section>
          
          <section id="articles">
            <Articles 
              articles={articles} 
              onArticleView={handleArticleView} 
            />
          </section>
          
          <section id="comments">
            <Comments 
              comments={comments} 
              onAddComment={handleAddComment} 
            />
          </section>
          
          {showAdmin && isAdmin && (
            <section id="admin">
              <AdminPanel
                comments={comments}
                articles={articles}
                onApproveComment={handleApproveComment}
                onDeleteComment={handleDeleteComment}
                onAddArticle={handleAddArticle}
                onDeleteArticle={handleDeleteArticle}
                onLogout={handleLogout}
              />
            </section>
          )}
        </div>
      </main>
      
      <footer className="bg-gray-800 text-white mt-12 py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-400">
            {t('footer.rights')} © {new Date().getFullYear()} - {t('header.title')}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {t('footer.designed')}
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;