import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: "/", destination: "/dashboard", permanent: false },
      { source: "/opportunities/:path*", destination: "/onboarding", permanent: true },
    ];
  },
};

export default nextConfig;
