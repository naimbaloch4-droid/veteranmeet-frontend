import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get token and user role from cookies
  const token = request.cookies.get('auth-token')?.value;
  const userRole = request.cookies.get('user-role')?.value;
  const path = request.nextUrl.pathname;

  // Public routes that don't need auth
  const publicRoutes = ['/login', '/register', '/test-auth', '/test-layout'];
  
  // If trying to access protected route without token
  if (!publicRoutes.includes(path) && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If already logged in and trying to access login/register
  if (token && publicRoutes.includes(path)) {
    // Redirect based on user role
    const redirectPath = userRole === 'admin' ? '/admin/dashboard' : '/dashboard';
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  // Prevent non-admin users from accessing admin routes
  if (path.startsWith('/admin') && token && userRole !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// Configure which routes use middleware
export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/user/:path*',
    '/veteran/:path*',
    '/login',
    '/register',
  ],
};