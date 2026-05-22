"use client";

import { PassengerGuard } from "@/components/qiilu/passenger-shell";
import { PassengerAccountMobilePage } from "@/components/qiilu/passenger-mobile-routes";
import { PassengerAccountDesktopPage } from "@/components/qiilu/passenger-desktop-routes";
import { ResponsiveRoute } from "@/components/responsive-route";

export default function PassengerAccountPage() {
  return (
    <PassengerGuard>
      {({ user }) => (
        <ResponsiveRoute
          loadingLabel="Opening passenger account..."
          desktop={() => <PassengerAccountDesktopPage user={user} />}
          mobile={() => <PassengerAccountMobilePage sessionUser={user} />}
        />
      )}
    </PassengerGuard>
  );
}
