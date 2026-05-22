"use client";

import { useEffect, useState, type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";

export function RouteLoadingScreen({ label = "Loading Qiilu..." }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <div className="rounded-[2rem] border border-border bg-card px-6 py-5 text-center shadow-sm">
        <LoaderCircle className="mx-auto mb-3 h-6 w-6 animate-spin text-primary" />
        <div className="text-sm font-bold">{label}</div>
        <div className="mt-1 text-xs text-muted-foreground">Preparing the right screen for your device.</div>
      </div>
    </div>
  );
}

export function ResponsiveRoute({
  desktop,
  mobile,
  loadingLabel
}: {
  desktop: () => ReactNode;
  mobile: () => ReactNode;
  loadingLabel?: string;
}) {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const sync = () => setIsDesktop(mediaQuery.matches);

    sync();
    mediaQuery.addEventListener("change", sync);

    return () => mediaQuery.removeEventListener("change", sync);
  }, []);

  if (isDesktop === null) {
    return <RouteLoadingScreen label={loadingLabel} />;
  }

  return <>{isDesktop ? desktop() : mobile()}</>;
}
