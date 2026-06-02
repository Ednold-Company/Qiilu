"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  Bell,
  Car,
  CheckCircle2,
  CreditCard,
  FileText,
  Heart,
  HelpCircle,
  Home,
  LayoutDashboard,
  ListOrdered,
  MapPin,
  MessageSquare,
  Moon,
  Navigation,
  Phone,
  Power,
  Search,
  Send,
  Settings,
  ShieldBan,
  ShieldCheck,
  Sun,
  User,
  Wallet
} from "lucide-react";
import { fetchJson } from "@/lib/api";
import { clearSession, getSession, type SessionUser } from "@/lib/auth-session";
import { readDocumentFileAsDataUrl } from "@/lib/document-upload";
import { shouldUpdateLiveCoords } from "@/lib/map-motion";
import { readImageFileAsDataUrl } from "@/lib/profile-image";
import { getRealtimeUrl } from "@/lib/realtime";
import { useTheme } from "@/lib/theme";

const PassengerLiveMap = dynamic(() => import("@/components/passenger-live-map"), { ssr: false });
const WALLET_TOP_UP_MIN_GHS = 1;
const WALLET_TOP_UP_MAX_GHS = 5000;

type DriverRequestItem = {
  id: string;
  pickup: string;
  destination: string;
  fareGhs: number;
  etaMinutes: number;
  passengers: number;
  distanceKm: number;
  payment: string;
  paymentMethod: string;
  countdownSeconds: number;
  riderName: string;
};

type DriverWalletResponse = {
  wallet: {
    totalBalanceGhs: number;
    cashGhs: number;
    momoGhs: number;
    pendingWithdrawalGhs: number;
    weeklyTrips: number;
    completionRate: number;
    commissionRate: number;
    instantMomoCashoutEligible: boolean;
  };
  transactions: Array<{
    id: string;
    kind: string;
    amountGhs: number;
    channel: string;
    createdAt: string;
  }>;
  payoutRequests: Array<{
    id: string;
    amountGhs: number;
    provider: string;
    accountRef: string;
    status: string;
    createdAt: string;
  }>;
};

type WalletActionResponse = {
  message: string;
  result?: {
    status?: string;
    authorizationUrl?: string | null;
    message?: string;
  };
};

type DriverHistoryResponse = {
  upcoming: Array<{ route: string; time: string; rider: string; gross: number; net: number }>;
  past: Array<{ route: string; time: string; rider: string; gross: number; net: number }>;
  cancelled: Array<{ route: string; time: string; rider: string; gross: number; net: number }>;
};

type DriverRequestsResponse = {
  dispatchEnabled?: boolean;
  message?: string | null;
  requests: DriverRequestItem[];
};

type DriverStatusResponse = {
  status: {
    availability: "OFFLINE" | "AVAILABLE" | "ON_TRIP";
  };
};

type MeResponse = {
  user: {
    id: string;
    name: string;
    phone: string;
    email?: string | null;
    profileImageUrl?: string | null;
    role: "DRIVER";
    kycStatus?: string | null;
    availability?: "OFFLINE" | "AVAILABLE" | "ON_TRIP";
  };
};

type DriverKycResponse = {
  kycStatus: "PENDING" | "APPROVED" | "REJECTED";
  latestSubmission: {
    id: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    documentUrl: string;
    documentBackUrl: string | null;
    documentType: string | null;
    documentNumber: string | null;
    legalName: string | null;
    issuingCountry: string | null;
    selfieProvided: boolean;
    selfieImageUrl: string | null;
    movementCheckPassed: boolean;
    movementCheckPrompt: string | null;
    createdAt: string;
    reviewedAt: string | null;
  } | null;
  submissions: Array<{
    id: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    documentUrl: string;
    documentBackUrl: string | null;
    documentType: string | null;
    documentNumber: string | null;
    legalName: string | null;
    issuingCountry: string | null;
    selfieProvided: boolean;
    selfieImageUrl: string | null;
    movementCheckPassed: boolean;
    movementCheckPrompt: string | null;
    createdAt: string;
    reviewedAt: string | null;
  }>;
  requiredDocuments: string[];
};

const DRIVER_KYC_MOVEMENT_PROMPT = "Turn head left, then right before selfie upload";

type ShellProps = {
  user: SessionUser;
  title: string;
  active: "dashboard" | "rides" | "messages" | "wallet" | "account" | "favourites";
  children: ReactNode;
};

export function DriverDesktopShell({ user, title, active, children }: ShellProps) {
  const { isDark, ready, toggleTheme } = useTheme();
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
        window.location.href = "/login";
      });
  };

  const navItems = [
    { href: "/driver/desktop", label: "Dashboard", icon: LayoutDashboard, key: "dashboard" as const },
    { href: "/driver/rides/desktop", label: "My Rides", icon: Car, key: "rides" as const },
    { href: "/driver/messages/desktop", label: "Messages", icon: MessageSquare, key: "messages" as const },
    { href: "/driver/wallet/desktop", label: "Earnings Wallet", icon: Wallet, key: "wallet" as const },
    { href: "/driver/account/desktop", label: "Profile", icon: User, key: "account" as const },
    { href: "/driver/favourites/desktop", label: "Favourites", icon: Heart, key: "favourites" as const }
  ];

  return (
    <div className="hidden min-h-screen bg-background text-foreground lg:flex">
      <aside className="flex w-64 shrink-0 flex-col justify-between border-r border-border bg-card">
        <div>
          <div className="border-b border-border p-6">
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <Image src="/qiilu.png" alt="Qiilu" width={132} height={40} className="h-9 w-auto" priority />
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Driver Partner</span>
              </div>
            </div>
          </div>
          <nav className="space-y-1 px-4 py-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.key;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
                    isActive ? "bg-primary/10 font-bold text-primary" : "font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
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
          <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-card font-bold">{initials}</div>
            <div className="flex-1 min-w-0">
              <div className="truncate text-sm font-bold">{user.name}</div>
              <div className="text-xs text-muted-foreground">{user.phone}</div>
            </div>
            <button type="button" onClick={logout} className="text-xs font-bold text-primary">
              Logout
            </button>
          </div>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col bg-muted/10">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-border bg-card px-8 shadow-sm">
          <h1 className="text-2xl font-bold">{title}</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted"
              type="button"
            >
              {ready && isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-muted">
              <Bell className="h-5 w-5" />
              <div className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary" />
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8">{children}</div>
      </main>
    </div>
  );
}

function DriverDesktopPlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
      <div className="text-lg font-bold text-foreground">{title}</div>
      <p className="mt-2">{description}</p>
    </div>
  );
}

