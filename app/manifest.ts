import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BeigeLeads",
    short_name: "BeigeLeads",
    description: "B2B data provider. Pay once, own the list.",
    start_url: "/",
    display: "browser",
    background_color: "#fbf8f1",
    theme_color: "#0f2a1d",
    icons: [
      { src: "/brand/favicon/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/favicon/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
