"use client";

import { PassengerGuard } from "@/components/qiilu/passenger-shell";
import { PassengerAccountMobilePage } from "@/components/qiilu/passenger-mobile-routes";
import { PassengerAccountDesktopPage } from "@/components/qiilu/passenger-desktop-routes";

export default function PassengerAccountPage() {
  return (
    <PassengerGuard>
      {({ user }) => (
        <>
          <PassengerAccountDesktopPage user={user} />
          <div className="lg:hidden">
            <PassengerAccountMobilePage sessionUser={user} />
          </div>
        </>
      )}
    </PassengerGuard>
  );
}
