"use client";

import DriverRidesPage from "../page";
import { DesktopRouteRedirect } from "@/components/desktop-route-redirect";

export default function DriverRidesDesktopRoute() {
  return (
    <DesktopRouteRedirect baseHref="/driver/rides">
      <DriverRidesPage />
    </DesktopRouteRedirect>
  );
}
