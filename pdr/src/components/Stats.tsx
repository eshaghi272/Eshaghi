// src/components/Stats.tsx

import React from 'react';
import { FaEye, FaComment, FaFileAlt, FaStar } from 'react-icons/fa';
import { SiteStats } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface StatsProps {
  stats: SiteStats;
}

const Stats: React.FC<StatsProps> = ({ stats }) => {
  const { t } = useLanguage();

  const statItems = [
    {
      icon: FaEye,
      label: t('stats.totalVisits'),
      value: stats.totalVisits.toLocaleString(),
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      icon: FaComment,
      label: t('stats.totalComments'),
      value: stats.totalComments,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      icon: FaFileAlt,
      label: t('stats.totalArticles'),
      value: stats.totalArticles,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      icon: FaStar,
      label: t('stats.averageRating'),
      value: stats.averageRating.toFixed(1),
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statItems.map((item, index) => (
        <div
          key={index}
          className="bg-white rounded-xl shadow-lg p-4 text-center hover:shadow-xl transition-shadow"
        >
          <div className={`${item.bgColor} w-12 h-12 rounded-full flex items-center justify-center mx-auto`}>
            <item.icon className={`${item.textColor} text-xl`} />
          </div>
          <p className="text-2xl font-bold text-gray-800 mt-2">{item.value}</p>
          <p className="text-sm text-gray-500">{item.label}</p>
        </div>
      ))}
    </div>
  );
};

export default Stats;