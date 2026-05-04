import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@neondatabase/auth"],
  allowedDevOrigins: ["192.168.4.109"],
};

export default nextConfig;
