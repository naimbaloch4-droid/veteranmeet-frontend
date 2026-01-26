'use client';

import { useEffect, useState } from 'react';
import { Shield, Plus, Search, RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGroupStore } from '@/store/useGroupStore';
import GroupCard from '@/components/GroupCard';
import PostCard from '@/components/PostCard';
import { getUser } from '@/lib/auth';
import api from '@/lib/api';

export default function GroupsPage() {
  const {
    groups,
    myGroups,
    currentGroup,
    groupPosts,
    loading,
    fetchGroups,
    fetchMyGroups,
    createGroup,
    joinGroup,
    leaveGroup,
    deleteGroup,
    setCurrentGroup,
    createGroupPost
  } = useGroupStore();

  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    topic: 'General',
    privacy_level: 'public'
  });
  const [postForm, setPostForm] = useState({ content: '', image: null as File | null });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const userData = getUser();
    setUser(userData);
    fetchGroups();
    fetchMyGroups();
  }, [fetchGroups, fetchMyGroups]);

  const handleCreateGroup = async () => {
    setFormError('');
    
    if (!groupForm.name || !groupForm.description) {
      setFormError('Name and description are required');
      return;
    }

    try {
      await createGroup(groupForm);
      setGroupForm({ name: '', description: '', topic: 'General', privacy_level: 'public' });
      setShowCreateGroup(false);
      fetchGroups();
      fetchMyGroups();
    } catch (error: any) {
      console.error('Failed to create group:', error);
      setFormError(error.response?.data?.detail || 'Failed to create group');
    }
  };

  const handleCreatePost = async () => {
    if (!currentGroup || !postForm.content.trim()) return;

    try {
      const formData = new FormData();
      formData.append('content', postForm.content);
      formData.append('group', currentGroup.id.toString());
      if (postForm.image) formData.append('image', postForm.image);

      await createGroupPost(currentGroup.id, formData);
      setPostForm({ content: '', image: null });
      setShowCreatePost(false);
    } catch (error: any) {
      console.error('Failed to create post:', error);
      alert(error.response?.data?.detail || 'Failed to create post');
    }
  };

  const handleGiveStar = async (userId: number) => {
    try {
      await api.post(`/api/auth/give-star/${userId}/`);
      alert('Star given successfully!');
    } catch (error: any) {
      console.error('Failed to give star:', error);
      alert(error.response?.data?.detail || 'Failed to give star');
    }
  };

  const getCurrentGroups = () => activeTab === 'my' ? myGroups : groups;
  
  const filteredGroups = (getCurrentGroups() || []).filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const topics = ['General', 'PTSD Support', 'Career Transition', 'Health & Wellness', 'Benefits', 'Family', 'Education'];

  return (
    <div className="admin-page-container page-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <Shield className="w-7 h-7 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Support Groups</h1>
              <p className="text-gray-600 mt-1">Join specialized veteran support groups</p>
            </div>
          </div>
          
          {user?.is_veteran && !currentGroup && (
            <button
              onClick={() => setShowCreateGroup(true)}
              className="flex items-center px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Group
            </button>
          )}
        </div>
      </div>

      {currentGroup ? (
        /* Group Detail View */
        <div>
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => setCurrentGroup(null)}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <X className="w-5 h-5 mr-2" />
              Back to Groups
            </button>
            {currentGroup.is_member && (
              <button
                onClick={() => setShowCreatePost(true)}
                className="flex items-center px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Post
              </button>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentGroup.name}</h2>
            <p className="text-gray-600 mb-4">{currentGroup.description}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>{currentGroup.members_count || 0} members</span>
              <span>•</span>
              <span>{currentGroup.topic}</span>
              <span>•</span>
              <span>{currentGroup.privacy_level}</span>
            </div>
          </div>

          <div className="space-y-4">
            {(groupPosts || []).length > 0 ? (
              (groupPosts || []).map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={user?.id}
                  onGiveStar={handleGiveStar}
                  showActions={true}
                />
              ))
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts yet</h3>
                <p className="text-gray-600">Be the first to post in this group</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Groups List View */
        <>
          {/* Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                    activeTab === 'all'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Groups
                </button>
                <button
                  onClick={() => setActiveTab('my')}
                  className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                    activeTab === 'my'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  My Groups ({myGroups.length})
                </button>
              </div>

              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search groups..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              
              <button
                onClick={() => {
                  fetchGroups();
                  fetchMyGroups();
                }}
                disabled={loading}
                className="flex items-center px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Groups Grid */}
          {loading && filteredGroups.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading groups...</p>
            </div>
          ) : filteredGroups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGroups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  currentUserId={user?.id}
                  onJoin={joinGroup}
                  onLeave={leaveGroup}
                  onDelete={deleteGroup}
                  onView={setCurrentGroup}
                  showActions={true}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No groups found</h2>
              <p className="text-gray-600">
                {searchQuery ? 'Try adjusting your search' : 'Create the first support group'}
              </p>
            </div>
          )}
        </>
      )}

      {/* Create Group Modal */}
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
                <h3 className="text-xl font-bold text-gray-900 mb-4">Create Support Group</h3>

                {formError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                    {formError}
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
                      placeholder="Navy Veteran Technicians"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                    <textarea
                      value={groupForm.description}
                      onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="A group for those who served in technical roles..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Topic</label>
                      <select
                        value={groupForm.topic}
                        onChange={(e) => setGroupForm({ ...groupForm, topic: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        {topics.map(topic => (
                          <option key={topic} value={topic}>{topic}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Privacy</label>
                      <select
                        value={groupForm.privacy_level}
                        onChange={(e) => setGroupForm({ ...groupForm, privacy_level: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setShowCreateGroup(false);
                      setFormError('');
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

      {/* Create Post Modal */}
      <AnimatePresence>
        {showCreatePost && currentGroup && (
          <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full"
            >
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">New Group Post</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Content *</label>
                    <textarea
                      value={postForm.content}
                      onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
                      rows={6}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Share with the group..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPostForm({ ...postForm, image: e.target.files?.[0] || null })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setShowCreatePost(false);
                      setPostForm({ content: '', image: null });
                    }}
                    className="px-5 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreatePost}
                    className="px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium shadow-lg"
                  >
                    Post
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
