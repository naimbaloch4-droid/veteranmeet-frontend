# 🔄 Store Migration Checklist

## Overview
This checklist helps migrate remaining Zustand stores to use the centralized service layer.

---

## ✅ Completed Migrations

- [x] **useChatStore.ts** - Fully migrated to `chatService`
- [x] **useHeartbeat.ts** - Updated to use `chatService.sendHeartbeat()`
- [x] **auth.ts / auth.service.ts** - Enhanced authentication with presence management

---

## 📋 Pending Migrations

### 1. useConnectionStore.ts

**Current Status**: Using `api` directly
**Target**: Migrate to `connectionService`

**Changes Required**:
```typescript
// Line 2: Update import
import api from '@/lib/api';  // Remove
import { connectionService } from '@/services/api.service';  // Add

// Line 38: Update fetchFollowers
const response = await api.get('/api/auth/followers/');  // Remove
const followers = await connectionService.getFollowers();  // Add
const followers = response.data.results || response.data || [];  // Remove

// Line 49: Update fetchFollowing
const response = await api.get('/api/auth/following/');  // Remove
const following = await connectionService.getFollowing();  // Add

// Line 84: Update followUser
const response = await api.post(`/api/auth/follow/${userId}/`);  // Remove
await connectionService.follow(userId);  // Add

// Line 107: Update unfollowUser
await api.delete(`/api/auth/unfollow/${userId}/`);  // Remove
await connectionService.unfollow(userId);  // Add
```

**Estimated Time**: 15 minutes

---

### 2. usePostStore.ts

**Current Status**: Using `api` directly
**Target**: Migrate to `postService`

**Changes Required**:
```typescript
// Line 2: Update import
import api from '@/lib/api';  // Remove
import { postService } from '@/services/api.service';  // Add

// Line 65: Update fetchPosts
const response = await api.get('/api/posts/', { params: { page, page_size: 20 } });  // Remove
const newPosts = await postService.getPosts({ page, page_size: 20 });  // Add
const newPosts = response.data.results || response.data || [];  // Remove

// Line 86: Update fetchFeedPosts
const response = await api.get('/api/auth/feed/', { params });  // Remove
// Note: feedPosts endpoint may need to be added to postService
const response = await api.get('/api/auth/feed/', { params });  // Keep for now

// Line 106: Update createPost
const response = await api.post('/api/posts/', formData, { ... });  // Remove
const newPost = await postService.createPost(formData);  // Add

// Line 133: Update deletePost
await api.delete(`/api/posts/${postId}/`);  // Remove
await postService.deletePost(postId);  // Add

// Line 147: Update likePost
const response = await api.post(`/api/posts/${postId}/like/`);  // Remove
await postService.likePost(postId);  // Add

// Line 163: Update unlikePost
await api.post(`/api/posts/${postId}/unlike/`);  // Remove
await postService.unlikePost(postId);  // Add

// Line 168: Update commentOnPost
const response = await api.post(`/api/posts/${postId}/comments/`, { content });  // Remove
const comment = await postService.addComment(postId, content);  // Add

// Line 185: Update fetchPostComments
const response = await api.get(`/api/posts/${postId}/comments/`);  // Remove
// Note: getComments may need to be added to postService
const response = await api.get(`/api/posts/${postId}/comments/`);  // Keep for now
```

**Estimated Time**: 20 minutes

---

### 3. useEventStore.ts

**Current Status**: Using `api` directly
**Target**: Migrate to `eventService`

**Changes Required**:
```typescript
// Line 2: Update import
import api from '@/lib/api';  // Remove
import { eventService } from '@/services/api.service';  // Add

// Fetch events
const response = await api.get('/api/events/', { params });  // Remove
const events = await eventService.getEvents(params);  // Add

// Create event
const response = await api.post('/api/events/', data);  // Remove
const event = await eventService.createEvent(data);  // Add

// Update event
await api.patch(`/api/events/${eventId}/`, data);  // Remove
await eventService.updateEvent(eventId, data);  // Add

// Delete event
await api.delete(`/api/events/${eventId}/`);  // Remove
await eventService.deleteEvent(eventId);  // Add

// Join event
await api.post(`/api/events/${eventId}/join/`);  // Remove
await eventService.joinEvent(eventId);  // Add

// Leave event
await api.post(`/api/events/${eventId}/leave/`);  // Remove
await eventService.leaveEvent(eventId);  // Add
```

**Estimated Time**: 15 minutes

---

### 4. useGroupStore.ts

**Current Status**: Using `api` directly
**Target**: Migrate to `groupService`

