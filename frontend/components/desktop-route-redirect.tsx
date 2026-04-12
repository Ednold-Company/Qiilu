"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

type DesktopRouteRedirectProps = {
  baseHref: string;
  children: ReactNode;
};

export function DesktopRouteRedirect({ baseHref, children }: DesktopRouteRedirectProps) {
  const router = useRouter();
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    const syncViewport = () => {
      const nextIsDesktop = window.innerWidth >= 1024;
      setIsDesktop(nextIsDesktop);

      if (!nextIsDesktop) {
        router.replace(baseHref);
      }
    };

    syncViewport();
    window.addEventListener("resize", syncViewport);

    return () => window.removeEventListener("resize", syncViewport);
  }, [baseHref, router]);

  if (isDesktop === null) {
    return null;
  }

  if (!isDesktop) {
    return null;
  }

  return <>{children}</>;
}
