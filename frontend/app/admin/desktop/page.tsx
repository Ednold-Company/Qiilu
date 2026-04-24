"use client";

import AdminPage from "@/app/admin/page";
import { DesktopRouteRedirect } from "@/components/desktop-route-redirect";

export default function AdminDesktopPage() {
  return (
    <DesktopRouteRedirect baseHref="/admin">
      <AdminPage />
    </DesktopRouteRedirect>
  );
}
