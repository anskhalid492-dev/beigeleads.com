import { defineCloudflareConfig } from "@opennextjs/cloudflare/config";

// Incremental cache (R2/KV) will be wired when we enable ISR for programmatic pages.
export default defineCloudflareConfig({});
