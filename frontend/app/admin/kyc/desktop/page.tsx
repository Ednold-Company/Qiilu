"use client";

import AdminKycPage from "@/app/admin/kyc/page";
import { DesktopRouteRedirect } from "@/components/desktop-route-redirect";

export default function AdminKycDesktopPage() {
  return (
    <DesktopRouteRedirect baseHref="/admin/kyc">
      <AdminKycPage />
    </DesktopRouteRedirect>
  );
}
