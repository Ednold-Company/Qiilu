"use client";

import DriverAccountPage from "../page";
import { DesktopRouteRedirect } from "@/components/desktop-route-redirect";

export default function DriverAccountDesktopRoute() {
  return (
    <DesktopRouteRedirect baseHref="/driver/account">
      <DriverAccountPage />
    </DesktopRouteRedirect>
  );
}
