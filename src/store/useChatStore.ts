import { create } from 'zustand';
import api from '@/lib/api';
import { User } from './usePostStore';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'seen' | 'failed';

export interface Message {
  id: number;
  room: number;
  sender: User;
  content: string;
  created_at: string;
  is_read: boolean;
  status?: MessageStatus; // Client-side status tracking
  error?: string; // Error message for failed sends
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
  is_typing?: boolean; // Track if other user is typing
  last_seen?: string; // Track last seen timestamp
}

interface ChatStore {
  rooms: ChatRoom[];
  currentRoom: ChatRoom | null;
  messages: Message[];
  loading: boolean;
  error: string | null;
  typingUsers: Map<number, string>; // roomId -> username
  onlineUsers: Set<number>; // userId set

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
  retryMessage: (tempId: number, roomId: number, content: string) => Promise<void>;
  setTyping: (roomId: number, username: string) => void;
  clearTyping: (roomId: number) => void;
  setUserOnline: (userId: number, isOnline: boolean) => void;
  updateMessageStatus: (messageId: number, status: MessageStatus) => void;
  fetchOnlineUsers: () => Promise<void>;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  rooms: [],
  currentRoom: null,
  messages: [],
  loading: false,
  error: null,
  typingUsers: new Map(),
  onlineUsers: new Set(),

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
      
      // Add status to existing messages
      const messagesWithStatus = messages.map((msg: Message) => ({
        ...msg,
        status: msg.is_read ? 'seen' : 'delivered' as MessageStatus
      }));
      
      set({ messages: messagesWithStatus, loading: false });
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
    // Optimistic Update: Create a temporary message
    const tempId = Date.now();
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const optimisticMessage: Message = {
      id: tempId,
      room: roomId,
      sender: currentUser,
      content: content,
      created_at: new Date().toISOString(),
      is_read: false,
      status: 'sending'
    };

    // Add to UI immediately
    set((state) => ({
      messages: [...state.messages, optimisticMessage],
      rooms: state.rooms.map(room =>
        room.id === roomId
          ? { ...room, last_message: optimisticMessage, updated_at: optimisticMessage.created_at }
          : room
      )
    }));

    try {
      const response = await api.post('/api/chat/messages/', {
        room: roomId,
        content
      });

      const actualMessage = response.data;

      // Replace optimistic message with actual data from server
      set((state) => ({
        messages: state.messages.map(msg => 
          msg.id === tempId 
            ? { ...actualMessage, status: 'sent' as MessageStatus } 
            : msg
        ),
        rooms: state.rooms.map(room =>
          room.id === roomId
            ? { ...room, last_message: actualMessage, updated_at: actualMessage.created_at }
            : room
        )
      }));

      // Update to delivered after a short delay (simulating server confirmation)
      setTimeout(() => {
        get().updateMessageStatus(actualMessage.id, 'delivered');
      }, 500);

      return actualMessage;
    } catch (error: any) {
      console.error('[Chat] Failed to save message to server:', error.response?.data || error.message);

      // Update the optimistic message to reflect failure
      set((state) => ({
        messages: state.messages.map(msg =>
          msg.id === tempId 
            ? { ...msg, status: 'failed' as MessageStatus, error: 'Failed to send' } 
            : msg
        )
      }));

      throw error;
    }
  },

  retryMessage: async (tempId: number, roomId: number, content: string) => {
    // Update status to sending
    set((state) => ({
      messages: state.messages.map(msg =>
        msg.id === tempId
          ? { ...msg, status: 'sending' as MessageStatus, error: undefined }
          : msg
      )
    }));

    try {
      const response = await api.post('/api/chat/messages/', {
        room: roomId,
        content
      });

      const actualMessage = response.data;

      // Replace failed message with actual data
      set((state) => ({
        messages: state.messages.map(msg =>
          msg.id === tempId
            ? { ...actualMessage, status: 'sent' as MessageStatus }
            : msg
        ),
        rooms: state.rooms.map(room =>
          room.id === roomId
            ? { ...room, last_message: actualMessage, updated_at: actualMessage.created_at }
            : room
        )
      }));

      setTimeout(() => {
        get().updateMessageStatus(actualMessage.id, 'delivered');
      }, 500);
    } catch (error: any) {
      console.error('[Chat] Retry failed:', error);
      set((state) => ({
        messages: state.messages.map(msg =>
          msg.id === tempId
            ? { ...msg, status: 'failed' as MessageStatus, error: 'Failed to send' }
            : msg
        )
      }));
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
      await api.post(`/api/chat/messages/${messageId}/mark_read/`);

      set((state) => ({
        messages: state.messages.map(msg =>
          msg.id === messageId ? { ...msg, is_read: true, status: 'seen' as MessageStatus } : msg
        )
      }));
    } catch (error: any) {
      console.warn(`[Chat] Failed to mark message ${messageId} as read:`, error.response?.status === 404 ? 'Endpoint not found' : error.message);
    }
  },

  updateMessageStatus: (messageId: number, status: MessageStatus) => {
    set((state) => ({
      messages: state.messages.map(msg =>
        msg.id === messageId ? { ...msg, status } : msg
      )
    }));
  },

  setCurrentRoom: (room: ChatRoom | null) => {
    set({ currentRoom: room, messages: [] });
    if (room) {
      get().fetchMessages(room.id);
    }
  },

  addMessage: (message: Message) => {
    set((state) => ({
      messages: [...state.messages, { ...message, status: 'delivered' as MessageStatus }],
      rooms: state.rooms.map(room =>
        room.id === message.room
          ? { ...room, last_message: message, updated_at: message.created_at, unread_count: (room.unread_count || 0) + 1 }
          : room
      )
    }));
  },

  setTyping: (roomId: number, username: string) => {
    set((state) => {
      const newTypingUsers = new Map(state.typingUsers);
      newTypingUsers.set(roomId, username);
      return { typingUsers: newTypingUsers };
    });
  },

  clearTyping: (roomId: number) => {
    set((state) => {
      const newTypingUsers = new Map(state.typingUsers);
      newTypingUsers.delete(roomId);
      return { typingUsers: newTypingUsers };
    });
  },

  setUserOnline: (userId: number, isOnline: boolean) => {
    set((state) => {
      const newOnlineUsers = new Set(state.onlineUsers);
      if (isOnline) {
        newOnlineUsers.add(userId);
      } else {
        newOnlineUsers.delete(userId);
      }
      return { onlineUsers: newOnlineUsers };
    });
  },

  fetchOnlineUsers: async () => {
    try {
      const response = await api.get('/api/chat/online-users/');
      const onlineUserIds = response.data.online_users || response.data || [];
      
      // Update the online users set
      const newOnlineUsers = new Set<number>(onlineUserIds);
      set({ onlineUsers: newOnlineUsers });
    } catch (error: any) {
      // Silently fail - online status is not critical
      console.warn('Failed to fetch online users:', error.response?.status === 404 ? 'Endpoint not found' : error.message);
    }
  },

  clearChat: () => set({ rooms: [], currentRoom: null, messages: [], typingUsers: new Map(), onlineUsers: new Set() })
}));
