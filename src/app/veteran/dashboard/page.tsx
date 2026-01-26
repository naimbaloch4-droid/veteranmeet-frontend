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
  AlertTriangle,
  Shield,
  Trophy,
  Award,
  Heart,
  Share2,
  MapPin,
  Clock,
  X,
  Send,
  Upload,
  Plus,
  ChevronRight,
  Info
} from 'lucide-react';
import api from '@/lib/api';
import StatCard from '@/components/StatCard';
import { useConnectionStore } from '@/store/useConnectionStore';
import {
  formatDateTime,
  formatTimeAgo,
  getVeteranCategoryFromStars,
  getVeteranCategoryColor,
  getInitials,
  getAnnouncementPriorityColor
} from '@/utils/veteranFormatters';

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  is_veteran: boolean;
  star_rating?: number;
  veteran_category?: string;
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

interface Announcement {
  id: number;
  title: string;
  content: string;
  priority: string;
  created_at: string;
}

interface DashboardData {
  user_stats: {
    posts_count: number;
    events_joined: number;
    stars: number;
  };
  recent_posts: Post[];
  upcoming_events: Event[];
  announcements: Announcement[];
}

export default function VeteranDashboard() {
  const { following, fetchFollowing } = useConnectionStore();
  const [user, setUser] = useState<User | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal states
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showStatsDetail, setShowStatsDetail] = useState(false);
  
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
  const [formErrors, setFormErrors] = useState<string[]>([]);

  useEffect(() => {
    fetchDashboardData();
    fetchFollowing();
  }, [fetchFollowing]);

  // Polling for real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData();
      fetchFollowing();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [fetchFollowing]);

  const fetchDashboardData = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Check if user is logged in
      if (!userData || !userData.id) {
        setError('Please log in to access the veteran dashboard');
        setLoading(false);
        return;
      }
      
      setUser(userData);

      // Fetch main dashboard data (multi-fetch endpoint)
      const dashboardRes = await api.get('/api/hub/dashboard/');
      setDashboardData(dashboardRes.data);

      // Fetch user's detailed stats
      const statsRes = await api.get('/api/hub/stats/');
      setUserStats(statsRes.data);

      setError('');
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      
      // Check if it's an authentication error
      if (err.response?.status === 401) {
        setError('Authentication required. Please log in to access the veteran dashboard.');
        // Redirect to login after a short delay
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        setLoading(false);
        return;
      }
      
      setError('Failed to load dashboard. Some features may be unavailable.');
      
      // Fallback: try to fetch data individually
      try {
        const [postsRes, eventsRes] = await Promise.allSettled([
          api.get('/api/posts/', { params: { limit: 5 } }),
          api.get('/api/events/', { params: { limit: 5 } })
        ]);

        const fallbackData: DashboardData = {
          user_stats: { posts_count: 0, events_joined: 0, stars: 0 },
          recent_posts: postsRes.status === 'fulfilled' ? (postsRes.value.data.results || postsRes.value.data || []) : [],
          upcoming_events: eventsRes.status === 'fulfilled' ? (eventsRes.value.data.results || eventsRes.value.data || []) : [],
          announcements: []
        };
        
        setDashboardData(fallbackData);
      } catch (fallbackErr) {
        console.error('Fallback data fetch failed:', fallbackErr);
      }
    } finally {
      setLoading(false);
    }
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

  const handleJoinEvent = async (eventId: number) => {
    try {
      const response = await api.post(`/api/events/${eventId}/join/`);
      alert(`Successfully joined event! You earned ${response.data.stars_earned || 0} stars!`);
      fetchDashboardData();
    } catch (err: any) {
      console.error('Failed to join event:', err);
      alert(err.response?.data?.detail || 'Failed to join event');
    }
  };

  const handleGiveStar = async (userId: number) => {
    try {
      await api.post(`/api/auth/give-star/${userId}/`);
      alert('Star given successfully! +1 reputation');
      fetchDashboardData();
    } catch (err: any) {
      console.error('Failed to give star:', err);
      alert(err.response?.data?.detail || 'Failed to give star');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const veteranCategory = userStats?.veteran_category || getVeteranCategoryFromStars(userStats?.star_rating || 0);
  const totalStars = userStats?.star_rating || dashboardData?.user_stats.stars || 0;

  return (
    <div className="admin-page-container page-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gray-800 rounded-xl shadow-lg">
              <Shield className="w-7 h-7 text-gray-100" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.first_name}!
              </h1>
              <p className="text-gray-600 mt-1 flex items-center space-x-2">
                {user?.is_veteran ? (
                  <>
                    <Shield className="w-4 h-4" />
                    <span>Veteran Member</span>
                    {veteranCategory && (
                      <>
                        <span>•</span>
                        <span className={getVeteranCategoryColor(veteranCategory)}>
                          {veteranCategory}
                        </span>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4" />
                    <span>Community Member</span>
                  </>
                )}
              </p>
            </div>
          </div>
          
          {user?.is_veteran && (
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCreatePost(true)}
                className="flex items-center px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all shadow-lg font-medium"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Post
              </button>
              <button
                onClick={() => setShowCreateEvent(true)}
                className="flex items-center px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg font-medium"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Create Event
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className={`border rounded-xl p-4 mb-6 ${
          error.includes('Authentication') || error.includes('log in')
            ? 'bg-red-50 border-red-200'
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-start">
            <AlertTriangle className={`w-5 h-5 mt-0.5 mr-3 flex-shrink-0 ${
              error.includes('Authentication') || error.includes('log in')
                ? 'text-red-600'
                : 'text-yellow-600'
            }`} />
            <div>
              <p className={`text-sm font-medium ${
                error.includes('Authentication') || error.includes('log in')
                  ? 'text-red-800'
                  : 'text-yellow-800'
              }`}>{error}</p>
              {(error.includes('Authentication') || error.includes('log in')) && (
                <p className="text-xs text-red-700 mt-1">Redirecting to login page...</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 section-spacing">
        <div 
          onClick={() => user?.is_veteran && setShowStatsDetail(true)}
          className={user?.is_veteran ? 'cursor-pointer' : ''}
        >
          <StatCard
            icon={Star}
            label="Total Stars"
            value={totalStars}
            iconBgColor="bg-yellow-50"
            iconColor="text-yellow-600"
            borderColor="border-yellow-100"
            subtitle={veteranCategory}
            delay={0}
          />
        </div>
        <StatCard
          icon={MessageSquare}
          label="My Posts"
          value={dashboardData?.user_stats.posts_count || 0}
          iconBgColor="bg-purple-50"
          iconColor="text-purple-600"
          borderColor="border-purple-100"
          delay={0.05}
        />
        <StatCard
          icon={Calendar}
          label="Events Joined"
          value={dashboardData?.user_stats.events_joined || 0}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
          borderColor="border-blue-100"
          delay={0.1}
        />
        <StatCard
          icon={Users}
          label="Connections"
          value={following.length}
          iconBgColor="bg-green-50"
          iconColor="text-green-600"
          borderColor="border-green-100"
          subtitle="Following"
          delay={0.15}
        />
      </div>

      {/* Announcements */}
      {dashboardData?.announcements && dashboardData.announcements.length > 0 && (
        <div className="section-spacing">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Important Announcements</h2>
          <div className="space-y-3">
            {dashboardData.announcements.map((announcement) => (
              <motion.div
                key={announcement.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`border rounded-xl p-4 ${getAnnouncementPriorityColor(announcement.priority)}`}
              >
                <div className="flex items-start">
                  <Info className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{announcement.title}</h3>
                    <p className="text-sm opacity-90">{announcement.content}</p>
                    <p className="text-xs mt-2 opacity-75">{formatTimeAgo(announcement.created_at)}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content - Recent Posts */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Recent Community Posts</h2>
              {user?.is_veteran && (
                <button
                  onClick={() => setShowCreatePost(true)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View All
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              {dashboardData?.recent_posts && dashboardData.recent_posts.length > 0 ? (
                dashboardData.recent_posts.map((post) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-gray-100 rounded-xl p-5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-11 h-11 bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                        <span className="text-sm font-medium text-gray-100">
                          {getInitials(post.author.first_name, post.author.last_name, post.author.username)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {post.author.first_name} {post.author.last_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatTimeAgo(post.created_at)}
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
                  <p className="text-sm text-gray-400 mt-1">Be the first to share something!</p>
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
              {dashboardData?.upcoming_events && dashboardData.upcoming_events.length > 0 ? (
                dashboardData.upcoming_events.slice(0, 3).map((event) => (
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
                        {formatDateTime(event.date_time)}
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

          {/* Recent Posts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Posts</h2>
            <div className="space-y-3">
              {dashboardData?.recent_posts && dashboardData.recent_posts.length > 0 ? (
                dashboardData.recent_posts.slice(0, 3).map((post) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-gray-100">
                          {getInitials(post.author.first_name, post.author.last_name, post.author.username)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-semibold text-gray-900 truncate">
                            {post.author.first_name} {post.author.last_name}
                          </p>
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(post.created_at)}
                          </span>
                        </div>
                        {post.title && (
                          <h4 className="text-sm font-medium text-gray-900 mb-1 line-clamp-1">{post.title}</h4>
                        )}
                        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{post.content}</p>
                        <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                          <div className="flex items-center">
                            <Heart className="w-3 h-3 mr-1" />
                            <span>{post.likes_count || 0}</span>
                          </div>
                          <div className="flex items-center">
                            <MessageSquare className="w-3 h-3 mr-1" />
                            <span>{post.comments_count || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-6">
                  <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">No recent posts</p>
                </div>
              )}
            </div>
          </div>

          {/* Veteran Benefits */}
          {user?.is_veteran && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-100 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                <Trophy className="w-4 h-4 mr-2 text-blue-600" />
                Your Veteran Privileges
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
          )}
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
                      <option value="Wellness">Wellness</option>
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

      {/* Stats Detail Modal */}
      <AnimatePresence>
        {showStatsDetail && (
          <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Your Veteran Stats</h3>
                  <button
                    onClick={() => setShowStatsDetail(false)}
                    className="icon-btn text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
                    <Star className="w-12 h-12 text-yellow-600 fill-current mx-auto mb-3" />
                    <p className="text-4xl font-bold text-gray-900 mb-2">{totalStars}</p>
                    <p className="text-sm text-gray-600">Total Stars Earned</p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Veteran Category</span>
                      <span className={`text-sm font-bold ${getVeteranCategoryColor(veteranCategory)}`}>
                        {veteranCategory}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                      <div 
                        className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((totalStars / 100000) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {100000 - totalStars > 0 
                        ? `${(100000 - totalStars).toLocaleString()} stars to Eternal Sage`
                        : 'Maximum rank achieved!'
                      }
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Rank Thresholds</h4>
                    {[
                      { name: 'Bronze Veteran', stars: 0 },
                      { name: 'Silver Veteran', stars: 25000 },
                      { name: 'Ruby Veteran', stars: 40000 },
                      { name: 'Golden Veteran', stars: 50000 },
                      { name: 'Diamond Veteran', stars: 60000 },
                      { name: 'Sapphire Veteran', stars: 65000 },
                      { name: 'Platinum Veteran', stars: 70000 },
                      { name: 'Eternal Sage', stars: 100000 },
                    ].map((rank) => (
                      <div key={rank.name} className="flex items-center justify-between text-xs">
                        <span className={`${getVeteranCategoryColor(rank.name)} font-medium`}>
                          {rank.name}
                        </span>
                        <span className="text-gray-500">{rank.stars.toLocaleString()} stars</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setShowStatsDetail(false)}
                  className="w-full mt-6 px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-medium"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
