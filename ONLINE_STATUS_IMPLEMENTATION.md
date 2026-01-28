# Online/Offline User Status Implementation

This document describes the online/offline user status implementation in the chat system.

## 🎯 Overview

The system uses a **time-based approach** to determine if users are online:
- Users are considered **online** if their `last_activity` was updated within the **last 5 minutes**
- The frontend sends **heartbeat requests** every **2 minutes** to keep the user's status active
- Online status is polled every **4 seconds** to update the UI in real-time

---

## 🏗️ Architecture

### Frontend Components

#### 1. **API Routes** (`src/app/api/chat/`)

##### `/api/chat/online-users/` (GET)
- **Purpose**: Fetches the list of currently online users from the backend
- **Implementation**: Proxies the request to the Django backend
- **Returns**: `{ online_users: [1, 2, 3, ...] }`
- **Fallback**: Returns empty array on error (graceful degradation)

##### `/api/chat/heartbeat/` (POST)
- **Purpose**: Updates the user's `last_activity` timestamp
- **Frequency**: Called every 2 minutes by the frontend
- **Payload**: `{ timestamp: "2024-01-28T12:00:00Z" }`
- **Fallback**: Silently fails if endpoint doesn't exist yet

#### 2. **Custom Hook** (`src/hooks/useHeartbeat.ts`)

```typescript
useHeartbeat(intervalMs?: number)
```

**Features**:
- ✅ Sends periodic heartbeats to keep user online
- ✅ Only runs when user is authenticated
- ✅ Pauses when browser tab is hidden (Page Visibility API)
- ✅ Sends immediate heartbeat when tab becomes visible again
- ✅ Auto-cleanup on unmount

**Integration**: 
- Integrated in `src/app/dashboard/layout.tsx` (for veterans)
- Integrated in `src/app/admin/layout.tsx` (for admins)

#### 3. **Chat Store** (`src/store/useChatStore.ts`)

**Online User Management**:
```typescript
- onlineUsers: Set<number>  // Set of online user IDs
- fetchOnlineUsers()        // Fetches from /api/chat/online-users/
- setUserOnline(userId, isOnline)  // Manually update online status
```

**Polling Strategy**:
- Fetches online users every **4 seconds** (in messages page)
- Updates the `onlineUsers` Set with fresh data

#### 4. **UI Components**

**OnlineStatusIndicator** (`src/components/OnlineStatusIndicator.tsx`)
- Shows green dot for online users
- Shows gray dot for offline users
- Animated pulse effect for online status
- Optional label: "Online" / "Offline"

---

## 🔧 Backend Requirements

### Required Endpoints

#### 1. **GET `/api/chat/online-users/`**

**Purpose**: Return list of currently online user IDs

**Logic**:
```python
from datetime import timedelta
from django.utils import timezone

def get_online_users():
    threshold = timezone.now() - timedelta(minutes=5)
    online_users = User.objects.filter(
        last_activity__gte=threshold
    )
    return online_users
```

**Response**:
```json
{
  "online_users": [1, 2, 3, 5, 8, 12, 15]
}
```

**Alternative Endpoint**: `/api/chat/rooms/online_users/` (the frontend tries both)

#### 2. **POST `/api/chat/heartbeat/`**

**Purpose**: Update the authenticated user's `last_activity` field

**Logic**:
```python
from django.utils import timezone

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def heartbeat(request):
    # Update last_activity for the current user
    request.user.last_activity = timezone.now()
    request.user.save(update_fields=['last_activity'])
    
    return Response({
        'success': True,
        'last_activity': request.user.last_activity
    })
```

**Request**:
```json
{
  "timestamp": "2024-01-28T12:00:00Z"
}
```

**Response**:
```json
{
  "success": true,
  "last_activity": "2024-01-28T12:00:00.123456Z"
}
```

---

## 🚀 How It Works

### User Lifecycle

```
1. User logs in
   └─> Frontend: useHeartbeat() starts
       └─> Sends immediate heartbeat to /api/chat/heartbeat/
       
2. User browses the app
   └─> Heartbeat sent every 2 minutes
       └─> Backend updates last_activity
       
3. Other users open chat
   └─> Frontend polls /api/chat/online-users/ every 4 seconds
       └─> Backend checks: last_activity >= (now - 5 minutes)
       └─> Returns list of online user IDs
       └─> UI shows green dot for online users
       
4. User closes tab or logs out
   └─> Heartbeat stops
       └─> After 5 minutes of inactivity
           └─> Backend considers user offline
           └─> Other users see gray dot
```

### Timeline Example

```
Time: 00:00  - User logs in
              └─> Heartbeat sent (last_activity = 00:00)
              
Time: 02:00  - Heartbeat sent (last_activity = 02:00)
Time: 04:00  - Heartbeat sent (last_activity = 04:00)
Time: 06:00  - Heartbeat sent (last_activity = 06:00)

Time: 06:30  - User closes browser
              └─> Heartbeat stops
              
Time: 11:00  - Backend checks online status
              └─> last_activity = 06:00
              └─> Current time = 11:00
              └─> 11:00 - 06:00 = 5 minutes
              └─> User is still ONLINE (just barely!)
              
Time: 11:01  - Backend checks online status
              └─> 11:01 - 06:00 = 5 minutes 1 second
              └─> User is now OFFLINE
```

