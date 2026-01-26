'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  MessageSquare,
  Calendar,
  Star,
  TrendingUp,
  Bell,
  Search,
  Plus,
  Heart,
  Share2,
  MapPin,
  Clock,
  LogOut,
  Image as ImageIcon,
  Award,
  UserPlus,
  UserMinus,
  X,
  Shield,
  Trophy,
  Send,
  Upload,
  Globe,
  Lock,
  Eye,
  ChevronRight
} from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Link from 'next/link';
import api from '@/lib/api';
import { logout } from '@/lib/auth';

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  is_veteran: boolean;
  star_rating?: number;
  veteran_category?: string;
  profile?: {
    avatar?: string;
    bio?: string;
  };
}

interface Post {
  id: number;
  title?: string;
  content: string;
  author: User;
  created_at: string;
  likes_count?: number;
  comments_count?: number;
  image?: string;
}

interface Event {
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
}

interface DashboardStats {
  total_posts?: number;
  total_events?: number;
  followers_count?: number;
  following_count?: number;
  stars_earned?: number;
  veteran_category?: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<DashboardStats>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  
  // Form states
  const [postForm, setPostForm] = useState({ title: '', content: '', image: null as File | null });
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    location: '',
    date_time: '',
    max_participants: 20,
    star_points: 100,
    event_type: 'Outdoor'
  });
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    privacy_level: 'public',
    topic: ''
  });
  
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [feedType, setFeedType] = useState<'all' | 'following'>('all');

  useEffect(() => {
    fetchDashboardData();
  }, [feedType]);

  const fetchDashboardData = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      setUser(userData);

      // Fetch all data in parallel
      const [postsRes, eventsRes, statsRes, userStarsRes, connectionsRes] = await Promise.allSettled([
        // Fetch posts - veterans can see personalized feed
        api.get(userData.is_veteran && feedType === 'following' ? '/api/auth/feed/' : '/api/posts/', {
          params: { limit: 10 }
        }),
        // Fetch upcoming events
        api.get('/api/events/', {
          params: { limit: 5 }
        }),
        // Fetch hub stats (posts, events counts)
        api.get('/api/hub/stats/'),
        // Fetch user's stars
        userData.id ? api.get(`/api/auth/users/${userData.id}/stars/`) : Promise.reject('No user ID'),
        // Fetch connections (followers/following) - endpoint may not exist, handle gracefully
        userData.is_veteran ? api.get(`/api/auth/users/${userData.id}/connections/`).catch(() => ({ data: { followers_count: 0, following_count: 0 } })) : Promise.reject('Not veteran')
      ]);

      // Process posts
      if (postsRes.status === 'fulfilled') {
        const postsData = postsRes.value.data.results || postsRes.value.data || [];
        setPosts(postsData);
      } else {
        console.error('Failed to fetch posts:', postsRes.reason);
      }

      // Process events
      if (eventsRes.status === 'fulfilled') {
        const eventsData = eventsRes.value.data.results || eventsRes.value.data || [];
        setEvents(eventsData);
      } else {
        console.error('Failed to fetch events:', eventsRes.reason);
      }

      // Build stats object from multiple sources
      const statsData: DashboardStats = {};

      // Get stats from hub/stats endpoint
      if (statsRes.status === 'fulfilled') {
        const hubStats = statsRes.value.data;
        statsData.total_posts = hubStats.total_posts || 0;
        statsData.total_events = hubStats.total_events || 0;
      } else {
        console.log('Hub stats not available, using fallback');
        statsData.total_posts = posts.length;
        statsData.total_events = events.length;
      }

      // Get user's total stars
      if (userStarsRes.status === 'fulfilled') {
        const starsData = userStarsRes.value.data;
        // Calculate total stars from all star records
        const totalStars = Array.isArray(starsData) 
          ? starsData.reduce((sum: number, star: any) => sum + (star.quantity || 0), 0)
          : 0;
        statsData.stars_earned = totalStars;
        
        // Calculate veteran category based on total stars
        if (userData.is_veteran) {
          statsData.veteran_category = getVeteranCategoryFromStars(totalStars);
        }
      } else {
        console.log('User stars not available');
        statsData.stars_earned = userData.star_rating || 0;
      }

      // Get connections
      if (connectionsRes.status === 'fulfilled') {
        const connectionsData = connectionsRes.value.data;
        statsData.followers_count = connectionsData.followers_count || connectionsData.followers?.length || 0;
        statsData.following_count = connectionsData.following_count || connectionsData.following?.length || 0;
      } else {
        console.log('Connections not available');
        statsData.followers_count = 0;
        statsData.following_count = 0;
      }

      setStats(statsData);

    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Some data failed to load');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to calculate veteran category from stars
  const getVeteranCategoryFromStars = (stars: number): string => {
    if (stars >= 100000) return 'Eternal Sage';
    if (stars >= 70000) return 'Platinum Veteran';
    if (stars >= 65000) return 'Sapphire Veteran';
    if (stars >= 60000) return 'Diamond Veteran';
    if (stars >= 50000) return 'Golden Veteran';
    if (stars >= 40000) return 'Ruby Veteran';
    if (stars >= 25000) return 'Silver Veteran';
    return 'Bronze Veteran';
  };

  const handleCreatePost = async () => {
    setFormErrors([]);
    
    if (!postForm.content.trim()) {
      setFormErrors(['Content is required']);
      return;
    }

    try {
      const formData = new FormData();
      if (postForm.title) formData.append('title', postForm.title);
      formData.append('content', postForm.content);
      if (user?.is_veteran && postForm.image) {
        formData.append('image', postForm.image);
      }

      await api.post('/api/posts/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setPostForm({ title: '', content: '', image: null });
      setShowCreatePost(false);
      fetchDashboardData();
    } catch (err: any) {
      console.error('Failed to create post:', err);
      setFormErrors([err.response?.data?.detail || 'Failed to create post']);
    }
  };

  const handleCreateEvent = async () => {
    setFormErrors([]);
    
    if (!eventForm.title || !eventForm.description || !eventForm.location || !eventForm.date_time) {
      setFormErrors(['All fields are required']);
      return;
    }

    try {
      await api.post('/api/events/', eventForm);
      
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
      fetchDashboardData();
    } catch (err: any) {
      console.error('Failed to create event:', err);
      setFormErrors([err.response?.data?.detail || 'Failed to create event']);
    }
  };

  const handleCreateGroup = async () => {
    setFormErrors([]);
    
    if (!groupForm.name || !groupForm.description) {
      setFormErrors(['Name and description are required']);
      return;
    }

    try {
      await api.post('/api/support-groups/groups/', groupForm);
      
      setGroupForm({
        name: '',
        description: '',
        privacy_level: 'public',
        topic: ''
      });
      setShowCreateGroup(false);
    } catch (err: any) {
      console.error('Failed to create group:', err);
      if (err.response?.status === 404) {
        setFormErrors(['Support groups feature is not yet available. Please contact administrator.']);
      } else {
        setFormErrors([err.response?.data?.detail || 'Failed to create support group']);
      }
    }
  };

  const handleFollowUser = async (userId: number) => {
    try {
      await api.post(`/api/auth/follow/${userId}/`);
      // Optionally refresh data
    } catch (err) {
      console.error('Failed to follow user:', err);
    }
  };

  const handleGiveStar = async (userId: number) => {
    try {
      await api.post(`/api/auth/give-star/${userId}/`);
      alert('Star given successfully!');
    } catch (err: any) {
      console.error('Failed to give star:', err);
      alert(err.response?.data?.detail || 'Failed to give star');
    }
  };

  const handleJoinEvent = async (eventId: number) => {
    try {
      await api.post(`/api/events/${eventId}/join/`);
      alert('Successfully joined event!');
      fetchDashboardData();
    } catch (err: any) {
      console.error('Failed to join event:', err);
      alert(err.response?.data?.detail || 'Failed to join event');
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const getVeteranCategoryColor = (category?: string) => {
    const colors: { [key: string]: string } = {
      'Eternal Sage': 'text-purple-600',
      'Platinum Veteran': 'text-gray-600',
      'Sapphire Veteran': 'text-blue-600',
      'Diamond Veteran': 'text-cyan-600',
      'Golden Veteran': 'text-yellow-600',
      'Ruby Veteran': 'text-red-600',
      'Silver Veteran': 'text-gray-500',
      'Bronze Veteran': 'text-orange-600'
    };
    return colors[category || ''] || 'text-gray-600';
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading your dashboard...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-gray-900 rounded-xl shadow-lg">
                  <Shield className="w-6 h-6 text-gray-100" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Welcome back, {user?.first_name}!
                  </h1>
                  <p className="text-xs text-gray-500 flex items-center space-x-2">
                    {user?.is_veteran ? (
                      <>
                        <Shield className="w-3 h-3" />
                        <span>Veteran Member</span>
                        {stats.veteran_category && (
                          <>
                            <span>•</span>
                            <span className={getVeteranCategoryColor(stats.veteran_category)}>
                              {stats.veteran_category}
                            </span>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <Users className="w-3 h-3" />
                        <span>Community Member</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button className="icon-btn text-gray-400 hover:text-gray-600">
                  <Bell className="w-5 h-5" />
                </button>
                <button className="icon-btn text-gray-400 hover:text-gray-600">
                  <Search className="w-5 h-5" />
                </button>
                <div className="w-9 h-9 bg-gray-800 rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-sm font-medium text-gray-100">
                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="icon-btn text-gray-400 hover:text-red-600 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => user?.is_veteran && setShowStatsModal(true)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-yellow-50 rounded-xl">
                    <Star className="w-6 h-6 text-yellow-600 fill-current" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Stars</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.stars_earned !== undefined ? stats.stars_earned : (user?.star_rating || 0)}
                    </p>
                  </div>
                </div>
                {user?.is_veteran && <ChevronRight className="w-5 h-5 text-gray-400" />}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-purple-50 rounded-xl">
                  <MessageSquare className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Posts</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.total_posts !== undefined ? stats.total_posts : 0}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-blue-50 rounded-xl">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Events</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.total_events !== undefined ? stats.total_events : 0}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-green-50 rounded-xl">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Connections</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.followers_count !== undefined ? stats.followers_count : 0}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Feed */}
            <div className="lg:col-span-2 space-y-6">
              {/* Quick Actions - Different for Veterans vs Regular Users */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                {user?.is_veteran ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button
                      onClick={() => setShowCreatePost(true)}
                      className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all group"
                    >
                      <div className="p-2 bg-purple-50 rounded-lg group-hover:bg-purple-100 mb-2">
                        <Plus className="w-5 h-5 text-purple-600" />
                      </div>
                      <span className="text-xs font-medium text-gray-900">Create Post</span>
                    </button>
                    <button
                      onClick={() => setShowCreateEvent(true)}
                      className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all group"
                    >
                      <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 mb-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="text-xs font-medium text-gray-900">Create Event</span>
                    </button>
                    <button
                      onClick={() => setShowCreateGroup(true)}
                      className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all group"
                    >
                      <div className="p-2 bg-green-50 rounded-lg group-hover:bg-green-100 mb-2">
                        <Shield className="w-5 h-5 text-green-600" />
                      </div>
                      <span className="text-xs font-medium text-gray-900">Support Group</span>
                    </button>
                    <Link href="/admin/dashboard">
                      <button className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all group">
                        <div className="p-2 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 mb-2">
                          <TrendingUp className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span className="text-xs font-medium text-gray-900">View Stats</span>
                      </button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setShowCreatePost(true)}
                      className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all group"
                    >
                      <div className="p-2 bg-purple-50 rounded-lg group-hover:bg-purple-100 mb-2">
                        <MessageSquare className="w-5 h-5 text-purple-600" />
                      </div>
                      <span className="text-xs font-medium text-gray-900">Create Post</span>
                      <span className="text-xs text-gray-500 mt-1">(Text only)</span>
                    </button>
                    <Link href="/events">
                      <button className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all group">
                        <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 mb-2">
                          <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="text-xs font-medium text-gray-900">Browse Events</span>
                      </button>
                    </Link>
                  </div>
                )}
                
                {!user?.is_veteran && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                    <div className="flex items-start space-x-3">
                      <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">Become a Veteran Member</p>
                        <p className="text-xs text-blue-700 mt-1">
                          Unlock full access: Create events, support groups, give stars, and more!
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Feed Toggle for Veterans */}
              {user?.is_veteran && (
                <div className="flex items-center space-x-2 bg-white rounded-xl shadow-sm border border-gray-100 p-2">
                  <button
                    onClick={() => setFeedType('all')}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                      feedType === 'all'
                        ? 'bg-gray-900 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    All Posts
                  </button>
                  <button
                    onClick={() => setFeedType('following')}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                      feedType === 'following'
                        ? 'bg-gray-900 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Following
                  </button>
                </div>
              )}

              {/* Recent Posts */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {feedType === 'following' ? 'Posts from People You Follow' : 'Community Feed'}
                </h2>
                <div className="space-y-4">
                  {posts.length > 0 ? (
                    posts.map((post) => (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border border-gray-100 rounded-xl p-5 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-11 h-11 bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                            <span className="text-sm font-medium text-gray-100">
                              {post.author.first_name?.[0]}{post.author.last_name?.[0]}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {post.author.first_name} {post.author.last_name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(post.created_at).toLocaleString()}
                                </p>
                              </div>
                              {user?.is_veteran && post.author.id !== user.id && (
                                <button
                                  onClick={() => handleGiveStar(post.author.id)}
                                  className="flex items-center space-x-1 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors text-xs font-medium"
                                >
                                  <Star className="w-3.5 h-3.5 fill-current" />
                                  <span>Give Star</span>
                                </button>
                              )}
                            </div>
                            {post.title && (
                              <h3 className="text-sm font-semibold text-gray-900 mb-2">{post.title}</h3>
                            )}
                            <p className="text-sm text-gray-700 mb-3 leading-relaxed">{post.content}</p>
                            {post.image && (
                              <img 
                                src={post.image} 
                                alt="Post" 
                                className="w-full rounded-lg mb-3 border border-gray-200"
                              />
                            )}
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <button className="flex items-center hover:text-red-600 transition-colors">
                                <Heart className="w-4 h-4 mr-1" />
                                <span>{post.likes_count || 0}</span>
                              </button>
                              <button className="flex items-center hover:text-blue-600 transition-colors">
                                <MessageSquare className="w-4 h-4 mr-1" />
                                <span>{post.comments_count || 0}</span>
                              </button>
                              <button className="flex items-center hover:text-green-600 transition-colors">
                                <Share2 className="w-4 h-4 mr-1" />
                                <span>Share</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">No posts yet</p>
                      <p className="text-sm text-gray-400 mt-1">
                        {feedType === 'following' 
                          ? 'Follow users to see their posts here'
                          : 'Be the first to share something!'
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Upcoming Events */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Events</h2>
                <div className="space-y-3">
                  {events.length > 0 ? (
                    events.slice(0, 3).map((event) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition-colors"
                      >
                        <h3 className="font-semibold text-gray-900 mb-2 text-sm">{event.title}</h3>
                        <div className="space-y-1.5 text-xs text-gray-600">
                          <div className="flex items-center">
                            <Clock className="w-3.5 h-3.5 mr-2 text-blue-600" />
                            {new Date(event.date_time).toLocaleString()}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="w-3.5 h-3.5 mr-2 text-red-600" />
                            {event.location}
                          </div>
                          {event.star_points && (
                            <div className="flex items-center">
                              <Star className="w-3.5 h-3.5 mr-2 text-yellow-600 fill-current" />
                              <span className="font-medium">{event.star_points} stars reward</span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleJoinEvent(event.id)}
                          className="w-full mt-3 px-3 py-2 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors"
                        >
                          Join Event
                        </button>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">No upcoming events</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Community Stats */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Community</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Active Members</span>
                    <span className="text-sm font-semibold text-gray-900">1,247</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Events This Month</span>
                    <span className="text-sm font-semibold text-gray-900">23</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">New Posts Today</span>
                    <span className="text-sm font-semibold text-gray-900">47</span>
                  </div>
                  {user?.is_veteran && (
                    <>
                      <div className="border-t border-gray-100 pt-3 mt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Following</span>
                          <span className="text-sm font-semibold text-gray-900">{stats.following_count || 0}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Followers</span>
                        <span className="text-sm font-semibold text-gray-900">{stats.followers_count || 0}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Feature Access Info */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-100 p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                  <Trophy className="w-4 h-4 mr-2 text-blue-600" />
                  {user?.is_veteran ? 'Your Veteran Privileges' : 'Veteran Benefits'}
                </h3>
                <ul className="space-y-2 text-xs text-gray-700">
                  <li className="flex items-start">
                    <Award className="w-3.5 h-3.5 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                    <span>Create events with star rewards</span>
                  </li>
                  <li className="flex items-start">
                    <Award className="w-3.5 h-3.5 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                    <span>Create support groups</span>
                  </li>
                  <li className="flex items-start">
                    <Award className="w-3.5 h-3.5 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                    <span>Give stars to recognize others</span>
                  </li>
                  <li className="flex items-start">
                    <Award className="w-3.5 h-3.5 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                    <span>Post with images</span>
                  </li>
                  <li className="flex items-start">
                    <Award className="w-3.5 h-3.5 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                    <span>Personalized feed</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Create Post Modal */}
        <AnimatePresence>
          {showCreatePost && (
            <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Create Post</h3>
                    <button
                      onClick={() => {
                        setShowCreatePost(false);
                        setPostForm({ title: '', content: '', image: null });
                        setFormErrors([]);
                      }}
                      className="icon-btn text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {formErrors.length > 0 && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                      <ul className="list-disc list-inside text-sm text-red-700">
                        {formErrors.map((error, i) => <li key={i}>{error}</li>)}
                      </ul>
                    </div>
                  )}

                  <div className="space-y-4">
                    {user?.is_veteran && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Title (Optional)
                        </label>
                        <input
                          type="text"
                          value={postForm.title}
                          onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="Give your post a title..."
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Content *
                      </label>
                      <textarea
                        value={postForm.content}
                        onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
                        rows={6}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Share your thoughts..."
                      />
                    </div>

                    {user?.is_veteran && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Image (Veteran Feature)
                        </label>
                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-purple-300 transition-colors">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setPostForm({ ...postForm, image: e.target.files?.[0] || null })}
                            className="hidden"
                            id="post-image"
                          />
                          <label htmlFor="post-image" className="cursor-pointer">
                            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">
                              {postForm.image ? postForm.image.name : 'Click to upload image'}
                            </p>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setShowCreatePost(false);
                        setPostForm({ title: '', content: '', image: null });
                        setFormErrors([]);
                      }}
                      className="px-5 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreatePost}
                      className="px-5 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-medium shadow-lg flex items-center"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Post
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Create Event Modal - Veterans Only */}
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
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Create Event</h3>
                    <button
                      onClick={() => {
                        setShowCreateEvent(false);
                        setFormErrors([]);
                      }}
                      className="icon-btn text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {formErrors.length > 0 && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                      <ul className="list-disc list-inside text-sm text-red-700">
                        {formErrors.map((error, i) => <li key={i}>{error}</li>)}
                      </ul>
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Star Reward (Max 5000)
                        </label>
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
                        <option value="Outdoor">Outdoor</option>
                        <option value="Workshop">Workshop</option>
                        <option value="Meetup">Meetup</option>
                        <option value="Training">Training</option>
                        <option value="Social">Social</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setShowCreateEvent(false);
                        setFormErrors([]);
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

        {/* Create Support Group Modal - Veterans Only */}
        <AnimatePresence>
          {showCreateGroup && user?.is_veteran && (
            <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Create Support Group</h3>
                    <button
                      onClick={() => {
                        setShowCreateGroup(false);
                        setFormErrors([]);
                      }}
                      className="icon-btn text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {formErrors.length > 0 && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                      <ul className="list-disc list-inside text-sm text-red-700">
                        {formErrors.map((error, i) => <li key={i}>{error}</li>)}
                      </ul>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Group Name *</label>
                      <input
                        type="text"
                        value={groupForm.name}
                        onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Post-Service Transition Support"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                      <textarea
                        value={groupForm.description}
                        onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="A group for those who recently left active duty..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Privacy Level</label>
                        <select
                          value={groupForm.privacy_level}
                          onChange={(e) => setGroupForm({ ...groupForm, privacy_level: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="public">Public</option>
                          <option value="private">Private</option>
                          <option value="invite-only">Invite Only</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Topic</label>
                        <input
                          type="text"
                          value={groupForm.topic}
                          onChange={(e) => setGroupForm({ ...groupForm, topic: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="Career Support"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setShowCreateGroup(false);
                        setFormErrors([]);
                      }}
                      className="px-5 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateGroup}
                      className="px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium shadow-lg"
                    >
                      Create Group
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </ProtectedRoute>
  );
}
