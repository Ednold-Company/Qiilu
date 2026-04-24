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
  ShieldCheck,
  Siren,
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

const emptySummary: AdminSummary = {
  users: [],
  rides: [],
  payouts: [],
  incidents: [],
  kycs: [],
  driversOnline: 0
};

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
  const [message, setMessage] = useState("Connecting to Qiilu control room...");

  const loadAdminData = useCallback(async () => {
    const [summaryPayload, dispatchPayload, kycPayload, payoutPayload, incidentPayload] = await Promise.all([
      fetchJson<AdminSummary>("/admin/summary"),
      fetchJson<{ liveRides: DispatchRide[]; drivers: DispatchDriver[] }>("/admin/dispatch"),
      fetchJson<{ submissions: KycSubmission[] }>("/admin/kyc"),
      fetchJson<{ payouts: PayoutRequest[] }>("/admin/payouts"),
      fetchJson<{ incidents: Incident[] }>("/admin/incidents")
    ]);

    setSummary(summaryPayload);
    setDispatch(dispatchPayload);
    setKyc(kycPayload.submissions);
    setPayouts(payoutPayload.payouts);
    setIncidents(incidentPayload.incidents);
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

  const getCount = (items: SummaryBucket[], key: string) =>
    items.find((item) => item.role === key || item.status === key)?._count._all ?? 0;

  const passengerCount = getCount(summary.users, "PASSENGER");
  const driverCount = getCount(summary.users, "DRIVER");
  const searchingRides = getCount(summary.rides, "SEARCHING");
  const inProgressRides = getCount(summary.rides, "IN_PROGRESS");
  const pendingPayouts = getCount(summary.payouts, "PENDING");
  const openIncidents = getCount(summary.incidents, "OPEN");
  const pendingKyc = getCount(summary.kycs, "PENDING");
  const approvedKyc = getCount(summary.kycs, "APPROVED");
  const rejectedKyc = getCount(summary.kycs, "REJECTED");
  const totalUsers = passengerCount + driverCount;
  const liveDrivers = dispatch.drivers.filter((driver) => driver.availability === "AVAILABLE").length;

  const navItems = [
    { href: "#overview", label: "Overview", icon: LayoutDashboard },
    { href: "#dispatch", label: "Dispatch", icon: MapPinned },
    { href: "#kyc", label: "KYC", icon: FileCheck2 },
    { href: "#payouts", label: "Payouts", icon: Wallet },
    { href: "#safety", label: "Safety", icon: Siren }
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
                <a
                  key={href}
                  href={href}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-muted-foreground transition hover:bg-primary/8 hover:text-foreground"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted/70">
                    <Icon className="h-4 w-4" />
                  </span>
                  {label}
                </a>
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
                          <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                            {ride.status.replaceAll("_", " ")}
                          </span>
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
                              <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                                {submission.status}
                              </span>
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
                        <span className="rounded-full bg-lime-500/10 px-3 py-1 text-xs font-semibold text-lime-700 dark:text-lime-300">
                          {payout.status}
                        </span>
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
                        <span className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary">
                          {driver.availability.replaceAll("_", " ").toLowerCase()}
                        </span>
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
                        <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                          {incident.severity}
                        </span>
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
