'use client';

import { motion } from 'framer-motion';

interface TypingIndicatorProps {
  username?: string;
  className?: string;
}

export default function TypingIndicator({ username, className = '' }: TypingIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className={`flex items-center space-x-2 text-sm text-gray-500 ${className}`}
    >
      <div className="flex space-x-1">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="w-2 h-2 bg-gray-400 rounded-full"
            animate={{
              y: [0, -8, 0],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: index * 0.15,
              ease: 'easeInOut'
            }}
          />
        ))}
      </div>
      <span className="text-xs font-medium italic">
        {username ? `${username} is typing...` : 'Typing...'}
      </span>
    </motion.div>
  );
}