function DriverHomeDesktopPageLegacy({ user }: { user: SessionUser }) {
  const [requests, setRequests] = useState<DriverRequestItem[]>([]);
  const [wallet, setWallet] = useState<DriverWalletResponse["wallet"] | null>(null);
  const [availability, setAvailability] = useState<DriverStatusResponse["status"]["availability"]>("OFFLINE");

  useEffect(() => {
    Promise.all([
      fetchJson<{ requests: DriverRequestItem[] }>("/driver/requests"),
      fetchJson<DriverWalletResponse>(`/driver/wallet/${user.id}`),
      fetchJson<DriverStatusResponse>(`/driver/status/${user.id}`)
    ])
      .then(([requestPayload, walletPayload, statusPayload]) => {
        setRequests(requestPayload.requests);
        setWallet(walletPayload.wallet);
        setAvailability(statusPayload.status.availability);
      })
      .catch(() => {
        setRequests([]);
        setWallet(null);
        setAvailability("OFFLINE");
      });
  }, [user.id]);

  const request = requests[0] ?? null;

  return (
    <DriverDesktopShell user={user} title="Dashboard" active="dashboard">
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-8 space-y-8">
          <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary to-orange-600 p-8 text-white shadow-xl shadow-primary/20">
            <div className="flex items-end justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-white/80">
                  <Activity className="h-4 w-4" /> This Week's Earnings
                </div>
                <div className="text-5xl font-extrabold tracking-tight">
                  <span className="mr-2 text-2xl opacity-80">GHS</span>
                  {wallet?.totalBalanceGhs.toFixed(2) ?? "0.00"}
                </div>
              </div>
              <div className={`rounded-full px-4 py-2 text-sm font-bold ${availability === "OFFLINE" ? "bg-white/20" : "bg-secondary text-secondary-foreground"}`}>
                <Power className="mr-2 inline h-4 w-4" />
                {availability === "OFFLINE" ? "Offline" : "Online"}
              </div>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-4 border-t border-white/20 pt-8">
              <StatCard label="Completed Trips" value={String(wallet?.weeklyTrips ?? 0)} />
              <StatCard label="Completion Rate" value={`${wallet?.completionRate ?? 0}%`} />
              <StatCard label="Commission" value={`${wallet?.commissionRate ?? 0}%`} />
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">Active Requests</h3>
              <Link href="/driver/rides/desktop" className="text-sm font-bold text-primary">
                View All
              </Link>
            </div>
            {request ? (
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <div className="mb-2 rounded bg-primary/10 px-2 py-1 inline-block text-[10px] font-bold uppercase tracking-wider text-primary">
                      Live Request
                    </div>
                    <div className="text-2xl font-extrabold">GHS {request.fareGhs.toFixed(2)}</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {request.distanceKm.toFixed(1)} km • {request.etaMinutes} mins • {request.payment}
                    </div>
                  </div>
                  <div className="rounded-full border-2 border-primary/20 px-3 py-2 text-sm font-bold text-primary">
                    {request.countdownSeconds}s
                  </div>
                </div>
                <div className="mb-6 space-y-4 border-l border-border pl-4">
                  <div className="relative">
                    <div className="absolute -left-[21px] top-1.5 h-3 w-3 rounded-full bg-primary" />
                    <div className="font-bold">{request.pickup}</div>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-[21px] top-1.5 h-3 w-3 rounded-full bg-foreground" />
                    <div className="font-bold">{request.destination}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" className="h-12 rounded-xl border border-border font-bold">
                    Reject
                  </button>
                  <button type="button" className="h-12 rounded-xl bg-primary font-bold text-primary-foreground shadow-md">
                    Accept
                  </button>
                </div>
              </div>
            ) : (
              <DriverDesktopPlaceholder
                title="No active requests"
                description="Once drivers go online and passengers request trips, the live queue will appear here."
              />
            )}
          </div>
        </div>

        <div className="col-span-4 space-y-8">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-6 text-lg font-bold">Wallet Snapshot</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Cash balance</span>
                <span className="font-bold">GHS {wallet?.cashGhs.toFixed(2) ?? "0.00"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">MoMo balance</span>
                <span className="font-bold">GHS {wallet?.momoGhs.toFixed(2) ?? "0.00"}</span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="font-bold">Pending withdrawal</span>
                <span className="font-bold text-primary">GHS {wallet?.pendingWithdrawalGhs.toFixed(2) ?? "0.00"}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold">Current Action</h3>
            {request ? (
              <div className="space-y-3">
                <div className="rounded-xl bg-primary/10 p-4 text-primary">
                  <div className="text-xs font-bold uppercase tracking-wider">Next pickup</div>
                  <div className="mt-1 text-base font-bold">{request.pickup}</div>
                </div>
                <button type="button" className="w-full rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground">
                  <Phone className="mr-2 inline h-4 w-4" /> Call rider
                </button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Go online and wait for a live ride request.</p>
            )}
          </div>
        </div>
      </div>
    </DriverDesktopShell>
  );
}

export function DriverHomeDesktopPage({ user }: { user: SessionUser }) {
  const [requests, setRequests] = useState<DriverRequestItem[]>([]);
  const [wallet, setWallet] = useState<DriverWalletResponse["wallet"] | null>(null);
  const [history, setHistory] = useState<DriverHistoryResponse>({ upcoming: [], past: [], cancelled: [] });
  const [kycStatus, setKycStatus] = useState<DriverKycResponse["kycStatus"]>("PENDING");
  const [dispatchMessage, setDispatchMessage] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [availability, setAvailability] = useState<DriverStatusResponse["status"]["availability"]>("OFFLINE");
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSendingSos, setIsSendingSos] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);

  const loadDashboard = async () => {
    const [requestPayload, walletPayload, statusPayload, historyPayload, kycPayload] = await Promise.all([
      fetchJson<DriverRequestsResponse>("/driver/requests"),
      fetchJson<DriverWalletResponse>(`/driver/wallet/${user.id}`),
      fetchJson<DriverStatusResponse>(`/driver/status/${user.id}`),
      fetchJson<DriverHistoryResponse>(`/driver/history/${user.id}`),
      fetchJson<DriverKycResponse>(`/driver/kyc/${user.id}`)
    ]);

    setRequests(requestPayload.requests);
    setDispatchMessage(requestPayload.message ?? null);
    setWallet(walletPayload.wallet);
    setAvailability(statusPayload.status.availability);
    setHistory(historyPayload);
    setKycStatus(kycPayload.kycStatus);
  };

  useEffect(() => {
    loadDashboard().catch(() => {
      setRequests([]);
      setWallet(null);
      setAvailability("OFFLINE");
    });
  }, [user.id]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void loadDashboard();
    }, 12000);

    return () => window.clearInterval(intervalId);
  }, [user.id]);

  useEffect(() => {
    const session = getSession();

    if (!session?.token) {
      return;
    }

    const socket = new WebSocket(getRealtimeUrl(session.token));

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as { type?: string };

        if (["driver.queue.updated", "ride.assigned", "ride.stage.updated", "ride.cancelled"].includes(message.type ?? "")) {
          void loadDashboard();
        }
      } catch {
        // Ignore malformed realtime events and keep the driver connected.
      }
    };

    return () => socket.close();
  }, [user.id]);

  useEffect(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const nextCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        setCurrentCoords((current) => (shouldUpdateLiveCoords(current, nextCoords) ? nextCoords : current));
      },
      () => undefined,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 15000
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    if (availability !== "AVAILABLE" || !currentCoords) {
      return;
    }

    const syncLocation = () => {
      void fetchJson(`/driver/status/${user.id}`, {
        method: "PUT",
        body: JSON.stringify({
          availability: "AVAILABLE",
          lat: currentCoords.lat,
          lng: currentCoords.lng
        })
      }).catch(() => undefined);
    };

    syncLocation();
    const intervalId = window.setInterval(syncLocation, 60000);

    return () => window.clearInterval(intervalId);
  }, [availability, currentCoords, user.id]);

  const request = requests[0] ?? null;
  const requestCards = requests.slice(0, 3);
  const completedRideCount = history.past.length;
  const acceptedRideCount = history.upcoming.length + history.past.length;
  const cancelledRideCount = history.cancelled.length;
  const totalRideDecisions = acceptedRideCount + cancelledRideCount;
  const acceptanceRate = totalRideDecisions ? Math.round((acceptedRideCount / totalRideDecisions) * 100) : 0;
  const isKycApproved = kycStatus === "APPROVED";

  const syncAvailability = async (next: "OFFLINE" | "AVAILABLE") => {
    setIsSyncing(true);
    setActionMessage(null);

    try {
      await fetchJson(`/driver/status/${user.id}`, {
        method: "PUT",
        body: JSON.stringify({
          availability: next,
          ...(currentCoords ? { lat: currentCoords.lat, lng: currentCoords.lng } : {})
        })
      });
      setAvailability(next);
      setActionMessage(next === "AVAILABLE" ? "Driver is online. Incoming requests will appear in Active Requests." : "Driver is offline.");
      await loadDashboard();
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Could not update driver status.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRideAction = async (rideId: string, action: "accept" | "reject") => {
    setIsSyncing(true);
    setActionMessage(null);

    try {
      await fetchJson(`/driver/requests/${rideId}/${action}`, { method: "POST" });
      setActionMessage(action === "accept" ? "Ride accepted. Passenger chat is available in Messages." : "Ride declined and returned to dispatch.");
      await loadDashboard();
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Could not update ride request.");
    } finally {
      setIsSyncing(false);
    }
  };

  const sendEmergencyIncident = async () => {
    if (!request) return;
    setIsSendingSos(true);
    setActionMessage(null);

    try {
      await fetchJson("/support/incidents", {
        method: "POST",
        body: JSON.stringify({
          rideId: request.id,
          category: "Driver emergency SOS",
          severity: "CRITICAL",
          description: [
            `Driver ${user.name} triggered SOS from desktop dashboard.`,
            `Passenger: ${request.riderName}.`,
            `Pickup: ${request.pickup}.`,
            `Destination: ${request.destination}.`,
            currentCoords ? `Driver coordinates: ${currentCoords.lat}, ${currentCoords.lng}.` : "Driver coordinates unavailable.",
            "Police station alert is not automated yet; Qiilu operations must escalate externally."
          ].join(" ")
        })
      });
      setActionMessage("Emergency sent to Qiilu operations. Police alert integration still needs a real emergency provider.");
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Could not send emergency incident.");
    } finally {
      setIsSendingSos(false);
    }
  };

  return (
    <DriverDesktopShell user={user} title="Dashboard" active="dashboard">
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-8 space-y-8">
          <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary to-orange-600 p-8 text-white shadow-xl shadow-primary/20">
            <div className="flex items-end justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-white/80">
                  <Activity className="h-4 w-4" /> This Week&apos;s Earnings
                </div>
                <div className="text-5xl font-extrabold tracking-tight">
                  <span className="mr-2 text-2xl opacity-80">GHS</span>
                  {wallet?.totalBalanceGhs.toFixed(2) ?? "0.00"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => void syncAvailability(availability === "OFFLINE" ? "AVAILABLE" : "OFFLINE")}
                disabled={isSyncing || !isKycApproved}
                className={`rounded-full px-4 py-2 text-sm font-bold disabled:opacity-60 ${
                  availability === "OFFLINE" ? "bg-white/20" : "bg-secondary text-secondary-foreground"
                }`}
              >
                <Power className="mr-2 inline h-4 w-4" />
                {!isKycApproved ? "KYC Required" : availability === "OFFLINE" ? "Go Online" : "Go Offline"}
              </button>
            </div>
            <div className="mt-8 grid grid-cols-4 gap-4 border-t border-white/20 pt-8">
              <StatCard label="Accepted" value={String(acceptedRideCount)} />
              <StatCard label="Completed" value={String(completedRideCount)} />
              <StatCard label="Cancelled" value={String(cancelledRideCount)} />
              <StatCard label="Accept Rate" value={`${acceptanceRate}%`} />
            </div>
          </div>

          {(actionMessage || dispatchMessage) ? (
            <div className="rounded-2xl border border-border bg-card p-5 text-sm font-medium text-muted-foreground shadow-sm">
              {actionMessage ?? dispatchMessage}
            </div>
          ) : null}

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">Active Requests</h3>
              <Link href="/driver/rides/desktop" className="text-sm font-bold text-primary">
                View All
              </Link>
            </div>
            {requestCards.length ? (
              <div className="grid gap-4 md:grid-cols-3">
                {requestCards.map((item, index) => (
                  <div key={item.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                    <div className="mb-4 flex items-start justify-between">
                      <div>
                        <div
                          className={`mb-2 inline-block rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                            index === 0 ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"
                          }`}
                        >
                          {index === 0 ? "App Request" : "Live Queue"}
                        </div>
                        <div className="text-2xl font-extrabold">GHS {item.fareGhs.toFixed(2)}</div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {item.distanceKm.toFixed(1)} km • {item.etaMinutes} mins • {item.payment}
                        </div>
                      </div>
                      <div className="rounded-full border-2 border-primary/20 px-3 py-2 text-sm font-bold text-primary">
                        {item.countdownSeconds}s
                      </div>
                    </div>

                    <div className="mb-6 space-y-4 border-l border-border pl-4">
                      <div className="relative">
                        <div className="absolute -left-[21px] top-1.5 h-3 w-3 rounded-full bg-primary" />
                        <div className="font-bold">{item.pickup}</div>
                      </div>
                      <div className="relative">
                        <div className="absolute -left-[21px] top-1.5 h-3 w-3 rounded-full bg-foreground" />
                        <div className="font-bold">{item.destination}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => void handleRideAction(item.id, "reject")} disabled={isSyncing} className="h-11 rounded-xl border border-border font-bold disabled:opacity-60">
                        Reject
                      </button>
                      <button type="button" onClick={() => void handleRideAction(item.id, "accept")} disabled={isSyncing} className="h-11 rounded-xl bg-primary font-bold text-primary-foreground shadow-md disabled:opacity-60">
                        Accept
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <DriverDesktopPlaceholder
                title="No active requests"
                description={isKycApproved ? "When you are online, accept and decline request cards will appear here." : "Complete driver KYC before the dispatch queue can send you live requests."}
              />
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border bg-muted/30 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Navigation className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold">Map Preview</h4>
                  <p className="text-sm text-muted-foreground">
                    {request ? request.pickup : "Driver live position"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-extrabold text-secondary">
                  {request ? `${request.etaMinutes} min` : "Live"}
                </div>
                <div className="text-sm font-medium">
                  {request ? `${request.distanceKm.toFixed(1)} km away` : "Waiting for request"}
                </div>
              </div>
            </div>
            <div className="relative h-[400px] overflow-hidden bg-[#e5e3df] dark:bg-[#15191f]">
              <PassengerLiveMap
                pickup={request?.pickup}
                destination={request?.destination}
                currentCoords={currentCoords}
                fullScreen
              />
            </div>
            <div className="flex items-center justify-between border-t border-border bg-card p-4">
              <div>
                <div className="font-bold">{request?.riderName ?? "No rider assigned"}</div>
                <div className="text-sm text-muted-foreground">
                  {request ? `${request.payment} • ${request.passengers} passenger` : "Go online and wait for the next booking"}
                </div>
              </div>
              <div className="flex gap-2">
                <Link href="/driver/messages/desktop" className="rounded-xl border border-border px-4 py-2 font-bold">
                  <MessageSquare className="mr-2 inline h-4 w-4" /> Message
                </Link>
                <button type="button" onClick={() => void sendEmergencyIncident()} disabled={!request || isSendingSos} className="rounded-xl bg-destructive px-5 py-2 font-bold text-destructive-foreground shadow-md disabled:opacity-60">
                  <AlertTriangle className="mr-2 inline h-4 w-4" /> {isSendingSos ? "Sending" : "SOS"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-4 space-y-8">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold">Legal Verification</h3>
            <div className={`rounded-2xl border p-4 ${isKycApproved ? "border-secondary/30 bg-secondary/10 text-secondary" : "border-amber-300/40 bg-amber-500/10 text-amber-700 dark:text-amber-200"}`}>
              <div className="font-bold">{isKycApproved ? "Approved for dispatch" : "KYC required before rides"}</div>
              <p className="mt-1 text-sm opacity-80">
                Legal name, Ghana Card or license, vehicle insurance, and road-worthiness are reviewed by admin before a driver appears in dispatch.
              </p>
              <Link href="/driver/kyc/desktop" className="mt-3 inline-flex rounded-xl bg-background px-4 py-2 text-sm font-bold text-foreground">
                Open KYC
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold">Messages & Notifications</h3>
            <p className="text-sm text-muted-foreground">
              Passenger chat threads appear in Messages after a ride is accepted. The bell is for operational notices and unread trip activity.
            </p>
            <Link href="/driver/messages/desktop" className="mt-4 inline-flex w-full justify-center rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground">
              Open Messages
            </Link>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-6 text-lg font-bold">Wallet Snapshot</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Cash balance</span>
                <span className="font-bold">GHS {wallet?.cashGhs.toFixed(2) ?? "0.00"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">MoMo balance</span>
                <span className="font-bold">GHS {wallet?.momoGhs.toFixed(2) ?? "0.00"}</span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="font-bold">Pending withdrawal</span>
                <span className="font-bold text-primary">GHS {wallet?.pendingWithdrawalGhs.toFixed(2) ?? "0.00"}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold">Current Action</h3>
            {request ? (
              <div className="space-y-3">
                <div className="rounded-xl bg-primary/10 p-4 text-primary">
                  <div className="text-xs font-bold uppercase tracking-wider">Next pickup</div>
                  <div className="mt-1 text-base font-bold">{request.pickup}</div>
                </div>
                <div className="rounded-xl bg-muted/50 p-4 text-sm">
                  <div className="font-bold text-foreground">Destination</div>
                  <div className="mt-1 text-muted-foreground">{request.destination}</div>
                </div>
                <button type="button" className="w-full rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground">
                  <Phone className="mr-2 inline h-4 w-4" /> Call rider
                </button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Go online and wait for a live ride request.</p>
            )}
          </div>
        </div>
      </div>
    </DriverDesktopShell>
  );
}

export function DriverRidesDesktopPage({ user }: { user: SessionUser }) {
  const [activeTab, setActiveTab] = useState<"upcoming" | "past" | "cancelled">("past");
  const [history, setHistory] = useState<DriverHistoryResponse>({ upcoming: [], past: [], cancelled: [] });
  const [selectedTripIndex, setSelectedTripIndex] = useState(0);

  useEffect(() => {
    fetchJson<DriverHistoryResponse>(`/driver/history/${user.id}`)
      .then((payload) => setHistory(payload))
      .catch(() => setHistory({ upcoming: [], past: [], cancelled: [] }));
  }, [user.id]);

  const currentList = history[activeTab];
  const selectedTrip = currentList[selectedTripIndex] ?? currentList[0] ?? null;
  const acceptedRideCount = history.upcoming.length + history.past.length;
  const completedRideCount = history.past.length;
  const cancelledRideCount = history.cancelled.length;
  const totalRideDecisions = acceptedRideCount + cancelledRideCount;
  const acceptanceRate = totalRideDecisions ? Math.round((acceptedRideCount / totalRideDecisions) * 100) : 0;

  return (
    <DriverDesktopShell user={user} title="Ride History" active="rides">
      <div className="mb-6 grid grid-cols-4 gap-4">
        <StatCard label="Accepted" value={String(acceptedRideCount)} />
        <StatCard label="Completed" value={String(completedRideCount)} />
        <StatCard label="Cancelled" value={String(cancelledRideCount)} />
        <StatCard label="Accept Rate" value={`${acceptanceRate}%`} />
      </div>

      <div className="grid min-h-[42rem] grid-cols-[minmax(0,1fr)_28rem] overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-y-auto p-8">
          <div className="mb-8 flex items-center gap-4">
            {(["upcoming", "past", "cancelled"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setSelectedTripIndex(0);
                }}
                className={`rounded-xl px-5 py-2 text-sm font-bold ${
                  activeTab === tab ? "bg-primary text-primary-foreground" : "border border-border bg-card text-muted-foreground"
                }`}
                type="button"
              >
                {tab[0].toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {currentList.length ? (
            <div className="grid grid-cols-2 gap-4">
              {currentList.map((trip, index) => (
                <button
                  key={`${trip.route}-${trip.time}`}
                  onClick={() => setSelectedTripIndex(index)}
                  className={`rounded-2xl border-2 p-5 text-left transition-all ${
                    selectedTrip === trip ? "border-primary bg-primary/5 shadow-md" : "border-border bg-card shadow-sm hover:border-foreground/20"
                  }`}
                  type="button"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-bold">{trip.rider}</div>
                        <div className="text-xs text-muted-foreground">{trip.time}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-secondary">GHS {trip.net.toFixed(2)}</div>
                      <div className="mt-1 text-[10px] font-bold uppercase text-muted-foreground">Net Earned</div>
                    </div>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-3 text-sm font-medium text-muted-foreground">
                    <MapPin className="mr-2 inline h-4 w-4 text-foreground" />
                    {trip.route}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <DriverDesktopPlaceholder
              title={`No ${activeTab} rides yet`}
              description="Driver trip history will appear here as live rides complete."
            />
          )}
        </div>

        <aside className="border-l border-border bg-card p-6">
          <h2 className="mb-6 text-2xl font-bold">Trip Details</h2>
          {selectedTrip ? (
            <div className="space-y-6">
              <div className="space-y-4 border-l border-border pl-4">
                <div className="relative">
                  <div className="absolute -left-[21px] top-1.5 h-3 w-3 rounded-full bg-primary" />
                  <div className="text-xs font-bold uppercase text-muted-foreground">Route</div>
                  <div className="font-bold">{selectedTrip.route}</div>
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-muted/30 p-5">
                <h3 className="mb-4 text-lg font-bold">Fare Breakdown</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Gross Fare</span>
                    <span className="font-medium">GHS {selectedTrip.gross.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-destructive">
                    <span>Qiilu Commission (15%)</span>
                    <span className="font-medium">-GHS {(selectedTrip.gross - selectedTrip.net).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <span className="font-bold">Net Earnings</span>
                    <span className="text-xl font-extrabold text-secondary">GHS {selectedTrip.net.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Select a trip to review it.</p>
          )}
        </aside>
      </div>
    </DriverDesktopShell>
  );
}

export function DriverMessagesDesktopPage({ user }: { user: SessionUser }) {
  return (
    <DriverDesktopShell user={user} title="Messages" active="messages">
      <div className="grid min-h-[42rem] grid-cols-[22rem_minmax(0,1fr)] overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="border-r border-border bg-card">
          <div className="border-b border-border p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input className="h-12 w-full rounded-full bg-muted/50 pl-9 pr-4 text-base outline-none" placeholder="Search conversations..." />
            </div>
          </div>
          <div className="space-y-2 p-4">
            <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4">
              <div className="mb-1 font-bold">Partner Support</div>
              <div className="text-sm text-muted-foreground">Realtime driver chat is still waiting for the dedicated backend thread service.</div>
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-center bg-background/50 p-8">
          <DriverDesktopPlaceholder
            title="No live driver conversations yet"
            description="The exact desktop messaging shell is now live. The remaining work is the realtime chat backend for driver-passenger threads."
          />
          <div className="mt-6 flex items-center gap-4 rounded-2xl border border-border bg-card p-3">
            <input className="h-12 flex-1 bg-transparent px-4 text-base outline-none" placeholder="Type a message..." disabled />
            <button type="button" className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white opacity-60" disabled>
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </DriverDesktopShell>
  );
}

function DriverWalletDesktopPageLegacy({ user }: { user: SessionUser }) {
  const [wallet, setWallet] = useState<DriverWalletResponse | null>(null);

  useEffect(() => {
    fetchJson<DriverWalletResponse>(`/driver/wallet/${user.id}`)
      .then((payload) => setWallet(payload))
      .catch(() => setWallet(null));
  }, [user.id]);

  return (
    <DriverDesktopShell user={user} title="Earnings Wallet" active="wallet">
      {wallet ? (
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-5 space-y-8">
            <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary to-orange-600 p-10 text-white shadow-xl shadow-primary/20">
              <div className="mb-2 flex items-center gap-2 text-lg font-medium text-white/80">
                <Wallet className="h-5 w-5" /> Current Balance
              </div>
              <div className="text-6xl font-extrabold tracking-tight">
                <span className="mr-2 text-3xl opacity-80">GHS</span>
                {wallet.wallet.totalBalanceGhs.toFixed(2)}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h3 className="mb-6 text-xl font-bold">Payout Overview</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Cash balance</span>
                  <span className="font-bold">GHS {wallet.wallet.cashGhs.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">MoMo balance</span>
                  <span className="font-bold">GHS {wallet.wallet.momoGhs.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className="font-bold">Pending withdrawal</span>
                  <span className="font-bold text-primary">GHS {wallet.wallet.pendingWithdrawalGhs.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-7 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-6 text-xl font-bold">Recent Transactions</h3>
            <div className="space-y-2">
              {wallet.transactions.length ? (
                wallet.transactions.slice(0, 8).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between rounded-xl p-4 hover:bg-muted/50">
                    <div className="flex items-center gap-5">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <Wallet className="h-6 w-6 text-foreground" />
                      </div>
                      <div>
                        <div className="font-bold text-base">{transaction.kind.replace(/_/g, " ")}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(transaction.createdAt))}
                        </div>
                      </div>
                    </div>
                    <div className="font-bold">GHS {transaction.amountGhs.toFixed(2)}</div>
                  </div>
                ))
              ) : (
                <DriverDesktopPlaceholder
                  title="No wallet activity yet"
                  description="Top-ups, ride credits, and payout requests will appear here automatically."
                />
              )}
            </div>
          </div>
        </div>
      ) : (
        <DriverDesktopPlaceholder
          title="Wallet unavailable"
          description="Qiilu could not load the live driver wallet right now."
        />
      )}
    </DriverDesktopShell>
  );
}

export function DriverWalletDesktopPage({ user }: { user: SessionUser }) {
  const [wallet, setWallet] = useState<DriverWalletResponse | null>(null);
  const [walletMessage, setWalletMessage] = useState<string | null>(null);
  const [toppingUp, setToppingUp] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAccountRef, setWithdrawAccountRef] = useState("");

  const loadWallet = async () => {
    const payload = await fetchJson<DriverWalletResponse>(`/driver/wallet/${user.id}`);
    setWallet(payload);
  };

  useEffect(() => {
    const paymentStatus = new URLSearchParams(window.location.search).get("payment");
    if (paymentStatus === "paystack") {
      setWalletMessage("Payment approval received. Your wallet will update when Paystack confirms the transaction.");
    }

    loadWallet().catch(() => setWallet(null));
  }, [user.id]);

  const topUp = async () => {
    const amountGhs = Number(topUpAmount);
    if (!topUpAmount || Number.isNaN(amountGhs) || amountGhs < WALLET_TOP_UP_MIN_GHS || amountGhs > WALLET_TOP_UP_MAX_GHS) {
      setWalletMessage(`Top-up amount must be between GHS ${WALLET_TOP_UP_MIN_GHS} and GHS ${WALLET_TOP_UP_MAX_GHS.toLocaleString()}.`);
      return;
    }

    setToppingUp(true);
    setWalletMessage(null);

    try {
      const payload = await fetchJson<WalletActionResponse>(`/driver/wallet/${user.id}/top-up`, {
        method: "POST",
        body: JSON.stringify({ amountGhs, provider: "MTN MoMo" })
      });

      if (payload.result?.authorizationUrl) {
        setWalletMessage(payload.message);
        window.location.assign(payload.result.authorizationUrl);
        return;
      }

      await loadWallet();
      setTopUpAmount("");
      setWalletMessage(payload.message ?? "Wallet top-up processed.");
    } catch (error) {
      setWalletMessage(error instanceof Error ? error.message : "Could not top up wallet.");
    } finally {
      setToppingUp(false);
    }
  };

  const withdraw = async () => {
    const amountGhs = Number(withdrawAmount);
    if (!withdrawAmount || Number.isNaN(amountGhs) || amountGhs <= 0) {
      setWalletMessage("Enter a valid withdrawal amount.");
      return;
    }

    if (!withdrawAccountRef.trim()) {
      setWalletMessage("Enter the MoMo number for cash-out.");
      return;
    }

    if (wallet && amountGhs > wallet.wallet.totalBalanceGhs) {
      setWalletMessage(`You can only withdraw up to GHS ${wallet.wallet.totalBalanceGhs.toFixed(2)} from this wallet.`);
      return;
    }

    setWithdrawing(true);
    setWalletMessage(null);

    try {
      const payload = await fetchJson<{ message: string }>(`/driver/wallet/${user.id}/withdraw`, {
        method: "POST",
        body: JSON.stringify({ amountGhs, provider: "MTN MoMo", accountRef: withdrawAccountRef.trim() })
      });
      await loadWallet();
      setWithdrawAmount("");
      setWalletMessage(payload.message ?? "Withdrawal request submitted.");
    } catch (error) {
      setWalletMessage(error instanceof Error ? error.message : "Could not request withdrawal.");
    } finally {
      setWithdrawing(false);
    }
  };

  const chartData = Array.from({ length: 7 }, (_, index) => {
    const target = new Date();
    target.setDate(target.getDate() - (6 - index));
    const dayKey = target.toISOString().slice(0, 10);
    const total =
      wallet?.transactions
        .filter((transaction) => transaction.createdAt.slice(0, 10) === dayKey)
        .reduce((sum, transaction) => sum + transaction.amountGhs, 0) ?? 0;

    return {
      label: target.toLocaleDateString("en-GB", { weekday: "short" }),
      total
    };
  });
  const maxChart = Math.max(...chartData.map((item) => item.total), 1);
  const withdrawAmountGhs = Number(withdrawAmount);
  const withdrawExceedsBalance = Boolean(withdrawAmount) && Number.isFinite(withdrawAmountGhs) && wallet ? withdrawAmountGhs > wallet.wallet.totalBalanceGhs : false;

  return (
    <DriverDesktopShell user={user} title="Earnings Wallet" active="wallet">
      {wallet ? (
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 grid grid-cols-3 gap-6">
            <div className="rounded-2xl bg-gradient-to-br from-primary to-orange-600 p-6 text-white shadow-lg">
              <div className="mb-1 text-sm font-medium uppercase tracking-wider text-white/80">Today&apos;s Earnings</div>
              <div className="text-4xl font-extrabold tracking-tight">GHS {wallet.wallet.totalBalanceGhs.toFixed(2)}</div>
              <div className="mt-4 inline-block rounded bg-white/20 px-2 py-1 text-sm font-bold">
                {wallet.wallet.weeklyTrips} Trips
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-1 text-sm font-medium uppercase tracking-wider text-muted-foreground">This Week</div>
              <div className="text-4xl font-extrabold tracking-tight">GHS {wallet.wallet.momoGhs.toFixed(2)}</div>
              <div className="mt-4 text-sm font-bold text-secondary">Completion {wallet.wallet.completionRate}%</div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-1 text-sm font-medium uppercase tracking-wider text-muted-foreground">Available To Withdraw</div>
              <div className="text-4xl font-extrabold tracking-tight">GHS {wallet.wallet.pendingWithdrawalGhs.toFixed(2)}</div>
              <div className="mt-4 text-sm font-bold text-secondary">Commission {wallet.wallet.commissionRate}%</div>
            </div>
          </div>

          <div className="col-span-12 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div>
              <div className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Wallet actions</div>
              <div className="mt-1 text-sm text-muted-foreground">Top up your balance or request a MoMo cash-out from this wallet.</div>
            </div>
            <div className="flex flex-wrap gap-3">
              <label className="flex h-12 items-center gap-2 rounded-xl border border-border bg-background px-4 shadow-sm">
                <span className="text-sm font-bold text-foreground">GHS</span>
                <input
                  value={topUpAmount}
                  onChange={(event) => setTopUpAmount(event.target.value)}
                  inputMode="decimal"
                  type="number"
                  min={WALLET_TOP_UP_MIN_GHS}
                  max={WALLET_TOP_UP_MAX_GHS}
                  placeholder="50.00"
                  className="w-32 bg-transparent text-sm font-bold outline-none placeholder:text-muted-foreground/60"
                />
              </label>
              <button type="button" disabled={toppingUp || !topUpAmount} onClick={() => void topUp()} className="rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground disabled:opacity-60">
                {toppingUp ? "Starting..." : "Top up balance"}
              </button>
              <label className="flex h-12 items-center gap-2 rounded-xl border border-border bg-muted/40 px-4">
                <span className="text-sm font-bold text-muted-foreground">GHS</span>
                <input
                  value={withdrawAmount}
                  onChange={(event) => setWithdrawAmount(event.target.value)}
                  inputMode="decimal"
                  type="number"
                  min="1"
                  placeholder="100.00"
                  className="w-28 bg-transparent text-sm font-bold text-foreground outline-none placeholder:text-muted-foreground"
                />
              </label>
              <input
                value={withdrawAccountRef}
                onChange={(event) => setWithdrawAccountRef(event.target.value)}
                inputMode="tel"
                placeholder="MoMo number"
                className="h-12 w-40 rounded-xl border border-border bg-background px-4 text-sm font-bold text-foreground shadow-sm outline-none placeholder:text-muted-foreground"
              />
              <button type="button" disabled={withdrawing || !withdrawAmount || !withdrawAccountRef.trim() || withdrawExceedsBalance} onClick={() => void withdraw()} className="rounded-xl border border-border px-5 py-3 font-bold text-foreground disabled:opacity-60">
                {withdrawing ? "Requesting..." : "Cash out"}
              </button>
            </div>
            <div className="w-full text-xs font-medium text-muted-foreground">
              Top-up limit: GHS {WALLET_TOP_UP_MIN_GHS} to GHS {WALLET_TOP_UP_MAX_GHS.toLocaleString()} per transaction.
            </div>
            {withdrawExceedsBalance ? (
              <div className="w-full rounded-xl bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive">
                Withdrawal is higher than your available balance of GHS {wallet.wallet.totalBalanceGhs.toFixed(2)}.
              </div>
            ) : null}
            {walletMessage ? <div className="w-full rounded-xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">{walletMessage}</div> : null}
          </div>

          <div className="col-span-8 space-y-8">
            <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
              <div className="mb-8 flex items-center justify-between">
                <h3 className="text-xl font-bold">Earnings Last 7 Days</h3>
                <div className="rounded-lg bg-muted px-3 py-1.5 text-sm font-bold">This Week</div>
              </div>

              <div className="mb-4 flex h-64 items-end justify-between gap-4">
                {chartData.map((item, index) => (
                  <div key={`${item.label}-${index}`} className="flex h-full w-full items-end">
                    <div
                      className={`w-full rounded-t-lg transition-all duration-300 ${
                        index === chartData.length - 1 ? "bg-primary" : "bg-primary/20 hover:bg-primary/40"
                      }`}
                      style={{ height: `${Math.max((item.total / maxChart) * 100, item.total > 0 ? 14 : 6)}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between border-t border-border pt-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {chartData.map((item, index) => (
                  <span key={`${item.label}-tick-${index}`} className={index === chartData.length - 1 ? "text-primary" : ""}>
                    {item.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="border-b border-border bg-muted/20 p-6">
                <h3 className="text-xl font-bold">Detailed Breakdown</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4 text-center">Channel</th>
                      <th className="px-6 py-4 text-right">Amount</th>
                      <th className="px-6 py-4 text-center">Kind</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {wallet.transactions.length ? (
                      wallet.transactions.slice(0, 8).map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-6 py-4 font-medium">
                            {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(transaction.createdAt))}
                          </td>
                          <td className="px-6 py-4 text-center">{transaction.channel}</td>
                          <td className="px-6 py-4 text-right font-bold">GHS {transaction.amountGhs.toFixed(2)}</td>
                          <td className="px-6 py-4 text-center">
                            <span className="rounded bg-primary/10 px-2 py-1 text-xs font-bold uppercase text-primary">
                              {transaction.kind.replace(/_/g, " ")}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-10">
                          <DriverDesktopPlaceholder
                            title="No wallet activity yet"
                            description="Top-ups, ride credits, and payout requests will appear here automatically."
                          />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="col-span-4 space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h3 className="mb-6 text-xl font-bold">Cash Out</h3>
              <div className="mb-6 rounded-xl border border-border bg-muted/30 p-4">
                <div className="mb-1 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Available to Withdraw
                </div>
                <div className="text-3xl font-extrabold text-primary">
                  GHS {wallet.wallet.pendingWithdrawalGhs.toFixed(2)}
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Cash balance</span>
                  <span className="font-bold">GHS {wallet.wallet.cashGhs.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">MoMo balance</span>
                  <span className="font-bold">GHS {wallet.wallet.momoGhs.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h3 className="mb-4 text-xl font-bold">Payout Method</h3>
              <div className="rounded-xl border-2 border-primary bg-primary/5 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-bold">Mobile Money</div>
                      <div className="text-xs text-muted-foreground">Linked payout route</div>
                    </div>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <DriverDesktopPlaceholder
          title="Wallet unavailable"
          description="Qiilu could not load the live driver wallet right now."
        />
      )}
    </DriverDesktopShell>
  );
}

export function DriverFavouritesDesktopPage({ user }: { user: SessionUser }) {
  const [activeTab, setActiveTab] = useState<"locations" | "passengers">("locations");

  return (
    <DriverDesktopShell user={user} title="Favourites" active="favourites">
      <div className="mb-8 inline-flex rounded-xl border border-border bg-card p-1 shadow-sm">
        <button
          onClick={() => setActiveTab("locations")}
          className={`rounded-lg px-8 py-3 text-sm font-bold ${activeTab === "locations" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}
          type="button"
        >
          Favourite Locations
        </button>
        <button
          onClick={() => setActiveTab("passengers")}
          className={`rounded-lg px-8 py-3 text-sm font-bold ${activeTab === "passengers" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}
          type="button"
        >
          Favourite Passengers
        </button>
      </div>

      <DriverDesktopPlaceholder
        title={activeTab === "locations" ? "No favourite locations yet" : "No favourite passengers yet"}
        description={
          activeTab === "locations"
            ? "Driver location bookmarks are still waiting for a persistence layer, so this desktop screen stays honest."
            : "Favourite passenger relationships are not stored in the live backend yet."
        }
      />
    </DriverDesktopShell>
  );
}

export function DriverAccountDesktopPage({ user }: { user: SessionUser }) {
  const [me, setMe] = useState<MeResponse["user"] | null>(null);
  const [wallet, setWallet] = useState<DriverWalletResponse["wallet"] | null>(null);
  const [kyc, setKyc] = useState<DriverKycResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "documents">("documents");
  const [documentType, setDocumentType] = useState("DRIVERS_LICENSE");
  const [documentNumber, setDocumentNumber] = useState("");
  const [legalName, setLegalName] = useState(user.name);
  const [issuingCountry, setIssuingCountry] = useState("Ghana");
  const [documentUrl, setDocumentUrl] = useState("");
  const [documentFileName, setDocumentFileName] = useState<string | null>(null);
  const [documentBackUrl, setDocumentBackUrl] = useState("");
  const [documentBackFileName, setDocumentBackFileName] = useState<string | null>(null);
  const [selfieImageUrl, setSelfieImageUrl] = useState("");
  const [selfieFileName, setSelfieFileName] = useState<string | null>(null);
  const [movementCheckPassed, setMovementCheckPassed] = useState(false);
  const [kycMessage, setKycMessage] = useState<string | null>(null);
  const [submittingKyc, setSubmittingKyc] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [uploadingProfileImage, setUploadingProfileImage] = useState(false);
  const kycDocumentInputRef = useRef<HTMLInputElement | null>(null);
  const kycDocumentBackInputRef = useRef<HTMLInputElement | null>(null);
  const kycSelfieInputRef = useRef<HTMLInputElement | null>(null);

  const loadAccount = async () => {
    const [mePayload, walletPayload, kycPayload] = await Promise.allSettled([
      fetchJson<MeResponse>("/auth/me"),
      fetchJson<DriverWalletResponse>(`/driver/wallet/${user.id}`),
      fetchJson<DriverKycResponse>(`/driver/kyc/${user.id}`)
    ]);

    setMe(mePayload.status === "fulfilled" ? mePayload.value.user : null);
    setWallet(walletPayload.status === "fulfilled" ? walletPayload.value.wallet : null);
    setKyc(kycPayload.status === "fulfilled" ? kycPayload.value : null);
  };

  useEffect(() => {
    loadAccount().catch(() => {
      setMe(null);
      setWallet(null);
      setKyc(null);
    });
  }, [user.id]);

  useEffect(() => {
    const section = new URLSearchParams(window.location.search).get("section");

    if (section === "profile") {
      setActiveTab("profile");
    }

    if (section === "vehicle" || section === "documents") {
      setActiveTab("documents");
    }
  }, []);

  const initials = user.name
    .split(" ")
    .map((item) => item[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const uploadProfileImage = async (file: File) => {
    setUploadingProfileImage(true);
    setProfileMessage(null);

    try {
      const profileImageUrl = await readImageFileAsDataUrl(file);
      const payload = await fetchJson<{ user: MeResponse["user"] }>("/auth/profile", {
        method: "PUT",
        body: JSON.stringify({ profileImageUrl })
      });
      setMe(payload.user);
      setProfileMessage("Profile image updated.");
    } catch (error) {
      setProfileMessage(error instanceof Error ? error.message : "Could not update profile image.");
    } finally {
      setUploadingProfileImage(false);
    }
  };

  const submitKyc = async () => {
    setSubmittingKyc(true);
    setKycMessage(null);

    try {
      await fetchJson(`/driver/kyc/${user.id}`, {
        method: "POST",
        body: JSON.stringify({
          documentType,
          documentNumber,
          legalName,
          issuingCountry,
          documentUrl,
          documentBackUrl,
          selfieProvided: Boolean(selfieImageUrl),
          selfieImageUrl,
          movementCheckPassed,
          movementCheckPrompt: DRIVER_KYC_MOVEMENT_PROMPT
        })
      });
      setDocumentNumber("");
      setDocumentUrl("");
      setDocumentFileName(null);
      setDocumentBackUrl("");
      setDocumentBackFileName(null);
      setSelfieImageUrl("");
      setSelfieFileName(null);
      setMovementCheckPassed(false);
      await loadAccount();
      setKycMessage("KYC submission received and queued for review.");
    } catch (error) {
      setKycMessage(error instanceof Error ? error.message : "Could not submit KYC.");
    } finally {
      setSubmittingKyc(false);
    }
  };

  const uploadKycDocument = async (file: File, side: "front" | "back") => {
    setKycMessage(null);

    try {
      const value = await readDocumentFileAsDataUrl(file);
      if (side === "front") {
        setDocumentUrl(value);
        setDocumentFileName(file.name);
      } else {
        setDocumentBackUrl(value);
        setDocumentBackFileName(file.name);
      }
    } catch (error) {
      setKycMessage(error instanceof Error ? error.message : "Could not read the selected document.");
    }
  };

  const uploadKycSelfie = async (file: File) => {
    setKycMessage(null);

    try {
      const value = await readImageFileAsDataUrl(file);
      setSelfieImageUrl(value);
      setSelfieFileName(file.name);
      setMovementCheckPassed(false);
    } catch (error) {
      setKycMessage(error instanceof Error ? error.message : "Could not read the selected selfie.");
    }
  };

  const statusTone =
    (kyc?.kycStatus ?? me?.kycStatus ?? "PENDING") === "APPROVED"
      ? "text-secondary bg-secondary/10"
      : (kyc?.kycStatus ?? me?.kycStatus ?? "PENDING") === "REJECTED"
        ? "text-destructive bg-destructive/10"
        : "text-primary bg-primary/10";

  return (
    <DriverDesktopShell user={user} title="Driver Profile" active="account">
      <div className="mx-auto grid max-w-6xl grid-cols-12 gap-8">
        <div className="col-span-4 space-y-6">
          <div className="rounded-[2rem] border border-border bg-card p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 h-32 w-32 overflow-hidden rounded-full shadow-xl">
              {me?.profileImageUrl ? (
                <Image
                  src={me.profileImageUrl}
                  alt={`${user.name} profile`}
                  width={128}
                  height={128}
                  className="h-32 w-32 object-cover"
                />
              ) : (
                <div className="flex h-32 w-32 items-center justify-center bg-gradient-to-tr from-primary to-secondary text-4xl font-extrabold text-white">
                  {initials}
                </div>
              )}
            </div>
            <h2 className="mb-1 text-2xl font-bold">{user.name}</h2>
            <p className="font-medium text-muted-foreground">{user.phone}</p>
            <div className={`mt-3 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold uppercase ${statusTone}`}>
              <CheckCircle2 className="h-4 w-4" /> {(kyc?.kycStatus ?? me?.kycStatus ?? "PENDING").replaceAll("_", " ")}
            </div>
            <label className="mt-5 inline-flex cursor-pointer items-center justify-center rounded-full border border-border bg-muted px-4 py-2 text-xs font-bold text-foreground transition hover:bg-muted/80">
              {uploadingProfileImage ? "Uploading..." : "Upload photo"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                disabled={uploadingProfileImage}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void uploadProfileImage(file);
                  }
                  event.currentTarget.value = "";
                }}
              />
            </label>
            {profileMessage ? <div className="mt-3 text-xs text-muted-foreground">{profileMessage}</div> : null}
            <div className="mt-8 grid grid-cols-2 gap-4 border-t border-border pt-6">
              <StatCard label="Availability" value={me?.availability ?? "OFFLINE"} />
              <StatCard label="Balance" value={wallet ? `GHS ${wallet.totalBalanceGhs.toFixed(0)}` : "GHS 0"} />
            </div>
          </div>
        </div>

        <div className="col-span-8 rounded-[2rem] border border-border bg-card p-10 shadow-sm">
          <div className="mb-8 flex gap-3">
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`rounded-xl px-5 py-2 text-sm font-bold ${activeTab === "profile" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              Profile Information
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("documents")}
              className={`rounded-xl px-5 py-2 text-sm font-bold ${activeTab === "documents" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              Documents & KYC
            </button>
          </div>

          {activeTab === "profile" ? (
            <div>
              <h3 className="mb-8 text-2xl font-bold">Profile Information</h3>
              <div className="space-y-6">
                <Field label="First Name" value={user.name.split(" ")[0] ?? user.name} />
                <Field label="Last Name" value={user.name.split(" ").slice(1).join(" ") || "Not set"} />
                <Field label="Phone Number" value={user.phone} />
                <Field label="Email Address" value={me?.email ?? "Not set"} />
                <Field label="KYC Status" value={(kyc?.kycStatus ?? me?.kycStatus ?? "PENDING").replaceAll("_", " ")} />
                <div className="pt-2">
                  <Link href="/driver/kyc/desktop" className="inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">
                    Open KYC workflow
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-8 flex items-end justify-between gap-6">
                <div>
                  <h3 className="text-2xl font-bold">Documents & KYC</h3>
                  <p className="mt-2 text-sm text-muted-foreground">Upload one verification document and keep your driver profile active.</p>
                </div>
                <div className="rounded-2xl bg-muted/50 px-4 py-3 text-right">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Verification status</div>
                  <div className="mt-1 text-lg font-extrabold">{(kyc?.kycStatus ?? "PENDING").replaceAll("_", " ")}</div>
                </div>
              </div>

              <div className="mb-8 grid gap-4 rounded-2xl border border-border bg-muted/20 p-5 md:grid-cols-2">
                <Field label="Latest submission" value={kyc?.latestSubmission?.documentType?.replaceAll("_", " ") ?? "No document submitted yet"} />
                <Field label="Submitted on" value={kyc?.latestSubmission ? new Date(kyc.latestSubmission.createdAt).toLocaleString() : "Waiting for first upload"} />
                <Field label="Document number" value={kyc?.latestSubmission?.documentNumber ?? "Not submitted"} />
                <Field label="Issuing country" value={kyc?.latestSubmission?.issuingCountry ?? "Not submitted"} />
              </div>

              <div className="mb-8 space-y-4 rounded-2xl border border-border p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-bold text-muted-foreground">Document Type</span>
                    <select
                      value={documentType}
                      onChange={(event) => {
                        setDocumentType(event.target.value);
                        setDocumentUrl("");
                        setDocumentFileName(null);
                        setDocumentBackUrl("");
                        setDocumentBackFileName(null);
                        setSelfieImageUrl("");
                        setSelfieFileName(null);
                        setMovementCheckPassed(false);
                      }}
                      className="h-12 w-full rounded-xl border border-border bg-muted/50 px-4 text-sm outline-none"
                    >
                      {(kyc?.requiredDocuments ?? ["DRIVERS_LICENSE", "GHANA_CARD", "VEHICLE_INSURANCE", "ROAD_WORTHINESS"]).map((item) => (
                        <option key={item} value={item}>
                          {item.replaceAll("_", " ")}
                        </option>
                      ))}
                    </select>
                  </label>
                  <FieldInput label="Document Number" value={documentNumber} onChange={setDocumentNumber} placeholder="Enter document number" />
                  <FieldInput label="Legal Name" value={legalName} onChange={setLegalName} placeholder="Name on document" />
                  <FieldInput label="Issuing Country" value={issuingCountry} onChange={setIssuingCountry} placeholder="Ghana" />
                </div>
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-bold text-muted-foreground">Front side</span>
                  <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4">
                    <div className="text-sm font-semibold">{documentFileName ?? "No file selected yet"}</div>
                    <div className="mt-1 text-xs text-muted-foreground">Upload the front side as an image or PDF up to 5MB.</div>
                    <button
                      type="button"
                      disabled={submittingKyc}
                      onClick={() => kycDocumentInputRef.current?.click()}
                      className="mt-3 inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Choose file
                    </button>
                    <input
                      ref={kycDocumentInputRef}
                      type="file"
                      accept="image/*,application/pdf"
                      className="sr-only"
                      disabled={submittingKyc}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          void uploadKycDocument(file, "front");
                        }
                        event.currentTarget.value = "";
                      }}
                    />
                  </div>
                </label>
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-bold text-muted-foreground">Back side</span>
                  <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4">
                    <div className="text-sm font-semibold">{documentBackFileName ?? "No file selected yet"}</div>
                    <div className="mt-1 text-xs text-muted-foreground">Upload the back side as an image or PDF up to 5MB.</div>
                    <button
                      type="button"
                      disabled={submittingKyc}
                      onClick={() => kycDocumentBackInputRef.current?.click()}
                      className="mt-3 inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Choose file
                    </button>
                    <input
                      ref={kycDocumentBackInputRef}
                      type="file"
                      accept="image/*,application/pdf"
                      className="sr-only"
                      disabled={submittingKyc}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          void uploadKycDocument(file, "back");
                        }
                        event.currentTarget.value = "";
                      }}
                    />
                  </div>
                </label>
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-bold text-muted-foreground">Driver selfie</span>
                  <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4">
                    <div className="text-sm font-semibold">{selfieFileName ?? "No selfie selected yet"}</div>
                    <div className="mt-1 text-xs text-muted-foreground">Upload a clear face photo, or open the full KYC workflow for live camera capture.</div>
                    {selfieImageUrl ? <img src={selfieImageUrl} alt="Driver selfie preview" className="mt-3 h-20 w-20 rounded-2xl object-cover" /> : null}
                    <label className="mt-3 flex items-start gap-2 rounded-xl bg-background/70 p-3 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={movementCheckPassed}
                        onChange={(event) => setMovementCheckPassed(event.target.checked)}
                        className="mt-0.5 h-4 w-4"
                      />
                      <span>I turned my head left and right before taking this selfie.</span>
                    </label>
                    <button
                      type="button"
                      disabled={submittingKyc}
                      onClick={() => kycSelfieInputRef.current?.click()}
                      className="mt-3 inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Choose selfie
                    </button>
                    <input
                      ref={kycSelfieInputRef}
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      disabled={submittingKyc}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          void uploadKycSelfie(file);
                        }
                        event.currentTarget.value = "";
                      }}
                    />
                  </div>
                </label>
                {kycMessage ? <div className="rounded-xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">{kycMessage}</div> : null}
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={submittingKyc || !documentUrl || !documentBackUrl || !selfieImageUrl || !movementCheckPassed}
                    onClick={() => void submitKyc()}
                    className="rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground disabled:opacity-60"
                  >
                    {submittingKyc ? "Submitting..." : "Submit for review"}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {(kyc?.submissions ?? []).length ? (
                  kyc!.submissions.map((submission) => (
                    <div key={submission.id} className="flex items-center justify-between rounded-2xl border border-border p-4">
                      <div>
                        <div className="font-bold">{submission.documentType?.replaceAll("_", " ") ?? "Document"}</div>
                        <div className="text-sm text-muted-foreground">
                          {submission.documentNumber ?? "No number"} • {new Date(submission.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase ${
                          submission.status === "APPROVED"
                            ? "bg-secondary/10 text-secondary"
                            : submission.status === "REJECTED"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-primary/10 text-primary"
                        }`}>
                          {submission.status}
                        </div>
                        <a href={submission.documentUrl} target="_blank" rel="noreferrer" className="mt-2 block text-xs font-bold text-primary">
                          Open front
                        </a>
                        {submission.documentBackUrl ? <a href={submission.documentBackUrl} target="_blank" rel="noreferrer" className="mt-1 block text-xs font-bold text-primary">Open back</a> : null}
                        {submission.selfieImageUrl ? <a href={submission.selfieImageUrl} target="_blank" rel="noreferrer" className="mt-1 block text-xs font-bold text-primary">Open selfie</a> : null}
                      </div>
                    </div>
                  ))
                ) : (
                  <DriverDesktopPlaceholder title="No KYC submissions yet" description="Your verification history will appear here after the first upload." />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </DriverDesktopShell>
  );
}

export function DriverSafetyDesktopPage({ user }: { user: SessionUser }) {
  return (
    <DriverDesktopShell user={user} title="Safety Hub" active="account">
      <div className="mx-auto grid max-w-6xl grid-cols-12 gap-8">
        <div className="col-span-5 rounded-[2rem] border border-border bg-card p-8 shadow-sm">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">Driver safety hub</h2>
          <p className="mt-3 text-muted-foreground">
            Safety actions are separated from Messages. During a live ride, the SOS action sends ride context to Qiilu operations.
          </p>
          <Link href="/driver/desktop" className="mt-6 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">
            Return to live dispatch
          </Link>
        </div>
        <div className="col-span-7 grid gap-4">
          <DriverDesktopInfoCard title="Trip SOS" description="Available inside active ride controls. It attaches driver, passenger, route, and ride state to the incident." />
          <DriverDesktopInfoCard title="Location accuracy" description="Keep browser location permission enabled when online, otherwise dispatch and safety location data will be stale." />
          <DriverDesktopInfoCard title="Incident follow-up" description="Safety incidents are visible to admins for review, escalation, and follow-up with both users." />
        </div>
      </div>
    </DriverDesktopShell>
  );
}

export function DriverSupportDesktopPage({ user }: { user: SessionUser }) {
  return (
    <DriverDesktopShell user={user} title="Help & Support" active="account">
      <div className="mx-auto grid max-w-6xl grid-cols-12 gap-8">
        <div className="col-span-5 rounded-[2rem] border border-border bg-card p-8 shadow-sm">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <HelpCircle className="h-7 w-7" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">Qiilu partner support</h2>
          <p className="mt-3 text-muted-foreground">
            Account, KYC, wallet, and ride issue guidance lives here. Passenger chat remains on the Messages page.
          </p>
          <div className="mt-6 flex gap-3">
            <Link href="/driver/messages/desktop" className="rounded-xl border border-border px-5 py-3 text-sm font-bold">
              Open messages
            </Link>
            <Link href="/driver/wallet/desktop" className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">
              Check wallet
            </Link>
          </div>
        </div>
        <div className="col-span-7 grid gap-4">
          <DriverDesktopInfoCard title="KYC support" description="Use Account or KYC to upload missing front, back, selfie, and movement-check evidence." />
          <DriverDesktopInfoCard title="Wallet support" description="Wallet shows top-up, withdrawal warnings, payout history, and pending withdrawal totals." />
          <DriverDesktopInfoCard title="Ride support" description="Use ride history and messages to identify the affected ride before raising a dispute." />
        </div>
      </div>
    </DriverDesktopShell>
  );
}

function DriverDesktopInfoCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="text-lg font-bold">{title}</div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-bold text-muted-foreground">{label}</label>
      <div className="flex h-12 items-center rounded-xl bg-muted/50 px-4 text-base">{value}</div>
    </div>
  );
}

function FieldInput({
  label,
  value,
  onChange,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-bold text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="flex h-12 w-full items-center rounded-xl bg-muted/50 px-4 text-base outline-none"
      />
    </label>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/50 p-3 text-center">
      <div className="mb-1 text-lg font-extrabold">{value}</div>
      <div className="text-[10px] font-bold uppercase text-muted-foreground">{label}</div>
    </div>
  );
}
