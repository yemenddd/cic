import type { NextConfig } from "next";

// The spline.design and unpkg.com entries were dropped along with the 3D
// scene component that needed them. An origin left in this list stays
// permitted whether or not anything still calls it, so it is removed with the
// code rather than kept "just in case".
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https://img.youtube.com https://*.public.blob.vercel-storage.com;
  frame-src https://www.youtube.com;
  connect-src 'self' blob:;
  worker-src 'self' blob:;
  media-src 'self' data: blob: mediastream:;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
`.replace(/\n/g, ' ').trim();

const securityHeaders = [
  { key: 'Content-Security-Policy',     value: ContentSecurityPolicy },
  { key: 'X-Frame-Options',             value: 'DENY' },
  { key: 'X-Content-Type-Options',      value: 'nosniff' },
  { key: 'Referrer-Policy',             value: 'strict-origin-when-cross-origin' },
  // The camera is allowed for this origin only, and only because the
  // attendance scanner at /admin/attendance/scan reads badge QR codes with it.
  // Everything else stays denied: a blanket `camera=()` would have made the
  // scanner silently fail to start, with no error a user could act on.
  { key: 'Permissions-Policy',          value: 'camera=(self), microphone=(), geolocation=(), payment=()' },
  { key: 'Strict-Transport-Security',   value: 'max-age=63072000; includeSubDomains; preload' },
];

const nextConfig: NextConfig = {
  compress: true,

  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 31536000,
    remotePatterns: [{ protocol: 'https', hostname: '*.public.blob.vercel-storage.com' }],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        source: '/images/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, stale-while-revalidate=86400' }],
      },
      {
        source: '/fonts/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/music/:path*.mp3',
        headers: [
          { key: 'Content-Type',  value: 'audio/mpeg' },
          { key: 'Accept-Ranges', value: 'bytes' },
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/music/:path*.m4a',
        headers: [
          { key: 'Content-Type',  value: 'audio/mp4' },
          { key: 'Accept-Ranges', value: 'bytes' },
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/music/:path*.wav',
        headers: [
          { key: 'Content-Type',  value: 'audio/wav' },
          { key: 'Accept-Ranges', value: 'bytes' },
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

export default nextConfig;
