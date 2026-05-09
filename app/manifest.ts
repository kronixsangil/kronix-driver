//app\manifest.ts
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KroniX Driver",
    short_name: "KroniX Driver",
    description: "App de conductores KroniX",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#16a34a",
    icons: [
      {
        src: "/kronix-icon.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/kronix-icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}