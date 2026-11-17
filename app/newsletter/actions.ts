"use server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { confirm, unsubscribe } from "@/lib/newsletter";

/** Mutations happen on a button press (POST), never on page load, so email link scanners cannot confirm or unsubscribe anyone. */
export async function confirmAction(token: string): Promise<boolean> { return confirm(getCloudflareContext().env, token); }
export async function unsubscribeAction(token: string): Promise<boolean> { return unsubscribe(getCloudflareContext().env, token); }
