"use client";

import AdminDriversPage from "@/app/admin/drivers/page";
import { DesktopRouteRedirect } from "@/components/desktop-route-redirect";

export default function AdminDriversDesktopPage() {
  return (
    <DesktopRouteRedirect baseHref="/admin/drivers">
      <AdminDriversPage />
    </DesktopRouteRedirect>
  );
}
