"use client";

import DriverFavouritesPage from "../page";
import { DesktopRouteRedirect } from "@/components/desktop-route-redirect";

export default function DriverFavouritesDesktopRoute() {
  return (
    <DesktopRouteRedirect baseHref="/driver/favourites">
      <DriverFavouritesPage />
    </DesktopRouteRedirect>
  );
}
