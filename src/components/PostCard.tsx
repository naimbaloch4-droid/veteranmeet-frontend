'use client';

import { motion } from 'framer-motion';
import { Heart, MessageSquare, Share2, Star, Trash2, MoreVertical } from 'lucide-react';
import { Post } from '@/store/usePostStore';
import { getInitials, formatTimeAgo } from '@/utils/veteranFormatters';
import { useState } from 'react';

interface PostCardProps {
  post: Post;
  onLike?: (postId: number) => void;
  onComment?: (postId: number, content: string) => void;
  onDelete?: (postId: number) => void;
  onGiveStar?: (userId: number) => void;
  currentUserId?: number;
  showActions?: boolean;
}

export default function PostCard({
  post,
  onLike,
  onComment,
  onDelete,
  onGiveStar,
  currentUserId,
  showActions = true
}: PostCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showCommentBox, setShowCommentBox] = useState(false);

  const handleLike = () => {
    if (onLike) onLike(post.id);
  };

  const handleComment = () => {
    if (commentText.trim() && onComment) {
      onComment(post.id, commentText);
      setCommentText('');
      setShowCommentBox(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="flex items-start space-x-3 mb-4">
        <div className="w-11 h-11 bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
          <span className="text-sm font-medium text-gray-100">
            {getInitials(post.author.first_name, post.author.last_name, post.author.username)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {post.author.first_name} {post.author.last_name}
              </p>
              <p className="text-xs text-gray-500">
                {formatTimeAgo(post.created_at)}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {showActions && post.author.id !== currentUserId && onGiveStar && (
                <button
                  onClick={() => onGiveStar(post.author.id)}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors text-xs font-medium"
                >
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>Give Star</span>
                </button>
              )}
              {showActions && post.author.id === currentUserId && onDelete && (
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {showMenu && (
                    <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-100 z-10">
                      <button
                        onClick={() => {
                          onDelete(post.id);
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-xl flex items-center"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Post
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {post.title && (
        <h3 className="text-base font-semibold text-gray-900 mb-2">{post.title}</h3>
      )}
      <p className="text-sm text-gray-700 mb-3 leading-relaxed whitespace-pre-wrap">{post.content}</p>

      {/* Image */}
      {post.image && (
        <img
          src={post.image}
          alt="Post"
          className="w-full rounded-lg mb-3 border border-gray-200 object-cover max-h-96"
        />
      )}

      {/* Actions */}
      {showActions && (
        <>
          <div className="flex items-center space-x-4 pt-3 border-t border-gray-100">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${post.is_liked
                ? 'text-red-600 bg-red-50'
                : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              <Heart className={`w-4 h-4 ${post.is_liked ? 'fill-current' : ''}`} />
              <span className="text-sm font-medium">{post.likes_count || 0}</span>
            </button>
            <button
              onClick={() => setShowCommentBox(!showCommentBox)}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm font-medium">{post.comments_count || 0}</span>
            </button>
            <button className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
              <Share2 className="w-4 h-4" />
              <span className="text-sm font-medium">Share</span>
            </button>
          </div>

          {/* Comment Box */}
          {showCommentBox && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleComment()}
                  placeholder="Write a comment..."
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                <button
                  onClick={handleComment}
                  disabled={!commentText.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                >
                  Post
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
