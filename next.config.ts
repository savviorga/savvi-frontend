import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
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
