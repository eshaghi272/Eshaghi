import React, { createContext, useContext, useState } from 'react';

interface Article {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  category: 'news' | 'education';
  date: string;
}

interface DBContextType {
  articles: Article[];
  loading: boolean;
}

export const DBContext = createContext<DBContextType | undefined>(undefined);

export const DBProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [articles] = useState<Article[]>([
    {
      id: 1,
      title: 'Armada Surgical Center Announces Second International GYN Aesthetic Training Course',
      excerpt: 'Second "GYN aesthetic training course" in Armada surgical center will be held on 24 and 25th Jan. 2026',
      content: 'Full content here...',
      category: 'news',
      date: '2026-01-17'
    },
    {
      id: 2,
      title: 'Minimally Invasive Techniques for the Treatment of Male Sexual Dysfunction',
      excerpt: 'The second training course was held on February 8, 2026, at the Armada Surgery Center',
      content: 'Full content here...',
      category: 'news',
      date: '2026-02-11'
    },
    {
      id: 3,
      title: 'Free public health screening campaign in Armada Towers',
      excerpt: 'Free public health screening campaign in Armada Towers',
      content: 'Full content here...',
      category: 'news',
      date: '2026-01-20'
    },
    {
      id: 4,
      title: 'Pain Management Conference was held at Armada Surgical Center',
      excerpt: 'Pain management conference was done in ASC by Dr Babak Babakhani',
      content: 'Full content here...',
      category: 'education',
      date: '2026-01-17'
    },
    {
      id: 5,
      title: 'Hemorrhoid, quick review',
      excerpt: 'Surgical procedures are not enough for prevention and should be followed by medication',
      content: 'Full content here...',
      category: 'education',
      date: '2026-01-22'
    }
  ]);
  const [loading] = useState(false);

  return (
    <DBContext.Provider value={{ articles, loading }}>
      {children}
    </DBContext.Provider>
  );
};

export const useDB = () => {
  const context = useContext(DBContext);
  if (!context) throw new Error('useDB must be used within DBProvider');
  return context;
};
