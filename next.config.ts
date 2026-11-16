import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Cache Components / partial prefetching are intentionally OFF:
// OpenNext Cloudflare support for them is unverified (see CLAUDE.md section 3).
const nextConfig: NextConfig = {
  images: { unoptimized: true }, // no default Next image optimizer on Workers
  poweredByHeader: false,
  // Solutions replaces the planned /use-cases hub (CLAUDE.md section 23).
  async redirects() {
    return [{ source: "/use-cases", destination: "/solutions", permanent: true }];
  },
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
