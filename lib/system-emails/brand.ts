/** Email design tokens: ONLY the existing brand palette (CLAUDE.md section 4). Logo files are the approved ones in public/brand. */
export const SITE = "https://beigeleads.com";
export const BRAND = {
  sand50: "#FBF8F1", sand100: "#F4EEDF", sand200: "#E8DEC6",
  forest100: "#D8EADF", forest500: "#2D6A4F", forest700: "#1B4332", forest900: "#0F2A1D",
  purple600: "#7C3AED",
  logoLight: `${SITE}/brand/png/beigeleads-horizontal-light.png`,
  logoDark: `${SITE}/brand/png/beigeleads-horizontal-dark.png`,
  font: "'Bricolage Grotesque', 'Segoe UI', Helvetica, Arial, sans-serif",
  company: "BeigeLeads LLC, 215 W Pershing Rd, Kansas City, MO 64108",
} as const;
