/**
 * Centralized API Service Layer
 * 
 * This service provides a clean abstraction over Axios for all API calls.
 * Benefits:
 * - Single source of truth for API endpoints
 * - Consistent error handling
 * - Easy to mock for testing
 * - Type-safe API calls
 */

import api from '@/lib/api';
import { AxiosResponse } from 'axios';

// ==================== AUTH SERVICES ====================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  username?: string;
}

export const authService = {
  login: async (credentials: LoginCredentials) => {
    const response = await api.post('/api/auth/login/', credentials);
    return response.data;
  },

  register: async (data: RegisterData) => {
    const response = await api.post('/api/auth/register/', data);
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/api/auth/logout/');
    return response.data;
  },

  refreshToken: async () => {
    const response = await api.post('/api/auth/token/refresh/');
    return response.data;
  },
};

// ==================== CHAT SERVICES ====================

export interface CreateRoomData {
  user_id: number;
}

export interface SendMessageData {
  room: number;
  content: string;
}

export const chatService = {
  // Room operations
  getRooms: async () => {
    const response = await api.get('/api/chat/rooms/');
    return response.data.results || response.data || [];
  },

  createDirectChat: async (userId: number) => {
    const response = await api.post('/api/chat/rooms/create_direct_chat/', {
      user_id: userId,
    });
    return response.data;
  },

  deleteRoom: async (roomId: number) => {
    const response = await api.delete(`/api/chat/rooms/${roomId}/`);
    return response.data;
  },

  markRoomAsRead: async (roomId: number) => {
    const response = await api.post(`/api/chat/rooms/${roomId}/mark_read/`);
    return response.data;
  },

  // Message operations
  getMessages: async (roomId: number) => {
    const response = await api.get('/api/chat/messages/', {
      params: { room_id: roomId },
    });
    return response.data.results || response.data || [];
  },

  sendMessage: async (data: SendMessageData) => {
    const response = await api.post('/api/chat/messages/', data);
    return response.data;
  },

  markMessageAsRead: async (messageId: number) => {
    const response = await api.post(`/api/chat/messages/${messageId}/mark_read/`);
    return response.data;
  },

  // Presence operations
  sendHeartbeat: async () => {
    const response = await api.post('/api/chat/heartbeat/', {
      timestamp: new Date().toISOString(),
    });
    return response.data;
  },

  markOffline: async () => {
    const response = await api.post('/api/chat/mark-offline/', {
      timestamp: new Date().toISOString(),
    });
    return response.data;
  },

  getOnlineUsers: async () => {
    const response = await api.get('/api/chat/online-users/');
    return response.data.online_users || response.data || [];
  },

  sendTypingIndicator: async (roomId: number, isTyping: boolean) => {
    const response = await api.post(`/api/chat/rooms/${roomId}/typing/`, {
      is_typing: isTyping,
    });
    return response.data;
  },
};

// ==================== USER/CONNECTION SERVICES ====================

export const userService = {
  getProfile: async (userId?: number) => {
    const url = userId ? `/api/users/${userId}/` : '/api/users/profile/';
    const response = await api.get(url);
    return response.data;
  },

  updateProfile: async (data: any) => {
    const response = await api.patch('/api/users/profile/', data);
    return response.data;
  },

  searchUsers: async (query: string) => {
    const response = await api.get('/api/users/search/', {
      params: { q: query },
    });
    return response.data;
  },
};

export const connectionService = {
  getFollowers: async () => {
    const response = await api.get('/api/connections/followers/');
    return response.data;
  },

  getFollowing: async () => {
    const response = await api.get('/api/connections/following/');
    return response.data;
  },

  follow: async (userId: number) => {
    const response = await api.post(`/api/connections/follow/${userId}/`);
    return response.data;
  },

  unfollow: async (userId: number) => {
    const response = await api.delete(`/api/connections/unfollow/${userId}/`);
    return response.data;
  },
};

// ==================== POST SERVICES ====================

export const postService = {
  getPosts: async (params?: any) => {
    const response = await api.get('/api/posts/', { params });
    return response.data.results || response.data || [];
  },

  createPost: async (data: any) => {
    const response = await api.post('/api/posts/', data);
    return response.data;
  },

  updatePost: async (postId: number, data: any) => {
    const response = await api.patch(`/api/posts/${postId}/`, data);
    return response.data;
  },

  deletePost: async (postId: number) => {
    const response = await api.delete(`/api/posts/${postId}/`);
    return response.data;
  },

  likePost: async (postId: number) => {
    const response = await api.post(`/api/posts/${postId}/like/`);
    return response.data;
  },

  unlikePost: async (postId: number) => {
    const response = await api.post(`/api/posts/${postId}/unlike/`);
    return response.data;
  },

  addComment: async (postId: number, content: string) => {
    const response = await api.post(`/api/posts/${postId}/comments/`, { content });
    return response.data;
  },
};

// ==================== EVENT SERVICES ====================

export const eventService = {
  getEvents: async (params?: any) => {
    const response = await api.get('/api/events/', { params });
    return response.data.results || response.data || [];
  },

  createEvent: async (data: any) => {
    const response = await api.post('/api/events/', data);
    return response.data;
  },

  updateEvent: async (eventId: number, data: any) => {
    const response = await api.patch(`/api/events/${eventId}/`, data);
    return response.data;
  },

  deleteEvent: async (eventId: number) => {
    const response = await api.delete(`/api/events/${eventId}/`);
    return response.data;
  },

  joinEvent: async (eventId: number) => {
    const response = await api.post(`/api/events/${eventId}/join/`);
    return response.data;
  },

  leaveEvent: async (eventId: number) => {
    const response = await api.post(`/api/events/${eventId}/leave/`);
    return response.data;
  },
};

// ==================== GROUP SERVICES ====================

export const groupService = {
  getGroups: async (params?: any) => {
    const response = await api.get('/api/groups/', { params });
    return response.data.results || response.data || [];
  },

  createGroup: async (data: any) => {
    const response = await api.post('/api/groups/', data);
    return response.data;
  },

  updateGroup: async (groupId: number, data: any) => {
    const response = await api.patch(`/api/groups/${groupId}/`, data);
    return response.data;
  },

  deleteGroup: async (groupId: number) => {
    const response = await api.delete(`/api/groups/${groupId}/`);
    return response.data;
  },

  joinGroup: async (groupId: number) => {
    const response = await api.post(`/api/groups/${groupId}/join/`);
    return response.data;
  },

  leaveGroup: async (groupId: number) => {
    const response = await api.post(`/api/groups/${groupId}/leave/`);
    return response.data;
  },
};

// ==================== RESOURCE SERVICES ====================

export const resourceService = {
  getResources: async (params?: any) => {
    const response = await api.get('/api/resources/', { params });
    return response.data.results || response.data || [];
  },

  createResource: async (data: any) => {
    const response = await api.post('/api/resources/', data);
    return response.data;
  },

  updateResource: async (resourceId: number, data: any) => {
    const response = await api.patch(`/api/resources/${resourceId}/`, data);
    return response.data;
  },

  deleteResource: async (resourceId: number) => {
    const response = await api.delete(`/api/resources/${resourceId}/`);
    return response.data;
  },
};

// Export all services as a single object for convenience
export default {
  auth: authService,
  chat: chatService,
  user: userService,
  connection: connectionService,
  post: postService,
  event: eventService,
  group: groupService,
  resource: resourceService,
};
