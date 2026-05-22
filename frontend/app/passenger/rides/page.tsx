"use client";

import { PassengerGuard } from "@/components/qiilu/passenger-shell";
import { PassengerRidesMobilePage } from "@/components/qiilu/passenger-mobile-routes";
import { PassengerRidesDesktopPage } from "@/components/qiilu/passenger-desktop-routes";
import { ResponsiveRoute } from "@/components/responsive-route";

export default function PassengerRidesPage() {
  return (
    <PassengerGuard>
      {({ user }) => (
        <ResponsiveRoute
          loadingLabel="Opening your rides..."
          desktop={() => <PassengerRidesDesktopPage user={user} />}
          mobile={() => <PassengerRidesMobilePage user={user} />}
        />
      )}
    </PassengerGuard>
  );
}
