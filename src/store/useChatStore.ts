import { create } from 'zustand';
import api from '@/lib/api';
import { User } from './usePostStore';

export interface Message {
  id: number;
  room: number;
  sender: User;
  content: string;
  created_at: string;
  is_read: boolean;
}

export interface ChatRoom {
  id: number;
  type: 'direct' | 'group';
  name?: string;
  participants: User[];
  last_message?: Message;
  unread_count?: number;
  updated_at: string;
  created_at: string;
}

interface ChatStore {
  rooms: ChatRoom[];
  currentRoom: ChatRoom | null;
  messages: Message[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchRooms: () => Promise<void>;
  fetchMessages: (roomId: number) => Promise<void>;
  createDirectChat: (userId: number) => Promise<ChatRoom>;
  sendMessage: (roomId: number, content: string) => Promise<Message>;
  markAsRead: (roomId: number) => Promise<void>;
  markMessageAsRead: (messageId: number) => Promise<void>;
  setCurrentRoom: (room: ChatRoom | null) => void;
  addMessage: (message: Message) => void;
  clearChat: () => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  rooms: [],
  currentRoom: null,
  messages: [],
  loading: false,
  error: null,

  fetchRooms: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/api/chat/rooms/');
      const rooms = response.data.results || response.data || [];
      set({ rooms, loading: false });
    } catch (error: any) {
      console.error('Failed to fetch chat rooms:', error);
      set({ error: error.response?.data?.detail || 'Failed to load chats', loading: false });
    }
  },

  fetchMessages: async (roomId: number) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/api/chat/messages/', {
        params: { room_id: roomId }
      });
      const messages = response.data.results || response.data || [];
      set({ messages, loading: false });
    } catch (error: any) {
      console.error('Failed to fetch messages:', error);
      set({ error: error.response?.data?.detail || 'Failed to load messages', loading: false });
    }
  },

  createDirectChat: async (userId: number) => {
    try {
      const response = await api.post('/api/chat/rooms/create_direct_chat/', {
        user_id: userId
      });

      const newRoom = response.data;
      set((state) => ({
        rooms: [newRoom, ...state.rooms.filter(r => r.id !== newRoom.id)]
      }));

      return newRoom;
    } catch (error: any) {
      console.error('Failed to create chat:', error);
      throw error;
    }
  },

  sendMessage: async (roomId: number, content: string) => {
    try {
      const response = await api.post('/api/chat/messages/', {
        room: roomId,
        content
      });

      const newMessage = response.data;

      set((state) => ({
        messages: [...state.messages, newMessage],
        rooms: state.rooms.map(room =>
          room.id === roomId
            ? { ...room, last_message: newMessage, updated_at: newMessage.created_at }
            : room
        )
      }));

      return newMessage;
    } catch (error: any) {
      console.error('Failed to send message:', error);
      throw error;
    }
  },

  markAsRead: async (roomId: number) => {
    try {
      await api.post(`/api/chat/rooms/${roomId}/mark_read/`);

      set((state) => ({
        rooms: state.rooms.map(room =>
          room.id === roomId
            ? { ...room, unread_count: 0 }
            : room
        )
      }));
    } catch (error: any) {
      console.error('Failed to mark as read:', error);
    }
  },

  markMessageAsRead: async (messageId: number) => {
    try {
      // Use the exact endpoint provided in the manual: POST /api/chat/messages/{id}/mark_read/
      await api.post(`/api/chat/messages/${messageId}/mark_read/`);

      set((state) => ({
        messages: state.messages.map(msg =>
          msg.id === messageId ? { ...msg, is_read: true } : msg
        )
      }));
    } catch (error: any) {
      // Log more details to help debug the 404
      console.warn(`[Chat] Failed to mark message ${messageId} as read:`, error.response?.status === 404 ? 'Endpoint not found' : error.message);
    }
  },

  setCurrentRoom: (room: ChatRoom | null) => {
    set({ currentRoom: room, messages: [] });
    if (room) {
      get().fetchMessages(room.id);
      // Removed markAsRead(room.id) as the manual specified per-message marking
    }
  },

  addMessage: (message: Message) => {
    set((state) => ({
      messages: [...state.messages, message],
      rooms: state.rooms.map(room =>
        room.id === message.room
          ? { ...room, last_message: message, updated_at: message.created_at }
          : room
      )
    }));
  },

  clearChat: () => set({ rooms: [], currentRoom: null, messages: [] })
}));
