import type { MetadataRoute } from "next";

const adminManifest: MetadataRoute.Manifest = {
  name: "Qiilu Admin",
  short_name: "Qiilu Admin",
  description: "Admin operations console for Qiilu dispatch, KYC, payouts, safety, and driver supply.",
  start_url: "/admin",
  scope: "/admin",
  display: "standalone",
  orientation: "any",
  background_color: "#08111f",
  theme_color: "#0f766e",
  categories: ["business", "productivity", "utilities"],
  icons: [
    {
      src: "/admin/icon?size=192",
      sizes: "192x192",
      type: "image/png"
    },
    {
      src: "/admin/icon?size=512",
      sizes: "512x512",
      type: "image/png"
    },
    {
      src: "/admin/icon?size=512",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable"
    }
  ],
  shortcuts: [
    {
      name: "KYC Review",
      short_name: "KYC",
      url: "/admin/kyc",
      description: "Review identity verification submissions"
    },
    {
      name: "Dispatch Desk",
      short_name: "Dispatch",
      url: "/admin/dispatch",
      description: "Monitor live dispatch and rides"
    },
    {
      name: "Safety Desk",
      short_name: "Safety",
      url: "/admin/safety",
      description: "Open safety and incident operations"
    }
  ]
};

export function GET() {
  return Response.json(adminManifest, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
