import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Qiilu",
    short_name: "Qiilu",
    description: "African-first ride hailing platform for passengers, drivers, and operations.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#101317",
    theme_color: "#f06700",
    categories: ["travel", "navigation", "business"],
    icons: [
      {
        src: "/icon?size=192",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/icon?size=512",
        sizes: "512x512",
        type: "image/png"
      },
      {
        src: "/icon?size=512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ],
    shortcuts: [
      {
        name: "Book a ride",
        short_name: "Book",
        url: "/passenger",
        description: "Open the passenger booking flow"
      },
      {
        name: "Driver console",
        short_name: "Drive",
        url: "/driver",
        description: "Open the driver dashboard"
      }
    ]
  };
}
