import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/chat/mark-offline
 * Marks the user as offline by setting their last_activity to a very old timestamp
 * 
 * This endpoint should be called when the user logs out to immediately show them
 * as offline in the chat system, rather than waiting for the 5-minute timeout.
 */
export async function POST(request: NextRequest) {
  try {
    const baseURL = process.env.NEXT_PUBLIC_API_URL;
    
    if (!baseURL) {
      console.error('[Mark Offline] NEXT_PUBLIC_API_URL is not configured');
      return NextResponse.json(
        { error: 'API URL not configured' },
        { status: 500 }
      );
    }

    // Get the auth token from cookies
    const authToken = request.cookies.get('auth-token')?.value;

    if (!authToken) {
      // User is not authenticated, silently succeed
      return NextResponse.json({
        success: true,
        message: 'Not authenticated, no action needed'
      });
    }

    // Call backend to mark user as offline
    // The backend should set last_activity to a very old timestamp (e.g., 1970-01-01)
    // or update a specific is_online flag
    try {
      const response = await fetch(`${baseURL}/api/chat/mark-offline/`, {
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
        // If the endpoint doesn't exist yet, try the heartbeat endpoint with an old timestamp
        if (response.status === 404) {
          console.warn('[Mark Offline] Backend endpoint not found, using fallback');
          // Try alternative: set last_activity to a very old date
          const fallbackResponse = await fetch(`${baseURL}/api/chat/heartbeat/`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              timestamp: '1970-01-01T00:00:00.000Z', // Very old timestamp
              offline: true
            }),
          });

          if (!fallbackResponse.ok && fallbackResponse.status !== 404) {
            console.error('[Mark Offline] Fallback also failed:', fallbackResponse.status);
          }
          
          return NextResponse.json({
            success: true,
            message: 'Used fallback method'
          });
        }

        console.error('[Mark Offline] Backend returned error:', response.status);
      }

      const data = response.ok ? await response.json() : {};
      
      return NextResponse.json({
        success: true,
        ...data
      });

    } catch (fetchError) {
      console.error('[Mark Offline] Network error:', fetchError);
      // Continue with logout even if marking offline fails
      return NextResponse.json({
        success: true,
        message: 'Marked offline (with errors)'
      });
    }

  } catch (error) {
    console.error('[Mark Offline] Error marking user offline:', error);
    
    // Don't fail the logout process even if this fails
    return NextResponse.json({
      success: true,
      message: 'Proceeding with logout despite errors'
    });
  }
}
