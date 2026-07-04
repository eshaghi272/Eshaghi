// src/components/AdminPanel.tsx

import React, { useState } from 'react';
import { FaTrash, FaCheck, FaTimes, FaEye, FaEdit, FaPlus, FaSignOutAlt, FaUserShield, FaStar, FaClock } from 'react-icons/fa';
import { Comment, Article } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface AdminPanelProps {
  comments: Comment[];
  articles: Article[];
  onApproveComment: (id: string) => void;
  onDeleteComment: (id: string) => void;
  onAddArticle: (article: Omit<Article, 'id' | 'date' | 'views'>) => void;
  onDeleteArticle: (id: string) => void;
  onLogout: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
  comments,
  articles,
  onApproveComment,
  onDeleteComment,
  onAddArticle,
  onDeleteArticle,
  onLogout,
}) => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'comments' | 'articles'>('comments');
  const [showAddArticle, setShowAddArticle] = useState(false);
  const [newArticle, setNewArticle] = useState({
    title: '',
    summary: '',
    fullText: '',
    category: '',
    imageUrl: '',
  });

  const pendingComments = comments.filter(c => !c.isApproved);

  const handleAddArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArticle.title.trim() || !newArticle.summary.trim()) return;
    
    onAddArticle(newArticle);
    setNewArticle({ title: '', summary: '', fullText: '', category: '', imageUrl: '' });
    setShowAddArticle(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      <div className="bg-gradient-to-l from-primary-700 to-primary-900 p-6 text-white flex justify-between items-center">
        <div className="flex items-center gap-3">
          <FaUserShield className="text-2xl" />
          <div>
            <h2 className="text-2xl font-bold">{t('admin.title')}</h2>
            <p className="text-primary-200 text-sm">{t('admin.subtitle')}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="bg-red-500/20 hover:bg-red-500/30 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <FaSignOutAlt />
          {t('admin.logout')}
        </button>
      </div>

      <div className="p-6">
        <div className="flex gap-2 border-b border-gray-200 mb-6">
          <button
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'comments'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('comments')}
          >
            {t('admin.comments')}
            {pendingComments.length > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 mr-2">
                {pendingComments.length}
              </span>
            )}
          </button>
          <button
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'articles'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('articles')}
          >
            {t('admin.articles')}
            <span className="bg-primary-100 text-primary-600 text-xs rounded-full px-2 py-0.5 mr-2">
              {articles.length}
            </span>
          </button>
        </div>

        {activeTab === 'comments' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800">{t('admin.manageComments')}</h3>
              <span className="text-sm text-gray-500">
                {pendingComments.length} {t('admin.pendingComments')}
              </span>
            </div>

            {comments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">{t('admin.noComments')}</p>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className={`border rounded-xl p-4 ${
                    !comment.isApproved ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-semibold text-gray-800">{comment.patientName}</span>
                        {!comment.isApproved && (
                          <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <FaClock className="text-xs" />
                            {t('comments.pending')}
                          </span>
                        )}
                        {comment.isApproved && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <FaCheck className="text-xs" />
                            {t('comments.approved')}
                          </span>
                        )}
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <FaStar
                              key={i}
                              className={i < comment.rating ? 'text-yellow-400' : 'text-gray-300'}
                              size={14}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="mt-2 text-gray-700">{comment.text}</p>
                      <span className="text-xs text-gray-400 mt-1 block">
                        {new Date(comment.date).toLocaleDateString('fa-IR')}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {!comment.isApproved && (
                        <button
                          onClick={() => onApproveComment(comment.id)}
                          className="bg-green-100 hover:bg-green-200 text-green-700 p-2 rounded-lg transition-colors"
                          title={t('admin.approve')}
                        >
                          <FaCheck />
                        </button>
                      )}
                      <button
                        onClick={() => onDeleteComment(comment.id)}
                        className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-lg transition-colors"
                        title={t('admin.delete')}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'articles' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800">{t('admin.manageArticles')}</h3>
              <button
                onClick={() => setShowAddArticle(!showAddArticle)}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <FaPlus />
                {t('admin.newArticle')}
              </button>
            </div>

            {showAddArticle && (
              <form onSubmit={handleAddArticle} className="bg-primary-50 rounded-xl p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder={t('admin.articleTitle')}
                    value={newArticle.title}
                    onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                    className="px-4 py-2 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
                    required
                  />
                  <input
                    type="text"
                    placeholder={t('admin.category')}
                    value={newArticle.category}
                    onChange={(e) => setNewArticle({ ...newArticle, category: e.target.value })}
                    className="px-4 py-2 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
                  />
                  <textarea
                    placeholder={t('admin.summary')}
                    value={newArticle.summary}
                    onChange={(e) => setNewArticle({ ...newArticle, summary: e.target.value })}
                    className="px-4 py-2 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none md:col-span-2"
                    rows={3}
                    required
                  />
                  <textarea
                    placeholder={t('admin.fullText')}
                    value={newArticle.fullText}
                    onChange={(e) => setNewArticle({ ...newArticle, fullText: e.target.value })}
                    className="px-4 py-2 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none md:col-span-2"
                    rows={4}
                  />
                  <input
                    type="text"
                    placeholder={t('admin.imageUrl')}
                    value={newArticle.imageUrl}
                    onChange={(e) => setNewArticle({ ...newArticle, imageUrl: e.target.value })}
                    className="px-4 py-2 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none md:col-span-2"
                  />
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    type="submit"
                    className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    {t('admin.publish')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddArticle(false)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg transition-colors"
                  >
                    {t('admin.cancel')}
                  </button>
                </div>
              </form>
            )}

            {articles.length === 0 ? (
              <p className="text-gray-500 text-center py-8">{t('admin.noArticles')}</p>
            ) : (
              articles.map((article) => (
                <div key={article.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800">{article.title}</h4>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
                        <span>{article.category}</span>
                        <span>👁 {article.views} {t('articles.views')}</span>
                        <span>{new Date(article.date).toLocaleDateString('fa-IR')}</span>
                      </div>
                      <p className="mt-2 text-gray-600 text-sm line-clamp-2">{article.summary}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onDeleteArticle(article.id)}
                        className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-lg transition-colors"
                        title={t('admin.deleteArticle')}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;