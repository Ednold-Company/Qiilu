"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DriverAccountMobilePage } from "@/components/qiilu/driver-mobile-routes";
import { DriverAccountDesktopPage } from "@/components/qiilu/driver-desktop-routes";
import { getSession, type SessionUser } from "@/lib/auth-session";

export default function DriverAccountPage() {
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
    <>
      <DriverAccountDesktopPage user={user} />
      <div className="lg:hidden">
        <DriverAccountMobilePage sessionUser={user} />
      </div>
    </>
  );
}
