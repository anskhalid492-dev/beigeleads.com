import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { HelpData } from "./data";
import { loadHelp } from "./store";

/** Published Help Center content for a page render (cached 60 s; falls back to the built-in content). */
export async function getHelp(): Promise<HelpData> {
  return loadHelp(getCloudflareContext().env);
}
