/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  // PWA/mobile-first: allow images served from the storage provider's domain.
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.storage.example.com' },
      { protocol: 'https', hostname: 'storage.local.dev' },
    ],
  },
};

export default nextConfig;