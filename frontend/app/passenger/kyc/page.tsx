"use client";

import { PassengerGuard } from "@/components/qiilu/passenger-shell";
import { PassengerKycDesktopPage, PassengerKycMobilePage } from "@/components/qiilu/kyc-pages";

export default function PassengerKycPage() {
  return (
    <PassengerGuard>
      {({ user }) => (
        <>
          <div className="hidden lg:block">
            <PassengerKycDesktopPage user={user} />
          </div>
          <div className="lg:hidden">
            <PassengerKycMobilePage user={user} />
          </div>
        </>
      )}
    </PassengerGuard>
  );
}
