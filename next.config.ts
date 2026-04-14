import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pg', 'bcrypt', 'jsonwebtoken'],
};

export default nextConfig;
