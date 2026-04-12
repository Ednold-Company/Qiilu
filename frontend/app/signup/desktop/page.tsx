"use client";

import SignupPage from "../page";
import { DesktopRouteRedirect } from "@/components/desktop-route-redirect";

export default function SignupDesktopRoute() {
  return (
    <DesktopRouteRedirect baseHref="/signup">
      <SignupPage />
    </DesktopRouteRedirect>
  );
}
