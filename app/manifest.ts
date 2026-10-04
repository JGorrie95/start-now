import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Start Now",
    short_name: "Start Now",
    description: "From stuck to started. One small, doable next step for overwhelmed brains.",
    start_url: "/",
    display: "standalone",
    background_color: "#EAE3D2",
    theme_color: "#2F6F5E",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
