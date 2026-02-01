/**
 * Legacy auth.ts - Kept for backward compatibility
 * All new code should use src/services/auth.service.ts
 */

export {
  isAuthenticated,
  getToken,
  getRefreshToken,
  getUser,
  getUserRole,
  setUser,
  logout,
  handleLoginSuccess,
  validateSession
} from '@/services/auth.service';
