'use client';

import { motion } from 'framer-motion';
import { UserCircle, MessageCircle, Star } from 'lucide-react';
import { User } from '@/store/usePostStore';
import { getInitials, getVeteranCategoryFromStars, getVeteranCategoryColor } from '@/utils/veteranFormatters';

interface UserCardProps {
  user: User;
  isFollowing?: boolean;
  onFollow?: (userId: number) => void;
  onUnfollow?: (userId: number) => void;
  onMessage?: (userId: number) => void;
  onGiveStar?: (userId: number) => void;
  currentUserId?: number;
  showActions?: boolean;
}

export default function UserCard({
  user,
  isFollowing,
  onFollow,
  onUnfollow,
  onMessage,
  onGiveStar,
  currentUserId,
  showActions = true
}: UserCardProps) {
  const veteranCategory = user.veteran_category || getVeteranCategoryFromStars(user.star_rating || 0);
  const isSelf = currentUserId === user.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md transition-shadow"
    >
      {/* User Info */}
      <div className="flex items-start space-x-3 mb-4">
        <div className="w-14 h-14 bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
          <span className="text-base font-medium text-gray-100">
            {getInitials(user.first_name, user.last_name, user.username)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900">
            {user.first_name} {user.last_name}
          </h3>
          <p className="text-sm text-gray-500">@{user.username}</p>
          
          {user.is_veteran && (
            <div className="mt-2 flex items-center space-x-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-lg">
                Veteran
              </span>
              {veteranCategory && (
                <span className={`text-xs font-semibold ${getVeteranCategoryColor(veteranCategory)}`}>
                  {veteranCategory}
                </span>
              )}
            </div>
          )}
          
          {user.star_rating !== undefined && (
            <div className="mt-2 flex items-center text-xs text-gray-600">
              <Star className="w-3.5 h-3.5 mr-1 text-yellow-600 fill-current" />
              <span>{user.star_rating.toLocaleString()} stars</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      {showActions && !isSelf && (
        <div className="flex space-x-2">
          {isFollowing ? (
            <button
              onClick={() => onUnfollow && onUnfollow(user.id)}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm transition-colors"
            >
              Following
            </button>
          ) : (
            <button
              onClick={() => onFollow && onFollow(user.id)}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors"
            >
              Follow
            </button>
          )}
          
          {onMessage && (
            <button
              onClick={() => onMessage(user.id)}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
          )}
          
          {onGiveStar && user.is_veteran && (
            <button
              onClick={() => onGiveStar(user.id)}
              className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
            >
              <Star className="w-4 h-4 fill-current" />
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
