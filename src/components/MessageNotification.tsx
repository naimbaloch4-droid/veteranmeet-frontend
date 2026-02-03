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
          className="fixed top-24 right-6 z-[9998] max-w-sm w-full pointer-events-auto"
        >
          <motion.div
            onClick={onClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-gradient-to-br from-white to-blue-50/30 border-2 border-blue-300/50 rounded-2xl shadow-2xl shadow-blue-900/20 p-5 cursor-pointer hover:shadow-blue-900/30 transition-all backdrop-blur-sm relative overflow-hidden"
          >
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 hover:opacity-100 transition-opacity duration-300" />
            
            {/* Pulsing notification indicator */}
            <div className="absolute top-3 right-3 w-3 h-3">
              <span className="absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75 animate-ping"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
            </div>
            
            <div className="flex items-start space-x-4 relative z-10">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/30">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider rounded-full">
                    New Message
                  </span>
                </div>
                <h4 className="text-base font-extrabold text-gray-900 mb-1.5 truncate">
                  {senderName}
                </h4>
                <p className="text-sm text-gray-700 line-clamp-2 font-medium leading-relaxed">
                  {messagePreview}
                </p>
                <p className="text-[11px] text-blue-600 font-bold mt-2">
                  Click to view message →
                </p>
              </div>
            </div>
            
            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all z-20"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
