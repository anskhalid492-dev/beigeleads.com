/** How the article may look when shared. Built from the same values the public page uses; platforms can still render differently. */
export function SocialPreviews({ title, description, image, focal }: { title: string; description: string; image: string | null; focal: string }) {
  const host = "beigeleads.com";
  const pic = image ? (
     
    <img src={image} alt="" className="aspect-[1.91/1] w-full object-cover" style={{ objectPosition: focal }} />
  ) : <div className="grid aspect-[1.91/1] w-full place-items-center bg-sand-200 text-xs">No image: shares show text only</div>;
  return (
    <div className="space-y-4">
      <figure aria-label="Facebook and LinkedIn preview" className="overflow-hidden rounded-xl border border-sand-300 bg-white">
        {pic}
        <figcaption className="border-t border-sand-200 bg-sand-50 p-3">
          <p className="text-[11px] uppercase tracking-wide">{host}</p>
          <p className="mt-0.5 line-clamp-2 text-sm font-semibold text-forest-900">{title || "Untitled"}</p>
          <p className="mt-0.5 line-clamp-2 text-xs">{description}</p>
        </figcaption>
        <p className="border-t border-sand-200 px-3 py-1.5 text-[11px]">Facebook and LinkedIn</p>
      </figure>
      <figure aria-label="X preview" className="overflow-hidden rounded-2xl border border-sand-300 bg-white">
        <div className="relative">
          {pic}
          <p className="absolute bottom-2 left-2 max-w-[85%] truncate rounded bg-black/70 px-2 py-0.5 text-xs text-white">{title || "Untitled"}</p>
        </div>
        <figcaption className="p-3"><p className="text-xs">{host}</p></figcaption>
        <p className="border-t border-sand-200 px-3 py-1.5 text-[11px]">X (large summary card)</p>
      </figure>
    </div>
  );
}
