'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

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
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed top-20 right-6 z-[9998] max-w-sm w-full pointer-events-auto"
        >
          <motion.div
            onClick={onClick}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="bg-white border border-slate-200 rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
          >
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-slate-900 truncate">
                      {senderName}
                    </h4>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                    {messagePreview}
                  </p>
                </div>
                
                {/* Close button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Subtle bottom accent */}
            <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-b-xl" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
