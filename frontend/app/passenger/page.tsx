"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PassengerScreen } from "@/components/qiilu/passenger";
import { getSession, type AuthSession, type SessionUser } from "@/lib/auth-session";

export default function PassengerPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const session = getSession();

    if (!session || session.user.role !== "PASSENGER") {
      router.replace("/login");
      return;
    }

    setUser(session.user);
    setToken((session as AuthSession).token);
  }, [router]);

  if (!user || !token) {
    return null;
  }

  return <PassengerScreen user={user} token={token} />;
}
