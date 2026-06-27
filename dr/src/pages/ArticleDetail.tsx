import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDB } from '../hooks/useDB';
import { ArrowLeft, Calendar, User } from 'lucide-react';

const ArticleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { articles } = useDB();
  
  const article = articles.find(a => a.id === Number(id));

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
          Article not found
        </h2>
        <Link to="/news" className="text-primary hover:underline">
          ← Back to News
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link to="/news" className="inline-flex items-center gap-2 text-primary hover:underline mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to News
      </Link>
      
      <article className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-8">
          <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
              {article.category}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(article.date).toLocaleDateString()}
            </span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {article.title}
          </h1>
          
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
            <User className="w-4 h-4" />
            <span>Dr. Abedian</span>
          </div>
          
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {article.content}
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
              This is a detailed article about {article.title}. More content will be added here.
            </p>
          </div>
        </div>
      </article>
    </div>
  );
};

export default ArticleDetail;
