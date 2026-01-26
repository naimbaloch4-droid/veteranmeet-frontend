'use client';

import { motion } from 'framer-motion';
import { Shield, Users, Lock, Globe, Trash2 } from 'lucide-react';
import { SupportGroup } from '@/store/useGroupStore';
import { getInitials, formatTimeAgo } from '@/utils/veteranFormatters';

interface GroupCardProps {
  group: SupportGroup;
  onJoin?: (groupId: number) => void;
  onLeave?: (groupId: number) => void;
  onDelete?: (groupId: number) => void;
  onView?: (group: SupportGroup) => void;
  currentUserId?: number;
  showActions?: boolean;
}

export default function GroupCard({
  group,
  onJoin,
  onLeave,
  onDelete,
  onView,
  currentUserId,
  showActions = true
}: GroupCardProps) {
  const isAdmin = currentUserId === group.admin.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md transition-all cursor-pointer"
      onClick={() => onView && onView(group)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3 flex-1">
          <div className="p-2 bg-green-100 rounded-xl">
            <Shield className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900 mb-1">{group.name}</h3>
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                {group.topic}
              </span>
              <span className="flex items-center text-xs text-gray-500">
                {group.privacy_level === 'private' ? (
                  <>
                    <Lock className="w-3 h-3 mr-1" />
                    Private
                  </>
                ) : (
                  <>
                    <Globe className="w-3 h-3 mr-1" />
                    Public
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
        {isAdmin && onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(group.id);
            }}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{group.description}</p>

      {/* Stats */}
      <div className="flex items-center space-x-4 mb-3 text-xs text-gray-500">
        <div className="flex items-center">
          <Users className="w-3.5 h-3.5 mr-1" />
          <span>{group.members_count || 0} members</span>
        </div>
        <span>•</span>
        <span>Created {formatTimeAgo(group.created_at)}</span>
      </div>

      {/* Admin */}
      <div className="flex items-center space-x-2 mb-3 pb-3 border-b border-gray-100">
        <div className="w-6 h-6 bg-gray-800 rounded-lg flex items-center justify-center">
          <span className="text-xs font-medium text-gray-100">
            {getInitials(group.admin.first_name, group.admin.last_name, group.admin.username)}
          </span>
        </div>
        <div>
          <p className="text-xs text-gray-500">Admin</p>
          <p className="text-xs font-medium text-gray-900">
            {group.admin.first_name} {group.admin.last_name}
          </p>
        </div>
      </div>

      {/* Actions */}
      {showActions && !isAdmin && (
        <div onClick={(e) => e.stopPropagation()}>
          {group.is_member ? (
            <button
              onClick={() => onLeave && onLeave(group.id)}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm transition-colors"
            >
              Leave Group
            </button>
          ) : (
            <button
              onClick={() => onJoin && onJoin(group.id)}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm transition-colors"
            >
              {group.privacy_level === 'private' ? 'Request to Join' : 'Join Group'}
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
