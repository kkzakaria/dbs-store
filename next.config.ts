import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "44321",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "44321",
      },
    ],
  },
};

export default nextConfig;
