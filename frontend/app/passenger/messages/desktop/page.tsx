"use client";

import PassengerMessagesPage from "../page";
import { DesktopRouteRedirect } from "@/components/desktop-route-redirect";

export default function PassengerMessagesDesktopRoute() {
  return (
    <DesktopRouteRedirect baseHref="/passenger/messages">
      <PassengerMessagesPage />
    </DesktopRouteRedirect>
  );
}
