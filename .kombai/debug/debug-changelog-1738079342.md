# Debug Changelog - React Error #185 (Infinite Loop)

## Issue
- **Error:** Minified React error #185 (Maximum update depth exceeded)
- **Cause:** Infinite loop in `useEffect` dependency array
- **Location:** `src/app/dashboard/messages/page.tsx` line 94

## Root Cause Analysis
The `useEffect` hook includes Zustand store functions in its dependency array:
```typescript
}, [fetchRooms, fetchFollowing, fetchOnlineUsers, currentRoom?.id, fetchMessages]);
```

When `fetchRooms()` updates the store state, Zustand creates new function references, triggering the `useEffect` to re-run. This creates an infinite loop:
1. `useEffect` runs → calls `fetchRooms()`
2. `fetchRooms()` updates store state
3. Store update creates new function references
4. New references trigger `useEffect` again
5. Loop repeats infinitely

## Changes Made

### 1. Fixed infinite loop in messages page useEffect
- **File:** `src/app/dashboard/messages/page.tsx`
- **Change:** Removed Zustand function dependencies from useEffect dependency array (line 94)
- **Original:** `}, [fetchRooms, fetchFollowing, fetchOnlineUsers, currentRoom?.id, fetchMessages]);`
- **Fixed:** `}, []);` (empty dependency array for mount-only execution)
- **Revert:** Restore the original dependency array with all function dependencies

### 2. Fixed infinite loop in dashboard layout useEffect (ROOT CAUSE)
- **File:** `src/app/dashboard/layout.tsx`
- **Change:** Removed `fetchRooms` from useEffect dependency array (line 98)
- **Original:** `}, [user, fetchRooms]);`
- **Fixed:** `}, [user?.id]);` (only depend on user ID changes for login/logout scenarios)
- **Revert:** Restore the original dependency array `[user, fetchRooms]`
- **Note:** This was the main source of the infinite loop since the layout wraps all dashboard pages

## Additional Feature: Offline Status on Logout

### 3. Added offline status marking on logout
- **File:** `src/app/api/chat/mark-offline/route.ts` (NEW FILE)
- **Change:** Created new API route to mark user as offline when logging out
- **Revert:** Delete entire file

### 4. Updated logout function to mark user offline
- **File:** `src/lib/auth.ts`
- **Change:** Added call to `/api/chat/mark-offline` before logout (lines 63-71)
- **Original:** Directly called logout API without marking offline
- **Fixed:** Now calls mark-offline endpoint first, then proceeds with logout
- **Revert:** Remove the mark-offline fetch call (lines 63-71)

## Revert Status
- [ ] Change 1 - Fixed useEffect dependency array in messages page
- [ ] Change 2 - Fixed useEffect dependency array in dashboard layout (PRIMARY FIX)
- [ ] Change 3 - Mark offline API route (NEW FEATURE)
- [ ] Change 4 - Updated logout to mark offline (NEW FEATURE)

## Notes
- Zustand store functions are stable and should not be included in dependency arrays
- The polling interval inside the useEffect will continue to call the latest versions of these functions
- `currentRoom?.id` was also removed since the polling interval already handles checking the current room
