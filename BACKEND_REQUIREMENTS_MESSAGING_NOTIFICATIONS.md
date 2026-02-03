# Backend Requirements for Messaging & Notification System

This document outlines all the backend API endpoints and features required for the complete messaging and notification implementation.

---

## 📋 Table of Contents

1. [Core Chat Endpoints](#core-chat-endpoints)
2. [Online Presence System](#online-presence-system)
3. [Unread Message Tracking](#unread-message-tracking)
4. [Real-time Features (Optional)](#real-time-features-optional)
5. [Database Models](#database-models)
6. [API Response Formats](#api-response-formats)
7. [Implementation Checklist](#implementation-checklist)

---

## 🔵 Core Chat Endpoints

### 1. **GET /api/chat/rooms/**
Fetch all chat rooms for the current user.

**Response:**
```json
{
  "results": [
    {
      "id": 1,
      "type": "direct",
      "name": "Conversation",
      "participants": [
        {
          "id": 1,
          "username": "john_doe",
          "first_name": "John",
          "last_name": "Doe",
          "email": "john@example.com"
        },
        {
          "id": 2,
          "username": "jane_smith",
          "first_name": "Jane",
          "last_name": "Smith",
          "email": "jane@example.com"
        }
      ],
      "last_message": {
        "id": 123,
        "content": "Hey, how are you?",
        "sender": {
          "id": 2,
          "username": "jane_smith",
          "first_name": "Jane",
          "last_name": "Smith"
        },
        "created_at": "2024-01-15T10:30:00Z",
        "is_read": false
      },
      "unread_count": 3,
      "updated_at": "2024-01-15T10:30:00Z",
      "created_at": "2024-01-10T08:00:00Z"
    }
  ]
}
```

**Key Requirements:**
- ✅ Must include `unread_count` for each room (count of unread messages for current user)
- ✅ Must include `last_message` with sender details
- ✅ Must include all `participants` with full user details
- ✅ Sort rooms by `updated_at` (most recent first)

---

### 2. **POST /api/chat/rooms/create_direct_chat/**
Create a new direct chat room with another user.

**Request:**
```json
{
  "user_id": 2
}
```

**Response:**
```json
{
  "id": 1,
  "type": "direct",
  "name": "Conversation",
  "participants": [/* user objects */],
  "last_message": null,
  "unread_count": 0,
  "updated_at": "2024-01-15T10:30:00Z",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Key Requirements:**
- ✅ Check if a direct chat already exists between these two users
- ✅ If exists, return the existing room (don't create duplicate)
- ✅ If new, create and return the new room

---

### 3. **GET /api/chat/messages/**
Fetch messages for a specific room.

**Query Parameters:**
- `room_id` (required): The room ID

**Response:**
```json
{
  "results": [
    {
      "id": 123,
      "room": 1,
      "sender": {
        "id": 2,
        "username": "jane_smith",
        "first_name": "Jane",
        "last_name": "Smith"
      },
      "content": "Hey, how are you?",
      "created_at": "2024-01-15T10:30:00Z",
      "is_read": false
    }
  ]
}
```

**Key Requirements:**
- ✅ Filter messages by `room_id`
- ✅ Include full sender details
- ✅ Include `is_read` status for each message
- ✅ Sort by `created_at` (oldest first for proper chat flow)

---

### 4. **POST /api/chat/messages/**
Send a new message to a room.

**Request:**
```json
{
  "room": 1,
  "content": "Hello there!"
}
```

**Response:**
```json
{
  "id": 124,
  "room": 1,
  "sender": {
    "id": 1,
    "username": "john_doe",
    "first_name": "John",
    "last_name": "Doe"
  },
  "content": "Hello there!",
  "created_at": "2024-01-15T10:31:00Z",
  "is_read": false
}
```

**Key Requirements:**
- ✅ Automatically set sender to current authenticated user
- ✅ Set `is_read` to `false` by default
- ✅ Update the room's `updated_at` timestamp
- ✅ Update the room's `last_message` reference

---

### 5. **POST /api/chat/rooms/{room_id}/mark_read/**
Mark all messages in a room as read.

**Response:**
```json
{
  "message": "All messages marked as read",
  "updated_count": 3
}
```

**Key Requirements:**
- ✅ Mark all unread messages in this room as `is_read = true` for current user
- ✅ Only mark messages where current user is NOT the sender
- ✅ Reset room's `unread_count` to 0 for current user

---

### 6. **POST /api/chat/messages/{message_id}/mark_read/**
Mark a specific message as read.

**Response:**
```json
{
  "message": "Message marked as read",
  "id": 123
}
```

**Key Requirements:**
- ✅ Mark specific message as `is_read = true`
- ✅ Only if current user is the recipient (not the sender)

---

### 7. **DELETE /api/chat/rooms/{room_id}/**
Delete a chat room (conversation).

**Response:**
```json
{
  "message": "Room deleted successfully"
}
```

**Key Requirements:**
- ✅ Soft delete or hard delete based on your preference
- ✅ Only allow deletion by participants
- ✅ Delete all associated messages

---

## 🟢 Online Presence System

### 8. **POST /api/chat/heartbeat/**
Update user's last activity timestamp (keeps them "online").

**Request:**
```json
{
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Response:**
```json
{
  "status": "success",
  "last_activity": "2024-01-15T10:30:00Z"
}
```

**Key Requirements:**
- ✅ Update current user's `last_activity` field
- ✅ Called every 2 minutes by frontend (via `useHeartbeat` hook)

---

### 9. **GET /api/chat/online-users/**
Get list of currently online user IDs.

**Response:**
```json
{
  "online_users": [1, 2, 5, 7, 12]
}
```

**or simpler:**
```json
[1, 2, 5, 7, 12]
```

**Key Requirements:**
- ✅ Return user IDs where `last_activity >= (current_time - 5 minutes)`
- ✅ Only return IDs (not full user objects) for performance
- ✅ Should be fast - consider caching or database indexing

**Backend Logic:**
```python
from django.utils import timezone
from datetime import timedelta

# Users online in last 5 minutes
online_threshold = timezone.now() - timedelta(minutes=5)
online_users = User.objects.filter(
    last_activity__gte=online_threshold
).values_list('id', flat=True)
```

---

### 10. **POST /api/chat/mark-offline/**
Mark user as offline (optional - for explicit logout).

**Request:**
```json
{
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Response:**
```json
{
  "status": "offline"
}
```

**Key Requirements:**
- ✅ Set user's `last_activity` to a past time or clear it
- ✅ Called when user explicitly logs out

---

## 🔴 Unread Message Tracking

### Backend Database Schema Updates

#### **User Model**
Add field for tracking online presence:
```python
class User(AbstractUser):
    # ... existing fields ...
    last_activity = models.DateTimeField(null=True, blank=True)
```

#### **ChatRoom Model**
```python
class ChatRoom(models.Model):
    type = models.CharField(max_length=20, choices=[('direct', 'Direct'), ('group', 'Group')])
    name = models.CharField(max_length=255, blank=True)
    participants = models.ManyToManyField(User, related_name='chat_rooms')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Optional: Store last message reference for performance
    last_message = models.ForeignKey('Message', null=True, blank=True, on_delete=models.SET_NULL, related_name='+')
```

#### **Message Model**
```python
class Message(models.Model):
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['created_at']
```

**OR** for better unread tracking per user:

```python
class MessageRead(models.Model):
    """Track which users have read which messages"""
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='read_receipts')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    read_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('message', 'user')
```

---

## ⚡ Real-time Features (Optional but Recommended)

### WebSocket Support (Django Channels)

For real-time message delivery without polling:

1. **WebSocket Connection**: `/ws/chat/{room_id}/`
2. **Events to Send:**
   - New message received
   - User is typing
   - User read message
   - User online/offline status change

**Example WebSocket Message:**
```json
{
  "type": "new_message",
  "data": {
    "id": 124,
    "room": 1,
    "sender": {
      "id": 2,
      "first_name": "Jane",
      "last_name": "Smith"
    },
    "content": "Hello!",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Benefits:**
- Instant message delivery (no polling delay)
- Lower server load
- Better user experience
- Typing indicators work smoothly

---

## 📊 API Response Formats

### Unread Count Calculation

**Per Room Unread Count:**
```python
def get_unread_count(room, user):
    """Get unread message count for a specific user in a room"""
    return room.messages.filter(
        is_read=False,
        sender__ne=user  # Don't count own messages
    ).count()
```

**Include in Room Response:**
```python
{
    "id": room.id,
    "type": room.type,
    "participants": [...],
    "last_message": {...},
    "unread_count": get_unread_count(room, request.user),
    "updated_at": room.updated_at,
}
```

---

## ✅ Implementation Checklist

### **Phase 1: Basic Chat (Essential)**
- [ ] `GET /api/chat/rooms/` - List rooms with unread counts
- [ ] `POST /api/chat/rooms/create_direct_chat/` - Create new chat
- [ ] `GET /api/chat/messages/?room_id=X` - Get messages
- [ ] `POST /api/chat/messages/` - Send message
- [ ] `POST /api/chat/rooms/{id}/mark_read/` - Mark room as read
- [ ] Add `unread_count` calculation to room responses
- [ ] Add `last_message` to room responses

### **Phase 2: Online Presence (Important)**
- [ ] Add `last_activity` field to User model
- [ ] `POST /api/chat/heartbeat/` - Update activity
- [ ] `GET /api/chat/online-users/` - Get online users
- [ ] `POST /api/chat/mark-offline/` - Mark offline (optional)
- [ ] Add database index on `last_activity` for performance

### **Phase 3: Additional Features (Nice to Have)**
- [ ] `POST /api/chat/messages/{id}/mark_read/` - Mark single message
- [ ] `DELETE /api/chat/rooms/{id}/` - Delete conversation
- [ ] Typing indicators (requires WebSockets)
- [ ] Message attachments/images
- [ ] Message reactions
- [ ] Search messages

### **Phase 4: Real-time (Optimal)**
- [ ] Setup Django Channels for WebSocket support
- [ ] WebSocket consumer for chat rooms
- [ ] Real-time message delivery
- [ ] Real-time typing indicators
- [ ] Real-time online/offline status

---

## 🔧 Performance Optimizations

### Database Indexing
```python
class Message(models.Model):
    # ... fields ...
    
    class Meta:
        indexes = [
            models.Index(fields=['room', 'created_at']),
            models.Index(fields=['room', 'is_read']),
        ]

class User(models.Model):
    # ... fields ...
    
    class Meta:
        indexes = [
            models.Index(fields=['last_activity']),
        ]
```

### Query Optimization
- Use `select_related()` for room participants
- Use `prefetch_related()` for messages
- Cache online users list (Redis recommended)
- Paginate message history

---

## 📝 Testing the Implementation

### Test Scenarios

1. **Send Message:**
   ```bash
   POST /api/chat/messages/
   {
     "room": 1,
     "content": "Test message"
   }
   ```

2. **Check Unread Count:**
   ```bash
   GET /api/chat/rooms/
   # Verify unread_count is correct
   ```

3. **Mark as Read:**
   ```bash
   POST /api/chat/rooms/1/mark_read/
   # Verify unread_count becomes 0
   ```

4. **Online Status:**
   ```bash
   POST /api/chat/heartbeat/
   GET /api/chat/online-users/
   # Verify current user ID is in the list
   ```

---

## 🚀 Quick Start Guide for Backend Developers

1. **Add the database fields:**
   - `User.last_activity` (DateTimeField)
   - Ensure `Message.is_read` exists (BooleanField)

2. **Implement the 3 critical endpoints:**
   - `GET /api/chat/rooms/` with `unread_count`
   - `POST /api/chat/heartbeat/`
   - `GET /api/chat/online-users/`

3. **Update existing endpoints:**
   - Add `unread_count` to room serializers
   - Add `last_message` to room serializers

4. **Test with frontend:**
   - Frontend already has all the code ready
   - Just needs backend endpoints to work

---

## 📞 Support & Questions

**Frontend Implementation:** ✅ Complete
- Message notifications working
- Unread indicators in sidebar
- Toast notifications
- Online status indicators
- Desktop notifications
- Tab title updates
- Sound alerts

**Backend Requirements:** This document

The frontend is already fully implemented and waiting for these backend endpoints to make everything work seamlessly!
