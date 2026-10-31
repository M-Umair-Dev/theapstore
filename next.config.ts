import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Product images still upload one file per server action.
      // Blog pictures and videos go to Vercel Blob and do not use this body.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
