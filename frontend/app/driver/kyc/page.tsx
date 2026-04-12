"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DriverKycDesktopPage, DriverKycMobilePage } from "@/components/qiilu/kyc-pages";
import { getSession, type SessionUser } from "@/lib/auth-session";

export default function DriverKycPage() {
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
      <div className="hidden lg:block">
        <DriverKycDesktopPage user={user} />
      </div>
      <div className="lg:hidden">
        <DriverKycMobilePage user={user} />
      </div>
    </>
  );
}
