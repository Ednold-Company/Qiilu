"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  BadgeDollarSign,
  CarFront,
  FileCheck2,
  LayoutDashboard,
  MapPinned,
  RefreshCw,
  ShieldCheck,
  Siren,
  Wallet
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { fetchJson } from "@/lib/api";
import { clearSession, getSession, type SessionUser } from "@/lib/auth-session";

export type AdminSummaryBucket = {
  role?: string;
  status?: string;
  _count: { _all: number };
};

export type DispatchRide = {
  id: string;
  pickup: string;
  destination: string;
  status: string;
  requestSource: string;
  estimatedFareGhs: number;
  passenger: { name: string; phone: string };
  driver: { name: string; phone: string; availability: string } | null;
};

export type KycSubmission = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  documentUrl: string;
  notes: string | null;
  user: { name: string; phone: string; role: string };
};

export type PayoutRequest = {
  id: string;
  amountGhs: number;
  provider: string;
  accountRef: string;
  status: "PENDING" | "PROCESSING" | "PAID" | "REJECTED";
  wallet: {
    user: { name: string; phone: string };
  };
};

export type Incident = {
  id: string;
  category: string;
  severity: string;
  status: string;
  description: string;
  reporter: { name: string; phone: string; role: string };
};

export function parseKycNotes(notes: string | null) {
  if (!notes) {
    return null;
  }

  try {
    const parsed = JSON.parse(notes) as Record<string, unknown>;
    return {
      documentType: typeof parsed.documentType === "string" ? parsed.documentType.replaceAll("_", " ") : null,
      documentNumber: typeof parsed.documentNumber === "string" ? parsed.documentNumber : null,
      legalName: typeof parsed.legalName === "string" ? parsed.legalName : null,
      issuingCountry: typeof parsed.issuingCountry === "string" ? parsed.issuingCountry : null,
      documentBackUrl: typeof parsed.documentBackUrl === "string" ? parsed.documentBackUrl : null,
      selfieProvided: parsed.selfieProvided === true,
      selfieImageUrl: typeof parsed.selfieImageUrl === "string" ? parsed.selfieImageUrl : null,
      movementCheckPassed: parsed.movementCheckPassed === true,
      movementCheckPrompt: typeof parsed.movementCheckPrompt === "string" ? parsed.movementCheckPrompt : null,
      notes: typeof parsed.notes === "string" ? parsed.notes : null
    };
  } catch {
    return {
      documentType: null,
      documentNumber: null,
      legalName: null,
      issuingCountry: null,
      documentBackUrl: null,
      selfieProvided: false,
      selfieImageUrl: null,
      movementCheckPassed: false,
      movementCheckPrompt: null,
      notes
    };
  }
}

export function isImageReference(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  return value.startsWith("data:image/") || /\.(png|jpe?g|webp|gif|bmp|svg)(\?.*)?$/i.test(value);
}

