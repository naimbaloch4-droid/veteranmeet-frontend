# Deployment Guide - VeteranMeet Frontend

## Vercel Deployment

This application is optimized for deployment on Vercel.

### Prerequisites

1. A [Vercel account](https://vercel.com/signup)
2. [Vercel CLI](https://vercel.com/docs/cli) installed (optional, for CLI deployment)
3. Backend API running and accessible

### Deployment Steps

#### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub/GitLab/Bitbucket**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Import Project in Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/new)
   - Click "Import Project"
   - Select your repository
   - Vercel will auto-detect Next.js configuration

3. **Configure Environment Variables**
   In the Vercel dashboard, add the following environment variable:
   - `NEXT_PUBLIC_API_URL`: Your backend API URL (e.g., `https://veteranmeet-1.onrender.com`)

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your application
   - You'll get a production URL (e.g., `your-app.vercel.app`)

#### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy to Preview**
   ```bash
   cd veteranmeet-frontend
   vercel
   ```

4. **Deploy to Production**
   ```bash
   vercel --prod
   ```

5. **Set Environment Variables**
   ```bash
   vercel env add NEXT_PUBLIC_API_URL
   ```
   Enter your API URL when prompted.

### Environment Variables

Required environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `https://veteranmeet-1.onrender.com` |

### Post-Deployment Configuration

1. **Update Backend CORS Settings**
   - Add your Vercel domain to backend's allowed origins
   - Example: `https://your-app.vercel.app`

2. **Configure Custom Domain (Optional)**
   - In Vercel dashboard, go to Settings > Domains
   - Add your custom domain
   - Update DNS records as instructed

3. **Set Up Preview Deployments**
   - Every push to branches creates preview deployments
   - Useful for testing before merging to main

### Automatic Deployments

Vercel automatically:
- Deploys on every push to `main` branch (production)
- Creates preview deployments for pull requests
- Runs build checks and tests
- Generates deployment URLs

### Build Configuration

The application uses these build settings:
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Development Command**: `npm run dev`

### Troubleshooting

#### Build Fails

1. Check build logs in Vercel dashboard
2. Verify all dependencies are in `package.json`
3. Ensure environment variables are set correctly

#### API Connection Issues

1. Verify `NEXT_PUBLIC_API_URL` is set correctly
2. Check backend CORS configuration allows your Vercel domain
3. Ensure backend API is accessible and running

#### Authentication Not Working

1. Verify cookies are being sent with `withCredentials: true`
2. Check that backend allows credentials in CORS
3. Ensure cookie domain settings match your deployment

### Performance Optimization

The application includes:
- ✅ React Strict Mode enabled
- ✅ SWC Minification enabled
- ✅ Image optimization configured
- ✅ Automatic code splitting
- ✅ Static page generation where possible

### Monitoring

After deployment:
1. Check Vercel Analytics for traffic insights
2. Monitor function logs in Vercel dashboard
3. Set up error tracking (e.g., Sentry) if needed

### Rollback

If issues occur:
1. Go to Vercel dashboard
2. Select previous deployment
3. Click "Promote to Production"

### Support

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Vercel Community](https://github.com/vercel/vercel/discussions)
