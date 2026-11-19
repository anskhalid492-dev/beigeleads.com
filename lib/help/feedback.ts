import { z } from "zod";
import { getDbFromEnv, schema } from "@/lib/db";
import { articleId } from "./data";
import { loadHelp } from "./store";

export const feedbackSchema = z.object({ article: z.string().max(120), helpful: z.boolean() });

/** Stores one anonymous vote. Only published articles can be voted on. */
export async function recordFeedback(env: { DB: D1Database; CACHE: KVNamespace }, article: string, helpful: boolean) {
  const data = await loadHelp(env);
  if (!data.articles.some((a) => articleId(a) === article)) throw new Error("unknown article");
  await getDbFromEnv(env).insert(schema.helpFeedback).values({ articleId: article, helpful });
}
