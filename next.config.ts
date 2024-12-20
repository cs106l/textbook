import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: process.env.NODE_ENV === "production" ? "/textbook" : undefined,
  images: {
    unoptimized: true,
  },
  env: {},
};

nextConfig.env!.NEXT_PUBLIC_BASE_PATH = nextConfig.basePath;

export default nextConfig;
