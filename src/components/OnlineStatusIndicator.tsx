'use client';

import { motion } from 'framer-motion';

interface OnlineStatusIndicatorProps {
  isOnline: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export default function OnlineStatusIndicator({
  isOnline,
  size = 'md',
  showLabel = false,
  className = ''
}: OnlineStatusIndicatorProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3'
  };

  const dotSize = sizeClasses[size];

  return (
    <div className={`flex items-center space-x-1.5 ${className}`}>
      <div className="relative">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`${dotSize} rounded-full ${
            isOnline ? 'bg-green-500' : 'bg-gray-300'
          } shadow-sm`}
        />
        {isOnline && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0.7 }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.7, 0, 0.7]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            className={`absolute inset-0 ${dotSize} rounded-full bg-green-400`}
          />
        )}
      </div>
      {showLabel && (
        <span
          className={`text-[10px] font-bold uppercase tracking-wider ${
            isOnline ? 'text-green-600' : 'text-gray-400'
          }`}
        >
          {isOnline ? 'Online' : 'Offline'}
        </span>
      )}
    </div>
  );
}
