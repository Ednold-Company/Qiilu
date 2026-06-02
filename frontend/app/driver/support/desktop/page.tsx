"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DesktopRouteRedirect } from "@/components/desktop-route-redirect";
import { DriverSupportDesktopPage } from "@/components/qiilu/driver-desktop-routes";
import { getSession, type SessionUser } from "@/lib/auth-session";

export default function DriverSupportDesktopRoute() {
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
    return null;
  }

  return (
    <DesktopRouteRedirect baseHref="/driver/support">
      <DriverSupportDesktopPage user={user} />
    </DesktopRouteRedirect>
  );
}
