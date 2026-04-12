"use client";

import { PassengerGuard } from "@/components/qiilu/passenger-shell";
import { PassengerPaymentsMobilePage } from "@/components/qiilu/passenger-mobile-routes";
import { PassengerPaymentsDesktopPage } from "@/components/qiilu/passenger-desktop-routes";

export default function PassengerPaymentPage() {
  return (
    <PassengerGuard>
      {({ user }) => (
        <>
          <PassengerPaymentsDesktopPage user={user} />
          <div className="lg:hidden">
            <PassengerPaymentsMobilePage />
          </div>
        </>
      )}
    </PassengerGuard>
  );
}
