import { z } from "zod";
import { getDbFromEnv, schema } from "@/lib/db";
import { helpArticles, articleId } from "./index";

export const feedbackSchema = z.object({ article: z.string().max(120), helpful: z.boolean() });

const known = new Set(helpArticles.map(articleId));
export const isKnownArticle = (id: string) => known.has(id);

/** Stores one anonymous vote. Only articles that exist can be voted on. */
export async function recordFeedback(env: { DB: D1Database }, article: string, helpful: boolean) {
  if (!isKnownArticle(article)) throw new Error("unknown article");
  await getDbFromEnv(env).insert(schema.helpFeedback).values({ articleId: article, helpful });
}
