import { create } from 'zustand';
import api from '@/lib/api';
import { User, Post } from './usePostStore';

export interface SupportGroup {
  id: number;
  name: string;
  description: string;
  topic: string;
  privacy_level: 'public' | 'private';
  admin: User;
  members_count?: number;
  is_member?: boolean;
  is_admin?: boolean;
  created_at: string;
  updated_at: string;
}

export interface GroupPost extends Post {
  group: number;
}

interface GroupStore {
  groups: SupportGroup[];
  myGroups: SupportGroup[];
  currentGroup: SupportGroup | null;
  groupPosts: GroupPost[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchGroups: (filters?: any) => Promise<void>;
  fetchMyGroups: () => Promise<void>;
  fetchGroupPosts: (groupId: number) => Promise<void>;
  createGroup: (data: any) => Promise<SupportGroup>;
  joinGroup: (groupId: number) => Promise<void>;
  leaveGroup: (groupId: number) => Promise<void>;
  deleteGroup: (groupId: number) => Promise<void>;
  createGroupPost: (groupId: number, data: FormData) => Promise<void>;
  setCurrentGroup: (group: SupportGroup | null) => void;
  clearGroups: () => void;
}

export const useGroupStore = create<GroupStore>((set, get) => ({
  groups: [],
  myGroups: [],
  currentGroup: null,
  groupPosts: [],
  loading: false,
  error: null,

  fetchGroups: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/api/support-groups/groups/', {
        params: filters
      });
      const groups = response.data.results || response.data || [];
      console.log('[Support Groups] Fetched groups:', groups.length, 'groups');
      console.log('[Support Groups] Groups data:', groups);
      set({ groups, loading: false });
    } catch (error: any) {
      console.error('[Support Groups] Failed to fetch groups:', error);
      console.error('[Support Groups] Error details:', error.response?.data);
      set({ error: error.response?.data?.detail || 'Failed to load groups', loading: false });
    }
  },

  fetchMyGroups: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/api/support-groups/my-groups/');
      const groups = response.data.results || response.data || [];
      console.log('[Support Groups] Fetched my groups:', groups.length, 'groups');
      set({ myGroups: groups, loading: false });
    } catch (error: any) {
      console.error('[Support Groups] Failed to fetch my groups:', error);
      console.error('[Support Groups] Error details:', error.response?.data);
      set({ error: error.response?.data?.detail || 'Failed to load your groups', loading: false });
    }
  },

  fetchGroupPosts: async (groupId: number) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/api/support-groups/posts/', {
        params: { group: groupId }
      });
      const posts = response.data.results || response.data || [];
      set({ groupPosts: posts, loading: false });
    } catch (error: any) {
      console.error('Failed to fetch group posts:', error);
      set({ error: error.response?.data?.detail || 'Failed to load group posts', loading: false });
    }
  },

  createGroup: async (data: any) => {
    try {
      const response = await api.post('/api/support-groups/groups/', data);
      set((state) => ({
        groups: [response.data, ...state.groups],
        myGroups: [response.data, ...state.myGroups]
      }));
      return response.data;
    } catch (error: any) {
      console.error('Failed to create group:', error);
      throw error;
    }
  },

  joinGroup: async (groupId: number) => {
    try {
      await api.post(`/api/support-groups/groups/${groupId}/join/`);
      
      const updateGroup = (group: SupportGroup) => {
        if (group.id === groupId) {
          return {
            ...group,
            is_member: true,
            members_count: (group.members_count || 0) + 1
          };
        }
        return group;
      };
      
      set((state) => ({
        groups: state.groups.map(updateGroup),
        myGroups: [...state.myGroups, state.groups.find(g => g.id === groupId)!].filter(Boolean)
      }));
    } catch (error: any) {
      console.error('Failed to join group:', error);
      throw error;
    }
  },

  leaveGroup: async (groupId: number) => {
    try {
      await api.post(`/api/support-groups/groups/${groupId}/leave/`);
      
      const updateGroup = (group: SupportGroup) => {
        if (group.id === groupId) {
          return {
            ...group,
            is_member: false,
            members_count: Math.max((group.members_count || 1) - 1, 0)
          };
        }
        return group;
      };
      
      set((state) => ({
        groups: state.groups.map(updateGroup),
        myGroups: state.myGroups.filter(g => g.id !== groupId)
      }));
    } catch (error: any) {
      console.error('Failed to leave group:', error);
      throw error;
    }
  },

  deleteGroup: async (groupId: number) => {
    try {
      await api.delete(`/api/support-groups/groups/${groupId}/`);
      set((state) => ({
        groups: state.groups.filter(g => g.id !== groupId),
        myGroups: state.myGroups.filter(g => g.id !== groupId)
      }));
    } catch (error: any) {
      console.error('Failed to delete group:', error);
      throw error;
    }
  },

  createGroupPost: async (groupId: number, data: FormData) => {
    try {
      const response = await api.post('/api/support-groups/posts/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      set((state) => ({
        groupPosts: [response.data, ...state.groupPosts]
      }));
    } catch (error: any) {
      console.error('Failed to create group post:', error);
      throw error;
    }
  },

  setCurrentGroup: (group: SupportGroup | null) => {
    set({ currentGroup: group, groupPosts: [] });
    if (group) {
      get().fetchGroupPosts(group.id);
    }
  },

  clearGroups: () => set({ groups: [], myGroups: [], currentGroup: null, groupPosts: [] })
}));
