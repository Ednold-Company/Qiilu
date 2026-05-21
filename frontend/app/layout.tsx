import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "Qiilu",
  description: "African-first ride hailing platform for passengers and drivers.",
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
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
