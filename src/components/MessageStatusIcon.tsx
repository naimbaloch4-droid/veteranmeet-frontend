'use client';

import { Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'seen' | 'failed';

interface MessageStatusIconProps {
  status: MessageStatus;
  className?: string;
}

export default function MessageStatusIcon({ status, className = '' }: MessageStatusIconProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'sending':
        return {
          Icon: Clock,
          color: 'text-gray-400',
          animate: true
        };
      case 'sent':
        return {
          Icon: Check,
          color: 'text-gray-400',
          animate: false
        };
      case 'delivered':
        return {
          Icon: CheckCheck,
          color: 'text-gray-400',
          animate: false
        };
      case 'seen':
        return {
          Icon: CheckCheck,
          color: 'text-blue-500',
          animate: false
        };
      case 'failed':
        return {
          Icon: AlertCircle,
          color: 'text-red-500',
          animate: false
        };
      default:
        return {
          Icon: Check,
          color: 'text-gray-400',
          animate: false
        };
    }
  };

  const { Icon, color, animate } = getStatusConfig();

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={className}
    >
      {animate ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Icon className={`w-3.5 h-3.5 ${color}`} />
        </motion.div>
      ) : (
        <Icon className={`w-3.5 h-3.5 ${color}`} />
      )}
    </motion.div>
  );
}
