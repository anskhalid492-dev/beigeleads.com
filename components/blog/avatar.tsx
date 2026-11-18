/** Author photo, or a neutral initials avatar when none exists. Never a stock or generated face. */
export function AuthorAvatar({ photo, name, size = 40, className = "" }: { photo: string | null | undefined; name: string; size?: number; className?: string }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";
  const box = { width: size, height: size } as const;
  if (photo) {
    return <img src={photo} alt="" width={size} height={size} loading="lazy" decoding="async" style={box} className={`shrink-0 rounded-full bg-sand-100 object-cover ${className}`} />;
  }
  return (
    <span aria-hidden style={{ ...box, fontSize: Math.max(11, size * 0.36) }} className={`grid shrink-0 place-items-center rounded-full bg-forest-100 font-bold text-forest-900 ${className}`}>
      {initials}
    </span>
  );
}
