import { create } from 'zustand';
import { chatService } from '@/services/api.service';
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
  typing_user?: {
    id: number;
    username: string;
    first_name?: string;
    last_name?: string;
  }; // User currently typing (from backend)
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
  deleteRoom: (roomId: number) => Promise<void>;
  sendTypingIndicator: (roomId: number, isTyping: boolean) => Promise<void>;
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
      const rooms = await chatService.getRooms();

      // Validate and sanitize room data
      const validRooms = rooms.filter((room: any) => {
        return room &&
               typeof room.id === 'number' &&
               room.participants &&
               Array.isArray(room.participants) &&
               room.participants.length > 0;
      });

      // Sort rooms: unread messages first, then by updated_at (most recent first)
      const sortedRooms = validRooms.sort((a: ChatRoom, b: ChatRoom) => {
        const aHasUnread = (a.unread_count || 0) > 0;
        const bHasUnread = (b.unread_count || 0) > 0;

        // If one has unread and the other doesn't, prioritize unread
        if (aHasUnread && !bHasUnread) return -1;
        if (!aHasUnread && bHasUnread) return 1;

        // If both have unread or both don't, sort by updated_at
        const aTime = new Date(a.updated_at || a.created_at || 0).getTime();
        const bTime = new Date(b.updated_at || b.created_at || 0).getTime();
        return bTime - aTime;
      });

      // Update typing indicators from room data
      const newTypingUsers = new Map<number, string>();
      sortedRooms.forEach((room: any) => {
        if (room.typing_user) {
          // Display first name + last name or just username
          const displayName = room.typing_user.first_name && room.typing_user.last_name
            ? `${room.typing_user.first_name} ${room.typing_user.last_name}`
            : room.typing_user.username;
          newTypingUsers.set(room.id, displayName);
        }
      });

      set({ rooms: sortedRooms, loading: false, typingUsers: newTypingUsers });
    } catch (error: any) {
      console.error('Failed to fetch chat rooms:', error);
      // Don't set error state to avoid React errors
      set({ rooms: [], loading: false });
    }
  },

  fetchMessages: async (roomId: number) => {
    set({ loading: true, error: null });
    try {
      const messages = await chatService.getMessages(roomId);
      
      // Sort messages by created_at (oldest first) to ensure correct display order
      const sortedMessages = messages.sort((a: Message, b: Message) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      
      // Add status to existing messages
      const messagesWithStatus = sortedMessages.map((msg: Message) => ({
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
      const newRoom = await chatService.createDirectChat(userId);

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
      const actualMessage = await chatService.sendMessage({
        room: roomId,
        content
      });

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
      const actualMessage = await chatService.sendMessage({
        room: roomId,
        content
      });

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
    // Immediately update local state for instant UI feedback
    set((state) => ({
      rooms: state.rooms.map(room =>
        room.id === roomId
          ? { ...room, unread_count: 0 }
          : room
      )
    }));

    // Then sync with backend
    try {
      await chatService.markRoomAsRead(roomId);
    } catch (error: any) {
      console.error('Failed to mark room as read:', error);
      // Optionally revert the optimistic update if backend fails
    }
  },

  markMessageAsRead: async (messageId: number) => {
    // Optimistically update message status
    set((state) => ({
      messages: state.messages.map(msg =>
        msg.id === messageId ? { ...msg, is_read: true, status: 'seen' as MessageStatus } : msg
      )
    }));

    // Then sync with backend
    try {
      await chatService.markMessageAsRead(messageId);
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
    const state = get();
    
    // Clear messages and set new room
    set({ currentRoom: room, messages: [] });
    
    if (room) {
      // Immediately mark as read in local state for instant UI update
      if (room.unread_count && room.unread_count > 0) {
        set((state) => ({
          rooms: state.rooms.map(r =>
            r.id === room.id ? { ...r, unread_count: 0 } : r
          )
        }));
        
        // Mark as read on backend
        state.markAsRead(room.id);
      }
      
      // Fetch messages
      get().fetchMessages(room.id);
    }
  },

  addMessage: (message: Message) => {
    set((state) => {
      const currentRoom = state.currentRoom;
      const isCurrentRoom = currentRoom?.id === message.room;

      // Update rooms with new message
      let updatedRooms = state.rooms.map(room =>
        room.id === message.room
          ? {
              ...room,
              last_message: message,
              updated_at: message.created_at,
              unread_count: isCurrentRoom ? 0 : (room.unread_count || 0) + 1
            }
          : room
      );

      // Re-sort rooms: unread messages first, then by updated_at
      updatedRooms = updatedRooms.sort((a: ChatRoom, b: ChatRoom) => {
        const aHasUnread = (a.unread_count || 0) > 0;
        const bHasUnread = (b.unread_count || 0) > 0;

        // If one has unread and the other doesn't, prioritize unread
        if (aHasUnread && !bHasUnread) return -1;
        if (!aHasUnread && bHasUnread) return 1;

        // If both have unread or both don't, sort by updated_at
        const aTime = new Date(a.updated_at || a.created_at || 0).getTime();
        const bTime = new Date(b.updated_at || b.created_at || 0).getTime();
        return bTime - aTime;
      });

      return {
        messages: isCurrentRoom ? [...state.messages, { ...message, status: 'delivered' as MessageStatus }] : state.messages,
        rooms: updatedRooms
      };
    });
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
      const onlineUserIds = await chatService.getOnlineUsers();
      
      // Completely replace the online users set (don't merge with old data)
      // This ensures logged-out users are properly marked offline
      const newOnlineUsers = new Set<number>(onlineUserIds);
      set({ onlineUsers: newOnlineUsers });
    } catch (error: any) {
      // Silently fail - online status is not critical
      console.warn('Failed to fetch online users:', error.response?.status === 404 ? 'Endpoint not found' : error.message);
    }
  },

  deleteRoom: async (roomId: number) => {
    try {
      await chatService.deleteRoom(roomId);
      
      // Remove room from state
      set((state) => ({
        rooms: state.rooms.filter(room => room.id !== roomId),
        currentRoom: state.currentRoom?.id === roomId ? null : state.currentRoom,
        messages: state.currentRoom?.id === roomId ? [] : state.messages
      }));
    } catch (error: any) {
      console.error('Failed to delete room:', error);
      throw error;
    }
  },

  sendTypingIndicator: async (roomId: number, isTyping: boolean) => {
    try {
      await chatService.sendTypingIndicator(roomId, isTyping);
    } catch (error: any) {
      // Silently fail - typing indicators are not critical
      console.warn('Failed to send typing indicator:', error);
    }
  },

  clearChat: () => set({ rooms: [], currentRoom: null, messages: [], typingUsers: new Map(), onlineUsers: new Set() })
}));
