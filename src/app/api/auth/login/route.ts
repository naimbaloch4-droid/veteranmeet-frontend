import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Forward login request to Django backend
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login/`,
      { email, password },
      { withCredentials: true }
    );

    const { access, refresh, user } = response.data;

    // Determine user role for routing
    const userRole = user.is_superuser || user.is_staff ? 'admin' : 'user';

    // Create response with user data
    const jsonResponse = NextResponse.json(
      { 
        success: true, 
        user,
        redirectTo: userRole === 'admin' ? '/admin/dashboard' : '/dashboard'
      },
      { status: 200 }
    );

    // Set auth-token cookie (NOT httpOnly so client can read it for Authorization header)
    jsonResponse.cookies.set('auth-token', access, {
      httpOnly: false, // Changed to false so client can read and add to Authorization header
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    jsonResponse.cookies.set('refresh-token', refresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    jsonResponse.cookies.set('user-role', userRole, {
      httpOnly: false, // Accessible to middleware
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    // Store user data in a separate cookie (not httpOnly so client can read)
    jsonResponse.cookies.set('user-data', JSON.stringify(user), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return jsonResponse;
  } catch (error: any) {
    console.error('Login API error:', error);
    
    // Handle different error scenarios
    if (error.response) {
      return NextResponse.json(
        { 
          success: false, 
          error: error.response.data?.detail || error.response.data?.error || 'Invalid credentials' 
        },
        { status: error.response.status }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Network error. Please try again.' },
      { status: 500 }
    );
  }
}
