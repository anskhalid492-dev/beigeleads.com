/** Official BeigeLeads logo (public/brand). "light" for light backgrounds, "dark" for dark ones. */
export function BrandLogo({ variant = "light", className = "h-8 w-auto" }: { variant?: "light" | "dark"; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/brand/svg/beigeleads-horizontal-${variant}.svg`} alt="BeigeLeads" width={280} height={64} className={className} />
  );
}