---

## ⚡ Performance Considerations

### Frontend
- **Heartbeat interval**: 2 minutes (configurable)
  - Too frequent = unnecessary server load
  - Too infrequent = users appear offline while active
  
- **Online status polling**: 4 seconds
  - Provides near real-time updates
  - Acceptable server load for typical chat usage

### Backend
- **Online threshold**: 5 minutes
  - Balances between accuracy and tolerance for temporary disconnections
  - Prevents users from appearing offline during brief network issues

### Optimizations
- ✅ Frontend uses Page Visibility API to pause heartbeats when tab is hidden
- ✅ Graceful degradation: Online status feature works even if backend isn't ready
- ✅ Error handling: Failures are logged but don't break the app

---

## 🐛 Troubleshooting

### "All users show as offline"

**Possible causes**:
1. Backend `/api/chat/online-users/` endpoint not implemented
2. Backend `/api/chat/heartbeat/` endpoint not implemented
3. `NEXT_PUBLIC_API_URL` environment variable not set
4. CORS issues preventing API calls

**Check**:
```bash
# Open browser console on messages page
# You should see:
[Heartbeat] Sending heartbeat...  (every 2 minutes)
[Online Users] Fetching online users...  (every 4 seconds)
```

### "Heartbeat endpoint returns 404"

**Solution**: Implement the heartbeat endpoint on the backend (see Backend Requirements above)

**Temporary workaround**: The frontend will continue working without breaking

### "Online status updates slowly"

**Cause**: Polling interval is set to 4 seconds

**Solution**: Adjust polling in `src/app/dashboard/messages/page.tsx`:
```typescript
// Change this line (currently 4000ms = 4 seconds)
const pollInterval = setInterval(() => {
  fetchRooms();
  fetchOnlineUsers();
  if (currentRoom) {
    fetchMessages(currentRoom.id);
  }
}, 2000); // Change to 2000ms = 2 seconds for faster updates
```

---

## 🔐 Security Considerations

1. **Authentication Required**: Both endpoints require valid JWT token
2. **Rate Limiting**: Consider adding rate limiting on the heartbeat endpoint
3. **HTTPS Only**: All API calls should use HTTPS in production
4. **CORS Configuration**: Ensure backend allows requests from frontend domain

---

## 🎨 Customization

### Adjust Online Threshold

**Backend** (`users/views.py`):
```python
# Change from 5 minutes to 3 minutes
threshold = timezone.now() - timedelta(minutes=3)
```

### Adjust Heartbeat Frequency

**Frontend** (where `useHeartbeat()` is called):
```typescript
// Send heartbeat every 1 minute instead of 2
useHeartbeat(60000); // 60000ms = 1 minute
```

### Adjust Polling Frequency

**Frontend** (`src/app/dashboard/messages/page.tsx`):
```typescript
// Poll every 2 seconds instead of 4
const pollInterval = setInterval(() => {
  // ...
}, 2000);
```

---

## 📊 Monitoring

### Key Metrics to Track

1. **Heartbeat Success Rate**: % of heartbeats that successfully reach the backend
2. **Average Online Users**: Track peak times for chat usage
3. **Online Status Accuracy**: Compare frontend perception vs backend reality

### Logging

**Backend**:
```python
import logging
logger = logging.getLogger(__name__)

@api_view(['POST'])
def heartbeat(request):
    logger.info(f'Heartbeat received from user {request.user.id}')
    # ... update logic
```

**Frontend** (already implemented):
```typescript
console.log('[Heartbeat] Sent successfully');
console.log('[Online Users] Fetched:', onlineUsers.length);
```

---

## ✅ Testing Checklist

- [ ] Backend `/api/chat/online-users/` endpoint returns correct data
- [ ] Backend `/api/chat/heartbeat/` endpoint updates `last_activity`
- [ ] Frontend sends heartbeat every 2 minutes
- [ ] Frontend polls online users every 4 seconds
- [ ] Online status indicator shows green dot for online users
- [ ] Online status indicator shows gray dot for offline users
- [ ] Heartbeat pauses when browser tab is hidden
- [ ] Heartbeat resumes when browser tab becomes visible
- [ ] Users appear offline after 5 minutes of inactivity
- [ ] Multiple tabs/devices maintain online status correctly

---

## 📝 Next Steps

### Recommended Improvements

1. **WebSocket Integration**: Replace polling with real-time WebSocket updates
   - More efficient than polling
   - Instant status updates
   - Requires Django Channels or similar

2. **Last Seen Timestamp**: Show "Last seen 5 minutes ago" instead of just offline
   - Requires storing and exposing `last_activity` to clients

3. **Typing Indicators**: Already partially implemented in the chat store
   - Requires WebSocket for real-time updates

4. **Presence Broadcast**: When user goes online/offline, notify all connected clients
   - Reduces polling frequency
   - Better user experience

---

## 🤝 Contributing

When modifying this feature:
1. Update this documentation
2. Test with multiple users/browsers
3. Verify backend changes don't break frontend
4. Check performance impact of any polling changes

---

## 📞 Support

For questions or issues:
1. Check browser console for errors
2. Verify environment variables are set
3. Test backend endpoints directly with curl/Postman
4. Review Django logs for backend errors
