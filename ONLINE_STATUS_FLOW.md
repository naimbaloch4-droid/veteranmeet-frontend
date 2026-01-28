# Online Status Flow - Complete Documentation

## Overview
This document explains the complete online/offline status flow for users in the chat system.

---

## 🟢 Login → User Appears ONLINE

### Flow Sequence
```
User Logs In
    ↓
Redirect to /dashboard
    ↓
Dashboard Layout Mounts
    ↓
useHeartbeat() Hook Runs (line 86 of layout.tsx)
    ↓
Immediate sendHeartbeat() Called (line 57 of useHeartbeat.ts)
    ↓
POST /api/chat/heartbeat
    ↓
Backend Updates last_activity = NOW
    ↓
✅ USER APPEARS ONLINE
```

### Code References

**1. Dashboard Layout** (`src/app/dashboard/layout.tsx:86`)
```typescript
useHeartbeat(); // Activates heartbeat on dashboard mount
```

**2. Heartbeat Hook** (`src/hooks/useHeartbeat.ts:56-57`)
```typescript
// Send initial heartbeat immediately
sendHeartbeat();
```

**3. Heartbeat API** (`src/app/api/chat/heartbeat/route.ts`)
- Calls backend: `POST ${baseURL}/api/chat/heartbeat/`
- Updates user's `last_activity` timestamp

### Result
✅ User appears online within **2-3 seconds** of logging in

---

## 🔄 Active Session → User Stays ONLINE

### Continuous Heartbeat
- Heartbeat sent every **2 minutes** (120,000ms)
- Updates `last_activity` field on backend
- Backend considers users online if `last_activity` is within last **5 minutes**

### Page Visibility Handling
- Heartbeat pauses when tab is hidden
- Resumes immediately when tab becomes visible again
- Smart: Only sends if >1 minute has passed since last heartbeat

### Code Reference
**Heartbeat Interval** (`src/hooks/useHeartbeat.ts:60-62`)
```typescript
intervalRef.current = setInterval(() => {
  sendHeartbeat();
}, intervalMs); // 120000ms = 2 minutes
```

---

## ⚫ Logout → User Appears OFFLINE

### Flow Sequence
```
User Clicks Logout
    ↓
logout() Function Called
    ↓
POST /api/chat/mark-offline (NEW!)
    ↓
Backend Sets last_activity = '1970-01-01' (very old)
    ↓
POST /api/auth/logout
    ↓
Clear Auth Tokens & Storage
    ↓
Redirect to /login
    ↓
✅ USER APPEARS OFFLINE IMMEDIATELY
```

### Code References

**1. Logout Function** (`src/lib/auth.ts:63-71`)
```typescript
// First, mark user as offline in chat system
try {
  await fetch('/api/chat/mark-offline', { 
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  });
} catch (offlineError) {
  console.warn('Failed to mark user as offline:', offlineError);
}
```

**2. Mark Offline API** (`src/app/api/chat/mark-offline/route.ts`)
- Calls backend: `POST ${baseURL}/api/chat/mark-offline/`
- Sets `last_activity` to `1970-01-01T00:00:00.000Z`
- Has fallback if endpoint doesn't exist

### Result
✅ User appears offline within **5-10 seconds** of logging out

---

## 📊 Online Status Detection

### How Backend Determines Online Status
```python
# Backend Logic (Django)
now = timezone.now()
five_minutes_ago = now - timedelta(minutes=5)
online_users = User.objects.filter(
    last_activity__gte=five_minutes_ago
)
```

### How Frontend Displays Online Status
1. **Polling:** Fetches online users every 8-10 seconds
2. **Component:** `OnlineStatusIndicator` shows green/gray dot
3. **Location:** Messages page, chat header, new chat modal

---

## 🧪 Testing the Complete Flow

### Test 1: Login → Online
1. Open chat as User B (already logged in)
2. Log in as User A in another browser
3. Wait 3-5 seconds
4. User B refreshes or waits for next poll (8-10 seconds)
5. ✅ **Expected:** User A appears with **green dot** (online)

### Test 2: Logout → Offline
1. User A and User B both logged in
2. User B can see User A is online (green dot)
3. User A clicks logout
4. Wait 5-10 seconds
5. User B's page refreshes online status
6. ✅ **Expected:** User A appears with **gray dot** (offline)

### Test 3: Idle → Still Online
1. User A logs in and navigates to messages
2. User A doesn't interact for 90 seconds
3. User B checks User A's status
4. ✅ **Expected:** User A still shows **green dot** (heartbeat keeps them online)

### Test 4: Tab Hidden → Comes Back Online
1. User A is active on messages
2. User A switches to another tab for 2 minutes
3. User A switches back to the app
4. Heartbeat sends immediately
5. ✅ **Expected:** User A never appears offline to User B

---

## 🔧 Backend Requirements

### Required Endpoints

#### 1. Heartbeat Endpoint
```
POST /api/chat/heartbeat/
Headers:
  Authorization: Bearer <token>
Body:
  {
    "timestamp": "2026-01-28T14:32:59.000Z"
  }

Action:
  - Update user's last_activity = request.timestamp
```

#### 2. Mark Offline Endpoint
```
POST /api/chat/mark-offline/
Headers:
  Authorization: Bearer <token>
Body:
  {
    "timestamp": "2026-01-28T14:32:59.000Z"
  }

Action:
  - Set user's last_activity = '1970-01-01T00:00:00.000Z'
  - OR set is_online = False
```

#### 3. Online Users Endpoint
```
GET /api/chat/online-users/
Headers:
  Authorization: Bearer <token>

Response:
  {
    "online_users": [1, 5, 12, 45]  // Array of user IDs
  }

Logic:
  - Return users where last_activity >= (now - 5 minutes)
```

---

## 📋 Summary

| Event | Action | Result | Time |
|-------|--------|--------|------|
| **Login** | Send heartbeat immediately | Shows online | 2-3 sec |
| **Active** | Heartbeat every 2 minutes | Stays online | Continuous |
| **Idle** | Heartbeat every 2 minutes | Stays online | Up to 5 min |
| **Logout** | Mark offline explicitly | Shows offline | 5-10 sec |
| **Close Tab** | No heartbeat sent | Shows offline | After 5 min |

---

## ✅ Current Status

- ✅ Login → Online (Working via useHeartbeat)
- ✅ Active → Stays Online (Working via 2-min heartbeat)
- ✅ Logout → Offline (Implemented in this session)
- ✅ Polling (Every 8-10 seconds)
- ✅ Visual Indicators (Green/Gray dots)
- ✅ Graceful Fallbacks (If endpoints missing)

**All features are now implemented and ready to use!** 🎉
