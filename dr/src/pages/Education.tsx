import React from 'react';
import { Link } from 'react-router-dom';
import { useDB } from '../hooks/useDB';
import { useLanguage } from '../hooks/useLanguage';
import { Calendar } from 'lucide-react';

const Education: React.FC = () => {
  const { articles } = useDB();
  const { t } = useLanguage();
  
  const eduArticles = articles.filter(a => a.category === 'education');

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
        {t('nav.education')}
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {eduArticles.map((article) => (
          <div key={article.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                  Education
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(article.date).toLocaleDateString()}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                {article.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                {article.excerpt}
              </p>
              <Link to={`/education/${article.id}`} className="text-primary hover:underline text-sm">
                Read More →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Education;
