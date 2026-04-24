"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BadgeDollarSign,
  CarFront,
  CheckCircle2,
  Clock3,
  FileCheck2,
  ShieldCheck,
  Siren,
  UserRoundCheck,
  Users
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
      router.replace("/login");
      return;
    }

    setUser(session.user);
  }, [router]);

  useEffect(() => {
    if (!user) {
      return;
    }

    loadAdminData()
      .catch((caughtError) => {
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

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 rounded-[1.8rem] border border-border/80 bg-card/95 px-5 py-4 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between dark:bg-[#151a20d9]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground">
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
                    router.push("/login");
                  });
              }}
            >
              {user?.name.slice(0, 2).toUpperCase() ?? "OP"}
            </button>
          </div>
        </header>

        <section className="relative mb-6 overflow-hidden rounded-[2rem] border border-border/80 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.15),transparent_24%),linear-gradient(135deg,#fff7ee_0%,#f8f8fb_52%,#eff5ff_100%)] p-6 shadow-sm dark:bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.14),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.12),transparent_20%),linear-gradient(135deg,#12171d_0%,#171c22_52%,#11161d_100%)]">
          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-secondary/25 bg-secondary/10 px-3 py-1 text-sm font-semibold text-secondary">
                <Activity className="h-4 w-4" />
                Realtime operational feed
              </div>
              <h1 className="max-w-2xl text-4xl font-extrabold tracking-tight md:text-5xl">
                Keep rides moving, drivers protected, and payouts flowing.
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
                Qiilu&apos;s admin surface is built for real transport operations across Ghana:
                live dispatch awareness, KYC reviews, payout approvals, and incident response in one place.
              </p>
              <div className="mt-5 flex flex-wrap gap-3 text-sm">
                <span className="rounded-full border border-border bg-card/95 px-3 py-2 font-semibold dark:bg-white/6">
                  {summary.driversOnline} drivers online
                </span>
                <span className="rounded-full border border-border bg-card/95 px-3 py-2 font-semibold dark:bg-white/6">
                  {dispatch.liveRides.length} live rides monitored
                </span>
                <span className="rounded-full border border-border bg-card/95 px-3 py-2 font-semibold dark:bg-white/6">
                  {getCount(summary.incidents, "OPEN")} open incidents
                </span>
              </div>
            </div>

            <div className="grid gap-3 rounded-[1.6rem] border border-border/80 bg-card/95 p-4 backdrop-blur dark:bg-[#171c22cc]">
              <div className="text-sm font-semibold text-muted-foreground">Operations pulse</div>
              <div className="rounded-2xl bg-primary px-4 py-3 text-primary-foreground">
                <div className="text-xs uppercase tracking-[0.22em] text-primary-foreground/75">Status</div>
                <div className="mt-1 text-2xl font-extrabold tracking-tight">{message}</div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-muted/60 p-4 dark:bg-white/6">
                  <div className="text-xs text-muted-foreground">Passengers</div>
                  <div className="mt-1 text-xl font-bold">{getCount(summary.users, "PASSENGER")}</div>
                </div>
                <div className="rounded-2xl bg-muted/60 p-4 dark:bg-white/6">
                  <div className="text-xs text-muted-foreground">Drivers</div>
                  <div className="mt-1 text-xl font-bold">{getCount(summary.users, "DRIVER")}</div>
                </div>
                <div className="rounded-2xl bg-muted/60 p-4 dark:bg-white/6">
                  <div className="text-xs text-muted-foreground">Pending KYC</div>
                  <div className="mt-1 text-xl font-bold">{getCount(summary.kycs, "PENDING")}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <StatCard icon={Users} label="Passengers" value={getCount(summary.users, "PASSENGER")} tone="bg-blue-500/10 text-blue-600 dark:text-blue-300" />
          <StatCard icon={UserRoundCheck} label="Drivers" value={getCount(summary.users, "DRIVER")} tone="bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" />
          <StatCard icon={CarFront} label="Searching rides" value={getCount(summary.rides, "SEARCHING")} tone="bg-orange-500/10 text-orange-600 dark:text-orange-300" />
          <StatCard icon={Clock3} label="Active rides" value={getCount(summary.rides, "IN_PROGRESS")} tone="bg-violet-500/10 text-violet-600 dark:text-violet-300" />
          <StatCard icon={BadgeDollarSign} label="Pending payouts" value={getCount(summary.payouts, "PENDING")} tone="bg-lime-500/10 text-lime-700 dark:text-lime-300" />
          <StatCard icon={Siren} label="Open incidents" value={getCount(summary.incidents, "OPEN")} tone="bg-rose-500/10 text-rose-600 dark:text-rose-300" />
        </section>

        <section className="grid flex-1 gap-6 xl:grid-cols-[1.25fr_0.95fr]">
          <div className="grid gap-6">
            <article className="rounded-[1.8rem] border border-border/80 bg-card/95 p-5 shadow-sm">
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
                          Passenger: {ride.passenger.name} · {ride.passenger.phone}
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

            <article className="rounded-[1.8rem] border border-border/80 bg-card/95 p-5 shadow-sm">
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
                          <div className="text-sm text-muted-foreground">{submission.user.phone} · {submission.user.role}</div>
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
            <article className="rounded-[1.8rem] border border-border/80 bg-card/95 p-5 shadow-sm">
              <PanelHeader title="Payout queue" meta="Approve and track MoMo payout requests from drivers" />
              <div className="grid gap-3">
                {payouts.length ? payouts.slice(0, 5).map((payout) => (
                  <div key={payout.id} className="rounded-[1.3rem] border border-border/80 bg-card/88 p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold">{payout.wallet.user.name}</div>
                        <div className="text-sm text-muted-foreground">{payout.provider} · {payout.accountRef}</div>
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

            <article className="rounded-[1.8rem] border border-border/80 bg-card/95 p-5 shadow-sm">
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
                          <div className="text-sm text-muted-foreground">{incident.reporter.name} · {incident.reporter.role.toLowerCase()}</div>
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
    </main>
  );
}
