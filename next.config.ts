import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/** Origen del API (se fija en el build, igual que NEXT_PUBLIC_API_URL). */
function apiOrigin(): string | null {
  try {
    const url = process.env.NEXT_PUBLIC_API_URL?.trim();
    return url ? new URL(url).origin : null;
  } catch {
    return null;
  }
}

/** Adjuntos: subida directa y vista previa con URLs prefirmadas de S3. */
const S3 = "https://*.amazonaws.com";

/**
 * CSP pensada para Next (scripts en línea de hidratación) sin dominios de
 * terceros: solo la propia app, el API y S3.
 */
function contentSecurityPolicy(): string {
  const connect = ["'self'", apiOrigin(), S3, ...(isDev ? ["ws:", "http://localhost:*"] : [])];
  const directives: Record<string, (string | null)[]> = {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'", ...(isDev ? ["'unsafe-eval'"] : [])],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:", "https:"],
    "font-src": ["'self'", "data:"],
    "connect-src": connect,
    "media-src": ["'self'", "blob:", S3],
    "frame-src": ["'self'", "blob:", S3],
    "worker-src": ["'self'", "blob:"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };
  return Object.entries(directives)
    .map(([name, values]) => `${name} ${values.filter(Boolean).join(" ")}`)
    .join("; ");
}

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy() },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // El micrófono solo lo usa la propia app (notas de voz).
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(self)" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    return [
      {
        source: "/transferencias",
        destination: "/pagos-recurrentes",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