export function StatusPill({
  label,
  tone
}: {
  label: string;
  tone: "neutral" | "success" | "warning" | "danger" | "info";
}) {
  const tones = {
    neutral: "bg-muted text-muted-foreground",
    success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    warning: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    danger: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
    info: "bg-blue-500/10 text-blue-700 dark:text-blue-300"
  } as const;

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tones[tone]}`}>
      {label}
    </span>
  );
}

export function PanelHeader({ title, meta }: { title: string; meta: string }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{meta}</p>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.3rem] border border-border/80 bg-muted/30 p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-extrabold tracking-tight">{value}</div>
    </div>
  );
}

export function AdminShell({
  title,
  subtitle,
  rail,
  metrics,
  children
}: {
  title: string;
  subtitle: string;
  rail?: ReactNode;
  metrics?: Array<{ label: string; value: string }>;
  children: ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    const session = getSession();

    if (!session || session.user.role !== "ADMIN") {
      router.replace("/login?admin=1");
      return;
    }

    setUser(session.user);
  }, [router]);

  const navItems = useMemo(
    () => [
      { href: "/admin", label: "Overview", icon: LayoutDashboard },
      { href: "/admin/dispatch", label: "Dispatch", icon: MapPinned },
      { href: "/admin/drivers", label: "Drivers", icon: CarFront },
      { href: "/admin/kyc", label: "KYC", icon: FileCheck2 },
      { href: "/admin/finance", label: "Finance", icon: BadgeDollarSign },
      { href: "/admin/payouts", label: "Payouts", icon: Wallet },
      { href: "/admin/safety", label: "Safety", icon: Siren }
    ],
    []
  );

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(241,245,249,0.92))] text-foreground dark:bg-[linear-gradient(180deg,#0d1117,#11161c)]">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-6 px-4 py-5 sm:px-6 xl:px-8">
        <aside className="sticky top-5 hidden h-[calc(100vh-2.5rem)] w-[290px] shrink-0 xl:flex xl:flex-col">
          <div className="flex h-full flex-col overflow-hidden rounded-[2rem] border border-border/80 bg-card/95 shadow-sm backdrop-blur">
            <div className="border-b border-border/80 px-5 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground">
                  Q
                </div>
                <div>
                  <div className="text-lg font-bold tracking-tight">Qiilu Control Room</div>
                  <div className="text-sm text-muted-foreground">Ops dashboard</div>
                </div>
              </div>
            </div>

            <div className="space-y-2 px-4 py-5">
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-muted-foreground transition hover:bg-primary/8 hover:text-foreground"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted/70">
                    <Icon className="h-4 w-4" />
                  </span>
                  {label}
                </Link>
              ))}
            </div>

            {rail ? <div className="mt-auto border-t border-border/80 p-4">{rail}</div> : null}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="mb-6 flex flex-col gap-4 rounded-[1.8rem] border border-border/80 bg-card/95 px-5 py-4 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between dark:bg-[#151a20d9]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground xl:hidden">
                Q
              </div>
              <div>
                <div className="text-lg font-bold tracking-tight">Qiilu Control Room</div>
                <div className="text-sm text-muted-foreground">{subtitle}</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link href="/">
                <Button variant="ghost" className="rounded-full">Home</Button>
              </Link>
              <ThemeToggle className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background" />
              <button
                type="button"
                className="flex h-10 min-w-10 items-center justify-center rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground"
                onClick={() => {
                  fetchJson("/auth/logout", { method: "POST" })
                    .catch(() => undefined)
                    .finally(() => {
                      clearSession();
                      router.push("/login?admin=1");
                    });
                }}
              >
                {user.name.slice(0, 2).toUpperCase()}
              </button>
            </div>
          </header>

          <nav className="-mt-2 mb-6 xl:hidden">
            <div className="flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border/80 bg-card/95 px-4 py-2 text-sm font-semibold text-muted-foreground shadow-sm backdrop-blur transition hover:border-primary/30 hover:text-foreground"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
            </div>
          </nav>

          <section className="mb-6 rounded-[2rem] border border-border/80 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.15),transparent_24%),linear-gradient(135deg,#fff7ee_0%,#f8f8fb_52%,#eff5ff_100%)] p-6 shadow-sm dark:bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.14),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.12),transparent_20%),linear-gradient(135deg,#12171d_0%,#171c22_52%,#11161d_100%)]">
            <div className="inline-flex items-center gap-2 rounded-full border border-secondary/25 bg-secondary/10 px-3 py-1 text-sm font-semibold text-secondary">
              <RefreshCw className="h-4 w-4" />
              Dedicated operations view
            </div>
            <h1 className="mt-4 max-w-3xl text-3xl font-extrabold tracking-tight md:text-5xl">{title}</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">{subtitle}</p>
            {metrics?.length ? (
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {metrics.map((metric) => (
                  <MetricCard key={metric.label} label={metric.label} value={metric.value} />
                ))}
              </div>
            ) : null}
          </section>

          {children}

          <footer className="mt-6 flex flex-col gap-3 rounded-[1.8rem] border border-border/80 bg-card/95 px-5 py-4 text-sm text-muted-foreground shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Admin actions are running against live Qiilu API endpoints.
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <ArrowUpRight className="h-4 w-4" />
                Use this console for review and escalation only
              </span>
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}

export function useAdminRealtime<T>(loader: () => Promise<T>, initialData: T) {
  const [data, setData] = useState<T>(initialData);
  const [message, setMessage] = useState("Connecting to Qiilu control room...");

  useEffect(() => {
    let active = true;

    const run = async () => {
      try {
        const next = await loader();
        if (!active) {
          return;
        }
        setData(next);
        setMessage("Live operational data synced");
      } catch (caughtError) {
        if (!active) {
          return;
        }
        setMessage(caughtError instanceof Error ? caughtError.message : "Could not load admin data.");
      }
    };

    void run();
    const intervalId = window.setInterval(() => {
      void run();
    }, 15000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [loader]);

  return { data, setData, message, setMessage };
}
