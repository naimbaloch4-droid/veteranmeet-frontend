'use client';

import { useState, useEffect } from 'react';
import { getUser, getUserRole, isAuthenticated } from '@/lib/auth';
import { Shield, CheckCircle, XCircle, AlertCircle, Cookie } from 'lucide-react';

export default function TestAuthPage() {
  const [authStatus, setAuthStatus] = useState({
    isAuthenticated: false,
    user: null as any,
    role: null as string | null,
    cookies: [] as { name: string; value: string }[],
  });

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    const authenticated = isAuthenticated();
    const user = getUser();
    const role = getUserRole();
    
    // Get cookies (only non-httpOnly ones)
    const cookies = document.cookie.split(';').map(cookie => {
      const [name, value] = cookie.trim().split('=');
      return { name, value };
    });

    setAuthStatus({
      isAuthenticated: authenticated,
      user,
      role,
      cookies,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <Shield className="w-10 h-10 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Authentication Test Page</h1>
              <p className="text-gray-600">Debug your authentication status</p>
            </div>
          </div>

          {/* Auth Status */}
          <div className="space-y-6">
            {/* Is Authenticated */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Authentication Status</h2>
                <button
                  onClick={checkAuthStatus}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Refresh
                </button>
              </div>
              
              <div className="flex items-center gap-3">
                {authStatus.isAuthenticated ? (
                  <>
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <span className="text-green-700 font-medium">Authenticated</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-6 h-6 text-red-600" />
                    <span className="text-red-700 font-medium">Not Authenticated</span>
                  </>
                )}
              </div>
            </div>

            {/* User Role */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">User Role</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-700">
                    Role: <strong className="text-gray-900">{authStatus.role || 'None'}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* User Data */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">User Data</h2>
              {authStatus.user ? (
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Username</p>
                      <p className="font-medium text-gray-900">{authStatus.user.username}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium text-gray-900">{authStatus.user.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-medium text-gray-900">
                        {authStatus.user.first_name} {authStatus.user.last_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Veteran Status</p>
                      <p className="font-medium text-gray-900">
                        {authStatus.user.is_veteran ? 'Yes ✓' : 'No'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Staff</p>
                      <p className="font-medium text-gray-900">
                        {authStatus.user.is_staff ? 'Yes ✓' : 'No'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Superuser</p>
                      <p className="font-medium text-gray-900">
                        {authStatus.user.is_superuser ? 'Yes ✓' : 'No'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700">No user data found</p>
                </div>
              )}
            </div>

            {/* Cookies */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Cookie className="w-5 h-5 text-gray-700" />
                <h2 className="text-xl font-semibold text-gray-900">Cookies (Non-HttpOnly)</h2>
              </div>
              {authStatus.cookies.length > 0 ? (
                <div className="space-y-2">
                  {authStatus.cookies.map((cookie, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3 font-mono text-sm">
                      <span className="text-blue-600">{cookie.name}</span>
                      <span className="text-gray-500"> = </span>
                      <span className="text-gray-700 break-all">{cookie.value}</span>
                    </div>
                  ))}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> httpOnly cookies (auth-token, refresh-token) won't appear here for security reasons.
                      Check DevTools → Application → Cookies to see them.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-600">No cookies found</p>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Testing Instructions</h3>
              <ol className="list-decimal list-inside space-y-2 text-blue-800">
                <li>Login to your account</li>
                <li>Return to this page</li>
                <li>Verify authentication status shows "Authenticated"</li>
                <li>Check user role matches your account type</li>
                <li>Verify user data is displayed correctly</li>
                <li>Open DevTools → Application → Cookies to see httpOnly cookies</li>
                <li>Try accessing protected routes to test middleware</li>
              </ol>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-4">
              <a
                href="/login"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Go to Login
              </a>
              <a
                href="/dashboard"
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Go to Dashboard
              </a>
              <a
                href="/admin/dashboard"
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                Go to Admin
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
