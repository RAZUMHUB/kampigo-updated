/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // PWA/mobile-first: allow images served from the storage provider's domain.
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.storage.example.com' },
      { protocol: 'https', hostname: 'storage.local.dev' },
    ],
  },
};

export default nextConfig;
