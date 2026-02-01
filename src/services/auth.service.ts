/**
 * Enhanced Authentication Service
 * 
 * Handles authentication with proper online/offline state management
 */

import { chatService } from './api.service';

// Helper to get cookie value by name (client-side)
const getCookie = (name: string): string | null => {
  if (typeof window === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  // Check if user-role cookie exists (since auth-token is httpOnly and not accessible)
  // We use user-role as a proxy for authentication status
  const userRole = getCookie('user-role');
  const userData = getCookie('user-data');
  return !!(userRole && userData);
};

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  // Tokens are now in httpOnly cookies, not accessible via JS
  // This function is kept for backward compatibility
  return getCookie('auth-token');
};

export const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  // Refresh token is in httpOnly cookie, not accessible via JS
  return getCookie('refresh-token');
};

export const getUser = (): any => {
  if (typeof window === 'undefined') return null;
  
  // Try to get from cookie first
  const userCookie = getCookie('user-data');
  if (userCookie) {
    try {
      return JSON.parse(decodeURIComponent(userCookie));
    } catch (e) {
      console.error('Failed to parse user cookie:', e);
    }
  }
  
  // Fall back to localStorage
  const userLocal = localStorage.getItem('user');
  return userLocal ? JSON.parse(userLocal) : null;
};

export const getUserRole = (): string | null => {
  if (typeof window === 'undefined') return null;
  return getCookie('user-role');
};

export const setUser = (user: any): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('user', JSON.stringify(user));
};

/**
 * Clear all user data and state
 * This ensures no stale data persists when logging out or switching users
 */
const clearAllUserData = () => {
  // Clear ALL storage
  localStorage.clear();
  sessionStorage.clear();
  
  // Clear notification tracking
  sessionStorage.removeItem('lastNotification');
  
  // Clear all cookies (client-side accessible ones)
  document.cookie.split(";").forEach((c) => {
    document.cookie = c
      .replace(/^ +/, "")
      .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });
};

/**
 * Enhanced logout with proper state cleanup
 * CRITICAL: Ensures user appears offline immediately
 */
export const logout = async (): Promise<void> => {
  if (typeof window === 'undefined') return;
  
  try {
    // STEP 1: Mark user as offline IMMEDIATELY
    // This ensures they appear offline to other users right away
    try {
      await chatService.markOffline();
      console.log('[Auth] User marked offline successfully');
    } catch (offlineError) {
      // Don't block logout if marking offline fails
      console.warn('[Auth] Failed to mark user as offline:', offlineError);
    }

    // STEP 2: Call logout API to clear httpOnly cookies
    await fetch('/api/auth/logout', { 
      method: 'POST',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('[Auth] Logout API error:', error);
  }
  
  // STEP 3: Clear ALL local data
  clearAllUserData();
  
  // STEP 4: Force redirect with cache busting to prevent back button issues
  const timestamp = Date.now();
  window.location.href = `/login?logout=${timestamp}`;
};

/**
 * Enhanced login with online presence activation
 */
export const handleLoginSuccess = async (userData: any, redirectPath: string) => {
  if (typeof window === 'undefined') return;
  
  // Store user data
  setUser(userData);
  
  // IMPORTANT: Send immediate heartbeat to mark user as online
  // This happens before redirect so user appears online immediately
  try {
    await chatService.sendHeartbeat();
    console.log('[Auth] User marked online via heartbeat');
  } catch (error) {
    console.warn('[Auth] Failed to send initial heartbeat:', error);
    // Don't block login if heartbeat fails
  }
  
  // Redirect to dashboard
  window.location.href = redirectPath;
};

/**
 * Session validation - checks if user session is still valid
 * Call this on app mount or after suspicious activity
 */
export const validateSession = async (): Promise<boolean> => {
  if (!isAuthenticated()) return false;
  
  try {
    // Try to make a simple authenticated request
    await chatService.sendHeartbeat();
    return true;
  } catch (error: any) {
    // If we get 401, session is invalid
    if (error.response?.status === 401) {
      console.warn('[Auth] Session invalid, logging out');
      await logout();
      return false;
    }
    // Other errors might be network issues, don't logout
    return true;
  }
};
