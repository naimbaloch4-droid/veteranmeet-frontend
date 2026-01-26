'use client';

import { motion } from 'framer-motion';
import { Calendar, MapPin, Users, Star, Clock, Trash2 } from 'lucide-react';
import { Event } from '@/store/useEventStore';
import { formatDateTime, getInitials } from '@/utils/veteranFormatters';

interface EventCardProps {
  event: Event;
  onJoin?: (eventId: number) => void;
  onLeave?: (eventId: number) => void;
  onDelete?: (eventId: number) => void;
  currentUserId?: number;
  showActions?: boolean;
}

export default function EventCard({
  event,
  onJoin,
  onLeave,
  onDelete,
  currentUserId,
  showActions = true
}: EventCardProps) {
  const isOrganizer = currentUserId === event.organizer.id;
  const isFull = !!(event.max_participants && event.participants_count && 
                 event.participants_count >= event.max_participants);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            {event.event_type && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-lg">
                {event.event_type}
              </span>
            )}
            {event.star_points && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-lg flex items-center">
                <Star className="w-3 h-3 mr-1 fill-current" />
                {event.star_points} stars
              </span>
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{event.title}</h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">{event.description}</p>
        </div>
        {isOrganizer && onDelete && (
          <button
            onClick={() => onDelete(event.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-700">
          <Clock className="w-4 h-4 mr-2 text-blue-600 flex-shrink-0" />
          <span>{formatDateTime(event.date_time)}</span>
        </div>
        <div className="flex items-center text-sm text-gray-700">
          <MapPin className="w-4 h-4 mr-2 text-red-600 flex-shrink-0" />
          <span>{event.location}</span>
        </div>
        <div className="flex items-center text-sm text-gray-700">
          <Users className="w-4 h-4 mr-2 text-green-600 flex-shrink-0" />
          <span>
            {event.participants_count || 0}
            {event.max_participants && ` / ${event.max_participants}`} participants
          </span>
        </div>
      </div>

      {/* Organizer */}
      <div className="flex items-center space-x-2 mb-4 pb-4 border-b border-gray-100">
        <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
          <span className="text-xs font-medium text-gray-100">
            {getInitials(event.organizer.first_name, event.organizer.last_name, event.organizer.username)}
          </span>
        </div>
        <div>
          <p className="text-xs text-gray-500">Organized by</p>
          <p className="text-sm font-medium text-gray-900">
            {event.organizer.first_name} {event.organizer.last_name}
          </p>
        </div>
      </div>

      {/* Actions */}
      {showActions && !isOrganizer && (
        <>
          {event.is_joined ? (
            <button
              onClick={() => onLeave && onLeave(event.id)}
              className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition-colors"
            >
              Leave Event
            </button>
          ) : (
            <button
              onClick={() => onJoin && onJoin(event.id)}
              disabled={isFull}
              className={`w-full px-4 py-2.5 rounded-xl font-medium transition-colors ${
                isFull
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isFull ? 'Event Full' : 'Join Event'}
            </button>
          )}
        </>
      )}
    </motion.div>
  );
}
