// utils/database.ts
export interface Article {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  category: 'news' | 'education';
  tags: string[];
  date: string;
  image?: string;
  author?: string;
}

export interface Testimonial {
  id: number;
  name: string;
  rating: number;
  comment: string;
  date: string;
  avatar?: string;
}

export interface Service {
  id: number;
  title: string;
  description: string;
  icon: string;
  category: string;
}

let db: IDBDatabase | null = null;

export const initDB = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve();
      return;
    }

    const request = indexedDB.open('DrAbedianDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve();
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      if (!database.objectStoreNames.contains('articles')) {
        const store = database.createObjectStore('articles', { keyPath: 'id' });
        store.createIndex('category', 'category', { unique: false });
        store.createIndex('date', 'date', { unique: false });
        seedArticles(store);
      }

      if (!database.objectStoreNames.contains('testimonials')) {
        const store = database.createObjectStore('testimonials', { keyPath: 'id' });
        seedTestimonials(store);
      }

      if (!database.objectStoreNames.contains('services')) {
        const store = database.createObjectStore('services', { keyPath: 'id' });
        seedServices(store);
      }
    };
  });
};

const seedArticles = (store: IDBObjectStore) => {
  const articles: Omit<Article, 'id'>[] = [
    {
      title: 'Armada Surgical Center Announces Second International GYN Aesthetic Training Course on 24-25th Jan',
      excerpt: 'Second "GYN aesthetic training course" in Armada surgical center will be held on 24 and 25th Jan. 2026',
      content: 'Full content here...',
      category: 'news',
      tags: ['Training', 'GYN', 'Aesthetic'],
      date: '2026-01-17',
      author: 'Dr. Abedian'
    },
    {
      title: 'The second training course on "Minimally Invasive Techniques for the Treatment of Male Sexual Dysfunction" was held on February 8, 2026',
      excerpt: 'The second training course on "Minimally Invasive Techniques for the Treatment of Male Sexual Dysfunction" was held on February 8, 2026, at the Armada Surgery Center',
      content: 'Full content here...',
      category: 'news',
      tags: ['Training', 'Sexual Dysfunction', 'Minimally Invasive'],
      date: '2026-02-11',
      author: 'Dr. Abedian'
    },
    {
      title: 'Free public health screening campaign in Armada Towers',
      excerpt: 'Free public health screening campaign in Armada Towers',
      content: 'Full content here...',
      category: 'news',
      tags: ['Health Screening', 'Public Health'],
      date: '2026-01-20',
      author: 'Dr. Abedian'
    },
    {
      title: 'Pain Management Conference was held at Armada Surgical Center',
      excerpt: 'Pain management conference was done in ASC by Dr Babak Babakhani, pain management specialist',
      content: 'Full content here...',
      category: 'education',
      tags: ['Pain Management', 'Conference'],
      date: '2026-01-17',
      author: 'Dr. Babakhani'
    },
    {
      title: 'Hemorrhoid, quick review',
      excerpt: 'Everyone should be note that surgical procedures are not enough for prevention and should be followed by medication and life style modification.',
      content: 'Full content here...',
      category: 'education',
      tags: ['Hemorrhoid', 'Treatment'],
      date: '2026-01-22',
      author: 'Dr. Abedian'
    },
    {
      title: 'Sinusitis, new aspect on diagnosis and treatment',
      excerpt: 'Sinusitis conference was run as Armada scientific conferences by Dr Mohesn Naraghi',
      content: 'Full content here...',
      category: 'education',
      tags: ['Sinusitis', 'Diagnosis', 'Treatment'],
      date: '2026-01-23',
      author: 'Dr. Naraghi'
    }
  ];

  articles.forEach((article, index) => {
    store.add({ ...article, id: index + 1 });
  });
};

const seedTestimonials = (store: IDBObjectStore) => {
  const testimonials: Omit<Testimonial, 'id'>[] = [
    {
      name: 'John Doe',
      rating: 5,
      comment: 'Excellent surgeon! Highly recommend Dr. Abedian.',
      date: '2026-01-15'
    },
    {
      name: 'Jane Smith',
      rating: 5,
      comment: 'Professional and caring staff. Great experience.',
      date: '2026-01-10'
    }
  ];

  testimonials.forEach((testimonial, index) => {
    store.add({ ...testimonial, id: index + 1 });
  });
};

const seedServices = (store: IDBObjectStore) => {
  const services: Omit<Service, 'id'>[] = [
    {
      title: 'Laparoscopic Surgery',
      description: 'Minimally invasive surgical procedures with faster recovery times.',
      icon: '🔬',
      category: 'surgery'
    },
    {
      title: 'Thyroid Surgery',
      description: 'Expert thyroid treatment and surgical procedures.',
      icon: '🦋',
      category: 'surgery'
    },
    {
      title: 'Weight Management',
      description: 'Comprehensive weight loss solutions and bariatric surgery.',
      icon: '⚖️',
      category: 'wellness'
    }
  ];

  services.forEach((service, index) => {
    store.add({ ...service, id: index + 1 });
  });
};

export const getArticles = (): Promise<Article[]> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    const transaction = db.transaction('articles', 'readonly');
    const store = transaction.objectStore('articles');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getTestimonials = (): Promise<Testimonial[]> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    const transaction = db.transaction('testimonials', 'readonly');
    const store = transaction.objectStore('testimonials');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getServices = (): Promise<Service[]> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    const transaction = db.transaction('services', 'readonly');
    const store = transaction.objectStore('services');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};