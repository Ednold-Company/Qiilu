"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Car,
  CreditCard,
  Heart,
  Home,
  LoaderCircle,
  LogOut,
  MessageSquare,
  ShieldCheck
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { clearSession, getSession, type AuthSession, type SessionUser } from "@/lib/auth-session";
import { fetchJson } from "@/lib/api";

type PassengerGuardProps = {
  children: (session: { user: SessionUser; token: string }) => ReactNode;
};

type PassengerSectionShellProps = {
  user: SessionUser;
  title: string;
  subtitle: string;
  children: ReactNode;
};

type PassengerNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const passengerNavItems: PassengerNavItem[] = [
  { href: "/passenger", label: "Home", icon: Home },
  { href: "/passenger/rides", label: "My Rides", icon: Car },
  { href: "/passenger/messages", label: "Messages", icon: MessageSquare },
  { href: "/passenger/favourites", label: "Favourites", icon: Heart },
  { href: "/passenger/payment", label: "Payment", icon: CreditCard },
  { href: "/passenger/safety", label: "Safety", icon: ShieldCheck }
];

export function PassengerGuard({ children }: PassengerGuardProps) {
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
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <LoaderCircle className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children({ user, token })}</>;
}

export function PassengerSectionShell({
  user,
  title,
  subtitle,
  children
}: PassengerSectionShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const initials = useMemo(
    () =>
      user.name
        .split(" ")
        .map((item) => item[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    [user.name]
  );

  const logout = () => {
    fetchJson("/auth/logout", { method: "POST" })
      .catch(() => undefined)
      .finally(() => {
        clearSession();
        router.push("/login");
      });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="hidden min-h-screen lg:flex">
        <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col justify-between border-r border-border bg-card dark:bg-[#151a20]">
          <div>
            <div className="flex items-center gap-3 p-6">
              <Image src="/qiilu.png" alt="Qiilu" width={132} height={40} className="h-9 w-auto" priority />
            </div>
            <nav className="space-y-2 px-4">
              {passengerNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
                      isActive
                        ? "bg-primary/10 font-bold text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="border-t border-border p-4">
            <div className="flex items-center gap-3 rounded-xl p-3 hover:bg-muted">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-secondary font-bold text-white">
                {initials}
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold">{user.name}</div>
                <div className="text-xs text-muted-foreground">{user.phone}</div>
              </div>
              <button
                type="button"
                onClick={logout}
                className="rounded-full p-2 text-muted-foreground hover:bg-background hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-border bg-background/90 px-6 backdrop-blur dark:bg-[#12171dcc]">
            <div>
              <h1 className="text-lg font-bold">{title}</h1>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
            <ThemeToggle />
          </header>
          <div className="min-h-[calc(100vh-4rem)] overflow-y-auto p-6">{children}</div>
        </main>
      </div>

      <div className="lg:hidden">
        <header className="sticky top-0 z-20 border-b border-border bg-background/90 px-5 pb-4 pt-6 backdrop-blur">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Passenger
              </div>
              <h1 className="text-xl font-bold">{title}</h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-sm" />
              <button
                type="button"
                onClick={logout}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-card text-muted-foreground shadow-sm"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {passengerNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${
                    isActive
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </header>
        <main className="min-h-[calc(100vh-8rem)] overflow-y-auto px-5 py-5">{children}</main>
      </div>
    </div>
  );
}
