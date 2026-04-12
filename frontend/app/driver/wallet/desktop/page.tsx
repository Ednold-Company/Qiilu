"use client";

import DriverWalletPage from "../page";
import { DesktopRouteRedirect } from "@/components/desktop-route-redirect";

export default function DriverWalletDesktopRoute() {
  return (
    <DesktopRouteRedirect baseHref="/driver/wallet">
      <DriverWalletPage />
    </DesktopRouteRedirect>
  );
}
