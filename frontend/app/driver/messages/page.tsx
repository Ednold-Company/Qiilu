"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DriverMessagesDesktopLive, DriverMessagesMobileLive } from "@/components/qiilu/ride-chat";
import { getSession, type SessionUser } from "@/lib/auth-session";
import { ResponsiveRoute, RouteLoadingScreen } from "@/components/responsive-route";

export default function DriverMessagesPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    const session = getSession();

    if (!session || session.user.role !== "DRIVER") {
      router.replace("/login");
      return;
    }

    setUser(session.user);
  }, [router]);

  if (!user) {
    return <RouteLoadingScreen label="Opening driver messages..." />;
  }

  return (
    <ResponsiveRoute
      loadingLabel="Opening driver messages..."
      desktop={() => <DriverMessagesDesktopLive user={user} />}
      mobile={() => <DriverMessagesMobileLive user={user} />}
    />
  );
}
