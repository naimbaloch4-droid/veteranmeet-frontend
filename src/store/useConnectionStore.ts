import { create } from 'zustand';
import api from '@/lib/api';
import { User } from './usePostStore';

interface Connection extends User {
  followed_at?: string;
  mutual?: boolean;
}

interface ConnectionStore {
  followers: Connection[];
  following: Connection[];
  suggestions: User[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchFollowers: () => Promise<void>;
  fetchFollowing: () => Promise<void>;
  fetchSuggestions: () => Promise<void>;
  followUser: (userId: number) => Promise<void>;
  unfollowUser: (userId: number) => Promise<void>;
  isFollowing: (userId: number) => boolean;
  clearConnections: () => void;
}

export const useConnectionStore = create<ConnectionStore>((set, get) => ({
  followers: [],
  following: [],
  suggestions: [],
  loading: false,
  error: null,

  fetchFollowers: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/api/auth/followers/');
      const followers = response.data.results || response.data || [];
      set({ followers, loading: false });
    } catch (error: any) {
      console.error('Failed to fetch followers:', error);
      set({ error: error.response?.data?.detail || 'Failed to load followers', loading: false });
    }
  },

  fetchFollowing: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/api/auth/following/');
      const following = response.data.results || response.data || [];
      set({ following, loading: false });
    } catch (error: any) {
      console.error('Failed to fetch following:', error);
      set({ error: error.response?.data?.detail || 'Failed to load following', loading: false });
    }
  },

  fetchSuggestions: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/api/auth/suggestions/');
      const suggestions = response.data.results || response.data || [];
      set({ suggestions, loading: false });
    } catch (error: any) {
      console.error('Failed to fetch suggestions:', error);
      set({ error: error.response?.data?.detail || 'Failed to load suggestions', loading: false });
    }
  },

  followUser: async (userId: number) => {
    try {
      await api.post(`/api/auth/follow/${userId}/`);
      
      // Add to following list
      const userResponse = await api.get(`/api/auth/user/${userId}/`);
      const user = userResponse.data;
      
      set((state) => ({
        following: [...state.following, user],
        suggestions: state.suggestions.filter(u => u.id !== userId)
      }));
    } catch (error: any) {
      console.error('Failed to follow user:', error);
      throw error;
    }
  },

  unfollowUser: async (userId: number) => {
    try {
      await api.post(`/api/auth/follow/${userId}/`); // Toggle endpoint
      
      set((state) => ({
        following: state.following.filter(u => u.id !== userId)
      }));
    } catch (error: any) {
      console.error('Failed to unfollow user:', error);
      throw error;
    }
  },

  isFollowing: (userId: number) => {
    return get().following.some(u => u.id === userId);
  },

  clearConnections: () => set({ followers: [], following: [], suggestions: [] })
}));
