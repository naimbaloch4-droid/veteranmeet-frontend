# Offline Status on Logout Implementation

## Overview
When a user logs out, they are now immediately marked as **offline** in the chat system, instead of appearing online for up to 5 minutes.

## How It Works

### Before (Old Behavior)
1. User clicks logout
2. Auth tokens are cleared
3. User redirects to login page
4. ⚠️ **Problem:** User still appears online for 5 minutes (until `last_activity` timeout expires)

### After (New Behavior)
1. User clicks logout
2. ✅ **New:** System marks user as offline immediately
3. Auth tokens are cleared
4. User redirects to login page
5. ✅ **Result:** User appears offline to other users immediately

## Implementation Details

### Frontend Changes

#### 1. New API Route: `/api/chat/mark-offline`
- **File:** `src/app/api/chat/mark-offline/route.ts`
- **Purpose:** Marks user as offline by calling backend
- **Fallback:** If backend endpoint doesn't exist, uses heartbeat with old timestamp
- **Error Handling:** Fails silently to not block logout

#### 2. Updated Logout Function
- **File:** `src/lib/auth.ts`
- **Change:** Calls mark-offline endpoint before logout
- **Sequence:**
  ```
  1. Mark user offline → 2. Clear cookies → 3. Clear storage → 4. Redirect
  ```

### Backend Requirements

The backend should implement the following endpoint:

```
POST /api/chat/mark-offline/
Headers:
  Authorization: Bearer <token>
Body:
  {
    "timestamp": "2026-01-28T14:32:59.000Z"
  }
```

**Expected Backend Behavior:**
- Set `last_activity` to `1970-01-01T00:00:00.000Z` (very old timestamp)
- OR set a dedicated `is_online` flag to `false`
- OR delete the user's online status entry from the cache/database

### Fallback Strategy

If the backend doesn't have a `/mark-offline/` endpoint yet, the system will:
1. Try calling `/api/chat/heartbeat/` with timestamp `1970-01-01T00:00:00.000Z`
2. This forces the user to appear offline when online status is calculated

## Testing

### To Test Logout Offline Status:
1. Log in as User A
2. Open chat in another browser as User B
3. Verify User A appears online (green dot)
4. User A logs out
5. Wait a few seconds
6. Refresh User B's chat
7. ✅ **Expected:** User A should now show as offline (gray dot)

### Without This Feature:
- User A would still appear online for 5 minutes after logout

## Benefits
- ✅ Immediate feedback to other users when someone logs out
- ✅ More accurate online status representation
- ✅ Better user experience in chat system
- ✅ Fails gracefully if backend endpoint missing

## Notes
- The mark-offline call will not block the logout process if it fails
- Online status is checked every 8-10 seconds by polling, so changes appear within ~10 seconds
- If the backend endpoint returns 404, the system uses a fallback method
