import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Qiilu Admin",
  description: "Admin operations console for Qiilu dispatch, KYC, payouts, safety, and driver supply.",
  manifest: "/admin/manifest.webmanifest",
  applicationName: "Qiilu Admin",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Qiilu Admin"
  },
  icons: {
    icon: "/admin/icon",
    apple: "/admin/apple-icon"
  }
};

export default function AdminLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
