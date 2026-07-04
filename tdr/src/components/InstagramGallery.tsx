import React from 'react';
import { useTranslation } from 'react-i18next';

const InstagramGallery: React.FC = () => {
  const { t } = useTranslation();
  const posts = t('instagram.posts', { returnObjects: true }) as Array<{
    title: string;
    author: string;
  }>;

  return (
    <section id="gallery" className="py-12 sm:py-16 md:py-20">
      <div className="container mx-auto px-4 sm:px-6">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-center">
          {t('instagram.title')}
        </h2>
        <p className="text-center text-gray-600 dark:text-gray-300 mt-2 text-sm sm:text-base">
          {t('instagram.subtitle')}
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-12">
          {posts.map((post, index) => (
            <div
              key={index}
              className="bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition"
            >
              <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 dark:from-gray-600 dark:to-gray-500 flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 dark:text-white text-sm sm:text-base">
                  {post.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{post.author}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default InstagramGallery;