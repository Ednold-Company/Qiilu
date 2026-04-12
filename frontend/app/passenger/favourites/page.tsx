"use client";

import { PassengerGuard } from "@/components/qiilu/passenger-shell";
import { PassengerFavouritesMobilePage } from "@/components/qiilu/passenger-mobile-routes";
import { PassengerFavouritesDesktopPage } from "@/components/qiilu/passenger-desktop-routes";

export default function PassengerFavouritesPage() {
  return (
    <PassengerGuard>
      {({ user }) => (
        <>
          <PassengerFavouritesDesktopPage user={user} />
          <div className="lg:hidden">
            <PassengerFavouritesMobilePage />
          </div>
        </>
      )}
    </PassengerGuard>
  );
}
