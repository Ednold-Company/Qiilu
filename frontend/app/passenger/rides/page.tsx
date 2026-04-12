"use client";

import { PassengerGuard } from "@/components/qiilu/passenger-shell";
import { PassengerRidesMobilePage } from "@/components/qiilu/passenger-mobile-routes";
import { PassengerRidesDesktopPage } from "@/components/qiilu/passenger-desktop-routes";

export default function PassengerRidesPage() {
  return (
    <PassengerGuard>
      {({ user }) => (
        <>
          <PassengerRidesDesktopPage user={user} />
          <div className="lg:hidden">
            <PassengerRidesMobilePage user={user} />
          </div>
        </>
      )}
    </PassengerGuard>
  );
}
