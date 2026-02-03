# Backend Requirements for Typing Indicators & Real-Time Sync

## 🎯 Overview
This document outlines the required backend changes to support:
1. **Typing Indicators** - Show when users are typing in real-time
2. **Better Real-Time Sync** - Reduce polling and improve message delivery

---

## 📡 Required Backend Endpoints

### 1. Typing Indicator Endpoint

#### **POST /api/chat/rooms/{room_id}/typing/**
Notify other participants when a user is typing.

**Request Body:**
```json
{
  "is_typing": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Typing status updated"
}
```

**Backend Implementation:**

**Option A: Simple Polling Approach (Easier)**

Add a field to track typing status:

```python
# chat/models.py
from django.utils import timezone
from datetime import timedelta

class ChatRoom(models.Model):
    # ... existing fields ...
    
    # New fields for typing indicators
    typing_user = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='typing_in_room'
    )
    typing_updated_at = models.DateTimeField(null=True, blank=True)
    
    def get_typing_user(self):
        """Returns typing user if they typed within last 5 seconds"""
        if self.typing_user and self.typing_updated_at:
            time_diff = timezone.now() - self.typing_updated_at
            if time_diff < timedelta(seconds=5):
                return {
                    'id': self.typing_user.id,
                    'username': self.typing_user.username,
                    'first_name': self.typing_user.first_name,
                    'last_name': self.typing_user.last_name
                }
        return None
```

```python
# chat/views.py
from rest_framework.decorators import action
from django.utils import timezone

class ChatRoomViewSet(viewsets.ModelViewSet):
    # ... existing code ...
    
    @action(detail=True, methods=['post'])
    def typing(self, request, pk=None):
        """Update typing status for a room"""
        room = self.get_object()
        is_typing = request.data.get('is_typing', False)
        
        # Check if user is participant
        if request.user not in room.participants.all():
            return Response(
                {'error': 'Not a participant'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if is_typing:
            room.typing_user = request.user
            room.typing_updated_at = timezone.now()
        else:
            # Clear typing if this user was typing
            if room.typing_user == request.user:
                room.typing_user = None
                room.typing_updated_at = None
        
        room.save()
        
        return Response({
            'success': True,
            'message': 'Typing status updated'
        })
```

**Update Room Serializer:**
```python
# chat/serializers.py
class ChatRoomSerializer(serializers.ModelSerializer):
    # ... existing fields ...
    typing_user = serializers.SerializerMethodField()
    
    def get_typing_user(self, obj):
        """Return typing user if they're currently typing"""
        typing_data = obj.get_typing_user()
        if typing_data:
            # Don't show if the typing user is the current user
            if typing_data['id'] != self.context['request'].user.id:
                return typing_data
        return None
    
    class Meta:
        model = ChatRoom
        fields = [
            'id', 'type', 'name', 'participants', 
            'last_message', 'unread_count', 'updated_at', 
            'created_at', 'typing_user'  # Add typing_user
        ]
```

**Option B: WebSocket Approach (Better Real-Time)**

For true real-time experience, implement Django Channels:

```python
# Install Django Channels
pip install channels channels-redis

# settings.py
INSTALLED_APPS = [
    # ...
    'channels',
]

ASGI_APPLICATION = 'veteranmeet.asgi.application'

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [('127.0.0.1', 6379)],
        },
    },
}
```

```python
# chat/consumers.py
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async

class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = f'chat_{self.room_id}'
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()
    
    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive_json(self, content):
        message_type = content.get('type')
        
        if message_type == 'typing':
            # Broadcast typing indicator
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'typing_indicator',
                    'user_id': self.scope['user'].id,
                    'username': self.scope['user'].username,
                    'is_typing': content.get('is_typing', False)
                }
            )
        
        elif message_type == 'message':
            # Handle new message
            message = await self.save_message(content)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': message
                }
            )
    
    async def typing_indicator(self, event):
        # Send typing indicator to WebSocket
        if event['user_id'] != self.scope['user'].id:
            await self.send_json({
                'type': 'typing',
                'user_id': event['user_id'],
                'username': event['username'],
                'is_typing': event['is_typing']
            })
    
    async def chat_message(self, event):
        # Send message to WebSocket
        await self.send_json({
            'type': 'message',
            'message': event['message']
        })
    
    @database_sync_to_async
    def save_message(self, content):
        # Save message to database
        room = ChatRoom.objects.get(id=self.room_id)
        message = ChatMessage.objects.create(
            room=room,
            sender=self.scope['user'],
            content=content['content']
        )
        return ChatMessageSerializer(message).data
```

```python
# chat/routing.py
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/chat/(?P<room_id>\w+)/$', consumers.ChatConsumer.as_asgi()),
]
```

