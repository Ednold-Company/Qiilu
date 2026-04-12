"use client";

import PassengerFavouritesPage from "../page";
import { DesktopRouteRedirect } from "@/components/desktop-route-redirect";

export default function PassengerFavouritesDesktopRoute() {
  return (
    <DesktopRouteRedirect baseHref="/passenger/favourites">
      <PassengerFavouritesPage />
    </DesktopRouteRedirect>
  );
}
