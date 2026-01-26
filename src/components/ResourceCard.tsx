'use client';

import { motion } from 'framer-motion';
import { BookOpen, ExternalLink, Phone, Trash2 } from 'lucide-react';
import { Resource } from '@/store/useResourceStore';
import { formatTimeAgo } from '@/utils/veteranFormatters';

interface ResourceCardProps {
  resource: Resource;
  onDelete?: (resourceId: number) => void;
  currentUserId?: number;
  showActions?: boolean;
}

export default function ResourceCard({
  resource,
  onDelete,
  currentUserId,
  showActions = true
}: ResourceCardProps) {
  const canDelete = currentUserId === resource.submitted_by?.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3 flex-1">
          <div className="p-2 bg-orange-100 rounded-xl flex-shrink-0">
            <BookOpen className="w-5 h-5 text-orange-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900 mb-1">{resource.title}</h3>
            {resource.category_name && (
              <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded mb-2">
                {resource.category_name}
              </span>
            )}
          </div>
        </div>
        {canDelete && onDelete && showActions && (
          <button
            onClick={() => onDelete(resource.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-3 leading-relaxed">{resource.description}</p>

      {/* Contact Info */}
      {resource.contact_info && (
        <div className="flex items-start space-x-2 mb-3 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
          <Phone className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <span>{resource.contact_info}</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          {resource.submitted_by && (
            <span>
              Submitted by {resource.submitted_by.first_name} {resource.submitted_by.last_name}
            </span>
          )}
          {resource.submitted_by && resource.created_at && <span className="mx-1">•</span>}
          {resource.created_at && <span>{formatTimeAgo(resource.created_at)}</span>}
        </div>
        
        {resource.url && (
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium"
          >
            <span>View Resource</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </motion.div>
  );
}
