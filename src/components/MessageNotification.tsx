'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';

interface MessageNotificationProps {
  show: boolean;
  senderName: string;
  messagePreview: string;
  onClose: () => void;
  onClick?: () => void;
}

export default function MessageNotification({
  show,
  senderName,
  messagePreview,
  onClose,
  onClick
}: MessageNotificationProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: 100 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          className="fixed top-24 right-4 z-[9998] max-w-sm w-full pointer-events-auto"
        >
          <div
            onClick={onClick}
            className="bg-white border border-blue-200 rounded-2xl shadow-2xl shadow-blue-900/10 p-4 cursor-pointer hover:shadow-blue-900/20 transition-shadow"
          >
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-50 rounded-xl">
                <MessageCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-1">
                  <h4 className="text-sm font-bold text-gray-900 truncate">
                    {senderName}
                  </h4>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                    }}
                    className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors ml-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-600 line-clamp-2">{messagePreview}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
