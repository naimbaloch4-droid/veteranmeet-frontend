import { create } from 'zustand';
import api from '@/lib/api';

export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  is_veteran: boolean;
  star_rating?: number;
  veteran_category?: string;
}

export interface Comment {
  id: number;
  author: User;
  content: string;
  created_at: string;
}

export interface Post {
  id: number;
  title?: string;
  content: string;
  author: User;
  created_at: string;
  updated_at: string;
  likes_count?: number;
  comments_count?: number;
  image?: string;
  is_liked?: boolean;
  comments?: Comment[];
}

interface PostStore {
  posts: Post[];
  feedPosts: Post[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  hasMore: boolean;
  
  // Actions
  fetchPosts: (page?: number) => Promise<void>;
  fetchFeedPosts: (page?: number) => Promise<void>;
  createPost: (data: FormData) => Promise<Post>;
  deletePost: (postId: number) => Promise<void>;
  likePost: (postId: number) => Promise<void>;
  commentOnPost: (postId: number, content: string) => Promise<void>;
  fetchPostComments: (postId: number) => Promise<Comment[]>;
  clearPosts: () => void;
}

export const usePostStore = create<PostStore>((set, get) => ({
  posts: [],
  feedPosts: [],
  loading: false,
  error: null,
  currentPage: 1,
  hasMore: true,

  fetchPosts: async (page = 1) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/api/posts/', {
        params: { page, page_size: 20 }
      });
      
      const newPosts = response.data.results || response.data || [];
      
      set((state) => ({
        posts: page === 1 ? newPosts : [...state.posts, ...newPosts],
        currentPage: page,
        hasMore: !!response.data.next,
        loading: false
      }));
    } catch (error: any) {
      console.error('Failed to fetch posts:', error);
      set({ error: error.response?.data?.detail || 'Failed to load posts', loading: false });
    }
  },

  fetchFeedPosts: async (page = 1) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/api/auth/feed/', {
        params: { page, page_size: 20 }
      });
      
      const newPosts = response.data.results || response.data || [];
      
      set((state) => ({
        feedPosts: page === 1 ? newPosts : [...state.feedPosts, ...newPosts],
        currentPage: page,
        hasMore: !!response.data.next,
        loading: false
      }));
    } catch (error: any) {
      console.error('Failed to fetch feed posts:', error);
      set({ error: error.response?.data?.detail || 'Failed to load feed', loading: false });
    }
  },

  createPost: async (data: FormData) => {
    try {
      const response = await api.post('/api/posts/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      set((state) => ({
        posts: [response.data, ...state.posts],
        feedPosts: [response.data, ...state.feedPosts]
      }));
      
      return response.data;
    } catch (error: any) {
      console.error('Failed to create post:', error);
      throw error;
    }
  },

  deletePost: async (postId: number) => {
    try {
      await api.delete(`/api/posts/${postId}/`);
      set((state) => ({
        posts: state.posts.filter(p => p.id !== postId),
        feedPosts: state.feedPosts.filter(p => p.id !== postId)
      }));
    } catch (error: any) {
      console.error('Failed to delete post:', error);
      throw error;
    }
  },

  likePost: async (postId: number) => {
    try {
      await api.post(`/api/posts/${postId}/like/`);
      
      const updatePost = (post: Post) => {
        if (post.id === postId) {
          return {
            ...post,
            is_liked: !post.is_liked,
            likes_count: post.is_liked 
              ? (post.likes_count || 0) - 1 
              : (post.likes_count || 0) + 1
          };
        }
        return post;
      };
      
      set((state) => ({
        posts: state.posts.map(updatePost),
        feedPosts: state.feedPosts.map(updatePost)
      }));
    } catch (error: any) {
      console.error('Failed to like post:', error);
      throw error;
    }
  },

  commentOnPost: async (postId: number, content: string) => {
    try {
      await api.post(`/api/posts/${postId}/comment/`, { content });
      
      const updatePost = (post: Post) => {
        if (post.id === postId) {
          return {
            ...post,
            comments_count: (post.comments_count || 0) + 1
          };
        }
        return post;
      };
      
      set((state) => ({
        posts: state.posts.map(updatePost),
        feedPosts: state.feedPosts.map(updatePost)
      }));
    } catch (error: any) {
      console.error('Failed to comment on post:', error);
      throw error;
    }
  },

  fetchPostComments: async (postId: number) => {
    try {
      const response = await api.get(`/api/posts/${postId}/comments/`);
      return response.data.results || response.data || [];
    } catch (error: any) {
      console.error('Failed to fetch comments:', error);
      return [];
    }
  },

  clearPosts: () => set({ posts: [], feedPosts: [], currentPage: 1, hasMore: true })
}));
