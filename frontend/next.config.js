/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow backend API calls during development
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/:path*`,
      },
    ];
  },
  images: {
    domains: ['firebasestorage.googleapis.com', 'storage.googleapis.com'],
  },
};

module.exports = nextConfig;
