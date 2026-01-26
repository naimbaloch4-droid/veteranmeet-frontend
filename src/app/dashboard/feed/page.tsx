'use client';

import { useEffect, useState } from 'react';
import { MessageSquare, Plus, Filter, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePostStore } from '@/store/usePostStore';
import PostCard from '@/components/PostCard';
import api from '@/lib/api';
import { getUser } from '@/lib/auth';

export default function CommunityFeedPage() {
  const { feedPosts, loading, fetchFeedPosts, createPost, likePost, commentOnPost } = usePostStore();
  const [user, setUser] = useState<any>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [postForm, setPostForm] = useState({ title: '', content: '', image: null as File | null });
  const [formError, setFormError] = useState('');
  const [feedTab, setFeedTab] = useState<'following' | 'mine'>('following');
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [loadingMy, setLoadingMy] = useState(false);

  useEffect(() => {
    const userData = getUser();
    setUser(userData);
    fetchFeedPosts(1);

    // Pre-fetch my posts
    if (userData) {
      fetchMyPosts();
    }
  }, [fetchFeedPosts]);

  const fetchMyPosts = async () => {
    setLoadingMy(true);
    try {
      const response = await api.get('/api/posts/');
      const all = response.data.results || response.data || [];
      const userData = getUser();
      setMyPosts(all.filter((p: any) => p.author.id === userData?.id));
    } catch (err) {
      console.error('Failed to fetch my posts:', err);
    } finally {
      setLoadingMy(false);
    }
  };

  const handleCreatePost = async () => {
    setFormError('');

    if (!postForm.content.trim()) {
      setFormError('Content is required');
      return;
    }

    try {
      const formData = new FormData();
      if (postForm.title) formData.append('title', postForm.title);
      formData.append('content', postForm.content);
      if (postForm.image) formData.append('image', postForm.image);

      await createPost(formData);
      setPostForm({ title: '', content: '', image: null });
      setShowCreatePost(false);
      fetchFeedPosts(1); // Refresh feed
      fetchMyPosts(); // Refresh my posts
    } catch (error: any) {
      console.error('Failed to create post:', error);
      setFormError(error.response?.data?.detail || 'Failed to create post');
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

  const handleComment = async (postId: number, content: string) => {
    try {
      await commentOnPost(postId, content);
    } catch (error) {
      console.error('Failed to comment:', error);
    }
  };

  return (
    <div className="admin-page-container page-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <MessageSquare className="w-7 h-7 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Community Feed</h1>
              <div className="flex items-center space-x-4 mt-1">
                <button
                  onClick={() => setFeedTab('following')}
                  className={`text-sm font-semibold transition-colors ${feedTab === 'following' ? 'text-purple-600' : 'text-gray-500 hover:text-gray-900'
                    }`}
                >
                  Following
                </button>
                <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                <button
                  onClick={() => setFeedTab('mine')}
                  className={`text-sm font-semibold transition-colors ${feedTab === 'mine' ? 'text-purple-600' : 'text-gray-500 hover:text-gray-900'
                    }`}
                >
                  My Posts
                </button>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => {
                if (feedTab === 'following') fetchFeedPosts(1);
                else fetchMyPosts();
              }}
              disabled={loading || loadingMy}
              className="flex items-center px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${(loading || loadingMy) ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            {user?.is_veteran && (
              <button
                onClick={() => setShowCreatePost(true)}
                className="flex items-center px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Post
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto">
        {feedTab === 'following' ? (
          loading && (feedPosts || []).length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading your feed...</p>
            </div>
          ) : (feedPosts || []).length > 0 ? (
            <div className="space-y-4">
              {(feedPosts || []).map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={user?.id}
                  onLike={(postId) => likePost(postId)}
                  onComment={(postId, content) => {
                    if (content) handleComment(postId, content);
                  }}
                  onGiveStar={handleGiveStar}
                  showActions={true}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No posts yet</h2>
              <p className="text-gray-600 mb-4">
                Follow other veterans to see their posts in your feed
              </p>
              <button
                onClick={() => window.location.href = '/dashboard/connections'}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium"
              >
                Find People to Follow
              </button>
            </div>
          )
        ) : (
          loadingMy && (myPosts || []).length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading your posts...</p>
            </div>
          ) : (myPosts || []).length > 0 ? (
            <div className="space-y-4">
              {(myPosts || []).map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={user?.id}
                  onLike={(postId) => likePost(postId)}
                  onComment={(postId, content) => {
                    if (content) handleComment(postId, content);
                  }}
                  onGiveStar={handleGiveStar}
                  showActions={true}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">You haven't posted yet</h2>
              <p className="text-gray-600 mb-4">
                Share your thoughts or images with the community!
              </p>
              <button
                onClick={() => setShowCreatePost(true)}
                className="px-6 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-medium shadow-lg"
              >
                Create Your First Post
              </button>
            </div>
          )
        )}
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
                <h3 className="text-xl font-bold text-gray-900 mb-4">Create Post</h3>

                {formError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                    {formError}
                  </div>
                )}

                <div className="space-y-4">
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Image
                    </label>
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
                      setPostForm({ title: '', content: '', image: null });
                      setFormError('');
                    }}
                    className="px-5 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreatePost}
                    className="px-5 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-medium shadow-lg"
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
