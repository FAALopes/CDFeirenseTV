import axios from 'axios';
import type { User, Slide, Settings, WPPost, WPCategory } from '../types';

const api = axios.create({
  baseURL: '',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = async (username: string, password: string) => {
  const { data } = await api.post('/api/auth/login', { username, password });
  return data;
};

export const getMe = async (): Promise<User> => {
  const { data } = await api.get('/api/auth/me');
  return data;
};

export const changePassword = async (oldPassword: string, newPassword: string) => {
  const { data } = await api.post('/api/auth/change-password', { oldPassword, newPassword });
  return data;
};

// Users
export const getUsers = async (params?: Record<string, string>) => {
  const { data } = await api.get<User[]>('/api/users', { params });
  return data;
};

export const createUser = async (userData: {
  username: string;
  name: string;
  email?: string;
  password: string;
  role?: string;
}) => {
  const { data } = await api.post<User>('/api/users', userData);
  return data;
};

export const updateUser = async (
  id: number,
  userData: { name?: string; email?: string; role?: string; password?: string }
) => {
  const { data } = await api.put<User>(`/api/users/${id}`, userData);
  return data;
};

export const toggleUserStatus = async (id: number) => {
  const { data } = await api.patch<User>(`/api/users/${id}/toggle`);
  return data;
};

export const deleteUser = async (id: number) => {
  const { data } = await api.delete(`/api/users/${id}`);
  return data;
};

// Slides
export const getSlides = async (params?: Record<string, string>) => {
  const { data } = await api.get<Slide[]>('/api/slides', { params });
  return data;
};

export const getSlide = async (id: number) => {
  const { data } = await api.get<Slide>(`/api/slides/${id}`);
  return data;
};

export const createSlide = async (slideData: Partial<Slide>) => {
  const { data } = await api.post<Slide>('/api/slides', slideData);
  return data;
};

export const updateSlide = async (id: number, slideData: Partial<Slide>) => {
  const { data } = await api.put<Slide>(`/api/slides/${id}`, slideData);
  return data;
};

export const deleteSlide = async (id: number) => {
  const { data } = await api.delete(`/api/slides/${id}`);
  return data;
};

export const reorderSlides = async (items: { id: number; ordering: number }[]) => {
  const { data } = await api.put('/api/slides/reorder', { items });
  return data;
};

export const toggleSlide = async (id: number) => {
  const { data } = await api.patch<Slide>(`/api/slides/${id}/toggle`);
  return data;
};

// Settings
export const getSettings = async (): Promise<Settings> => {
  const { data } = await api.get('/api/settings');
  return data;
};

export const updateSettings = async (settings: Settings): Promise<Settings> => {
  const { data } = await api.put('/api/settings', settings);
  return data;
};

// WordPress
export const getWPPosts = async (): Promise<WPPost[]> => {
  const { data } = await api.get('/api/wordpress/posts');
  return data;
};

export const getWPCategories = async (): Promise<WPCategory[]> => {
  const { data } = await api.get('/api/wordpress/categories');
  return data;
};

// Uploads
export const uploadImage = async (file: File): Promise<{ url: string; filename: string }> => {
  const formData = new FormData();
  formData.append('image', file);
  const { data } = await api.post('/api/uploads', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const deleteImage = async (filename: string) => {
  const { data } = await api.delete(`/api/uploads/${filename}`);
  return data;
};

// TV (public)
export const getTVSlides = async (): Promise<Slide[]> => {
  const { data } = await api.get('/api/tv/slides');
  return data;
};

export const getTVSettings = async (): Promise<Settings> => {
  const { data } = await api.get('/api/tv/settings');
  return data;
};

export default api;
