import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/chat/online-users
 * Fetches the list of currently online users from the backend
 * 
 * Backend Logic:
 * - Users are considered online if their last_activity was within the last 5 minutes
 * - The backend endpoint checks: last_activity >= (current_time - 5 minutes)
 */
export async function GET(request: NextRequest) {
  try {
    const baseURL = process.env.NEXT_PUBLIC_API_URL;
    
    if (!baseURL) {
      console.error('[Online Users] NEXT_PUBLIC_API_URL is not configured');
      return NextResponse.json(
        { error: 'API URL not configured' },
        { status: 500 }
      );
    }

    // Get the auth token from cookies
    const authToken = request.cookies.get('auth-token')?.value;

    if (!authToken) {
      // Not authenticated - return empty list
      return NextResponse.json({
        online_users: []
      });
    }

    // Fetch online users from the Django backend
    // Try both possible endpoints (based on backend implementation)
    let response;
    try {
      // First try the direct endpoint
      response = await fetch(`${baseURL}/api/chat/online-users/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store', // Don't cache online status
      });
    } catch (directEndpointError) {
      // If direct endpoint fails, try the chat rooms endpoint
      try {
        response = await fetch(`${baseURL}/api/chat/rooms/online_users/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        });
      } catch (roomsEndpointError) {
        console.error('[Online Users] Both endpoints failed:', {
          direct: directEndpointError,
          rooms: roomsEndpointError
        });
        throw roomsEndpointError;
      }
    }

    if (!response.ok) {
      console.error('[Online Users] Backend returned error:', response.status);
      // Return empty list on error rather than failing completely
      return NextResponse.json({
        online_users: []
      });
    }

    const data = await response.json();
    
    // Backend should return either:
    // { online_users: [1, 2, 3] } or just [1, 2, 3]
    const onlineUsers = data.online_users || data || [];

    return NextResponse.json({
      online_users: onlineUsers
    });

  } catch (error) {
    console.error('[Online Users] Error fetching online users:', error);
    
    // Return empty list instead of error to gracefully degrade
    return NextResponse.json({
      online_users: []
    });
  }
}
