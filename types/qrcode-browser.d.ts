// The pure-JS (no fs, no canvas needed for SVG) build of the `qrcode` package, safe for Workers.
declare module "qrcode/lib/browser.js" {
  export function toString(text: string, opts?: { margin?: number; width?: number; errorCorrectionLevel?: "L" | "M" | "Q" | "H" }): Promise<string>;
}
