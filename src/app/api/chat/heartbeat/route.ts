import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/chat/heartbeat
 * Updates the user's last_activity timestamp on the backend
 * 
 * This endpoint should be called periodically (every 1-2 minutes) to keep
 * the user's online status active. The backend uses last_activity to determine
 * if a user is online (within last 5 minutes).
 */
export async function POST(request: NextRequest) {
  try {
    const baseURL = process.env.NEXT_PUBLIC_API_URL;
    
    if (!baseURL) {
      return NextResponse.json(
        { error: 'API URL not configured' },
        { status: 500 }
      );
    }

    // Get the auth token from cookies
    const authToken = request.cookies.get('auth-token')?.value;

    if (!authToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Send heartbeat to backend to update last_activity
    // The backend should have an endpoint that updates the user's last_activity field
    const response = await fetch(`${baseURL}/api/chat/heartbeat/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timestamp: new Date().toISOString()
      }),
    });

    if (!response.ok) {
      // If the heartbeat endpoint doesn't exist yet, we can still return success
      // The frontend will continue working without breaking
      if (response.status === 404) {
        return NextResponse.json({
          success: true,
          message: 'Heartbeat endpoint not implemented on backend yet'
        });
      }

      console.error('[Heartbeat] Backend returned error:', response.status);
      return NextResponse.json(
        { error: 'Failed to update activity' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      ...data
    });

  } catch (error) {
    console.error('[Heartbeat] Error updating activity:', error);
    
    // Silently fail - heartbeat is not critical
    return NextResponse.json({
      success: false,
      error: 'Failed to send heartbeat'
    }, { status: 500 });
  }
}