**Changes Required**:
```typescript
// Line 2: Update import
import api from '@/lib/api';  // Remove
import { groupService } from '@/services/api.service';  // Add

// Fetch groups
const response = await api.get('/api/groups/', { params });  // Remove
const groups = await groupService.getGroups(params);  // Add

// Create group
const response = await api.post('/api/groups/', data);  // Remove
const group = await groupService.createGroup(data);  // Add

// Update group
await api.patch(`/api/groups/${groupId}/`, data);  // Remove
await groupService.updateGroup(groupId, data);  // Add

// Delete group
await api.delete(`/api/groups/${groupId}/`);  // Remove
await groupService.deleteGroup(groupId);  // Add

// Join group
await api.post(`/api/groups/${groupId}/join/`);  // Remove
await groupService.joinGroup(groupId);  // Add

// Leave group
await api.post(`/api/groups/${groupId}/leave/`);  // Remove
await groupService.leaveGroup(groupId);  // Add
```

**Estimated Time**: 15 minutes

---

### 5. useResourceStore.ts

**Current Status**: Using `api` directly
**Target**: Migrate to `resourceService`

**Changes Required**:
```typescript
// Line 2: Update import
import api from '@/lib/api';  // Remove
import { resourceService } from '@/services/api.service';  // Add

// Fetch resources
const response = await api.get('/api/resources/', { params });  // Remove
const resources = await resourceService.getResources(params);  // Add

// Create resource
const response = await api.post('/api/resources/', data);  // Remove
const resource = await resourceService.createResource(data);  // Add

// Update resource
await api.patch(`/api/resources/${resourceId}/`, data);  // Remove
await resourceService.updateResource(resourceId, data);  // Add

// Delete resource
await api.delete(`/api/resources/${resourceId}/`);  // Remove
await resourceService.deleteResource(resourceId);  // Add
```

**Estimated Time**: 15 minutes

---

## 🎯 Migration Pattern

For each store, follow this pattern:

### Step 1: Update Import
```typescript
import { xxxService } from '@/services/api.service';
```

### Step 2: Replace API Calls
```typescript
// Before
const response = await api.get('/api/endpoint/');
const data = response.data.results || response.data || [];

// After
const data = await xxxService.methodName();
```

### Step 3: Remove Response Parsing
```typescript
// Service layer already handles:
// - response.data.results || response.data || []
// - Error handling
// - Type casting
```

### Step 4: Test
- Verify all CRUD operations work
- Check error handling
- Test loading states
- Verify optimistic updates still work

---

## 🧪 Testing After Migration

After migrating each store, test:

1. **Fetch Operations**
   - [ ] Data loads correctly
   - [ ] Loading states work
   - [ ] Error handling works

2. **Create Operations**
   - [ ] Items are created
   - [ ] Optimistic updates work
   - [ ] Error recovery works

3. **Update Operations**
   - [ ] Items update correctly
   - [ ] UI reflects changes immediately
   - [ ] Backend sync succeeds

4. **Delete Operations**
   - [ ] Items are removed
   - [ ] UI updates instantly
   - [ ] No orphaned data

---

## 📊 Progress Tracking

| Store | Status | Time Est. | Completed |
|-------|--------|-----------|-----------|
| useChatStore | ✅ Migrated | - | ✅ |
| useConnectionStore | ⏳ Pending | 15 min | ⬜ |
| usePostStore | ⏳ Pending | 20 min | ⬜ |
| useEventStore | ⏳ Pending | 15 min | ⬜ |
| useGroupStore | ⏳ Pending | 15 min | ⬜ |
| useResourceStore | ⏳ Pending | 15 min | ⬜ |

**Total Estimated Time**: ~1.5 hours

---

## ✅ Benefits After Full Migration

1. **Consistency**: All API calls follow same pattern
2. **Maintainability**: Single source of truth for endpoints
3. **Testing**: Easy to mock service layer
4. **Type Safety**: Better TypeScript support
5. **Error Handling**: Centralized error management
6. **Code Reuse**: Eliminate duplicate API call logic

---

## 🚨 Important Notes

1. **Don't Break Existing Functionality**
   - Test each store after migration
   - Verify all features still work
   - Check error states

2. **Keep Optimistic Updates**
   - Preserve instant UI feedback
   - Maintain error recovery
   - Keep user experience smooth

3. **Handle Edge Cases**
   - Empty responses
   - Network errors
   - 401 unauthorized
   - 404 not found

4. **Backward Compatibility**
   - Old API patterns still work
   - Gradual migration is safe
   - No breaking changes

---

**Status**: 1/6 stores migrated (useChatStore complete)
**Priority**: Medium (existing code works, this improves maintainability)
**Difficulty**: Easy (simple find-and-replace pattern)
