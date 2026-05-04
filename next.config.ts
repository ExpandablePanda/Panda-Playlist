import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/Panda-Playlist',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
