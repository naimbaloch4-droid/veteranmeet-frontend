'use client';

import { useEffect, useState } from 'react';
import { Calendar, Plus, Filter, Search, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEventStore, Event } from '@/store/useEventStore';
import EventCard from '@/components/EventCard';
import { getUser } from '@/lib/auth';
import { useToastStore } from '@/store/useToastStore';

export default function EventsPage() {
  const { events, loading, fetchEvents, createEvent, joinEvent, leaveEvent, deleteEvent } = useEventStore();
  const { success, error: showError } = useToastStore();
  const [user, setUser] = useState<any>(null);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    location: '',
    date_time: '',
    max_participants: 20,
    star_points: 100,
    event_type: 'Outdoor'
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const userData = getUser();
    setUser(userData);
    fetchEvents(1, filterType !== 'all' ? { event_type: filterType } : {});
  }, [fetchEvents, filterType]);

  const handleCreateEvent = async () => {
    setFormError('');
    
    if (!eventForm.title || !eventForm.description || !eventForm.location || !eventForm.date_time) {
      setFormError('All fields are required');
      return;
    }

    try {
      await createEvent(eventForm);
      setEventForm({
        title: '',
        description: '',
        location: '',
        date_time: '',
        max_participants: 20,
        star_points: 100,
        event_type: 'Outdoor'
      });
      setShowCreateEvent(false);
      success('Event created successfully!');
      fetchEvents(1);
    } catch (error: any) {
      console.error('Failed to create event:', error);
      setFormError(error.response?.data?.detail || 'Failed to create event');
    }
  };

  const handleJoinEvent = async (eventId: number) => {
    try {
      const result = await joinEvent(eventId);
      const starsEarned = result.stars_earned || 0;
      success(`Successfully joined event! You earned ${starsEarned} ${starsEarned === 1 ? 'star' : 'stars'}!`);
    } catch (error: any) {
      console.error('Failed to join event:', error);
      showError(error.response?.data?.detail || 'Failed to join event');
    }
  };

  const handleLeaveEvent = async (eventId: number) => {
    try {
      await leaveEvent(eventId);
      success('Successfully left event');
    } catch (error: any) {
      console.error('Failed to leave event:', error);
      showError(error.response?.data?.detail || 'Failed to leave event');
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    try {
      await deleteEvent(eventId);
      success('Event deleted successfully');
    } catch (error: any) {
      console.error('Failed to delete event:', error);
      showError(error.response?.data?.detail || 'Failed to delete event');
    }
  };

  const filteredEvents = (events || []).filter((event: Event) =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const eventTypes = ['all', 'Outdoor', 'Workshop', 'Meetup', 'Training', 'Social', 'Wellness'];

  return (
    <div className="admin-page-container page-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Calendar className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Events</h1>
              <p className="text-gray-600 mt-1">Browse and join community events</p>
            </div>
          </div>
          
          {user?.is_veteran && (
            <button
              onClick={() => setShowCreateEvent(true)}
              className="flex items-center px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={() => fetchEvents(1, filterType !== 'all' ? { event_type: filterType } : {})}
            disabled={loading}
            className="flex items-center px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          {eventTypes.map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-colors ${
                filterType === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      {loading && events.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading events...</p>
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event: Event) => (
            <EventCard
              key={event.id}
              event={event}
              currentUserId={user?.id}
              onJoin={handleJoinEvent}
              onLeave={handleLeaveEvent}
              onDelete={handleDeleteEvent}
              showActions={true}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No events found</h2>
          <p className="text-gray-600 mb-4">
            {searchQuery ? 'Try adjusting your search' : 'Be the first to create an event!'}
          </p>
        </div>
      )}

      {/* Create Event Modal */}
      <AnimatePresence>
        {showCreateEvent && user?.is_veteran && (
          <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Create Event</h3>

                {formError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                    {formError}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                    <input
                      type="text"
                      value={eventForm.title}
                      onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Weekend Hiking Trip"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                    <textarea
                      value={eventForm.description}
                      onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Join us for a mountain hike..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                      <input
                        type="text"
                        value={eventForm.location}
                        onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="State Park North"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date & Time *</label>
                      <input
                        type="datetime-local"
                        value={eventForm.date_time}
                        onChange={(e) => setEventForm({ ...eventForm, date_time: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Max Participants</label>
                      <input
                        type="number"
                        value={eventForm.max_participants}
                        onChange={(e) => setEventForm({ ...eventForm, max_participants: parseInt(e.target.value) })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Star Reward</label>
                      <input
                        type="number"
                        value={eventForm.star_points}
                        onChange={(e) => setEventForm({ ...eventForm, star_points: Math.min(5000, parseInt(e.target.value)) })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                        max="5000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
                    <select
                      value={eventForm.event_type}
                      onChange={(e) => setEventForm({ ...eventForm, event_type: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {['Outdoor', 'Workshop', 'Meetup', 'Training', 'Social', 'Wellness'].map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setShowCreateEvent(false);
                      setFormError('');
                    }}
                    className="px-5 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateEvent}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium shadow-lg"
                  >
                    Create Event
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
