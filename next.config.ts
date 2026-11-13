import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";

function supabaseOrigins(): { http: string[]; ws: string[] } {
  const http = new Set<string>();
  const configured = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (configured) {
    try {
      http.add(new URL(configured).origin);
    } catch {
      // An invalid URL is reported when the client is created.
    }
  }
  if (isDevelopment) {
    http.add("http://127.0.0.1:54321");
    http.add("http://localhost:54321");
  }
  return {
    http: [...http],
    ws: [...http].map((origin) => origin.replace(/^http/, "ws")),
  };
}

function contentSecurityPolicy(): string {
  const supabase = supabaseOrigins();
  return [
    "default-src 'self'",
    // Next injects inline bootstrap scripts; dev also needs eval for HMR.
    `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    `connect-src 'self' ${[...supabase.http, ...supabase.ws].join(" ")}${isDevelopment ? " ws: wss:" : ""}`.trim(),
    "manifest-src 'self'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    // OAuth sign-in redirects through Supabase to Google after a form post.
    `form-action 'self' ${supabase.http.join(" ")} https://accounts.google.com`,
    "frame-ancestors 'none'",
    ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
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
          { key: "Content-Security-Policy", value: contentSecurityPolicy() },
        ],
      },
    ];
  },
};

export default nextConfig;
