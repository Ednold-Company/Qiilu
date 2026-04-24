"use client";

import AdminPayoutsPage from "@/app/admin/payouts/page";
import { DesktopRouteRedirect } from "@/components/desktop-route-redirect";

export default function AdminPayoutsDesktopPage() {
  return (
    <DesktopRouteRedirect baseHref="/admin/payouts">
      <AdminPayoutsPage />
    </DesktopRouteRedirect>
  );
}
