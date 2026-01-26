# Vercel Deployment Configuration Fix

## Issue
Error: `The specified Root Directory "main" does not exist`

## Solution

### Step 1: Update Vercel Project Settings

1. Go to your Vercel project: https://vercel.com/dashboard
2. Select your project **veteranmeet-frontend**
3. Go to **Settings** → **General**
4. Find **Root Directory** section
5. Change from `main` to **`.`** (leave empty or use a dot)
6. Click **Save**

### Step 2: Configure Environment Variables

1. In Vercel dashboard, go to **Settings** → **Environment Variables**
2. Add the following variable:
   - **Name:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://veteranmeet-1.onrender.com`
   - **Environments:** Check all (Production, Preview, Development)
3. Click **Save**

### Step 3: Redeploy

1. Go to **Deployments** tab
2. Click **Redeploy** on the latest deployment
3. Or push a new commit to trigger automatic deployment

## Expected Build Configuration

```json
{
  "framework": "nextjs",
  "rootDirectory": ".",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "devCommand": "npm run dev"
}
```

## Verification Checklist

- [ ] Root Directory set to `.` or left empty
- [ ] Environment variable `NEXT_PUBLIC_API_URL` is configured
- [ ] Build Command is `npm run build`
- [ ] Output Directory is `.next`
- [ ] Framework is detected as `nextjs`

## Notes

- The project is a Next.js 14 App Router application
- All source code is in the `src/` directory
- No monorepo structure - the root is the project root
