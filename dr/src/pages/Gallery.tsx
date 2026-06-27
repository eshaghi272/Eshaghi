import React from 'react';
import { useLanguage } from '../hooks/useLanguage';

const Gallery: React.FC = () => {
  const { t } = useLanguage();
  
  const images = [
    { id: 1, title: 'Modern Operating Room', category: 'Facility' },
    { id: 2, title: 'Surgical Team', category: 'Team' },
    { id: 3, title: 'Advanced Technology', category: 'Technology' },
    { id: 4, title: 'Patient Care', category: 'Care' },
    { id: 5, title: 'Medical Equipment', category: 'Equipment' },
    { id: 6, title: 'Consultation Room', category: 'Facility' },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
        {t('nav.gallery')}
      </h1>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((image) => (
          <div key={image.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 flex items-center justify-center">
              <span className="text-4xl">🏥</span>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-800 dark:text-white">{image.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{image.category}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Gallery;
