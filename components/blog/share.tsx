import { CopyLink } from "./client";

const btn = "grid size-10 place-items-center rounded-full border border-sand-300 bg-white text-sm font-bold text-forest-900 hover:bg-sand-100 focus-visible:outline-2 focus-visible:outline-purple-600";

/** Share links are plain URLs (no tracking scripts). `vertical` is the desktop rail, the default is a row. */
export function Share({ url, title, vertical = false }: { url: string; title: string; vertical?: boolean }) {
  const u = encodeURIComponent(url), t = encodeURIComponent(title);
  return (
    <div aria-label="Share this article" role="group" className={`flex ${vertical ? "flex-col" : "flex-wrap"} items-center gap-2`}>
      <a className={btn} aria-label="Share on LinkedIn" href={`https://www.linkedin.com/sharing/share-offsite/?url=${u}`} target="_blank" rel="noopener noreferrer">in</a>
      <a className={btn} aria-label="Share on X" href={`https://twitter.com/intent/tweet?url=${u}&text=${t}`} target="_blank" rel="noopener noreferrer">X</a>
      <a className={btn} aria-label="Share on Facebook" href={`https://www.facebook.com/sharer/sharer.php?u=${u}`} target="_blank" rel="noopener noreferrer">f</a>
      <CopyLink url={url} compact />
    </div>
  );
}
