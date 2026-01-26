# Vercel CORS Issue Fix Guide

## Problem
The application works locally but fails on Vercel with error:
```
Failed to load dashboard statistics. Please ensure you have admin privileges and backend is running.
Make sure Django backend is running and CORS is configured properly
```

## Root Cause
This is a **CORS (Cross-Origin Resource Sharing)** issue. Your Django backend is not configured to accept requests from your Vercel deployment domain.

## Solution

### Step 1: Verify Environment Variable in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Verify that `NEXT_PUBLIC_API_URL` is set to: `https://veteranmeet-1.onrender.com`
4. Make sure it's enabled for **Production**, **Preview**, and **Development**

### Step 2: Update Django CORS Configuration

In your Django backend (`veteranmeet-1.onrender.com`), update the `settings.py` file:

#### Install django-cors-headers (if not already installed)
```bash
pip install django-cors-headers
```

#### Update settings.py

```python
# Add to INSTALLED_APPS
INSTALLED_APPS = [
    # ... other apps
    'corsheaders',
    # ... rest of apps
]

# Add to MIDDLEWARE (must be before CommonMiddleware)
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Add this line
    'django.middleware.common.CommonMiddleware',
    # ... rest of middleware
]

# CORS Configuration
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # Local development
    "http://localhost:3001",
    "https://your-app.vercel.app",  # Replace with your actual Vercel domain
    "https://your-app-*.vercel.app",  # For preview deployments
]

# Alternative: Allow all origins (NOT recommended for production)
# CORS_ALLOW_ALL_ORIGINS = True

# Important: Allow credentials (cookies, authorization headers)
CORS_ALLOW_CREDENTIALS = True

# Allow specific headers
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# Allow specific methods
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]
```

### Step 3: Find Your Vercel Domain

To get your exact Vercel domain:

1. Go to your Vercel project dashboard
2. Look at the **Domains** section
3. Copy the full domain (e.g., `veteranmeet-frontend.vercel.app`)
4. Add it to `CORS_ALLOWED_ORIGINS` in your Django settings

### Step 4: Test the Connection

1. Deploy your Django backend changes
2. Visit: `https://your-vercel-app.vercel.app/api-test`
3. Click "Run Diagnostic Tests"
4. Review the results to identify any remaining issues

### Step 5: Verify Backend is Running

Ensure your Django backend at `https://veteranmeet-1.onrender.com` is:
- ✅ Running and accessible
- ✅ Has the CORS configuration applied
- ✅ Allows requests from your Vercel domain

### Common Issues & Solutions

#### Issue 1: "NEXT_PUBLIC_API_URL is not set"
**Solution:** Add the environment variable in Vercel dashboard and redeploy

#### Issue 2: "CORS policy: No 'Access-Control-Allow-Origin' header"
**Solution:** Update Django CORS configuration as shown above

#### Issue 3: "401 Unauthorized"
**Solution:** Ensure `CORS_ALLOW_CREDENTIALS = True` in Django settings

#### Issue 4: Backend is sleeping (Render free tier)
**Solution:** 
- Wake up the backend by visiting `https://veteranmeet-1.onrender.com` in your browser
- Consider upgrading to a paid plan to keep the backend always active
- Or implement a keep-alive ping service

### Testing Checklist

- [ ] Environment variable `NEXT_PUBLIC_API_URL` is set in Vercel
- [ ] Django backend has `django-cors-headers` installed
- [ ] `corsheaders` is added to `INSTALLED_APPS`
- [ ] `CorsMiddleware` is added to `MIDDLEWARE`
- [ ] Vercel domain is added to `CORS_ALLOWED_ORIGINS`
- [ ] `CORS_ALLOW_CREDENTIALS = True` is set
- [ ] Django backend is deployed with new settings
- [ ] Test page at `/api-test` shows all green checkmarks

### Need More Help?

If issues persist after following these steps:
1. Check browser console for specific error messages
2. Check Django backend logs on Render dashboard
3. Run the diagnostic test at `/api-test` and review detailed error messages
