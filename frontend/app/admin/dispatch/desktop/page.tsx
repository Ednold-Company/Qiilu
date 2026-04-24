"use client";

import AdminDispatchPage from "@/app/admin/dispatch/page";
import { DesktopRouteRedirect } from "@/components/desktop-route-redirect";

export default function AdminDispatchDesktopPage() {
  return (
    <DesktopRouteRedirect baseHref="/admin/dispatch">
      <AdminDispatchPage />
    </DesktopRouteRedirect>
  );
}
