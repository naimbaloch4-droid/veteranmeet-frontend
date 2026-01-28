'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import {
  MessageSquare,
  Trash2,
  Calendar,
  Flag,
  Search,
  XCircle,
  Megaphone
} from 'lucide-react';
import { useToastStore } from '@/store/useToastStore';

interface Post {
  id: number;
  author: {
    id: number;
    username: string;
    email: string;
  };
  content: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
}

interface Event {
  id: number;
  title: string;
  description: string;
  date?: string;
  date_time?: string;
  location: string;
  organizer: {
    username: string;
    id?: number;
  };
  attendees_count?: number;
  participants_count?: number;
}

interface Announcement {
  id: number;
  title: string;
  message: string;
  created_at: string;
  priority: string;
}

type TabType = 'posts' | 'events' | 'announcements';

export default function ContentModeration() {
  const { success, error: showError } = useToastStore();
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    message: '',
    priority: 'normal'
  });

  useEffect(() => {
    fetchContent();
  }, [activeTab]);

  const fetchContent = async () => {
    setLoading(true);
    setError('');
    try {
      switch (activeTab) {
        case 'posts':
          const postsResponse = await api.get('/api/posts/');
          const postsData = postsResponse.data.results || postsResponse.data || [];
          console.log('Posts API response:', postsResponse.data);
          console.log('Posts data (normalized):', postsData);
          console.log('Posts count:', Array.isArray(postsData) ? postsData.length : 'Not an array');
          setPosts(postsData);
          break;
        case 'events':
          const eventsResponse = await api.get('/api/events/');
          console.log('Events API full response:', eventsResponse);
          console.log('Events API response data:', eventsResponse.data);
          console.log('Events response type:', typeof eventsResponse.data);
          console.log('Events is array?:', Array.isArray(eventsResponse.data));
          console.log('Events has results?:', eventsResponse.data.results);
          
          let eventsData = [];
          if (Array.isArray(eventsResponse.data)) {
            eventsData = eventsResponse.data;
          } else if (eventsResponse.data.results) {
            eventsData = eventsResponse.data.results;
          } else if (eventsResponse.data.data) {
            eventsData = eventsResponse.data.data;
          }
          
          console.log('Events data (normalized):', eventsData);
          console.log('Events count:', eventsData.length);
          setEvents(eventsData);
          break;
        case 'announcements':
          const announcementsResponse = await api.get('/api/hub/announcements/');
          const announcementsData = announcementsResponse.data.results || announcementsResponse.data || [];
          console.log('Announcements loaded:', announcementsData);
          setAnnouncements(announcementsData);
          break;
      }
    } catch (err: any) {
      console.error('Failed to fetch content:', err);
      console.error('Error details:', err.response?.data);
      setError('Failed to load content: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
      await api.delete(`/api/posts/${postId}/`);
      setPosts(posts.filter(p => p.id !== postId));
      success('Post deleted successfully');
    } catch (err: any) {
      console.error('Failed to delete post:', err);
      showError('Failed to delete post');
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (!confirm('Are you sure you want to cancel this event?')) return;
    
    try {
      await api.delete(`/api/events/${eventId}/`);
      setEvents(events.filter(e => e.id !== eventId));
      success('Event deleted successfully');
    } catch (err: any) {
      console.error('Failed to delete event:', err);
      showError('Failed to delete event');
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await api.post('/api/hub/announcements/', newAnnouncement);
      setAnnouncements([response.data, ...announcements]);
      setNewAnnouncement({ title: '', message: '', priority: 'normal' });
      setShowAnnouncementForm(false);
      success('Announcement created successfully');
    } catch (err: any) {
      console.error('Failed to create announcement:', err);
      showError('Failed to create announcement');
    }
  };

  const filteredPosts = posts.filter(post =>
    post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.author.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-page-container page-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gray-800 rounded-xl shadow-lg">
              <MessageSquare className="w-7 h-7 text-gray-100" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Content Moderation</h1>
              <p className="text-gray-600 mt-1">Manage posts, events, and announcements</p>
            </div>
          </div>
          {activeTab === 'announcements' && (
            <button
              onClick={() => setShowAnnouncementForm(true)}
              className="flex items-center space-x-2 px-6 py-2.5 bg-gray-800 text-white rounded-xl hover:bg-gray-900 hover:shadow-xl transition-all font-medium shadow-lg btn-hover"
            >
              <Megaphone className="w-5 h-5" />
              <span>New Announcement</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 section-spacing overflow-hidden">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition-all ${
              activeTab === 'posts'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <MessageSquare className="w-5 h-5" />
              <span>Posts</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition-all ${
              activeTab === 'events'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Events</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition-all ${
              activeTab === 'announcements'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Megaphone className="w-5 h-5" />
              <span>Announcements</span>
            </div>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {activeTab !== 'announcements' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 section-spacing">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl section-spacing font-medium shadow-sm">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading {activeTab}...</p>
          </div>
        </div>
      )}

      {/* Content Display */}
      {!loading && (
        <>
          {/* Posts Tab */}
          {activeTab === 'posts' && (
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center shadow-md">
                          <span className="text-sm font-bold text-gray-100">
                            {post.author.username[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">@{post.author.username}</p>
                          <p className="text-sm text-gray-500">{post.author.email}</p>
                        </div>
                      </div>
                      <p className="text-gray-700 mb-4 leading-relaxed">{post.content}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="font-medium">{post.likes_count} likes</span>
                        <span className="font-medium">{post.comments_count} comments</span>
                        <span>{new Date(post.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="icon-btn text-red-600 hover:bg-red-50 ml-4"
                      title="Delete Post"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              ))}
              {filteredPosts.length === 0 && (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No posts found</p>
                </div>
              )}
            </div>
          )}

          {/* Events Tab */}
          {activeTab === 'events' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredEvents.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{event.title}</h3>
                      <p className="text-gray-600 text-sm mb-4 leading-relaxed">{event.description}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="icon-btn text-red-600 hover:bg-red-50"
                      title="Cancel Event"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-2 text-sm border-t border-gray-100 pt-4">
                    <div className="flex items-center justify-between text-gray-600">
                      <span className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>Date:</span>
                      </span>
                      <span className="font-medium text-gray-900">
                        {new Date(event.date_time || event.date || '').toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-gray-600">
                      <span className="flex items-center space-x-2">
                        <Flag className="w-4 h-4" />
                        <span>Location:</span>
                      </span>
                      <span className="font-medium text-gray-900">{event.location}</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-600">
                      <span>Organizer:</span>
                      <span className="font-medium text-gray-900">@{event.organizer.username}</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-600">
                      <span>Attendees:</span>
                      <span className="font-medium text-gray-900">
                        {event.participants_count || event.attendees_count || 0}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
              {filteredEvents.length === 0 && (
                <div className="col-span-2 text-center py-16 bg-white rounded-xl border border-gray-100">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No events found</p>
                </div>
              )}
            </div>
          )}

          {/* Announcements Tab */}
          {activeTab === 'announcements' && (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <motion.div
                  key={announcement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-xl shadow-sm border p-6 ${
                    announcement.priority === 'high'
                      ? 'bg-red-50 border-red-200'
                      : announcement.priority === 'medium'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <Megaphone className={`w-5 h-5 ${
                          announcement.priority === 'high'
                            ? 'text-red-600'
                            : announcement.priority === 'medium'
                            ? 'text-yellow-600'
                            : 'text-blue-600'
                        }`} />
                        <h3 className="text-lg font-bold text-gray-900">{announcement.title}</h3>
                      </div>
                      <p className="text-gray-700 mb-3 leading-relaxed">{announcement.message}</p>
                      <p className="text-sm text-gray-600">
                        Created: {new Date(announcement.created_at).toLocaleString()}
                      </p>
                    </div>
                    <span className={`badge ml-4 flex-shrink-0 ${
                      announcement.priority === 'high'
                        ? 'bg-red-100 text-red-800 border-red-300'
                        : announcement.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                        : 'bg-blue-100 text-blue-800 border-blue-300'
                    }`}>
                      {announcement.priority}
                    </span>
                  </div>
                </motion.div>
              ))}
              {announcements.length === 0 && (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
                  <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No announcements yet</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* New Announcement Modal */}
      {showAnnouncementForm && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Create Announcement</h2>
              <button
                onClick={() => setShowAnnouncementForm(false)}
                className="icon-btn text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Enter announcement title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={newAnnouncement.message}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                  required
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Enter announcement message"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={newAnnouncement.priority}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, priority: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
                >
                  <option value="normal">Normal</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAnnouncementForm(false)}
                  className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-gradient-primary px-6 py-2.5 text-white rounded-xl font-medium"
                >
                  Create Announcement
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
