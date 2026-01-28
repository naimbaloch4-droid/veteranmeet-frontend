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

export const logout = async (): Promise<void> => {
  if (typeof window === 'undefined') return;
  
  try {
    // First, mark user as offline in chat system
    // This ensures they immediately appear offline to other users
    try {
      await fetch('/api/chat/mark-offline', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
    } catch (offlineError) {
      // Don't block logout if marking offline fails
      console.warn('Failed to mark user as offline:', offlineError);
    }

    // Call logout API to clear httpOnly cookies
    await fetch('/api/auth/logout', { 
      method: 'POST',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Logout API error:', error);
  }
  
  // Clear ALL storage
  localStorage.clear();
  sessionStorage.clear();
  
  // Clear all cookies (client-side accessible ones)
  document.cookie.split(";").forEach((c) => {
    document.cookie = c
      .replace(/^ +/, "")
      .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });
  
  // Force redirect with cache busting to prevent back button issues
  const timestamp = Date.now();
  window.location.href = `/login?logout=${timestamp}`;
};
