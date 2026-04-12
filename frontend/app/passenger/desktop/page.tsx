"use client";

import PassengerPage from "../page";
import { DesktopRouteRedirect } from "@/components/desktop-route-redirect";

export default function PassengerDesktopRoute() {
  return (
    <DesktopRouteRedirect baseHref="/passenger">
      <PassengerPage />
    </DesktopRouteRedirect>
  );
}
