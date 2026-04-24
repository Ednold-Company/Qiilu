"use client";

import AdminSafetyPage from "@/app/admin/safety/page";
import { DesktopRouteRedirect } from "@/components/desktop-route-redirect";

export default function AdminSafetyDesktopPage() {
  return (
    <DesktopRouteRedirect baseHref="/admin/safety">
      <AdminSafetyPage />
    </DesktopRouteRedirect>
  );
}
