'use client';

import { useEffect, useState } from 'react';
import { Users, UserPlus, Search, RefreshCw } from 'lucide-react';
import { useConnectionStore } from '@/store/useConnectionStore';
import { useChatStore } from '@/store/useChatStore';
import UserCard from '@/components/UserCard';
import { getUser } from '@/lib/auth';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useToastStore } from '@/store/useToastStore';

export default function ConnectionsPage() {
  const router = useRouter();
  const { 
    followers, 
    following, 
    suggestions, 
    loading, 
    fetchFollowers, 
    fetchFollowing, 
    fetchSuggestions,
    followUser,
    unfollowUser,
    isFollowing
  } = useConnectionStore();
  
  const { createDirectChat } = useChatStore();
  const { success, error: showError } = useToastStore();
  
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'followers' | 'following' | 'suggestions'>('suggestions');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const userData = getUser();
    setUser(userData);
    fetchFollowers();
    fetchFollowing();
    fetchSuggestions();
  }, [fetchFollowers, fetchFollowing, fetchSuggestions]);

  const handleFollow = async (userId: number) => {
    try {
      await followUser(userId);
      success('Successfully followed user!');
      // Refresh suggestions to get updated list
      fetchSuggestions();
    } catch (error: any) {
      console.error('Failed to follow user:', error);
      showError(error.response?.data?.detail || 'Failed to follow user');
    }
  };

  const handleUnfollow = async (userId: number) => {
    try {
      await unfollowUser(userId);
      success('Successfully unfollowed user');
    } catch (error: any) {
      console.error('Failed to unfollow user:', error);
      showError(error.response?.data?.detail || 'Failed to unfollow user');
    }
  };

  const handleMessage = async (userId: number) => {
    try {
      const room = await createDirectChat(userId);
      success('Chat started successfully!');
      router.push('/dashboard/messages');
    } catch (error: any) {
      console.error('Failed to create chat:', error);
      showError(error.response?.data?.detail || 'Failed to start chat');
    }
  };

  const handleGiveStar = async (userId: number) => {
    try {
      await api.post(`/api/auth/give-star/${userId}/`);
      success('Star given successfully!');
    } catch (error: any) {
      console.error('Failed to give star:', error);
      showError(error.response?.data?.detail || 'Failed to give star');
    }
  };

  const getCurrentList = () => {
    switch (activeTab) {
      case 'followers':
        return followers;
      case 'following':
        return following;
      case 'suggestions':
        return suggestions;
      default:
        return [];
    }
  };

  const filteredList = (getCurrentList() || []).filter(u =>
    `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="admin-page-container page-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-indigo-100 rounded-xl">
            <Users className="w-7 h-7 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Connections</h1>
            <p className="text-gray-600 mt-1">Manage your followers and following</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('suggestions')}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                activeTab === 'suggestions'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <UserPlus className="w-4 h-4 inline mr-2" />
              Suggestions
              {suggestions.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-white bg-opacity-20 rounded-full text-xs">
                  {suggestions.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('following')}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                activeTab === 'following'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Following
              {following.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs">
                  {following.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('followers')}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                activeTab === 'followers'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Followers
              {followers.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs">
                  {followers.length}
                </span>
              )}
            </button>
          </div>

          <button
            onClick={() => {
              fetchFollowers();
              fetchFollowing();
              fetchSuggestions();
            }}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search people..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Users Grid */}
      {loading && filteredList.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading connections...</p>
        </div>
      ) : filteredList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredList.map((person) => (
            <UserCard
              key={person.id}
              user={person}
              currentUserId={user?.id}
              isFollowing={isFollowing(person.id)}
              onFollow={handleFollow}
              onUnfollow={handleUnfollow}
              onMessage={handleMessage}
              onGiveStar={handleGiveStar}
              showActions={true}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {searchQuery ? 'No results found' : `No ${activeTab} yet`}
          </h2>
          <p className="text-gray-600">
            {searchQuery 
              ? 'Try adjusting your search' 
              : activeTab === 'suggestions'
              ? 'Connect with veterans to build your network'
              : `Start following veterans to see them here`
            }
          </p>
        </div>
      )}
    </div>
  );
}
