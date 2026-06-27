export interface Article {
  id: number;
  title: string;
  titleFa?: string;
  excerpt: string;
  excerptFa?: string;
  content: string;
  contentFa?: string;
  category: 'news' | 'education';
  tags: string[];
  date: string;
  image?: string;
  author?: string;
  authorFa?: string;
  readTime?: number;
}

export interface Testimonial {
  id: number;
  name: string;
  nameFa?: string;
  rating: number;
  comment: string;
  commentFa?: string;
  date: string;
  avatar?: string;
  location?: string;
  locationFa?: string;
}

export interface Service {
  id: number;
  title: string;
  titleFa?: string;
  description: string;
  descriptionFa?: string;
  icon: string;
  category: string;
  categoryFa?: string;
  features?: string[];
  featuresFa?: string[];
  image?: string;
}

export interface GalleryItem {
  id: number;
  title: string;
  titleFa?: string;
  description?: string;
  descriptionFa?: string;
  image: string;
  category: 'before-after' | 'surgery' | 'facility';
  date?: string;
}

export interface Appointment {
  id: number;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  date: string;
  time: string;
  service: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  createdAt: string;
}

export type Language = 'en' | 'fa';
export type Theme = 'light' | 'dark';
export type ColorScheme = 'blue' | 'green' | 'purple' | 'red' | 'orange';
