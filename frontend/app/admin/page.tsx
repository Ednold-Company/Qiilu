"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BadgeDollarSign,
  BarChart3,
  CarFront,
  CheckCircle2,
  Clock3,
  FileCheck2,
  LayoutDashboard,
  MapPinned,
  RefreshCw,
  ShieldCheck,
  Siren,
  TrendingUp,
  UserRoundCheck,
  Users,
  Wallet
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { fetchJson } from "@/lib/api";
import { clearSession, getSession, type SessionUser } from "@/lib/auth-session";

type SummaryBucket = {
  role?: string;
  status?: string;
  _count: { _all: number };
};

type AdminSummary = {
  users: SummaryBucket[];
  rides: SummaryBucket[];
  payouts: SummaryBucket[];
  incidents: SummaryBucket[];
  kycs: SummaryBucket[];
  driversOnline: number;
};

type DispatchRide = {
  id: string;
  pickup: string;
  destination: string;
  status: string;
  requestSource: string;
  estimatedFareGhs: number;
  passenger: { name: string; phone: string };
  driver: { name: string; phone: string; availability: string } | null;
};

type DispatchDriver = {
  id: string;
  name: string;
  phone: string;
  availability: string;
  kycStatus: string | null;
  lastSeenAt: string | null;
};

type KycSubmission = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  documentUrl: string;
  notes: string | null;
  user: { name: string; phone: string; role: string };
};

type PayoutRequest = {
  id: string;
  amountGhs: number;
  provider: string;
  accountRef: string;
  status: "PENDING" | "PROCESSING" | "PAID" | "REJECTED";
  wallet: {
    user: { name: string; phone: string };
  };
};

type Incident = {
  id: string;
  category: string;
  severity: string;
  status: string;
  description: string;
  reporter: { name: string; phone: string; role: string };
};

type SnapshotHistory = {
  at: string;
  driversOnline: number;
  liveRides: number;
  pendingKyc: number;
  pendingPayouts: number;
  openIncidents: number;
};

const emptySummary: AdminSummary = {
  users: [],
  rides: [],
  payouts: [],
  incidents: [],
  kycs: [],
  driversOnline: 0
};

function getBucketCount(items: SummaryBucket[], key: string) {
  return items.find((item) => item.role === key || item.status === key)?._count._all ?? 0;
}

function parseKycNotes(notes: string | null) {
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
      selfieProvided: parsed.selfieProvided === true,
      selfieImageUrl: typeof parsed.selfieImageUrl === "string" ? parsed.selfieImageUrl : null,
      notes: typeof parsed.notes === "string" ? parsed.notes : null
    };
  } catch {
    return { notes };
  }
}

function isImageReference(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  return value.startsWith("data:image/") || /\.(png|jpe?g|webp|gif|bmp|svg)(\?.*)?$/i.test(value);
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  tone: string;
}) {
  return (
    <div className="rounded-[1.6rem] border border-border/80 bg-card/95 p-5 shadow-sm backdrop-blur">
      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${tone}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 text-3xl font-extrabold tracking-tight">{value}</div>
    </div>
  );
}

function PanelHeader({ title, meta }: { title: string; meta: string }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{meta}</p>
      </div>
    </div>
  );
}

function formatTrend(current: number, total: number) {
  if (!total) {
    return "0% share";
  }

  return `${Math.round((current / total) * 100)}% share`;
}

