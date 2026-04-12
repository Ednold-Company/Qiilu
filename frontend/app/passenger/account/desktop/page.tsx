"use client";

import PassengerAccountPage from "../page";
import { DesktopRouteRedirect } from "@/components/desktop-route-redirect";

export default function PassengerAccountDesktopRoute() {
  return (
    <DesktopRouteRedirect baseHref="/passenger/account">
      <PassengerAccountPage />
    </DesktopRouteRedirect>
  );
}
