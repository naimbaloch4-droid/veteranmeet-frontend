import { useEffect, useRef, useState } from 'react';

interface NotificationOptions {
  enableSound?: boolean;
  enableDesktopNotifications?: boolean;
  enableTabTitleNotifications?: boolean;
}

/**
 * useMessageNotifications Hook
 * 
 * Manages various notification features for new messages:
 * - Tab title updates with unread count
 * - Sound notifications (optional)
 * - Desktop notifications (optional)
 * - Auto-requests notification permissions
 */
export function useMessageNotifications(
  unreadCount: number,
  options: NotificationOptions = {}
) {
  // Read user preferences from localStorage
  const getSavedPreference = (key: string, defaultValue: boolean) => {
    if (typeof window === 'undefined') return defaultValue;
    const saved = localStorage.getItem(key);
    return saved !== null ? saved === 'true' : defaultValue;
  };

  const {
    enableSound = getSavedPreference('notification-sound', true),
    enableDesktopNotifications = getSavedPreference('notification-desktop', true),
    enableTabTitleNotifications = true,
  } = options;

  const prevUnreadCountRef = useRef(unreadCount);
  const originalTitleRef = useRef<string>('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // Initialize
  useEffect(() => {
    // Store original title
    if (typeof window !== 'undefined') {
      originalTitleRef.current = document.title;
    }

    // Request notification permission
    if (enableDesktopNotifications && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
      
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          setNotificationPermission(permission);
        });
      }
    }

    // Cleanup on unmount
    return () => {
      if (typeof window !== 'undefined' && originalTitleRef.current) {
        document.title = originalTitleRef.current;
      }
    };
  }, [enableDesktopNotifications]);

  // Update tab title with unread count
  useEffect(() => {
    if (!enableTabTitleNotifications || typeof window === 'undefined') return;

    if (unreadCount > 0) {
      document.title = `(${unreadCount}) ${originalTitleRef.current}`;
    } else {
      document.title = originalTitleRef.current;
    }
  }, [unreadCount, enableTabTitleNotifications]);

  // Handle new message (count increased)
  useEffect(() => {
    const hasNewMessage = unreadCount > prevUnreadCountRef.current && prevUnreadCountRef.current >= 0;
    prevUnreadCountRef.current = unreadCount;

    if (!hasNewMessage) return;

    // Play sound notification
    if (enableSound) {
      playNotificationSound();
    }

    // Show desktop notification
    if (enableDesktopNotifications && notificationPermission === 'granted') {
      showDesktopNotification(unreadCount);
    }
  }, [unreadCount, enableSound, enableDesktopNotifications, notificationPermission]);

  const playNotificationSound = () => {
    try {
      // Create audio element if it doesn't exist
      if (!audioRef.current) {
        audioRef.current = new Audio();
        // Using a data URL for a simple notification sound (short beep)
        // This is a very short, subtle notification sound
        audioRef.current.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2S76+efTgwOUqjj7rdmHgU7k9ryz3ksRMvyt2MdBjiR1/LMeSsGKHjJ8N6RQQsVYLjr7KpYFg1KoePwtmMcBjiR1/LMeSwGKHjJ8N6RQQsVYLjr7KpYFg1KoePwtmMcBjiR1/LMeSsGKHjJ8N6RQQsVYLjr7KpYFg1KoePwtmMcBjiR1/LMeSsGKHjJ8N6RQQsVYLjr7KpYFg1KoePwtmMcBjiR1/LMeSsGKHjJ8N6RQQsVYLjr7KpYFg1KoePwtmMcBjiR1/LMeSsGKHjJ8N6RQQsVYLjr7KpYFg1KoePwtmMcBjiR1/LMeSsGKHjJ8N6RQQsVYLjr7KpYFg1KoePw';
        audioRef.current.volume = 0.3; // Subtle volume
      }
      
      // Reset and play
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => {
        // Silently fail if audio play is blocked by browser
        console.debug('Audio notification blocked:', err);
      });
    } catch (error) {
      console.debug('Error playing notification sound:', error);
    }
  };

  const showDesktopNotification = (count: number) => {
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification('New Message', {
          body: `You have ${count} unread message${count > 1 ? 's' : ''}`,
          icon: '/favicon.ico', // You can customize this
          badge: '/favicon.ico',
          tag: 'veteran-hub-message', // Prevents duplicate notifications
          requireInteraction: false,
          silent: true, // We already play sound separately
        });

        // Auto-close after 4 seconds
        setTimeout(() => notification.close(), 4000);

        // Handle click
        notification.onclick = () => {
          window.focus();
          window.location.href = '/dashboard/messages';
          notification.close();
        };
      }
    } catch (error) {
      console.debug('Error showing desktop notification:', error);
    }
  };

  return {
    notificationPermission,
    requestPermission: () => {
      if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
          setNotificationPermission(permission);
        });
      }
    },
  };
}
