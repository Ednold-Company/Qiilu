import type { Metadata } from "next";
import Script from "next/script";
import "leaflet/dist/leaflet.css";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "Qiilu",
  description: "African-first ride hailing platform for passengers and drivers.",
  manifest: "/manifest.webmanifest",
  applicationName: "Qiilu",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Qiilu"
  },
  icons: {
    icon: "/icon",
    apple: "/apple-icon"
  }
};

export const viewport = {
  themeColor: "#f06700",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <PwaRegister />
        <Script id="qiilu-theme-init" strategy="beforeInteractive">
          {`
            try {
              const storageKey = "qiilu-theme";
              const stored = window.localStorage.getItem(storageKey);
              const mode = stored === "light" || stored === "dark"
                ? stored
                : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
              document.documentElement.classList.toggle("dark", mode === "dark");
              document.documentElement.dataset.theme = mode;
              document.cookie = "qiilu-theme=" + mode + "; path=/; max-age=31536000; SameSite=Lax";
            } catch (error) {
              document.documentElement.classList.remove("dark");
              document.documentElement.dataset.theme = "light";
            }
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}
