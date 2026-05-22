"use client";

import { PassengerGuard } from "@/components/qiilu/passenger-shell";
import { PassengerFavouritesMobilePage } from "@/components/qiilu/passenger-mobile-routes";
import { PassengerFavouritesDesktopPage } from "@/components/qiilu/passenger-desktop-routes";
import { ResponsiveRoute } from "@/components/responsive-route";

export default function PassengerFavouritesPage() {
  return (
    <PassengerGuard>
      {({ user }) => (
        <ResponsiveRoute
          loadingLabel="Opening favourites..."
          desktop={() => <PassengerFavouritesDesktopPage user={user} />}
          mobile={() => <PassengerFavouritesMobilePage />}
        />
      )}
    </PassengerGuard>
  );
}
