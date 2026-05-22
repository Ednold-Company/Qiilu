"use client";

import { PassengerGuard } from "@/components/qiilu/passenger-shell";
import { PassengerPaymentsMobilePage } from "@/components/qiilu/passenger-mobile-routes";
import { PassengerPaymentsDesktopPage } from "@/components/qiilu/passenger-desktop-routes";
import { ResponsiveRoute } from "@/components/responsive-route";

export default function PassengerPaymentPage() {
  return (
    <PassengerGuard>
      {({ user }) => (
        <ResponsiveRoute
          loadingLabel="Opening payments..."
          desktop={() => <PassengerPaymentsDesktopPage user={user} />}
          mobile={() => <PassengerPaymentsMobilePage />}
        />
      )}
    </PassengerGuard>
  );
}
