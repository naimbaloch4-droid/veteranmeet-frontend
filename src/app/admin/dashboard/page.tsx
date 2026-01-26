'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Users,
  Shield,
  Flag,
  BarChart3,
  TrendingUp,
  Activity,
  AlertTriangle,
  MessageSquare,
  Calendar,
  Star
} from 'lucide-react';
import api from '@/lib/api';
import StatCard from '@/components/StatCard';

interface DashboardStats {
  total_users: number;
  total_veterans: number;
  total_non_veterans: number;
  active_users: number;
  total_posts: number;
  total_events: number;
  total_announcements: number;
  pending_reports: number;
  total_stars: number;
  recent_users: any[];
  recent_activities: {
    recent_posts_count: number;
    recent_events_count: number;
    new_users_week: number;
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    total_users: 0,
    total_veterans: 0,
    total_non_veterans: 0,
    active_users: 0,
    total_posts: 0,
    total_events: 0,
    total_announcements: 0,
    pending_reports: 0,
    total_stars: 0,
    recent_users: [],
    recent_activities: {
      recent_posts_count: 0,
      recent_events_count: 0,
      new_users_week: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      console.log('Fetching from API URL:', process.env.NEXT_PUBLIC_API_URL);
      console.log('Full URL:', `${process.env.NEXT_PUBLIC_API_URL}/api/hub/admin-overview/`);
      
      // Use the new dedicated admin overview endpoint
      const overviewRes = await api.get('/api/hub/admin-overview/');
      
      console.log('Admin overview data received:', overviewRes.data);
      
      const dashboardData: DashboardStats = {
        total_users: overviewRes.data.total_users || 0,
        total_veterans: overviewRes.data.total_veterans || 0,
        total_non_veterans: overviewRes.data.total_non_veterans || 0,
        active_users: overviewRes.data.active_users || 0,
        total_posts: overviewRes.data.total_posts || 0,
        total_events: overviewRes.data.total_events || 0,
        total_announcements: overviewRes.data.total_announcements || 0,
        pending_reports: 0, // Will fetch separately if needed
        total_stars: 0, // Will fetch separately if needed
        recent_users: overviewRes.data.recent_users || [],
        recent_activities: {
          recent_posts_count: overviewRes.data.recent_activities?.recent_posts_count || 0,
          recent_events_count: overviewRes.data.recent_activities?.recent_events_count || 0,
          new_users_week: overviewRes.data.recent_activities?.new_users_week || 0
        }
      };

      // Fetch additional data in parallel (reports and stars)
      const [reportsRes, starsRes] = await Promise.allSettled([
        api.get('/api/reports/'),
        api.get('/api/auth/stars/')
      ]);

      // Process reports data
      if (reportsRes.status === 'fulfilled') {
        const reports = reportsRes.value.data.results || reportsRes.value.data || [];
        dashboardData.pending_reports = Array.isArray(reports) 
          ? reports.filter((r: any) => r.status === 'pending' || !r.status).length 
          : 0;
      } else {
        console.log('Reports endpoint not available');
      }

      // Process stars data
      if (starsRes.status === 'fulfilled') {
        const stars = starsRes.value.data.results || starsRes.value.data || [];
        dashboardData.total_stars = Array.isArray(stars) 
          ? stars.reduce((sum: number, star: any) => sum + (star.quantity || 1), 0)
          : 0;
      } else {
        console.log('Stars endpoint not available');
      }

      console.log('Final dashboard stats:', dashboardData);
      setStats(dashboardData);
      setError('');
    } catch (err: any) {
      console.error('Failed to fetch admin overview:', err);
      setError('Failed to load dashboard statistics. Please ensure you have admin privileges and backend is running.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const hasError = error && stats.total_users === 0;

  return (
    <div className="admin-page-container page-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center space-x-4 mb-2">
          <div className="p-3 bg-gray-800 rounded-xl shadow-lg">
            <Shield className="w-7 h-7 text-gray-100" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage VeteranMeet platform and monitor activity</p>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {hasError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <p className="text-red-800 font-medium">{error}</p>
              <p className="text-sm text-red-600 mt-1">
                Make sure Django backend is running and CORS is configured properly
              </p>
            </div>
          </div>
        </div>
      )}
      
      {error && !hasError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <p className="text-yellow-800 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Primary Stats Grid - 4 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 section-spacing">
        <StatCard
          icon={Users}
          label="Total Users"
          value={stats.total_users}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
          borderColor="border-blue-100"
          delay={0}
        />
        <StatCard
          icon={Activity}
          label="Enabled Accounts"
          value={stats.active_users}
          iconBgColor="bg-green-50"
          iconColor="text-green-600"
          borderColor="border-green-100"
          subtitle="Non-disabled users"
          delay={0.05}
        />
        <StatCard
          icon={MessageSquare}
          label="Total Posts"
          value={stats.total_posts}
          iconBgColor="bg-purple-50"
          iconColor="text-purple-600"
          borderColor="border-purple-100"
          delay={0.1}
        />
        <StatCard
          icon={Calendar}
          label="Total Events"
          value={stats.total_events}
          iconBgColor="bg-orange-50"
          iconColor="text-orange-600"
          borderColor="border-orange-100"
          delay={0.15}
        />
      </div>

      {/* Secondary Stats Grid - 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 section-spacing">
        <StatCard
          icon={Flag}
          label="Pending Reports"
          value={stats.pending_reports}
          iconBgColor="bg-red-50"
          iconColor="text-red-600"
          borderColor="border-red-100"
          delay={0.2}
        />
        <StatCard
          icon={Star}
          label="Total Stars"
          value={stats.total_stars}
          iconBgColor="bg-yellow-50"
          iconColor="text-yellow-600"
          borderColor="border-yellow-100"
          delay={0.25}
        />
        <StatCard
          icon={TrendingUp}
          label="Growth Rate"
          value="+12%"
          iconBgColor="bg-indigo-50"
          iconColor="text-indigo-600"
          borderColor="border-indigo-100"
          delay={0.3}
        />
      </div>

      {/* Quick Actions Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 section-spacing">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link 
            href="/admin/users" 
            className="flex items-center justify-center p-4 border border-gray-200 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all group"
          >
            <Users className="w-5 h-5 text-gray-600 group-hover:text-gray-900 mr-2 transition-colors" />
            <span className="text-sm font-medium text-gray-900 transition-colors">Manage Users</span>
          </Link>
          <Link 
            href="/admin/reports" 
            className="flex items-center justify-center p-4 border border-gray-200 rounded-xl hover:border-red-300 hover:bg-red-50 transition-all group"
          >
            <Flag className="w-5 h-5 text-gray-600 group-hover:text-red-600 mr-2 transition-colors" />
            <span className="text-sm font-medium text-gray-900 group-hover:text-red-700 transition-colors">Review Reports</span>
          </Link>
          <Link 
            href="/admin/content" 
            className="flex items-center justify-center p-4 border border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all group"
          >
            <MessageSquare className="w-5 h-5 text-gray-600 group-hover:text-purple-600 mr-2 transition-colors" />
            <span className="text-sm font-medium text-gray-900 group-hover:text-purple-700 transition-colors">Moderate Content</span>
          </Link>
          <Link 
            href="/admin/analytics" 
            className="flex items-center justify-center p-4 border border-gray-200 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all group"
          >
            <BarChart3 className="w-5 h-5 text-gray-600 group-hover:text-gray-900 mr-2 transition-colors" />
            <span className="text-sm font-medium text-gray-900 transition-colors">View Analytics</span>
          </Link>
        </div>
      </div>

      {/* Recent Users Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Users</h2>
        <div className="space-y-3">
          {stats.recent_users && stats.recent_users.length > 0 ? (
            stats.recent_users.map((user: any, index: number) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-gray-100">
                      {user.first_name?.[0] || user.username?.[0] || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      @{user.username}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold ${
                    user.is_veteran
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-gray-50 text-gray-700 border border-gray-200'
                  }`}>
                    {user.is_veteran ? 'Veteran' : 'Member'}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(user.date_joined).toLocaleDateString()}
                  </p>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No recent users to display</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Summary Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity (Last 7 Days)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-100">
            <MessageSquare className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats.recent_activities.recent_posts_count}</p>
            <p className="text-sm text-gray-600 mt-1">New Posts</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-100">
            <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats.recent_activities.recent_events_count}</p>
            <p className="text-sm text-gray-600 mt-1">New Events</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-xl border border-green-100">
            <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats.recent_activities.new_users_week}</p>
            <p className="text-sm text-gray-600 mt-1">New Signups</p>
          </div>
        </div>
      </div>
    </div>
  );
}
