"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DriverMessagesDesktopLive, DriverMessagesMobileLive } from "@/components/qiilu/ride-chat";
import { getSession, type SessionUser } from "@/lib/auth-session";

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
    return null;
  }

  return (
    <>
      <DriverMessagesDesktopLive user={user} />
      <div className="lg:hidden">
        <DriverMessagesMobileLive user={user} />
      </div>
    </>
  );
}
