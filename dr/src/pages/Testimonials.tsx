import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { Star } from 'lucide-react';

const Testimonials: React.FC = () => {
  const { t } = useLanguage();
  
  const testimonials = [
    { name: 'John Doe', rating: 5, comment: 'Excellent surgeon! Highly recommend Dr. Abedian.', date: '2026-01-15' },
    { name: 'Jane Smith', rating: 5, comment: 'Professional and caring staff. Great experience.', date: '2026-01-10' },
    { name: 'Michael Johnson', rating: 4, comment: 'Very knowledgeable and thorough.', date: '2026-01-05' },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
        {t('nav.testimonials')}
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonials.map((testimonial, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-1 text-yellow-400 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < testimonial.rating ? 'fill-current' : 'text-gray-300'}`} />
              ))}
            </div>
            <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">
              "{testimonial.comment}"
            </p>
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-800 dark:text-white text-sm">
                {testimonial.name}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(testimonial.date).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Testimonials;
