'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import {
  BarChart3,
  TrendingUp,
  Users,
  MessageSquare,
  Calendar,
  Heart,
  UserPlus,
  Activity,
  AlertTriangle
} from 'lucide-react';
import StatCard from '@/components/StatCard';

interface EngagementStats {
  total_posts: number;
  total_events: number;
  total_connections: number;
  total_likes: number;
  posts_this_week: number;
  events_this_week: number;
  new_users_this_week: number;
  active_users_today: number;
}

export default function Analytics() {
  const [stats, setStats] = useState<EngagementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/hub/stats/');
      setStats(response.data);
    } catch (err: any) {
      console.error('Failed to fetch stats:', err);
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-medium mb-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page-container page-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center space-x-4 mb-2">
          <div className="p-3 bg-gray-800 rounded-xl shadow-lg">
            <BarChart3 className="w-7 h-7 text-gray-100" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics & Statistics</h1>
            <p className="text-gray-600 mt-1">Platform engagement and user metrics</p>
          </div>
        </div>
      </div>

      {/* Overall Platform Stats Section */}
      <div className="section-spacing">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Overall Platform Stats</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl shadow-lg p-6 text-white hover-elevate"
          >
            <div className="flex items-center justify-between mb-4">
              <MessageSquare className="w-8 h-8 opacity-90" />
              <span className="text-sm opacity-80 font-medium">All Time</span>
            </div>
            <p className="text-4xl font-bold mb-1">{stats?.total_posts || 0}</p>
            <p className="text-sm opacity-90 font-medium">Total Posts</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl shadow-lg p-6 text-white hover-elevate"
          >
            <div className="flex items-center justify-between mb-4">
              <Calendar className="w-8 h-8 opacity-90" />
              <span className="text-sm opacity-80 font-medium">All Time</span>
            </div>
            <p className="text-4xl font-bold mb-1">{stats?.total_events || 0}</p>
            <p className="text-sm opacity-90 font-medium">Total Events</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl shadow-lg p-6 text-white hover-elevate"
          >
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 opacity-90" />
              <span className="text-sm opacity-80 font-medium">All Time</span>
            </div>
            <p className="text-4xl font-bold mb-1">{stats?.total_connections || 0}</p>
            <p className="text-sm opacity-90 font-medium">Connections Made</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl shadow-lg p-6 text-white hover-elevate"
          >
            <div className="flex items-center justify-between mb-4">
              <Heart className="w-8 h-8 opacity-90" />
              <span className="text-sm opacity-80 font-medium">All Time</span>
            </div>
            <p className="text-4xl font-bold mb-1">{stats?.total_likes || 0}</p>
            <p className="text-sm opacity-90 font-medium">Total Likes</p>
          </motion.div>
        </div>
      </div>

      {/* Weekly Trends Section */}
      <div className="section-spacing">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">This Week's Activity</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={MessageSquare}
            label="Posts This Week"
            value={stats?.posts_this_week || 0}
            iconBgColor="bg-blue-50"
            iconColor="text-blue-600"
            borderColor="border-blue-100"
            subtitle="Active engagement"
          />
          <StatCard
            icon={Calendar}
            label="Events This Week"
            value={stats?.events_this_week || 0}
            iconBgColor="bg-purple-50"
            iconColor="text-purple-600"
            borderColor="border-purple-100"
            subtitle="Community building"
            delay={0.05}
          />
          <StatCard
            icon={UserPlus}
            label="New Users"
            value={stats?.new_users_this_week || 0}
            iconBgColor="bg-green-50"
            iconColor="text-green-600"
            borderColor="border-green-100"
            subtitle="Growing community"
            delay={0.1}
          />
          <StatCard
            icon={Activity}
            label="Active Today"
            value={stats?.active_users_today || 0}
            iconBgColor="bg-orange-50"
            iconColor="text-orange-600"
            borderColor="border-orange-100"
            subtitle="Online now"
            delay={0.15}
          />
        </div>
      </div>

      {/* Engagement Metrics Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-8">Engagement Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center p-6 bg-blue-50 rounded-xl border border-blue-100"
          >
            <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 rounded-xl mb-4">
              <MessageSquare className="w-7 h-7 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">
              {stats?.total_posts ? ((stats.posts_this_week / stats.total_posts) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-sm font-medium text-gray-600">Weekly Post Activity</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-center p-6 bg-purple-50 rounded-xl border border-purple-100"
          >
            <div className="inline-flex items-center justify-center w-14 h-14 bg-purple-100 rounded-xl mb-4">
              <Calendar className="w-7 h-7 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">
              {stats?.total_events ? ((stats.events_this_week / stats.total_events) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-sm font-medium text-gray-600">Weekly Event Activity</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center p-6 bg-green-50 rounded-xl border border-green-100"
          >
            <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-xl mb-4">
              <TrendingUp className="w-7 h-7 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">
              {stats?.new_users_this_week || 0}
            </p>
            <p className="text-sm font-medium text-gray-600">User Growth This Week</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
