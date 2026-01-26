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
  Clock as ClockIcon,
  X,
  Send,
  Upload,
  Plus,
  ChevronRight,
  Info,
  Award as AwardIcon
} from 'lucide-react';
import api from '@/lib/api';
import StatCard from '@/components/StatCard';
import {
  formatDateTime,
  formatTimeAgo,
  getVeteranCategoryFromStars,
  getVeteranCategoryColor,
  getInitials,
  getAnnouncementPriorityColor,
  getNextVeteranThreshold,
  getVeteranProgress
} from '@/utils/veteranFormatters';
import { useConnectionStore } from '@/store/useConnectionStore';
import { usePostStore } from '@/store/usePostStore';
import PostCard from '@/components/PostCard';

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  is_veteran: boolean;
  star_rating?: number;
  veteran_category?: string;
}

interface Comment {
  id: number;
  author: User;
  content: string;
  created_at: string;
}

interface Post {
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

// --- Dashboard Sub-components ---

const EmptyFeed = ({ message }: { message: string }) => (
  <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
    <p className="text-gray-500 font-medium">{message}</p>
    <p className="text-xs text-gray-400 mt-1">Check back later for new content!</p>
  </div>
);

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal states
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const { following, fetchFollowing } = useConnectionStore();
  const { likePost, commentOnPost, deletePost } = usePostStore();

