"use client";

import { PassengerGuard } from "@/components/qiilu/passenger-shell";
import { PassengerKycDesktopPage, PassengerKycMobilePage } from "@/components/qiilu/kyc-pages";
import { ResponsiveRoute } from "@/components/responsive-route";

export default function PassengerKycPage() {
  return (
    <PassengerGuard>
      {({ user }) => (
        <ResponsiveRoute
          loadingLabel="Opening passenger KYC..."
          desktop={() => <PassengerKycDesktopPage user={user} />}
          mobile={() => <PassengerKycMobilePage user={user} />}
        />
      )}
    </PassengerGuard>
  );
}
