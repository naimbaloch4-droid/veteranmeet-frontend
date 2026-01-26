# VeteranMeet Frontend

A Next.js application for connecting veterans and providing support services.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v3
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Animation**: Framer Motion

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Backend API running (default: https://veteranmeet-1.onrender.com)

### Installation

1. Clone the repository and navigate to the frontend directory:
```bash
cd veteranmeet-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env.local
```

4. Update `.env.local` with your API URL:
```env
NEXT_PUBLIC_API_URL=https://your-backend-api.com
```

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin dashboard pages
│   ├── dashboard/         # User dashboard
│   ├── login/             # Authentication pages
│   └── api/               # API routes
├── components/            # Reusable React components
├── lib/                   # Utility functions and configurations
│   ├── api.ts            # Axios instance with interceptors
│   └── auth.ts           # Authentication utilities
└── middleware.ts          # Next.js middleware for auth
```

## Features

- 🔐 JWT-based authentication with cookie storage
- 👤 Role-based access control (Admin/User)
- 🛡️ Protected routes via middleware
- 📊 Admin dashboard with analytics
- 🎨 Responsive design with Tailwind CSS
- ⚡ Optimized for performance

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | Yes |

See `.env.example` for reference.

## Deployment

### Deploy to Vercel (Recommended)

This application is optimized for Vercel deployment. See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

Quick deploy:
1. Push code to GitHub
2. Import project in [Vercel Dashboard](https://vercel.com/new)
3. Set environment variables
4. Deploy!

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Vercel Deployment](https://vercel.com/docs)

## License

Private project for VeteranMeet.
