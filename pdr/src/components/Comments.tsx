// src/components/Comments.tsx

import React, { useState } from 'react';
import { FaStar, FaUser, FaCalendarAlt, FaCheckCircle, FaClock } from 'react-icons/fa';
import { Comment } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface CommentsProps {
  comments: Comment[];
  onAddComment: (comment: Omit<Comment, 'id' | 'date' | 'isApproved'>) => void;
}

const Comments: React.FC<CommentsProps> = ({ comments, onAddComment }) => {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const approvedComments = comments.filter(c => c.isApproved);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return;

    setIsSubmitting(true);
    
    onAddComment({
      patientName: name.trim(),
      rating,
      text: text.trim(),
      isVerified: false,
    });

    setName('');
    setText('');
    setRating(5);
    setIsSubmitting(false);
    setSuccessMessage(t('comments.success'));
    
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const renderStars = (rate: number, interactive: boolean = false) => {
    const stars = [];
    const maxRating = interactive ? hoveredRating || rating : rate;
    
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          type="button"
          className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
          onClick={() => interactive && setRating(i)}
          onMouseEnter={() => interactive && setHoveredRating(i)}
          onMouseLeave={() => interactive && setHoveredRating(null)}
        >
          <FaStar
            className={`${
              i <= maxRating ? 'text-yellow-400' : 'text-gray-300'
            } ${interactive ? 'text-2xl' : 'text-sm'}`}
          />
        </button>
      );
    }
    return stars;
  };

  return (
    <section id="comments" className="bg-white rounded-2xl shadow-xl overflow-hidden">
      <div className="bg-gradient-to-l from-primary-600 to-primary-800 p-6 text-white">
        <h2 className="text-2xl font-bold">{t('comments.title')}</h2>
        <p className="text-primary-200 text-sm mt-1">{t('comments.subtitle')}</p>
      </div>

      <div className="p-6">
        <form onSubmit={handleSubmit} className="bg-primary-50 rounded-xl p-6 mb-8">
          <h3 className="font-bold text-lg text-gray-800 mb-4">{t('comments.newComment')}</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('comments.name')}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                placeholder={t('comments.namePlaceholder')}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('comments.rating')}</label>
              <div className="flex gap-1">
                {renderStars(rating, true)}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('comments.commentText')}</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all resize-none"
                rows={4}
                placeholder={t('comments.commentPlaceholder')}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 rounded-lg font-semibold text-white transition-all ${
                isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-medical hover:bg-primary-600 hover:shadow-lg'
              }`}
            >
              {isSubmitting ? t('comments.submitting') : t('comments.submit')}
            </button>

            {successMessage && (
              <div className="bg-green-100 text-green-700 p-3 rounded-lg text-sm flex items-center gap-2">
                <FaCheckCircle className="text-green-500" />
                {successMessage}
              </div>
            )}
          </div>
        </form>

        <div className="space-y-4">
          <h3 className="font-bold text-lg text-gray-800 mb-4">
            {t('comments.title')} ({approvedComments.length})
          </h3>

          {approvedComments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">{t('comments.noComments')}</p>
          ) : (
            approvedComments.map((comment) => (
              <div key={comment.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <FaUser className="text-primary-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800">{comment.patientName}</span>
                        {comment.isVerified && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <FaCheckCircle className="text-xs" />
                            {t('comments.verified')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <FaCalendarAlt className="text-primary-400" />
                          {new Date(comment.date).toLocaleDateString('fa-IR')}
                        </span>
                        <div className="flex gap-0.5">
                          {renderStars(comment.rating)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-gray-700 leading-relaxed">{comment.text}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default Comments;