// Streams a request body into private R2 without holding the file in memory. The first bytes are read up front (format check by real bytes),
// the rest follows through a fixed-length stream, so a body that does not match the declared size fails instead of being stored.
export const HEAD_BYTES = 8192;

export async function readHead(body: ReadableStream<Uint8Array>): Promise<{ head: Uint8Array; reader: ReadableStreamDefaultReader<Uint8Array>; rest: Uint8Array | null; done: boolean }> {
  const reader = body.getReader();
  const parts: Uint8Array[] = []; let n = 0; let done = false;
  while (n < HEAD_BYTES && !done) {
    const r = await reader.read();
    if (r.done) { done = true; break; }
    parts.push(r.value); n += r.value.length;
  }
  const all = new Uint8Array(n); let o = 0; for (const p of parts) { all.set(p, o); o += p.length; }
  return { head: all.subarray(0, Math.min(n, HEAD_BYTES)), reader, rest: n > HEAD_BYTES ? all.subarray(HEAD_BYTES) : null, done };
}

/** Writes head + remaining body to R2 under `key`. Throws if the body is not exactly `size` bytes. */
export async function putStream(bucket: R2Bucket, key: string, size: number, first: Uint8Array, rest: Uint8Array | null, reader: ReadableStreamDefaultReader<Uint8Array>, done: boolean, contentType = "application/octet-stream"): Promise<void> {
  const fls = new FixedLengthStream(size);
  const put = bucket.put(key, fls.readable, { httpMetadata: { contentType } });
  const w = fls.writable.getWriter();
  try {
    await w.write(first);
    if (rest) await w.write(rest);
    while (!done) { const r = await reader.read(); if (r.done) break; await w.write(r.value); }
    await w.close();
  } catch (e) { await w.abort(e).catch(() => undefined); await put.catch(() => undefined); throw e; }
  await put;
}
