import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Cache Components / partial prefetching are intentionally OFF:
// OpenNext Cloudflare support for them is unverified (see CLAUDE.md section 3).
const nextConfig: NextConfig = {
  images: { unoptimized: true }, // no default Next image optimizer on Workers
  poweredByHeader: false,
  // Tailwind v4 loader (kept from the create-next-app scaffold).
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

initOpenNextCloudflareForDev();
