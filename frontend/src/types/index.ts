export interface User {
  id: number;
  username: string;
  name: string;
  email?: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
  createdAt: string;
}

export type SlideType =
  | 'news'
  | 'game'
  | 'complex_map'
  | 'visitor_info'
  | 'services'
  | 'announcement'
  | 'sponsor';

export interface Slide {
  id: number;
  type: SlideType;
  title: string;
  content: any;
  duration: number;
  ordering: number;
  isActive: boolean;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  [key: string]: string;
}

export interface WPPost {
  id: number;
  title: string;
  excerpt: string;
  featuredImage: string;
  date: string;
  link: string;
}

export interface WPCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
}
