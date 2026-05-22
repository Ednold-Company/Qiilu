"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DriverHomeMobilePage } from "@/components/qiilu/driver-mobile-routes";
import { DriverHomeDesktopPage } from "@/components/qiilu/driver-desktop-routes";
import { getSession, type AuthSession, type SessionUser } from "@/lib/auth-session";
import { ResponsiveRoute, RouteLoadingScreen } from "@/components/responsive-route";

export default function DriverPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const session = getSession();

    if (!session || session.user.role !== "DRIVER") {
      router.replace("/login");
      return;
    }

    setUser(session.user);
    setToken((session as AuthSession).token);
  }, [router]);

  if (!user || !token) {
    return <RouteLoadingScreen label="Opening driver dashboard..." />;
  }

  return (
    <ResponsiveRoute
      loadingLabel="Opening driver dashboard..."
      desktop={() => <DriverHomeDesktopPage user={user} />}
      mobile={() => <DriverHomeMobilePage user={user} />}
    />
  );
}
