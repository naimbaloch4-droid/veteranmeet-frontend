'use client';

import { useState, useEffect } from 'react';
import { Bell, Volume2, VolumeX, Monitor, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationSettings({ isOpen, onClose }: NotificationSettingsProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [desktopEnabled, setDesktopEnabled] = useState(true);
  const [desktopPermission, setDesktopPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Load settings from localStorage
    const savedSound = localStorage.getItem('notification-sound');
    const savedDesktop = localStorage.getItem('notification-desktop');
    
    if (savedSound !== null) setSoundEnabled(savedSound === 'true');
    if (savedDesktop !== null) setDesktopEnabled(savedDesktop === 'true');

    // Check desktop notification permission
    if ('Notification' in window) {
      setDesktopPermission(Notification.permission);
    }
  }, []);

  const handleSoundToggle = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem('notification-sound', String(newValue));
  };

  const handleDesktopToggle = async () => {
    if (!desktopEnabled && 'Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      setDesktopPermission(permission);
      
      if (permission === 'granted') {
        setDesktopEnabled(true);
        localStorage.setItem('notification-desktop', 'true');
      }
    } else {
      const newValue = !desktopEnabled;
      setDesktopEnabled(newValue);
      localStorage.setItem('notification-desktop', String(newValue));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-50 rounded-xl">
                    <Bell className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Notification Settings</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Manage your message alerts</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Settings */}
              <div className="p-6 space-y-4">
                {/* Sound Notifications */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    {soundEnabled ? (
                      <Volume2 className="w-5 h-5 text-gray-600" />
                    ) : (
                      <VolumeX className="w-5 h-5 text-gray-400" />
                    )}
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Sound Alerts</p>
                      <p className="text-xs text-gray-500 mt-0.5">Play sound for new messages</p>
                    </div>
                  </div>
                  <button
                    onClick={handleSoundToggle}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      soundEnabled ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <motion.div
                      animate={{ x: soundEnabled ? 24 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg"
                    />
                  </button>
                </div>

                {/* Desktop Notifications */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <Monitor className={`w-5 h-5 ${desktopEnabled ? 'text-gray-600' : 'text-gray-400'}`} />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Desktop Notifications</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {desktopPermission === 'denied'
                          ? 'Blocked by browser'
                          : 'Show notifications on desktop'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleDesktopToggle}
                    disabled={desktopPermission === 'denied'}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      desktopEnabled && desktopPermission !== 'denied' ? 'bg-blue-600' : 'bg-gray-300'
                    } ${desktopPermission === 'denied' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <motion.div
                      animate={{ x: desktopEnabled && desktopPermission !== 'denied' ? 24 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg"
                    />
                  </button>
                </div>

                {/* Info */}
                {desktopPermission === 'denied' && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <p className="text-xs text-yellow-800">
                      <strong>Note:</strong> Desktop notifications are blocked. Enable them in your browser settings.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 pb-6">
                <button
                  onClick={onClose}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
