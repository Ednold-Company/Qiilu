"use client";

import { PassengerGuard } from "@/components/qiilu/passenger-shell";
import {
  PassengerMessagesDesktopLive,
  PassengerMessagesMobileLive
} from "@/components/qiilu/ride-chat";

export default function PassengerMessagesPage() {
  return (
    <PassengerGuard>
      {({ user }) => (
        <>
          <PassengerMessagesDesktopLive user={user} />
          <div className="lg:hidden">
            <PassengerMessagesMobileLive user={user} />
          </div>
        </>
      )}
    </PassengerGuard>
  );
}
