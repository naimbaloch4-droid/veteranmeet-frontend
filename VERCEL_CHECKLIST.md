# Vercel Deployment Checklist

## Pre-Deployment ✅

- [x] Environment variables documented in `.env.example`
- [x] Production optimizations in `next.config.js`
- [x] CORS headers configured in `vercel.json`
- [x] `.gitignore` includes `.env*` and `.vercel`
- [x] `.vercelignore` created for build optimization
- [x] Build command verified (`npm run build`)
- [x] README updated with deployment info
- [x] Detailed deployment guide created

## Deploy to Vercel

### Quick Start (via Dashboard)

1. **Push to Git**
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

2. **Import in Vercel**
   - Visit: https://vercel.com/new
   - Import your repository
   - Framework preset: Next.js (auto-detected)

3. **Environment Variables**
   Add in Vercel dashboard:
   ```
   NEXT_PUBLIC_API_URL=https://veteranmeet-1.onrender.com
   ```

4. **Deploy**
   - Click "Deploy" button
   - Wait for build to complete
   - Get your live URL!

### After Deployment

- [ ] Update backend CORS to allow your Vercel domain
- [ ] Test authentication flow
- [ ] Test admin and user dashboards
- [ ] Verify API connections work
- [ ] Check all routes are accessible
- [ ] Configure custom domain (optional)

## Troubleshooting

### Build Errors
- Check Vercel build logs
- Verify all dependencies in `package.json`
- Ensure Node.js version compatibility

### API Issues
- Verify `NEXT_PUBLIC_API_URL` environment variable
- Check backend CORS configuration
- Test API endpoints directly

### Authentication Issues
- Verify cookies are being set correctly
- Check `withCredentials: true` in axios config
- Ensure backend accepts credentials in CORS

## Important Notes

- Environment variables prefixed with `NEXT_PUBLIC_` are exposed to the browser
- Vercel automatically deploys on git push to main branch
- Preview deployments are created for pull requests
- Deployment URL format: `your-project.vercel.app`

## Support Resources

- [Vercel Docs](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Environment Variables Guide](https://vercel.com/docs/concepts/projects/environment-variables)