function MiniBarChart({
  items
}: {
  items: Array<{ label: string; value: number; tone: string }>;
}) {
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label} className="space-y-1.5">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">{item.label}</span>
            <span className="font-semibold">{item.value}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted/80">
            <div
              className={`h-full rounded-full ${item.tone}`}
              style={{ width: `${Math.max((item.value / maxValue) * 100, item.value ? 12 : 0)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function MetricsTimeline({
  items
}: {
  items: Array<{ label: string; value: string; meta: string }>;
}) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.label} className="flex items-start gap-3">
          <div className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
          <div className="min-w-0">
            <div className="text-sm font-semibold">{item.label}</div>
            <div className="text-lg font-extrabold tracking-tight">{item.value}</div>
            <div className="text-xs text-muted-foreground">{item.meta}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusPill({
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

function TinyTrendChart({
  title,
  value,
  tone,
  points
}: {
  title: string;
  value: string;
  tone: string;
  points: number[];
}) {
  const maxValue = Math.max(...points, 1);

  return (
    <div className="rounded-[1.5rem] border border-border/80 bg-card/95 p-4 shadow-sm">
      <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{title}</div>
      <div className="mt-2 text-2xl font-extrabold tracking-tight">{value}</div>
      <div className="mt-4 flex h-24 items-end gap-2">
        {points.map((point, index) => (
          <div key={`${title}-${index}`} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
            <div
              className={`w-full rounded-t-full ${tone}`}
              style={{ height: `${Math.max((point / maxValue) * 100, point ? 10 : 4)}%` }}
            />
            <div className="text-[10px] text-muted-foreground">{index + 1}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [summary, setSummary] = useState<AdminSummary>(emptySummary);
  const [dispatch, setDispatch] = useState<{ liveRides: DispatchRide[]; drivers: DispatchDriver[] }>({
    liveRides: [],
    drivers: []
  });
  const [kyc, setKyc] = useState<KycSubmission[]>([]);
  const [kycReviewNotes, setKycReviewNotes] = useState<Record<string, string>>({});
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [history, setHistory] = useState<SnapshotHistory[]>([]);
  const [message, setMessage] = useState("Connecting to Qiilu control room...");

  const loadAdminData = useCallback(async () => {
    const [summaryPayload, dispatchPayload, kycPayload, payoutPayload, incidentPayload, metricsHistoryPayload] = await Promise.all([
      fetchJson<AdminSummary>("/admin/summary"),
      fetchJson<{ liveRides: DispatchRide[]; drivers: DispatchDriver[] }>("/admin/dispatch"),
      fetchJson<{ submissions: KycSubmission[] }>("/admin/kyc"),
      fetchJson<{ payouts: PayoutRequest[] }>("/admin/payouts"),
      fetchJson<{ incidents: Incident[] }>("/admin/incidents"),
      fetchJson<{ snapshots: SnapshotHistory[] }>("/admin/metrics-history?limit=24")
    ]);

    setSummary(summaryPayload);
    setDispatch(dispatchPayload);
    setKyc(kycPayload.submissions);
    setPayouts(payoutPayload.payouts);
    setIncidents(incidentPayload.incidents);
    setHistory(metricsHistoryPayload.snapshots);
    setMessage("Live operational data synced");
  }, []);

  useEffect(() => {
    const session = getSession();

    if (!session || session.user.role !== "ADMIN") {
      router.replace("/login?admin=1");
      return;
    }

    setUser(session.user);
  }, [router]);

  useEffect(() => {
    if (!user) {
      return;
    }

    loadAdminData().catch((caughtError) => {
      setMessage(caughtError instanceof Error ? caughtError.message : "Could not load admin dashboard.");
    });

    const intervalId = window.setInterval(() => {
      void loadAdminData().catch(() => undefined);
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, [loadAdminData, user]);

  const reviewKyc = async (submissionId: string, status: "APPROVED" | "REJECTED") => {
    await fetchJson(`/admin/kyc/${submissionId}/review`, {
      method: "POST",
      body: JSON.stringify({ status, notes: kycReviewNotes[submissionId]?.trim() || undefined })
    });
    await loadAdminData();
    setKycReviewNotes((current) => {
      const next = { ...current };
      delete next[submissionId];
      return next;
    });
    setMessage(`KYC ${status.toLowerCase()} successfully.`);
  };

  const processPayout = async (payoutId: string, action: "process" | "approve" | "reject") => {
    await fetchJson(`/admin/payouts/${payoutId}/${action}`, {
      method: "POST",
      body: JSON.stringify({ reviewerNotes: `Handled from Qiilu admin on ${new Date().toISOString()}` })
    });

    const statusMap = {
      process: "PROCESSING",
      approve: "PAID",
      reject: "REJECTED"
    } as const;

    await loadAdminData();
    setMessage(`Payout moved to ${statusMap[action].toLowerCase()}.`);
  };

  const resolveIncident = async (incidentId: string, status: "INVESTIGATING" | "RESOLVED" | "CLOSED") => {
    await fetchJson(`/admin/incidents/${incidentId}/resolve`, {
      method: "POST",
      body: JSON.stringify({ status })
    });
    await loadAdminData();
    setMessage(`Incident moved to ${status.toLowerCase()}.`);
  };

  const passengerCount = getBucketCount(summary.users, "PASSENGER");
  const driverCount = getBucketCount(summary.users, "DRIVER");
  const searchingRides = getBucketCount(summary.rides, "SEARCHING");
  const inProgressRides = getBucketCount(summary.rides, "IN_PROGRESS");
  const pendingPayouts = getBucketCount(summary.payouts, "PENDING");
  const openIncidents = getBucketCount(summary.incidents, "OPEN");
  const pendingKyc = getBucketCount(summary.kycs, "PENDING");
  const approvedKyc = getBucketCount(summary.kycs, "APPROVED");
  const rejectedKyc = getBucketCount(summary.kycs, "REJECTED");
  const totalUsers = passengerCount + driverCount;
  const liveDrivers = dispatch.drivers.filter((driver) => driver.availability === "AVAILABLE").length;
  const currentSnapshot: SnapshotHistory = {
    at: new Date().toISOString(),
    driversOnline: summary.driversOnline,
    liveRides: dispatch.liveRides.length,
    pendingKyc,
    pendingPayouts,
    openIncidents
  };
  const chartHistory = history.length
    ? [...history.slice(-23), currentSnapshot]
    : [currentSnapshot];

  const navItems = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/dispatch", label: "Dispatch", icon: MapPinned },
    { href: "/admin/kyc", label: "KYC", icon: FileCheck2 },
    { href: "/admin/finance", label: "Finance", icon: BadgeDollarSign },
    { href: "/admin/payouts", label: "Payouts", icon: Wallet },
    { href: "#trends", label: "Trends", icon: TrendingUp },
    { href: "/admin/safety", label: "Safety", icon: Siren }
  ];

  const operationsBars = [
    { label: "Drivers online", value: summary.driversOnline, tone: "bg-emerald-500" },
    { label: "Live rides", value: dispatch.liveRides.length, tone: "bg-orange-500" },
    { label: "Pending KYC", value: pendingKyc, tone: "bg-blue-500" },
    { label: "Pending payouts", value: pendingPayouts, tone: "bg-lime-500" }
  ];

  const healthTimeline = [
    {
      label: "Network supply",
      value: `${summary.driversOnline}`,
      meta: formatTrend(summary.driversOnline, Math.max(driverCount, 1))
    },
    {
      label: "Open response load",
      value: `${openIncidents}`,
      meta: openIncidents ? "Safety team attention required" : "No active escalations"
    },
    {
      label: "Manual reviews",
      value: `${pendingKyc}`,
      meta: pendingKyc ? "KYC queue needs action" : "Verification queue is clear"
    }
  ];

  const liveFeedItems = [
    {
      label: "Dashboard sync",
      value: history.length ? new Date(chartHistory[chartHistory.length - 1].at).toLocaleTimeString() : "Awaiting refresh",
      tone: "info" as const
    },
    {
      label: "KYC backlog",
      value: `${pendingKyc} waiting`,
      tone: pendingKyc ? ("warning" as const) : ("success" as const)
    },
    {
      label: "Payout queue",
      value: `${pendingPayouts} pending`,
      tone: pendingPayouts ? ("warning" as const) : ("success" as const)
    },
    {
      label: "Safety watch",
      value: `${openIncidents} open`,
      tone: openIncidents ? ("danger" as const) : ("success" as const)
    }
  ];

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

            <div className="mt-auto border-t border-border/80 p-4">
              <div className="rounded-[1.5rem] bg-[linear-gradient(135deg,rgba(249,115,22,0.14),rgba(34,197,94,0.12))] p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  System pulse
                </div>
                <MetricsTimeline items={healthTimeline} />
              </div>
            </div>
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
                <div className="text-sm text-muted-foreground">Safety, supply, payouts and trip operations</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link href="/">
                <Button variant="ghost" className="rounded-full">Home</Button>
              </Link>
              <Link href="/passenger">
                <Button variant="ghost" className="rounded-full">Passenger</Button>
              </Link>
              <Link href="/driver">
                <Button variant="ghost" className="rounded-full">Driver</Button>
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
                {user?.name.slice(0, 2).toUpperCase() ?? "OP"}
              </button>
            </div>
          </header>

          <section
            id="overview"
            className="relative mb-6 overflow-hidden rounded-[2rem] border border-border/80 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.15),transparent_24%),linear-gradient(135deg,#fff7ee_0%,#f8f8fb_52%,#eff5ff_100%)] p-6 shadow-sm dark:bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.14),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.12),transparent_20%),linear-gradient(135deg,#12171d_0%,#171c22_52%,#11161d_100%)]"
          >
            <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-secondary/25 bg-secondary/10 px-3 py-1 text-sm font-semibold text-secondary">
                  <Activity className="h-4 w-4" />
                  Realtime operational feed
                </div>
                <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight md:text-5xl">
                  Keep rides moving, drivers protected, and payouts flowing.
                </h1>
                <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
                  This is the live operations surface for Qiilu across Ghana: supply health, KYC reviews,
                  payout controls, and safety response in one cleaner command view.
                </p>
                <div className="mt-5 flex flex-wrap gap-3 text-sm">
                  <span className="rounded-full border border-border bg-card/95 px-3 py-2 font-semibold dark:bg-white/6">
                    {summary.driversOnline} drivers online
                  </span>
                  <span className="rounded-full border border-border bg-card/95 px-3 py-2 font-semibold dark:bg-white/6">
                    {dispatch.liveRides.length} live rides monitored
                  </span>
                  <span className="rounded-full border border-border bg-card/95 px-3 py-2 font-semibold dark:bg-white/6">
                    {openIncidents} open incidents
                  </span>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="rounded-[1.6rem] border border-border/80 bg-card/95 p-4 backdrop-blur dark:bg-[#171c22cc]">
                  <div className="mb-2 text-sm font-semibold text-muted-foreground">Operations pulse</div>
                  <div className="rounded-2xl bg-primary px-4 py-3 text-primary-foreground">
                    <div className="text-xs uppercase tracking-[0.22em] text-primary-foreground/75">Status</div>
                    <div className="mt-1 text-2xl font-extrabold tracking-tight">{message}</div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="rounded-2xl bg-muted/60 p-4 dark:bg-white/6">
                      <div className="text-xs text-muted-foreground">Passengers</div>
                      <div className="mt-1 text-xl font-bold">{passengerCount}</div>
                    </div>
                    <div className="rounded-2xl bg-muted/60 p-4 dark:bg-white/6">
                      <div className="text-xs text-muted-foreground">Drivers</div>
                      <div className="mt-1 text-xl font-bold">{driverCount}</div>
                    </div>
                    <div className="rounded-2xl bg-muted/60 p-4 dark:bg-white/6">
                      <div className="text-xs text-muted-foreground">Pending KYC</div>
                      <div className="mt-1 text-xl font-bold">{pendingKyc}</div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-[1.6rem] border border-border/80 bg-card/95 p-4 shadow-sm">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                      <Users className="h-4 w-4 text-primary" />
                      User mix
                    </div>
                    <MiniBarChart
                      items={[
                        { label: "Passengers", value: passengerCount, tone: "bg-blue-500" },
                        { label: "Drivers", value: driverCount, tone: "bg-emerald-500" }
                      ]}
                    />
                    <div className="mt-3 text-xs text-muted-foreground">
                      {formatTrend(driverCount, Math.max(totalUsers, 1))} of all accounts are drivers.
                    </div>
                  </div>

                  <div className="rounded-[1.6rem] border border-border/80 bg-card/95 p-4 shadow-sm">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      Verification health
                    </div>
                    <MiniBarChart
                      items={[
                        { label: "Pending", value: pendingKyc, tone: "bg-blue-500" },
                        { label: "Approved", value: approvedKyc, tone: "bg-emerald-500" },
                        { label: "Rejected", value: rejectedKyc, tone: "bg-rose-500" }
                      ]}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <StatCard icon={Users} label="Passengers" value={passengerCount} tone="bg-blue-500/10 text-blue-600 dark:text-blue-300" />
            <StatCard icon={UserRoundCheck} label="Drivers" value={driverCount} tone="bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" />
            <StatCard icon={CarFront} label="Searching rides" value={searchingRides} tone="bg-orange-500/10 text-orange-600 dark:text-orange-300" />
            <StatCard icon={Clock3} label="Active rides" value={inProgressRides} tone="bg-violet-500/10 text-violet-600 dark:text-violet-300" />
            <StatCard icon={BadgeDollarSign} label="Pending payouts" value={pendingPayouts} tone="bg-lime-500/10 text-lime-700 dark:text-lime-300" />
            <StatCard icon={Siren} label="Open incidents" value={openIncidents} tone="bg-rose-500/10 text-rose-600 dark:text-rose-300" />
          </section>

          <section className="mb-6 grid gap-6 2xl:grid-cols-[1.25fr_0.75fr]">
            <article className="rounded-[1.8rem] border border-border/80 bg-card/95 p-5 shadow-sm">
              <PanelHeader title="Live network metrics" meta="A quick operating picture of supply, demand, risk and finance" />
              <div className="grid gap-4 lg:grid-cols-[1fr_0.95fr]">
                <div className="rounded-[1.5rem] border border-border/80 bg-muted/30 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                    <Activity className="h-4 w-4 text-primary" />
                    Operations load
                  </div>
                  <MiniBarChart items={operationsBars} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-border/80 bg-muted/30 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Dispatch readiness</div>
                    <div className="mt-2 text-3xl font-extrabold tracking-tight">{liveDrivers}</div>
                    <div className="mt-1 text-sm text-muted-foreground">drivers immediately available</div>
                  </div>
                  <div className="rounded-[1.5rem] border border-border/80 bg-muted/30 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Queue pressure</div>
                    <div className="mt-2 text-3xl font-extrabold tracking-tight">{pendingKyc + pendingPayouts}</div>
                    <div className="mt-1 text-sm text-muted-foreground">manual reviews awaiting action</div>
                  </div>
                  <div className="rounded-[1.5rem] border border-border/80 bg-muted/30 p-4 sm:col-span-2">
                    <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Safety watch</div>
                    <div className="mt-2 flex items-end justify-between gap-4">
                      <div className="text-3xl font-extrabold tracking-tight">{openIncidents}</div>
                      <div className="text-right text-sm text-muted-foreground">
                        {openIncidents ? "Cases still need attention from the ops desk." : "No active risk escalation right now."}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </article>

            <article className="rounded-[1.8rem] border border-border/80 bg-card/95 p-5 shadow-sm">
              <PanelHeader title="Ops priorities" meta="What deserves the team's attention first" />
              <MetricsTimeline
                items={[
                  {
                    label: "KYC queue",
                    value: `${pendingKyc}`,
                    meta: pendingKyc ? "Move identity reviews to keep driver supply growing." : "No waiting submissions."
                  },
                  {
                    label: "Finance queue",
                    value: `${pendingPayouts}`,
                    meta: pendingPayouts ? "Driver cash-out requests need review." : "No payout backlog."
                  },
                  {
                    label: "Safety queue",
                    value: `${openIncidents}`,
                    meta: openIncidents ? "Escalations are open and should be triaged." : "No current incident queue."
                  }
                ]}
              />
            </article>
          </section>

          <section id="trends" className="mb-6 rounded-[1.8rem] border border-border/80 bg-card/95 p-5 shadow-sm">
            <PanelHeader
              title="Live trend window"
              meta="These charts build from real admin refreshes during the current session, so the ops team can spot direction, not just totals."
            />
            <div className="grid gap-4 xl:grid-cols-4">
              <TinyTrendChart
                title="Drivers online"
                value={`${chartHistory[chartHistory.length - 1]?.driversOnline ?? 0}`}
                tone="bg-emerald-500"
                points={chartHistory.map((point) => point.driversOnline)}
              />
              <TinyTrendChart
                title="Live rides"
                value={`${chartHistory[chartHistory.length - 1]?.liveRides ?? 0}`}
                tone="bg-orange-500"
                points={chartHistory.map((point) => point.liveRides)}
              />
              <TinyTrendChart
                title="Pending KYC"
                value={`${chartHistory[chartHistory.length - 1]?.pendingKyc ?? 0}`}
                tone="bg-blue-500"
                points={chartHistory.map((point) => point.pendingKyc)}
              />
              <TinyTrendChart
                title="Open incidents"
                value={`${chartHistory[chartHistory.length - 1]?.openIncidents ?? 0}`}
                tone="bg-rose-500"
                points={chartHistory.map((point) => point.openIncidents)}
              />
            </div>
          </section>

          <section className="grid flex-1 gap-6 xl:grid-cols-[1.25fr_0.95fr]">
            <div className="grid gap-6">
              <article id="dispatch" className="rounded-[1.8rem] border border-border/80 bg-card/95 p-5 shadow-sm">
                <PanelHeader title="Live dispatch" meta="Rides currently searching, assigned, or moving through active stages" />
                <div className="grid gap-3">
                  {dispatch.liveRides.length ? dispatch.liveRides.map((ride) => (
                    <div key={ride.id} className="rounded-[1.3rem] border border-border/80 bg-card/88 p-4">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                            {ride.requestSource}
                          </span>
                          <StatusPill
                            label={ride.status.replaceAll("_", " ")}
                            tone={
                              ride.status === "IN_PROGRESS"
                                ? "success"
                                : ride.status === "SEARCHING"
                                  ? "warning"
                                  : ride.status === "CANCELLED"
                                    ? "danger"
                                    : "info"
                            }
                          />
                        </div>
                        <strong className="text-lg">GHS {ride.estimatedFareGhs.toFixed(2)}</strong>
                      </div>
                      <div className="grid gap-2 md:grid-cols-[1fr_auto] md:items-center">
                        <div>
                          <div className="font-bold">{ride.pickup} to {ride.destination}</div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            Passenger: {ride.passenger.name} | {ride.passenger.phone}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground md:text-right">
                          Driver: {ride.driver?.name ?? "Unassigned"}
                        </div>
                      </div>
                    </div>
                  )) : <div className="rounded-[1.3rem] border border-dashed border-border p-6 text-center text-muted-foreground">No active rides in dispatch right now.</div>}
                </div>
              </article>

              <article id="kyc" className="rounded-[1.8rem] border border-border/80 bg-card/95 p-5 shadow-sm">
                <PanelHeader title="KYC review queue" meta="Approve or reject new driver verification submissions" />
                <div className="grid gap-3">
                  {kyc.length ? kyc.map((submission) => (
                    <div key={submission.id} className="rounded-[1.3rem] border border-border/80 bg-card/88 p-4">
                      {(() => {
                        const details = parseKycNotes(submission.notes);

                        return (
                          <>
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                  <FileCheck2 className="h-5 w-5" />
                                </div>
                                <div>
                                  <div className="font-bold">{submission.user.name}</div>
                                  <div className="text-sm text-muted-foreground">{submission.user.phone} | {submission.user.role}</div>
                                </div>
                              </div>
                              <StatusPill
                                label={submission.status}
                                tone={
                                  submission.status === "APPROVED"
                                    ? "success"
                                    : submission.status === "REJECTED"
                                      ? "danger"
                                      : "warning"
                                }
                              />
                            </div>
                            <div className="mb-4 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                              <div>Document: {details?.documentType ?? "Not specified"}</div>
                              <div>Number: {details?.documentNumber ?? "Not specified"}</div>
                              <div>Name: {details?.legalName ?? "Not specified"}</div>
                              <div>Country: {details?.issuingCountry ?? "Not specified"}</div>
                            </div>
                            <div className="mb-4 grid gap-3 md:grid-cols-2">
                              <div className="rounded-2xl border border-border/80 bg-muted/30 p-3">
                                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                  Document preview
                                </div>
                                {isImageReference(submission.documentUrl) ? (
                                  <img
                                    src={submission.documentUrl}
                                    alt={`${submission.user.name} KYC document`}
                                    className="h-36 w-full rounded-xl object-cover"
                                  />
                                ) : (
                                  <div className="flex h-36 items-center justify-center rounded-xl bg-background text-sm text-muted-foreground">
                                    Preview unavailable for this file type
                                  </div>
                                )}
                              </div>
                              <div className="rounded-2xl border border-border/80 bg-muted/30 p-3">
                                <div className="mb-2 flex items-center justify-between gap-3">
                                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                    Selfie check
                                  </div>
                                  <span className="text-xs font-semibold text-muted-foreground">
                                    {details?.selfieProvided ? "Provided" : "Missing"}
                                  </span>
                                </div>
                                {details?.selfieImageUrl ? (
                                  <img
                                    src={details.selfieImageUrl}
                                    alt={`${submission.user.name} selfie verification`}
                                    className="h-36 w-full rounded-xl object-cover"
                                  />
                                ) : (
                                  <div className="flex h-36 items-center justify-center rounded-xl bg-background text-sm text-muted-foreground">
                                    No selfie captured yet
                                  </div>
                                )}
                              </div>
                            </div>
                            {details?.notes ? <p className="mb-4 text-sm text-muted-foreground">{details.notes}</p> : null}
                            <div className="mb-4 rounded-2xl border border-border/80 bg-muted/30 p-4">
                              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                Selfie comparison note
                              </div>
                              <div className="mb-3 flex flex-wrap gap-2">
                                {[
                                  "Selfie matches document",
                                  "Selfie does not match document",
                                  "Selfie unclear, needs manual follow-up"
                                ].map((option) => (
                                  <button
                                    key={option}
                                    type="button"
                                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                                      kycReviewNotes[submission.id] === option
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-border bg-background text-muted-foreground"
                                    }`}
                                    onClick={() =>
                                      setKycReviewNotes((current) => ({
                                        ...current,
                                        [submission.id]: option
                                      }))
                                    }
                                  >
                                    {option}
                                  </button>
                                ))}
                              </div>
                              <textarea
                                value={kycReviewNotes[submission.id] ?? ""}
                                onChange={(event) =>
                                  setKycReviewNotes((current) => ({
                                    ...current,
                                    [submission.id]: event.target.value
                                  }))
                                }
                                placeholder="Add any extra review context for this submission"
                                className="min-h-24 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none"
                              />
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Link href={submission.documentUrl} target="_blank">
                                <Button variant="outline" className="rounded-full">Open document</Button>
                              </Link>
                              {details?.selfieImageUrl ? (
                                <Link href={details.selfieImageUrl} target="_blank">
                                  <Button variant="outline" className="rounded-full">Open selfie</Button>
                                </Link>
                              ) : null}
                              <Button variant="outline" className="rounded-full" onClick={() => reviewKyc(submission.id, "REJECTED")}>
                                Reject
                              </Button>
                              <Button className="rounded-full" onClick={() => reviewKyc(submission.id, "APPROVED")}>
                                Approve
                              </Button>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )) : <div className="rounded-[1.3rem] border border-dashed border-border p-6 text-center text-muted-foreground">No KYC submissions waiting.</div>}
                </div>
              </article>
            </div>

            <div className="grid gap-6">
              <div className="xl:sticky xl:top-5 xl:z-10">
                <article className="rounded-[1.8rem] border border-border/80 bg-card/95 p-5 shadow-sm">
                  <PanelHeader title="Ops activity rail" meta="Keep the most urgent queues and live motion in view while you work" />
                  <div className="space-y-4">
                    <div className="rounded-[1.4rem] border border-border/80 bg-[linear-gradient(135deg,rgba(249,115,22,0.08),rgba(14,165,233,0.08))] p-4">
                      <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                        <RefreshCw className="h-4 w-4 text-primary" />
                        Sync health
                      </div>
                      <div className="text-2xl font-extrabold tracking-tight">{message}</div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        Refresh cadence is every 15 seconds while this admin console stays open.
                      </div>
                    </div>

                    <div className="space-y-3">
                      {liveFeedItems.map((item) => (
                        <div key={item.label} className="flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-muted/30 px-4 py-3">
                          <div>
                            <div className="text-sm font-semibold">{item.label}</div>
                            <div className="text-xs text-muted-foreground">Live operational signal</div>
                          </div>
                          <StatusPill label={item.value} tone={item.tone} />
                        </div>
                      ))}
                    </div>

                    <div className="rounded-[1.4rem] border border-border/80 bg-muted/30 p-4">
                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        Queue heat
                      </div>
                      <MiniBarChart
                        items={[
                          { label: "KYC queue", value: pendingKyc, tone: "bg-blue-500" },
                          { label: "Payout queue", value: pendingPayouts, tone: "bg-lime-500" },
                          { label: "Safety queue", value: openIncidents, tone: "bg-rose-500" }
                        ]}
                      />
                    </div>
                  </div>
                </article>
              </div>

              <article id="payouts" className="rounded-[1.8rem] border border-border/80 bg-card/95 p-5 shadow-sm">
                <PanelHeader title="Payout queue" meta="Approve and track MoMo payout requests from drivers" />
                <div className="grid gap-3">
                  {payouts.length ? payouts.slice(0, 5).map((payout) => (
                    <div key={payout.id} className="rounded-[1.3rem] border border-border/80 bg-card/88 p-4">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <div className="font-bold">{payout.wallet.user.name}</div>
                          <div className="text-sm text-muted-foreground">{payout.provider} | {payout.accountRef}</div>
                        </div>
                        <StatusPill
                          label={payout.status}
                          tone={
                            payout.status === "PAID"
                              ? "success"
                              : payout.status === "REJECTED"
                                ? "danger"
                                : payout.status === "PROCESSING"
                                  ? "info"
                                  : "warning"
                          }
                        />
                      </div>
                      <div className="mb-4 flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">Requested amount</div>
                        <div className="text-xl font-extrabold">GHS {payout.amountGhs.toFixed(2)}</div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" className="rounded-full" onClick={() => processPayout(payout.id, "process")}>
                          Process
                        </Button>
                        <Button className="rounded-full" onClick={() => processPayout(payout.id, "approve")}>
                          Approve
                        </Button>
                        <Button variant="outline" className="rounded-full" onClick={() => processPayout(payout.id, "reject")}>
                          Reject
                        </Button>
                      </div>
                    </div>
                  )) : <div className="rounded-[1.3rem] border border-dashed border-border p-6 text-center text-muted-foreground">No payouts waiting right now.</div>}
                </div>
              </article>

              <article className="rounded-[1.8rem] border border-border/80 bg-card/95 p-5 shadow-sm">
                <PanelHeader title="Driver availability" meta="Current supply snapshot and last-seen state" />
                <div className="grid gap-3">
                  {dispatch.drivers.length ? dispatch.drivers.map((driver) => (
                    <div key={driver.id} className="rounded-[1.3rem] border border-border/80 bg-card/88 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-bold">{driver.name}</div>
                          <div className="text-sm text-muted-foreground">{driver.phone}</div>
                        </div>
                        <StatusPill
                          label={driver.availability.replaceAll("_", " ").toLowerCase()}
                          tone={driver.availability === "AVAILABLE" ? "success" : driver.availability === "BUSY" ? "warning" : "neutral"}
                        />
                      </div>
                      <div className="mt-3 grid gap-1 text-sm text-muted-foreground">
                        <span>KYC: {driver.kycStatus ?? "pending review"}</span>
                        <span>Last seen: {driver.lastSeenAt ? new Date(driver.lastSeenAt).toLocaleString() : "no signal yet"}</span>
                      </div>
                    </div>
                  )) : <div className="rounded-[1.3rem] border border-dashed border-border p-6 text-center text-muted-foreground">No drivers tracked yet.</div>}
                </div>
              </article>

              <article id="safety" className="rounded-[1.8rem] border border-border/80 bg-card/95 p-5 shadow-sm">
                <PanelHeader title="Safety incidents" meta="Escalations, fraud flags, and emergency support cases" />
                <div className="grid gap-3">
                  {incidents.length ? incidents.slice(0, 5).map((incident) => (
                    <div key={incident.id} className="rounded-[1.3rem] border border-border/80 bg-card/88 p-4">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-300">
                            <AlertTriangle className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-bold">{incident.category}</div>
                            <div className="text-sm text-muted-foreground">{incident.reporter.name} | {incident.reporter.role.toLowerCase()}</div>
                          </div>
                        </div>
                        <StatusPill
                          label={incident.severity}
                          tone={
                            incident.severity === "CRITICAL"
                              ? "danger"
                              : incident.severity === "HIGH"
                                ? "warning"
                                : "neutral"
                          }
                        />
                      </div>
                      <p className="mb-4 text-sm text-muted-foreground">{incident.description}</p>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" className="rounded-full" onClick={() => resolveIncident(incident.id, "INVESTIGATING")}>
                          Investigate
                        </Button>
                        <Button className="rounded-full" onClick={() => resolveIncident(incident.id, "RESOLVED")}>
                          Resolve
                        </Button>
                        <Button variant="outline" className="rounded-full" onClick={() => resolveIncident(incident.id, "CLOSED")}>
                          Close
                        </Button>
                      </div>
                    </div>
                  )) : <div className="rounded-[1.3rem] border border-dashed border-border p-6 text-center text-muted-foreground">No support incidents reported.</div>}
                </div>
              </article>
            </div>
          </section>

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
              <CheckCircle2 className="h-4 w-4 text-secondary" />
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}
