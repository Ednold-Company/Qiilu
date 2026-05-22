"use client";

import { PassengerGuard } from "@/components/qiilu/passenger-shell";
import {
  PassengerMessagesDesktopLive,
  PassengerMessagesMobileLive
} from "@/components/qiilu/ride-chat";
import { ResponsiveRoute } from "@/components/responsive-route";

export default function PassengerMessagesPage() {
  return (
    <PassengerGuard>
      {({ user }) => (
        <ResponsiveRoute
          loadingLabel="Opening messages..."
          desktop={() => <PassengerMessagesDesktopLive user={user} />}
          mobile={() => <PassengerMessagesMobileLive user={user} />}
        />
      )}
    </PassengerGuard>
  );
}
