import { useEffect, useRef } from 'react';
import { isAuthenticated } from '@/lib/auth';
import { chatService } from '@/services/api.service';

/**
 * useHeartbeat Hook
 * 
 * Sends periodic heartbeat requests to the backend to keep the user's
 * last_activity field updated. This ensures the user appears as "online"
 * in the chat system.
 * 
 * The backend considers users online if their last_activity is within
 * the last 5 minutes. We send heartbeats every 2 minutes to stay well
 * within this threshold.
 * 
 * Features:
 * - Only runs when user is authenticated
 * - Automatically pauses when tab is hidden (Page Visibility API)
 * - Sends immediate heartbeat on tab becoming visible again
 * - Cleans up interval on unmount
 * 
 * @param intervalMs - Heartbeat interval in milliseconds (default: 120000 = 2 minutes)
 */
export function useHeartbeat(intervalMs: number = 120000) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastHeartbeatRef = useRef<number>(0);

  const sendHeartbeat = async () => {
    if (!isAuthenticated()) {
      return;
    }

    try {
      await chatService.sendHeartbeat();
      lastHeartbeatRef.current = Date.now();
    } catch (error) {
      // Silently fail - heartbeat is not critical to app functionality
      console.warn('[Heartbeat] Error sending heartbeat:', error);
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      return;
    }

    // Send initial heartbeat immediately to mark user online
    sendHeartbeat();

    // Set up periodic heartbeat
    intervalRef.current = setInterval(() => {
      sendHeartbeat();
    }, intervalMs);

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Tab became visible - send immediate heartbeat if it's been a while
        const timeSinceLastHeartbeat = Date.now() - lastHeartbeatRef.current;
        if (timeSinceLastHeartbeat > intervalMs / 2) {
          sendHeartbeat();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [intervalMs]);

  return null;
}
