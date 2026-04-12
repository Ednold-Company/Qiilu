"use client";

import LoginPage from "../page";
import { DesktopRouteRedirect } from "@/components/desktop-route-redirect";

export default function LoginDesktopRoute() {
  return (
    <DesktopRouteRedirect baseHref="/login">
      <LoginPage />
    </DesktopRouteRedirect>
  );
}