```python
# veteranmeet/asgi.py
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from chat.routing import websocket_urlpatterns

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'veteranmeet.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)
    ),
})
```

---

## 📊 Database Migrations

### For Polling Approach (Option A):

```bash
# Generate migration
python manage.py makemigrations chat

# Apply migration
python manage.py migrate chat
```

**Expected Migration:**
```python
# chat/migrations/0003_typing_indicators.py
from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    dependencies = [
        ('chat', '0002_previous_migration'),
    ]

    operations = [
        migrations.AddField(
            model_name='chatroom',
            name='typing_user',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='typing_in_room',
                to='users.user'
            ),
        ),
        migrations.AddField(
            model_name='chatroom',
            name='typing_updated_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
```

---

## 🔄 Improved Real-Time Sync

### Current Issue:
Frontend polls every 3 seconds, which can still feel laggy.

### Solutions:

**Option 1: Long Polling (Easier)**
Add a `since` parameter to get only new messages:

```python
# chat/views.py
class ChatMessageViewSet(viewsets.ModelViewSet):
    @action(detail=False, methods=['get'])
    def poll(self, request):
        """Poll for new messages since timestamp"""
        room_id = request.query_params.get('room_id')
        since = request.query_params.get('since')  # ISO timestamp
        
        queryset = ChatMessage.objects.filter(room_id=room_id)
        
        if since:
            queryset = queryset.filter(created_at__gt=since)
        
        messages = queryset.order_by('created_at')
        serializer = ChatMessageSerializer(messages, many=True)
        
        return Response({
            'messages': serializer.data,
            'timestamp': timezone.now().isoformat()
        })
```

Frontend usage:
```typescript
// Store last poll timestamp
const [lastPollTime, setLastPollTime] = useState(new Date().toISOString());

// Poll with timestamp
const response = await api.get(`/api/chat/messages/poll/?room_id=${roomId}&since=${lastPollTime}`);
setLastPollTime(response.data.timestamp);
```

**Option 2: WebSocket (Best)**
Use the WebSocket approach from Option B above for instant message delivery.

---

## 🚀 Recommended Implementation Path

### **Phase 1: Quick Win (1-2 hours)**
Implement **Option A - Polling Approach** for typing indicators:
1. Add `typing_user` and `typing_updated_at` fields to ChatRoom
2. Create migration and apply it
3. Add `/api/chat/rooms/{id}/typing/` endpoint
4. Update ChatRoomSerializer to include `typing_user`
5. Frontend already supports this!

### **Phase 2: Better Sync (2-3 hours)**
Implement long polling for messages:
1. Add `/api/chat/messages/poll/` endpoint with `since` parameter
2. Update frontend to use timestamp-based polling
3. Reduces unnecessary data transfer

### **Phase 3: Real-Time (1-2 days)**
Implement WebSockets with Django Channels:
1. Install and configure Django Channels
2. Set up Redis for channel layers
3. Create WebSocket consumers
4. Update frontend to use WebSocket connections
5. True real-time typing and messages

---

## 🧪 Testing

### Test Typing Indicators:
```bash
# Create test
curl -X POST http://localhost:8000/api/chat/rooms/1/typing/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_typing": true}'

# Verify in room response
curl http://localhost:8000/api/chat/rooms/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Long Polling:
```bash
# Get messages since timestamp
curl "http://localhost:8000/api/chat/messages/poll/?room_id=1&since=2024-01-15T10:00:00Z" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📝 Frontend Changes Already Made

✅ **Typing Detection** - Sends typing indicator when user types
✅ **Typing Display** - Shows "typing..." in chat header
✅ **Improved Polling** - Reduced from 8s to 3s
✅ **Professional Notifications** - WhatsApp-style design
✅ **No "0 unread" Badge** - Only shows when count > 0

**The frontend is ready!** Just need backend support.

---

## 🎯 Summary

**Minimum Required (Phase 1):**
- [ ] Add typing fields to ChatRoom model
- [ ] Create and apply migration
- [ ] Add POST `/api/chat/rooms/{room_id}/typing/` endpoint
- [ ] Update ChatRoomSerializer to include `typing_user`

**For Better Experience (Phase 2):**
- [ ] Add GET `/api/chat/messages/poll/?since=timestamp` endpoint
- [ ] Return only new messages since timestamp

**For Best Experience (Phase 3):**
- [ ] Install Django Channels + Redis
- [ ] Implement WebSocket consumers
- [ ] Real-time message delivery
- [ ] Real-time typing indicators

---

## 📚 Resources

- [Django Channels Documentation](https://channels.readthedocs.io/)
- [Django REST Framework Actions](https://www.django-rest-framework.org/api-guide/viewsets/#marking-extra-actions-for-routing)
- [Redis Installation](https://redis.io/docs/getting-started/)
