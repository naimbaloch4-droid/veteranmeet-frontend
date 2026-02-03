import { create } from 'zustand';
import { User } from './usePostStore';
import api from '@/lib/api';

export interface Event {
  id: number;
  title: string;
  description: string;
  date_time: string;
  location: string;
  organizer: User;
  participants_count?: number;
  max_participants?: number;
  star_points?: number;
  event_type?: string;
  is_joined?: boolean;
  is_full?: boolean;
  created_at: string;
}

interface EventStore {
  events: Event[];
  myEvents: Event[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  hasMore: boolean;
  
  // Actions
  fetchEvents: (page?: number, filters?: any) => Promise<void>;
  fetchMyEvents: () => Promise<void>;
  createEvent: (data: any) => Promise<Event>;
  joinEvent: (eventId: number) => Promise<{ stars_earned?: number; message: string }>;
  leaveEvent: (eventId: number) => Promise<void>;
  deleteEvent: (eventId: number) => Promise<void>;
  clearEvents: () => void;
}

export const useEventStore = create<EventStore>((set, get) => ({
  events: [],
  myEvents: [],
  loading: false,
  error: null,
  currentPage: 1,
  hasMore: true,

  fetchEvents: async (page = 1, filters = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/api/events/', {
        params: { page, page_size: 20, ...filters }
      });
      
      const newEvents = response.data.results || response.data || [];
      
      set((state) => ({
        events: page === 1 ? newEvents : [...state.events, ...newEvents],
        currentPage: page,
        hasMore: !!response.data.next,
        loading: false
      }));
    } catch (error: any) {
      console.error('Failed to fetch events:', error);
      set({ error: error.response?.data?.detail || 'Failed to load events', loading: false });
    }
  },

  fetchMyEvents: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/api/events/my-events/');
      const events = response.data.results || response.data || [];
      set({ myEvents: events, loading: false });
    } catch (error: any) {
      console.error('Failed to fetch my events:', error);
      set({ error: error.response?.data?.detail || 'Failed to load your events', loading: false });
    }
  },

  createEvent: async (data: any) => {
    try {
      const response = await api.post('/api/events/', data);
      set((state) => ({
        events: [response.data, ...state.events],
        myEvents: [response.data, ...state.myEvents]
      }));
      return response.data;
    } catch (error: any) {
      console.error('Failed to create event:', error);
      throw error;
    }
  },

  joinEvent: async (eventId: number) => {
    try {
      const response = await api.post(`/api/events/${eventId}/join/`);
      
      const updateEvent = (event: Event) => {
        if (event.id === eventId) {
          return {
            ...event,
            is_joined: true,
            participants_count: (event.participants_count || 0) + 1
          };
        }
        return event;
      };
      
      set((state) => ({
        events: state.events.map(updateEvent),
        myEvents: [...state.myEvents, state.events.find(e => e.id === eventId)!].filter(Boolean)
      }));
      
      return response.data;
    } catch (error: any) {
      console.error('Failed to join event:', error);
      throw error;
    }
  },

  leaveEvent: async (eventId: number) => {
    try {
      await api.post(`/api/events/${eventId}/leave/`);
      
      const updateEvent = (event: Event) => {
        if (event.id === eventId) {
          return {
            ...event,
            is_joined: false,
            participants_count: Math.max((event.participants_count || 1) - 1, 0)
          };
        }
        return event;
      };
      
      set((state) => ({
        events: state.events.map(updateEvent),
        myEvents: state.myEvents.filter(e => e.id !== eventId)
      }));
    } catch (error: any) {
      console.error('Failed to leave event:', error);
      throw error;
    }
  },

  deleteEvent: async (eventId: number) => {
    try {
      await api.delete(`/api/events/${eventId}/?keep_stars=true`);
      set((state) => ({
        events: state.events.filter(e => e.id !== eventId),
        myEvents: state.myEvents.filter(e => e.id !== eventId)
      }));
    } catch (error: any) {
      console.error('Failed to delete event:', error);
      throw error;
    }
  },

  clearEvents: () => set({ events: [], myEvents: [], currentPage: 1, hasMore: true })
}));
