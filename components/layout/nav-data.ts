// Placeholder navigation. Categories shown here are the launch seed (CLAUDE.md section 14).
export const megaMenu = [
  { heading: "Health & beauty", items: [{ label: "Dentists", href: "/lists/dentists" }] },
  { heading: "Food & dining", items: [{ label: "Restaurants", href: "/lists/restaurants" }] },
  { heading: "Retail", items: [{ label: "Ski shops", href: "/lists/ski-shops" }] },
] as const;

export const mainNav = [
  { label: "Solutions", href: "/solutions" },
  { label: "How it works", href: "/how-it-works" },
  { label: "Compare", href: "/compare" },
  { label: "FAQ", href: "/faq" },
] as const;
