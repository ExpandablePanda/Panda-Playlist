import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "StageVault",
    short_name: "StageVault",
    description: "Live music dashboard for setlists, lyrics, requests, and reports.",
    start_url: "/app",
    display: "standalone",
    background_color: "#0a0b0f",
    theme_color: "#14080b",
    icons: [
      {
        src: "/app-icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
