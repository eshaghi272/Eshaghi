// src/components/Articles.tsx

import React, { useState } from 'react';
import { FaEye, FaCalendarAlt, FaTag, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { Article } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface ArticlesProps {
  articles: Article[];
  onArticleView: (id: string) => void;
}

const Articles: React.FC<ArticlesProps> = ({ articles, onArticleView }) => {
  const { t } = useLanguage();
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedArticle(expandedArticle === id ? null : id);
    if (expandedArticle !== id) {
      onArticleView(id);
    }
  };

  return (
    <section id="articles" className="bg-white rounded-2xl shadow-xl overflow-hidden">
      <div className="bg-gradient-to-l from-primary-600 to-primary-800 p-6 text-white">
        <h2 className="text-2xl font-bold">{t('articles.title')}</h2>
        <p className="text-primary-200 text-sm mt-1">{t('articles.subtitle')}</p>
      </div>

      <div className="p-6 space-y-4">
        {articles.length === 0 ? (
          <p className="text-gray-500 text-center py-8">{t('articles.noArticles')}</p>
        ) : (
          articles.map((article) => (
            <div
              key={article.id}
              className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
            >
              <div
                className="p-4 cursor-pointer"
                onClick={() => toggleExpand(article.id)}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-800 hover:text-primary-600 transition-colors">
                      {article.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <FaCalendarAlt className="text-primary-400" />
                        {new Date(article.date).toLocaleDateString('fa-IR')}
                      </span>
                      <span className="flex items-center gap-1">
                        <FaTag className="text-primary-400" />
                        {article.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <FaEye className="text-primary-400" />
                        {article.views} {t('articles.views')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-primary-600 font-semibold text-sm">
                      {expandedArticle === article.id ? t('articles.close') : t('articles.showSummary')}
                    </span>
                    {expandedArticle === article.id ? (
                      <FaChevronUp className="text-primary-600" />
                    ) : (
                      <FaChevronDown className="text-primary-600" />
                    )}
                  </div>
                </div>
              </div>

              {expandedArticle === article.id && (
                <div className="px-4 pb-4 pt-2 border-t border-gray-100">
                  <div className="bg-primary-50 rounded-lg p-4">
                    <p className="text-gray-700 leading-relaxed font-medium text-sm">
                      📝 {t('articles.summary')}:
                    </p>
                    <p className="text-gray-600 leading-relaxed mt-1">
                      {article.summary}
                    </p>
                    {article.fullText && (
                      <div className="mt-3 pt-3 border-t border-primary-200">
                        <p className="text-gray-700 leading-relaxed text-sm">
                          {article.fullText.substring(0, 300)}
                          {article.fullText.length > 300 && '...'}
                        </p>
                        <button className="mt-2 text-primary-600 hover:text-primary-700 font-semibold text-sm">
                          {t('articles.readMore')} →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default Articles;