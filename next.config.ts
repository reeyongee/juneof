// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos", // Keep this if you might still use picsum for other placeholders
        port: "",
        pathname: "/**",
      },
      {
        // This is the new entry for Shopify
        protocol: "https",
        hostname: "cdn.shopify.com",
        port: "",
        pathname: "/**", // Allows any path under cdn.shopify.com
      },
      {
        // --- ADD THIS NEW ENTRY FOR SANITY ---
        protocol: "https",
        hostname: "cdn.sanity.io",
        port: "",
        pathname: "/**",
      },
      // --- END OF NEW ENTRY ---
    ],
  },
};

export default nextConfig;
