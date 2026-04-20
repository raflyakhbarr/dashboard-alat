import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pg', 'bcrypt', 'jsonwebtoken'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'tpssby-my.sharepoint.com',
      },
    ],
  },
};

export default nextConfig;
