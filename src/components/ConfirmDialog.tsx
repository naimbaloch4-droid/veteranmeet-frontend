'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { useConfirmStore } from '@/store/useConfirmStore';

const typeIcons = {
  danger: AlertTriangle,
  warning: AlertCircle,
  info: Info
};

const typeColors = {
  danger: 'text-red-600',
  warning: 'text-yellow-600',
  info: 'text-blue-600'
};

const buttonColors = {
  danger: 'bg-red-600 hover:bg-red-700',
  warning: 'bg-yellow-600 hover:bg-yellow-700',
  info: 'bg-blue-600 hover:bg-blue-700'
};

export default function ConfirmDialog() {
  const { dialog, close } = useConfirmStore();

  if (!dialog?.isOpen) return null;

  const Icon = typeIcons[dialog.type || 'info'];

  const handleConfirm = () => {
    dialog.onConfirm();
    close();
  };

  const handleCancel = () => {
    if (dialog.onCancel) dialog.onCancel();
    close();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black bg-opacity-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        >
          <div className="p-6">
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-full bg-gray-100`}>
                <Icon className={`w-6 h-6 ${typeColors[dialog.type || 'info']}`} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{dialog.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{dialog.message}</p>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-3 px-6 pb-6">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition-colors"
            >
              {dialog.cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className={`flex-1 px-4 py-2.5 text-white rounded-xl font-medium transition-colors shadow-lg ${
                buttonColors[dialog.type || 'info']
              }`}
            >
              {dialog.confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
