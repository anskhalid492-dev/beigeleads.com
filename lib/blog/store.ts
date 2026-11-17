import { cleanDoc, emptyDoc, type DocNode } from "./doc";

/** All blog objects live in the existing R2 bucket (binding LISTS) under the blog/ prefix. */
const bucket = (env: CloudflareEnv) => env.LISTS;

export const bodyKey = (id: number) => `blog/posts/${id}/body.json`;
export const revisionKey = (id: number) => `blog/posts/${id}/rev/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.json`;

export async function readBody(env: CloudflareEnv, id: number): Promise<DocNode> {
  const o = await bucket(env).get(bodyKey(id));
  if (!o) return emptyDoc();
  try { return cleanDoc(await o.json()); } catch { return emptyDoc(); }
}

export async function writeBody(env: CloudflareEnv, id: number, doc: DocNode) {
  await bucket(env).put(bodyKey(id), JSON.stringify(doc), { httpMetadata: { contentType: "application/json" } });
}

export type RevisionSnapshot = { title: string; excerpt: string; doc: DocNode };

export async function writeRevision(env: CloudflareEnv, id: number, snap: RevisionSnapshot): Promise<string> {
  const key = revisionKey(id);
  await bucket(env).put(key, JSON.stringify(snap), { httpMetadata: { contentType: "application/json" } });
  return key;
}

export async function readRevision(env: CloudflareEnv, key: string): Promise<RevisionSnapshot | null> {
  if (!key.startsWith("blog/posts/")) return null;
  const o = await bucket(env).get(key);
  if (!o) return null;
  try {
    const j = (await o.json()) as RevisionSnapshot;
    return { title: String(j.title ?? ""), excerpt: String(j.excerpt ?? ""), doc: cleanDoc(j.doc) };
  } catch { return null; }
}

export async function deletePrefix(env: CloudflareEnv, prefix: string) {
  let cursor: string | undefined;
  do {
    const l = await bucket(env).list({ prefix, cursor });
    if (l.objects.length) await bucket(env).delete(l.objects.map((x) => x.key));
    cursor = l.truncated ? l.cursor : undefined;
  } while (cursor);
}
