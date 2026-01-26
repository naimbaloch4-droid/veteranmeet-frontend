import { create } from 'zustand';
import api from '@/lib/api';
import { User } from './usePostStore';

export interface Resource {
  id: number;
  title: string;
  description: string;
  url?: string;
  category: number;
  category_name?: string;
  contact_info?: string;
  submitted_by?: User;
  created_at: string;
  updated_at: string;
  is_approved?: boolean;
}

export interface ResourceCategory {
  id: number;
  name: string;
  description?: string;
  resources_count?: number;
}

interface ResourceStore {
  resources: Resource[];
  categories: ResourceCategory[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchResources: (filters?: any) => Promise<void>;
  fetchCategories: () => Promise<void>;
  createResource: (data: any) => Promise<Resource>;
  deleteResource: (resourceId: number) => Promise<void>;
  clearResources: () => void;
}

export const useResourceStore = create<ResourceStore>((set, get) => ({
  resources: [],
  categories: [],
  loading: false,
  error: null,

  fetchResources: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/api/resources/', {
        params: filters
      });
      const resources = response.data.results || response.data || [];
      set({ resources, loading: false });
    } catch (error: any) {
      console.error('Failed to fetch resources:', error);
      set({ error: error.response?.data?.detail || 'Failed to load resources', loading: false });
    }
  },

  fetchCategories: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/api/resources/categories/');
      const categories = response.data.results || response.data || [];
      set({ categories, loading: false });
    } catch (error: any) {
      console.error('Failed to fetch categories:', error);
      set({ error: error.response?.data?.detail || 'Failed to load categories', loading: false });
    }
  },

  createResource: async (data: any) => {
    try {
      const response = await api.post('/api/resources/', data);
      set((state) => ({
        resources: [response.data, ...state.resources]
      }));
      return response.data;
    } catch (error: any) {
      console.error('Failed to create resource:', error);
      throw error;
    }
  },

  deleteResource: async (resourceId: number) => {
    try {
      await api.delete(`/api/resources/${resourceId}/`);
      set((state) => ({
        resources: state.resources.filter(r => r.id !== resourceId)
      }));
    } catch (error: any) {
      console.error('Failed to delete resource:', error);
      throw error;
    }
  },

  clearResources: () => set({ resources: [], categories: [] })
}));
