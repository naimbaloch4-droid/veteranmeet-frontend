/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  reactStrictMode: true,
  swcMinify: true,
  
  // Image optimization
  images: {
    domains: ['veteranmeet-1.onrender.com'],
    formats: ['image/avif', 'image/webp'],
  },

  // Development-specific webpack config
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          'D:\\System Volume Information',
          'D:\\pagefile.sys',
          'D:\\DumpStack.log.tmp'
        ]
      };
    }
    return config;
  }
};

module.exports = nextConfig;
