import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Bulletproof '@/...' alias so it resolves on every platform. tsconfig
    // `paths` alone is sometimes ignored by Next's webpack in Linux/CI builds,
    // which produced "Can't resolve '@/lib/actions'" on Vercel.
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    return config;
  },
  reactStrictMode: true,
  images: {
    // Permissive on purpose: seeded brand/partner logos and uploaded media can
    // live on many https hosts. Tighten to an explicit allow-list once all
    // image origins are known (atora.com.my + Supabase Storage bucket).
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  // Production security headers (atora.com.my).
  // CSP keeps 'unsafe-inline' because Next/Tailwind inline styles are required;
  // upgrade to nonces in a future hardening pass if you want a strict CSP.
  async headers() {
    // Optional Google reCAPTCHA on the comment board. The widget loads a script
    // and renders in an iframe, so the CSP has to be relaxed — but ONLY when a
    // key is actually configured. Without keys the strict policy stays in place.
    const recaptchaEnabled = Boolean(
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || process.env.RECAPTCHA_SECRET_KEY
    );
    const captchaScript = recaptchaEnabled ? ' https://www.google.com https://www.gstatic.com' : '';
    const captchaFrame = recaptchaEnabled ? ' https://www.google.com' : "'none'";

    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${captchaScript}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      `connect-src 'self'${recaptchaEnabled ? ' https://www.google.com' : ''}`,
      `frame-src ${captchaFrame}`,
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
      {
        // Harden the admin area: deny framing entirely.
        source: '/admin/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
