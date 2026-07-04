// src/types/index.ts

export interface Comment {
  id: string;
  patientName: string;
  rating: number;
  text: string;
  date: string;
  isVerified: boolean;
  isApproved: boolean;
}

export interface Article {
  id: string;
  title: string;
  summary: string;
  fullText: string;
  date: string;
  views: number;
  category: string;
  imageUrl?: string;
}

export interface SiteStats {
  totalVisits: number;
  totalComments: number;
  totalArticles: number;
  averageRating: number;
}

export interface AdminState {
  isLoggedIn: boolean;
  username: string;
}