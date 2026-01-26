# VeteranMeet Authentication Testing Guide

## 🔐 Authentication Flow Overview

### How It Works:
1. **Login** → User submits credentials
2. **API Route** (`/api/auth/login`) → Forwards to Django backend
3. **Cookies Set** → httpOnly cookies stored (secure)
4. **Redirect** → Based on user role (admin or regular user)
5. **Middleware** → Validates on every route access
6. **Protected Routes** → Double-check with ProtectedRoute component

---

## 🧪 Testing Steps

### Prerequisites
1. **Backend Running**: Make sure Django backend is running on `http://localhost:8000`
2. **Frontend Running**: Start Next.js dev server

```powershell
cd veteranmeet-frontend
npm run dev
```

### Test Case 1: Regular User Login
1. Navigate to `http://localhost:3000/login`
2. Enter credentials for a **regular user** (non-admin)
3. **Expected**:
   - Login successful
   - Cookies set: `auth-token`, `refresh-token`, `user-role=user`, `user-data`
   - Redirect to `/dashboard`
   - Dashboard loads with user data

### Test Case 2: Admin User Login
1. Navigate to `http://localhost:3000/login`
2. Enter credentials for an **admin user** (`is_staff=true` or `is_superuser=true`)
3. **Expected**:
   - Login successful
   - Cookies set: `auth-token`, `refresh-token`, `user-role=admin`, `user-data`
   - Redirect to `/admin/dashboard`
   - Admin dashboard loads with statistics

### Test Case 3: Protected Route Access (Not Logged In)
1. **Clear cookies** (Dev Tools → Application → Cookies → Clear all)
2. Try to access `http://localhost:3000/dashboard`
3. **Expected**:
   - Middleware redirects to `/login`
   - Shows "Verifying access..." loading screen briefly
   - Then "Redirecting to login..."

### Test Case 4: Already Logged In (Accessing Login Page)
1. **Stay logged in** from Test Case 1 or 2
2. Try to access `http://localhost:3000/login`
3. **Expected**:
   - Middleware redirects based on role:
     - Regular user → `/dashboard`
     - Admin → `/admin/dashboard`

### Test Case 5: Non-Admin Accessing Admin Routes
1. Login as a **regular user**
2. Try to access `http://localhost:3000/admin/dashboard`
3. **Expected**:
   - Middleware blocks access
   - Redirects to `/dashboard`

### Test Case 6: Logout
1. Login as any user
2. Click the **logout button** (top right corner)
3. **Expected**:
   - All cookies cleared
   - LocalStorage cleared
   - Redirect to `/login`
   - Cannot access protected routes

### Test Case 7: Token Expiration (Manual Test)
1. Login successfully
2. **Delete the `auth-token` cookie** manually (Dev Tools)
3. Try to navigate or refresh a protected page
4. **Expected**:
   - Middleware detects missing token
   - Redirects to `/login`

---

## 🛠️ Debugging Tools

### Check Cookies (Chrome/Edge)
1. Open **DevTools** (F12)
2. Go to **Application** tab
3. Expand **Cookies** → `http://localhost:3000`
4. Look for:
   - `auth-token` (httpOnly)
   - `refresh-token` (httpOnly)
   - `user-role` (admin or user)
   - `user-data` (JSON)

### Check Network Requests
1. Open **DevTools** → **Network** tab
2. Login and watch:
   - `POST /api/auth/login` → Should return 200
   - Check **Response** tab for `redirectTo`
   - Check **Cookies** tab to see set cookies

### Check Console Logs
1. Open **DevTools** → **Console** tab
2. Look for:
   - Login success/error messages
   - Auth check logs
   - API call logs

---

## 🚨 Common Issues & Solutions

| Issue | Possible Cause | Solution |
|-------|---------------|----------|
| "Network error" on login | Backend not running | Start Django: `python manage.py runserver` |
| Infinite redirect loop | Cookie not being set | Check if `withCredentials: true` in API calls |
| Middleware not working | Cookie name mismatch | Verify cookie name is `auth-token` |
| "Checking authentication..." forever | Client-side auth check failing | Check browser console for errors |
| Can't access admin routes | User role not set correctly | Verify `user.is_staff` or `user.is_superuser` in Django |
| CORS errors | Backend CORS not configured | Add frontend URL to Django CORS settings |

---

## 📋 Checklist

- [ ] Backend is running (`http://localhost:8000`)
- [ ] Frontend is running (`http://localhost:3000`)
- [ ] Environment variables are set (`.env.local`)
- [ ] Can login as regular user
- [ ] Can login as admin user
- [ ] Regular users redirected to `/dashboard`
- [ ] Admin users redirected to `/admin/dashboard`
- [ ] Non-admins blocked from `/admin/*`
- [ ] Protected routes require authentication
- [ ] Already logged-in users can't access `/login`
- [ ] Logout works correctly
- [ ] Cookies are set and httpOnly
- [ ] Loading states show properly

---

## 🔍 Advanced Testing

### API Client with Cookies
Test if API calls include cookies automatically:

```typescript
import api from '@/lib/api';

// This should automatically include auth-token cookie
const response = await api.get('/auth/profile/');
console.log(response.data);
```

### Token Refresh Flow
1. Login successfully
2. Wait for token to expire (or manually set short expiry in Django)
3. Make an API call
4. **Expected**: API client automatically refreshes token

---

## 📊 Success Criteria

✅ **Security**:
- Tokens stored in httpOnly cookies (not localStorage)
- XSS protection enabled
- CSRF protection with SameSite=strict

✅ **Functionality**:
- Role-based routing works
- Middleware protects all routes
- Loading states are smooth (no flash)
- Logout clears all auth data

✅ **User Experience**:
- Fast redirects
- Clear loading indicators
- No infinite loops
- Proper error messages

---

## 🎯 Next Steps

After confirming authentication works:
1. Test with real Django backend
2. Implement token refresh endpoint
3. Add "Remember Me" functionality (longer cookie expiry)
4. Add session timeout warnings
5. Implement 2FA (if needed)
