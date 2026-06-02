"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DriverSupportDesktopPage } from "@/components/qiilu/driver-desktop-routes";
import { DriverSupportMobilePage } from "@/components/qiilu/driver-mobile-routes";
import { getSession, type SessionUser } from "@/lib/auth-session";
import { ResponsiveRoute, RouteLoadingScreen } from "@/components/responsive-route";

export default function DriverSupportPage() {
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
    return <RouteLoadingScreen label="Opening support..." />;
  }

  return (
    <ResponsiveRoute
      loadingLabel="Opening support..."
      desktop={() => <DriverSupportDesktopPage user={user} />}
      mobile={() => <DriverSupportMobilePage />}
    />
  );
}
