/** Email design tokens: ONLY the existing brand palette (CLAUDE.md section 4). Logo files are the approved ones in public/brand. */
export const SITE = "https://beigeleads.com";
export const BRAND = {
  sand50: "#FBF8F1", sand100: "#F4EEDF", sand200: "#E8DEC6",
  forest100: "#D8EADF", forest500: "#2D6A4F", forest700: "#1B4332", forest900: "#0F2A1D",
  purple600: "#7C3AED", purple100: "#EDE4FD", sand300: "#D8C9A3", forest300: "#8FD0A9",
  logoLight: `${SITE}/brand/png/beigeleads-horizontal-light.png`,
  logoDark: `${SITE}/brand/png/beigeleads-horizontal-dark.png`,
  font: "'Bricolage Grotesque', 'Segoe UI', Helvetica, Arial, sans-serif",
  company: "BeigeLeads LLC, 215 W Pershing Rd, Kansas City, MO 64108",
} as const;

/** Founder signature photo (email-safe JPEG made from the owner's About-page photo). */
export const FOUNDER_PHOTO = `${SITE}/founder/anus-192.jpg`;
