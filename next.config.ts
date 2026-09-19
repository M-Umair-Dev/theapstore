import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Product images are uploaded through a server action. The default 1 MB
      // cap is too small for a screenshot; the action itself enforces 4 MB.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
