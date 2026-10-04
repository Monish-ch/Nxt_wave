import type { MetadataRoute } from "next"

/**
 * PWA manifest — makes the growth engine installable (Android/desktop Chrome
 * install prompt, iOS "Add to Home Screen" styling). The ambassador board is
 * the bookmark-and-return surface, so a standalone display + branded icon
 * keeps it one tap away between outreach pushes.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NxtWave AI Workshop Growth Engine",
    short_name: "NxtWave",
    description:
      "Build Your First AI Project in 60 Minutes — track registrations, referral milestones and campus leaderboard standings in real time.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#7c3aed",
    categories: ["education", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        // Maskable variant: art is centered, so it survives circular masks.
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Register for the workshop",
        url: "/register",
        description: "Reserve a free spot for the 60-minute AI workshop",
      },
      {
        name: "Campus leaderboard",
        url: "/leaderboard",
        description: "Top referrers and college standings",
      },
    ],
  }
}
