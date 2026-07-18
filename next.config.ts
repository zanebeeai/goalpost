import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";
const localSupabaseHttp = " http://127.0.0.1:54321 http://localhost:54321";
const localSupabaseSockets = " ws://127.0.0.1:54321 ws://localhost:54321";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  experimental: {
    serverActions: {
      bodySizeLimit: "26mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""} https://challenges.cloudflare.com`,
              "style-src 'self' 'unsafe-inline'",
              `img-src 'self' blob: data: https://*.supabase.co${isDevelopment ? localSupabaseHttp : ""}`,
              "font-src 'self'",
              `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.sentry.io${isDevelopment ? `${localSupabaseHttp}${localSupabaseSockets}` : ""}`,
              "frame-src https://challenges.cloudflare.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
});
