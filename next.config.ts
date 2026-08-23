import type { NextConfig } from "next";

const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https://img.youtube.com https://*.spline.design https://cdn.sanity.io;
  frame-src https://www.youtube.com;
  connect-src 'self' blob: https://prod.spline.design https://*.spline.design https://unpkg.com;
  worker-src 'self' blob:;
  media-src 'self' data: blob:;
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
  { key: 'Permissions-Policy',          value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Strict-Transport-Security',   value: 'max-age=63072000; includeSubDomains; preload' },
];

const nextConfig: NextConfig = {
  compress: true,


  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 31536000,
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io' }],
  },

  async headers() {
    return [
      {
        // Everything except /studio — the embedded Sanity Studio needs to talk
        // to *.sanity.io (API, realtime, CDN) which this CSP would otherwise block.
        source: '/((?!studio).*)',
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