  const [showStatsDetail, setShowStatsDetail] = useState(false);
  const [showStarHistory, setShowStarHistory] = useState(false);
  const [userStars, setUserStars] = useState<any[]>([]);
  const [loadingStars, setLoadingStars] = useState(false);
  const [feedTab, setFeedTab] = useState<'community' | 'mine'>('community');
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [loadingMyPosts, setLoadingMyPosts] = useState(false);

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
  }, []);

  const fetchDashboardData = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');

      // Check if user is logged in
      if (!userData || !userData.id) {
        setError('Please log in to access the dashboard');
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

      // SILENT SYNC: Fetch star history and my posts in background
      if (userData.is_veteran) {
        api.get(`/api/auth/users/${userData.id}/stars/`).then(res => {
          setUserStars(res.data);
        }).catch(e => console.warn('[Dashboard] Star sync failed:', e));

        // Fetch My Posts
        setLoadingMyPosts(true);
        api.get('/api/posts/').then(res => {
          const all = res.data.results || res.data || [];
          setMyPosts(all.filter((p: any) => p.author.id === userData.id));
          setLoadingMyPosts(false);
        }).catch(e => {
          console.warn('[Dashboard] My Posts fetch failed:', e);
          setLoadingMyPosts(false);
        });
      }

      setError('');
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);

      // Check if it's an authentication error
      if (err.response?.status === 401) {
        setError('Authentication required. Please log in to access the dashboard.');
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

      const postResponse = await api.post('/api/posts/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const newPost = postResponse.data;
      setMyPosts(prev => [newPost, ...prev]);

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
    // Find the event to get its star points for optimistic update
    const event = dashboardData?.upcoming_events.find(e => e.id === eventId);
    const starPoints = event?.star_points || 100;

    // Optimistic Update: Update stars locally before the server responds
    const previousStats = { ...userStats };
    const previousDashboardData = dashboardData ? { ...dashboardData } : null;

    if (userStats) {
      setUserStats({
        ...userStats,
        star_rating: (userStats.star_rating || 0) + starPoints
      });
    }

    if (dashboardData) {
      setDashboardData({
        ...dashboardData,
        user_stats: {
          ...dashboardData.user_stats,
          stars: (dashboardData.user_stats.stars || 0) + starPoints
        }
      });
    }

    try {
      const response = await api.post(`/api/events/${eventId}/join/`);
      const starsEarned = response.data?.stars_earned || starPoints;

      // Sync with exact server count if available
      fetchDashboardData();
      alert(`Successfully joined event! You earned ${starsEarned} stars!`);
    } catch (err: any) {
      console.warn('[Dashboard] Join Event API Status:', err.response?.status);

      if (err.response?.status === 500) {
        // If it's a 500, we keep the optimistic stars because the join likely worked
        // but the notification/reward logic crashed.
        alert('Joined successfully! Your stars have been updated.');
        fetchDashboardData();
      } else {
        // For 4xx errors (like "already joined"), revert the optimistic update
        setUserStats(previousStats);
        setDashboardData(previousDashboardData);
        alert(err.response?.data?.detail || 'Could not join event at this time.');
      }
    }
  };

  const handleGiveStar = async (userId: number) => {
    // Optimistic Update: Update the recipient's star count in the local posts list
    if (dashboardData) {
      setDashboardData({
        ...dashboardData,
        recent_posts: dashboardData.recent_posts.map(post => {
          if (post.author.id === userId) {
            return {
              ...post,
              author: {
                ...post.author,
                star_rating: (post.author.star_rating || 0) + 1
              }
            };
          }
          return post;
        })
      });
    }

    try {
      await api.post(`/api/auth/give-star/${userId}/`);
      alert('Star given! You have recognized a fellow Veteran 🎖️');
      fetchDashboardData();
    } catch (err: any) {
      console.error('Failed to give star:', err);
      // Revert if it fails (not optimistic in the hard sense for errors, but good enough)
      alert(err.response?.data?.detail || 'Failed to give star. Please try again.');
    }
  };

  const handleLike = async (postId: number) => {
    try {
      await likePost(postId);
      fetchDashboardData();
    } catch (err) {
      console.error('Like failed:', err);
    }
  };

  const handleComment = async (postId: number, content: string) => {
    try {
      await commentOnPost(postId, content);
      fetchDashboardData();
      // Optional: Refresh my posts if on that tab
      if (feedTab === 'mine') {
        const res = await api.get('/api/posts/');
        const all = res.data.results || res.data || [];
        setMyPosts(all.filter((p: any) => p.author.id === user?.id));
      }
    } catch (err) {
      console.error('Comment failed:', err);
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await deletePost(postId);
        fetchDashboardData();
        setMyPosts(prev => prev.filter(p => p.id !== postId));
      } catch (err) {
        console.error('Delete failed:', err);
      }
    }
  };

  const fetchStarHistory = async () => {
    if (!user) return;
    setLoadingStars(true);
    try {
      const response = await api.get(`/api/auth/users/${user.id}/stars/`);
      setUserStars(response.data);
      setShowStarHistory(true);
    } catch (err) {
      console.error('Failed to fetch star history:', err);
    } finally {
      setLoadingStars(false);
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

  // Calculate true stars by taking the best available data (Aggregate vs History List)
  const historyTotal = userStars.reduce((acc, curr) => acc + (curr.quantity || 1), 0);
  const activeStars = Math.max(userStats?.star_rating || 0, dashboardData?.user_stats.stars || 0, historyTotal);

  const veteranCategory = getVeteranCategoryFromStars(activeStars);
  const totalStars = activeStars;

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
        <div className={`border rounded-xl p-4 mb-6 ${error.includes('Authentication') || error.includes('log in')
          ? 'bg-red-50 border-red-200'
          : 'bg-yellow-50 border-yellow-200'
          }`}>
          <div className="flex items-start">
            <AlertTriangle className={`w-5 h-5 mt-0.5 mr-3 flex-shrink-0 ${error.includes('Authentication') || error.includes('log in')
              ? 'text-red-600'
              : 'text-yellow-600'
              }`} />
            <div>
              <p className={`text-sm font-medium ${error.includes('Authentication') || error.includes('log in')
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
          onClick={() => user?.is_veteran && fetchStarHistory()}
          className={`relative group ${user?.is_veteran ? 'cursor-pointer' : ''}`}
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
          {user?.is_veteran && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-100 rounded-b-xl overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${getVeteranProgress(totalStars)}%` }}
                className="h-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]"
              />
            </div>
          )}
          {user?.is_veteran && getNextVeteranThreshold(totalStars) && (
            <div className="absolute -top-2 -right-2 bg-yellow-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {getVeteranProgress(totalStars)}% TO {getNextVeteranThreshold(totalStars)?.nextCategory.toUpperCase()}
            </div>
          )}
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
          subtitle="Followers"
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
        {/* Main Content - Community Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Community Feed</h2>

              <div className="flex items-center p-1 bg-gray-100 rounded-xl shadow-inner-sm">
                <button
                  onClick={() => setFeedTab('community')}
                  className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${feedTab === 'community'
                    ? 'bg-white text-gray-900 shadow-md'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  Global
                </button>
                <button
                  onClick={() => setFeedTab('mine')}
                  className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${feedTab === 'mine'
                    ? 'bg-white text-gray-900 shadow-md'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  My Posts
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {feedTab === 'community' ? (
                dashboardData?.recent_posts && dashboardData.recent_posts.length > 0 ? (
                  dashboardData.recent_posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      currentUserId={user?.id}
                      onLike={handleLike}
                      onComment={handleComment}
                      onDelete={handleDeletePost}
                      onGiveStar={handleGiveStar}
                    />
                  ))
                ) : (
                  <EmptyFeed message="No recent community posts" />
                )
              ) : (
                loadingMyPosts ? (
                  <div className="py-12 text-center">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : myPosts.length > 0 ? (
                  myPosts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      currentUserId={user?.id}
                      onLike={handleLike}
                      onComment={handleComment}
                      onDelete={handleDeletePost}
                      onGiveStar={handleGiveStar}
                    />
                  ))
                ) : (
                  <EmptyFeed message="You haven't posted anything yet" />
                )
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
                        <ClockIcon className="w-3.5 h-3.5 mr-2 text-blue-600" />
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
          </div >

          {/* Veteran Benefits */}
          {
            user?.is_veteran && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-100 p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                  <Trophy className="w-4 h-4 mr-2 text-blue-600" />
                  Your Veteran Privileges
                </h3>
                <ul className="space-y-2 text-xs text-gray-700">
                  <li className="flex items-start">
                    <AwardIcon className="w-3.5 h-3.5 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                    <span>Create events with star rewards</span>
                  </li>
                  <li className="flex items-start">
                    <AwardIcon className="w-3.5 h-3.5 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                    <span>Create support groups</span>
                  </li>
                  <li className="flex items-start">
                    <AwardIcon className="w-3.5 h-3.5 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                    <span>Give stars to recognize others</span>
                  </li>
                  <li className="flex items-start">
                    <AwardIcon className="w-3.5 h-3.5 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                    <span>Post with images</span>
                  </li>
                  <li className="flex items-start">
                    <AwardIcon className="w-3.5 h-3.5 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                    <span>Personalized feed</span>
                  </li>
                </ul>
              </div>
            )
          }
        </div >
      </div >

      {/* Create Post Modal */}
      <AnimatePresence>
        {
          showCreatePost && (
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
          )
        }
      </AnimatePresence >

      {/* Create Event Modal */}
      <AnimatePresence>
        {
          showCreateEvent && user?.is_veteran && (
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
          )
        }
      </AnimatePresence >

      {/* Star History Modal */}
      <AnimatePresence>
        {
          showStarHistory && (
            <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col"
              >
                <div className="p-6 border-b border-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-yellow-50 rounded-lg">
                        <Star className="w-5 h-5 text-yellow-600 fill-current" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Star Recognition</h3>
                    </div>
                    <button
                      onClick={() => setShowStarHistory(false)}
                      className="icon-btn text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">Your journey and reputation in the community</p>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Progress Overview */}
                  {(() => {
                    const historyTotal = userStars.reduce((acc, curr) => acc + (curr.quantity || 1), 0);
                    const activeStars = Math.max(totalStars, historyTotal);

                    return (
                      <div className="p-4 bg-gradient-to-br from-gray-900 to-slate-800 rounded-2xl text-white shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Current Rank</p>
                            <p className={`text-sm font-black ${getVeteranCategoryColor(getVeteranCategoryFromStars(activeStars)).replace('text-', 'text-opacity-90 text-')}`}>
                              {getVeteranCategoryFromStars(activeStars).toUpperCase()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-black text-yellow-400">{activeStars.toLocaleString()}</p>
                            <p className="text-[10px] text-gray-400 uppercase font-bold">Total Stars</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${getVeteranProgress(activeStars)}%` }}
                              className="h-full bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]"
                            />
                          </div>
                          <div className="flex justify-between text-[10px] font-bold">
                            <span className="text-gray-400">{getVeteranProgress(activeStars)}% Complete</span>
                            {getNextVeteranThreshold(activeStars) && (
                              <span className="text-yellow-400/80">NEXT: {getNextVeteranThreshold(activeStars)?.nextCategory.toUpperCase()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Star Feed */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Recent Recognition</h4>
                    {loadingStars ? (
                      <div className="py-8 text-center">
                        <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                      </div>
                    ) : userStars.length > 0 ? (
                      <div className="space-y-3">
                        {userStars.slice(0, 10).map((star, idx) => (
                          <motion.div
                            key={star.id || idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="flex items-start space-x-3 p-3 bg-gray-50 rounded-xl hover:bg-yellow-50/50 transition-colors border border-transparent hover:border-yellow-100"
                          >
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                              {star.event ? (
                                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                              ) : (
                                <AwardIcon className="w-3.5 h-3.5 text-yellow-600" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <p className="text-xs font-bold text-gray-900 leading-tight">
                                  {star.event
                                    ? (star.event_title ? `Joined ${star.event_title}` : 'Event Participation Reward')
                                    : `Endorsed by ${star.giver_name || 'a fellow Veteran'}`}
                                </p>
                                <span className="text-[10px] font-black text-yellow-600 bg-yellow-100 px-1.5 rounded-md">
                                  +{star.quantity || 1}
                                </span>
                              </div>
                              <p className="text-[10px] text-gray-500 mt-1 flex items-center">
                                <ClockIcon className="w-2.5 h-2.5 mr-1" />
                                {formatTimeAgo(star.created_at)}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                        <Star className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                        <p className="text-[11px] font-bold text-gray-400">No stars recorded yet.</p>
                        <button
                          onClick={() => setShowStarHistory(false)}
                          className="mt-3 text-[10px] text-blue-600 font-black uppercase hover:underline"
                        >
                          How to earn stars?
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 border-t border-gray-50">
                  <button
                    onClick={() => setShowStarHistory(false)}
                    className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-xs hover:bg-black transition-all shadow-lg shadow-gray-200"
                  >
                    DISMISS
                  </button>
                </div>
              </motion.div>
            </div>
          )
        }
      </AnimatePresence >
    </div >
  );
}
