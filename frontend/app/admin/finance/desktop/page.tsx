"use client";

import AdminFinancePage from "@/app/admin/finance/page";
import { DesktopRouteRedirect } from "@/components/desktop-route-redirect";

export default function AdminFinanceDesktopPage() {
  return (
    <DesktopRouteRedirect baseHref="/admin/finance">
      <AdminFinancePage />
    </DesktopRouteRedirect>
  );
}
