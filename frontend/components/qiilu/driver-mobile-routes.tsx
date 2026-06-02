"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  Bell,
  Car,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  FileText,
  HelpCircle,
  Home,
  MapPin,
  Menu,
  MessageSquare,
  Moon,
  Navigation,
  Phone,
  Power,
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
  pickupGuidance?: string | null;
  safetyPin?: string | null;
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
  title: string;
  active: "home" | "rides" | "messages" | "wallet" | "account";
  children: ReactNode;
};

export function DriverShell({ title, active, children }: ShellProps) {
  const { isDark, ready, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground sm:mx-auto sm:max-w-[430px] sm:overflow-hidden sm:rounded-[3rem] sm:border-8 sm:border-gray-900 sm:shadow-2xl">
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card/90 p-6 pt-10 backdrop-blur sm:pt-12">
        <h1 className="text-xl font-bold">{title}</h1>
        <button
          onClick={toggleTheme}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-muted"
          type="button"
        >
          {ready && isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>

      <div className="min-h-[calc(100dvh-9rem)] overflow-y-auto px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-6">{children}</div>

      <div className="fixed bottom-0 left-0 right-0 z-30 mx-auto h-[calc(5rem+env(safe-area-inset-bottom))] w-full border-t border-border bg-card/92 shadow-[0_-10px_30px_rgba(0,0,0,0.10)] backdrop-blur sm:max-w-[430px]">
        <div className="grid h-full grid-cols-5 items-center gap-1 px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
          <DriverBottomItem href="/driver" icon={Home} label="Home" active={active === "home"} />
          <DriverBottomItem href="/driver/rides" icon={Navigation} label="Rides" active={active === "rides"} />
          <DriverBottomItem href="/driver/messages" icon={MessageSquare} label="Messages" active={active === "messages"} />
          <DriverBottomItem href="/driver/wallet" icon={Wallet} label="Wallet" active={active === "wallet"} />
          <DriverBottomItem href="/driver/account" icon={User} label="Account" active={active === "account"} />
        </div>
      </div>
    </div>
  );
}

function DriverBottomItem({
  href,
  icon: Icon,
  label,
  active
}: {
  href: string;
  icon: typeof Home;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex min-w-0 flex-col items-center justify-center rounded-2xl px-1 py-2 text-center transition-colors ${
        active ? "bg-primary/10 text-primary shadow-sm" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
      }`}
    >
      <Icon className="mb-1 h-6 w-6" />
      <span className="block max-w-full text-[10px] font-semibold leading-none">{label}</span>
    </Link>
  );
}

function DriverEmpty({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
      <p className="text-lg font-bold">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function ThemeButton() {
  const { isDark, ready, toggleTheme } = useTheme();

  return (
    <button onClick={toggleTheme} className="flex h-full w-full items-center justify-center" type="button">
      {ready && isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
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

function statusText(value: DriverStatusResponse["status"]["availability"] | undefined) {
  if (value === "ON_TRIP") return "ONLINE";
  if (value === "AVAILABLE") return "ONLINE";
  return "OFFLINE";
}

export function DriverHomeMobilePage({ user }: { user: SessionUser }) {
  const [requests, setRequests] = useState<DriverRequestItem[]>([]);
  const [wallet, setWallet] = useState<DriverWalletResponse["wallet"] | null>(null);
  const [history, setHistory] = useState<DriverHistoryResponse>({
    upcoming: [],
    past: [],
    cancelled: []
  });
  const [kycStatus, setKycStatus] = useState<DriverKycResponse["kycStatus"]>("PENDING");
  const [dispatchMessage, setDispatchMessage] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [availability, setAvailability] =
    useState<DriverStatusResponse["status"]["availability"]>("OFFLINE");
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSendingSos, setIsSendingSos] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);

  const load = async () => {
    try {
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [user.id]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void load();
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
          void load();
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

  const currentRequest = requests[0] ?? null;
  const isOnline = availability !== "OFFLINE";
  const completedRideCount = history.past.length;
  const acceptedRideCount = history.upcoming.length + history.past.length;
  const cancelledRideCount = history.cancelled.length;
  const totalRideDecisions = acceptedRideCount + cancelledRideCount;
  const acceptanceRate = totalRideDecisions ? Math.round((acceptedRideCount / totalRideDecisions) * 100) : 0;
  const isKycApproved = kycStatus === "APPROVED";
  const step: "idle" | "incoming" | "active" = !isOnline
    ? "idle"
    : availability === "ON_TRIP"
      ? "active"
      : currentRequest
        ? "incoming"
        : "idle";

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
      setActionMessage(next === "AVAILABLE" ? "You are online. Incoming ride requests will appear here." : "You are offline.");
      if (next === "OFFLINE") {
        setRequests([]);
      } else {
        void load();
      }
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Could not update driver status.");
    } finally {
      setIsSyncing(false);
    }
  };

  const acceptRide = async () => {
    if (!currentRequest) return;
    setIsSyncing(true);
    setActionMessage(null);

    try {
      await fetchJson(`/driver/requests/${currentRequest.id}/accept`, { method: "POST" });
      setAvailability("ON_TRIP");
      setActionMessage("Ride accepted. The passenger can message you from the trip chat.");
      void load();
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Could not accept ride.");
    } finally {
      setIsSyncing(false);
    }
  };

  const rejectRide = async () => {
    if (!currentRequest) return;
    setIsSyncing(true);
    setActionMessage(null);

    try {
      await fetchJson(`/driver/requests/${currentRequest.id}/reject`, { method: "POST" });
      setActionMessage("Ride declined and returned to dispatch.");
      void load();
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Could not decline ride.");
    } finally {
      setIsSyncing(false);
    }
  };

  const completeRide = async () => {
    if (!currentRequest) return;
    await fetchJson(`/driver/rides/${currentRequest.id}/stage`, {
      method: "POST",
      body: JSON.stringify({ status: "COMPLETED" })
    });
    await fetchJson(`/driver/status/${user.id}`, {
      method: "PUT",
      body: JSON.stringify({ availability: "AVAILABLE" })
    });
    setAvailability("AVAILABLE");
    void load();
  };

  const sendEmergencyIncident = async () => {
    if (!currentRequest) return;
    setIsSendingSos(true);
    setActionMessage(null);

    try {
      await fetchJson("/support/incidents", {
        method: "POST",
        body: JSON.stringify({
          rideId: currentRequest.id,
          category: "Driver emergency SOS",
          severity: "CRITICAL",
          description: [
            `Driver ${user.name} triggered SOS.`,
            `Passenger: ${currentRequest.riderName}.`,
            `Pickup: ${currentRequest.pickup}.`,
            `Destination: ${currentRequest.destination}.`,
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

  if (loading) {
    return (
      <DriverShell title="Driver" active="home">
        <DriverEmpty
          title="Loading dashboard"
          description="Qiilu is preparing your live queue and earnings."
        />
      </DriverShell>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground sm:mx-auto sm:max-w-[430px] sm:overflow-hidden sm:rounded-[3rem] sm:border-8 sm:border-gray-900 sm:shadow-2xl">
      <div className="relative isolate min-h-screen overflow-hidden bg-background">
        <div className="absolute inset-0 z-0">
          <PassengerLiveMap
            pickup={currentRequest?.pickup}
            destination={currentRequest?.destination}
            currentCoords={currentCoords}
            fullScreen
            backgroundMode
          />
        </div>

        <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-full ${
              isOnline ? "bg-secondary/20 animate-pulse" : "bg-muted"
            }`}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-border bg-background shadow-lg">
              <Navigation className="h-4 w-4 rotate-45 fill-current text-foreground" />
            </div>
          </div>
        </div>

        <div className="absolute left-0 top-0 z-20 flex w-full flex-col">
          <div className="pointer-events-auto flex items-center justify-between bg-gradient-to-b from-background/90 to-transparent p-6 pt-10 sm:pt-12">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/80 shadow-md backdrop-blur-sm">
              <Menu className="h-5 w-5" />
            </div>

            <button
              onClick={() => void syncAvailability(isOnline ? "OFFLINE" : "AVAILABLE")}
              className={`flex items-center gap-2 rounded-full px-5 py-2.5 font-bold shadow-lg ${
                isOnline
                  ? "bg-secondary text-secondary-foreground shadow-secondary/25"
                  : "bg-muted text-muted-foreground"
              }`}
              type="button"
            >
              <Power className="h-4 w-4" />
              {statusText(availability)}
            </button>

            <div className="flex items-center gap-2">
              <div className="rounded-2xl bg-background/88 px-3 py-2 shadow-md backdrop-blur-sm">
                <Image src="/qiilu.png" alt="Qiilu" width={88} height={28} className="h-6 w-auto" priority />
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/80 shadow-md">
                <ThemeButton />
              </div>
            </div>
          </div>

          {step === "idle" && isOnline && wallet ? (
            <div className="pointer-events-auto mx-4 mt-2 rounded-2xl border border-border bg-card p-5 shadow-xl">
              <h3 className="mb-1 text-sm font-medium text-muted-foreground">Today's Earnings</h3>
              <div className="mb-4 flex items-end justify-between">
                <div className="text-4xl font-extrabold tracking-tight">
                  <span className="mr-1 text-xl text-muted-foreground">GHS</span>
                  {wallet.totalBalanceGhs.toFixed(2)}
                </div>
                <div className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-sm font-bold text-primary">
                  <Car className="h-3 w-3" /> {wallet.weeklyTrips} trips
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 border-t border-border pt-4">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Accepted</span>
                  <span className="font-bold">{acceptedRideCount}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Cancelled</span>
                  <span className="font-bold">{cancelledRideCount}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Accept rate</span>
                  <span className="font-bold">{acceptanceRate}%</span>
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-border bg-muted/40 p-3 text-xs font-medium text-muted-foreground">
                Ride requests appear in the bottom request card while you are online and KYC approved.
              </div>
            </div>
          ) : null}
        </div>

        <div className="absolute bottom-0 left-0 z-20 flex w-full flex-col justify-end">
          {!isOnline ? (
            <div className="pointer-events-auto rounded-t-[2rem] border-t border-border bg-background p-8 pb-32 text-center shadow-2xl">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Power className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="mb-2 text-2xl font-bold">{isKycApproved ? "You're offline" : "Legal verification required"}</h2>
              <p className="mb-6 text-muted-foreground">
                {isKycApproved
                  ? "Go online to start receiving ride requests."
                  : "Drivers must submit legal name, Ghana Card or license, vehicle insurance, and road-worthiness documents before dispatch is enabled."}
              </p>
              {isKycApproved ? (
                <button
                  onClick={() => void syncAvailability("AVAILABLE")}
                  disabled={isSyncing}
                  className="h-14 w-full rounded-full bg-primary text-lg font-bold text-primary-foreground disabled:opacity-60"
                  type="button"
                >
                  {isSyncing ? "Updating..." : "Go Online"}
                </button>
              ) : (
                <Link href="/driver/kyc" className="flex h-14 w-full items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  Complete KYC
                </Link>
              )}
              {(actionMessage || dispatchMessage) ? (
                <div className="mt-4 rounded-2xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                  {actionMessage ?? dispatchMessage}
                </div>
              ) : null}
            </div>
          ) : null}

          {step === "idle" && isOnline ? (
            <div className="pointer-events-auto rounded-t-[2rem] border-t border-border bg-background p-6 pb-32 shadow-2xl">
              <div className="mb-4 flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Waiting for ride requests</h2>
                  <p className="text-sm text-muted-foreground">
                    Accept and decline cards appear here. Passenger messages appear under Messages after a ride is accepted.
                  </p>
                </div>
              </div>
              {(actionMessage || dispatchMessage) ? (
                <div className="rounded-2xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                  {actionMessage ?? dispatchMessage}
                </div>
              ) : null}
            </div>
          ) : null}

          {step === "incoming" && currentRequest ? (
            <div className="pointer-events-auto overflow-hidden rounded-t-[2rem] border-t border-border bg-background pb-24 shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
              <div className="h-1.5 w-full bg-muted">
                <div
                  className="h-full origin-left animate-[shrink_15s_linear_forwards] bg-primary"
                  style={{ width: "100%" }}
                />
              </div>
              <div className="p-6">
                <div className="mb-6 flex items-start justify-between">
                  <div>
                    <div className="mb-2 inline-block rounded bg-primary/10 px-2 py-1 text-xs font-bold text-primary">
                      APP REQUEST
                    </div>
                    <h2 className="text-3xl font-extrabold tracking-tight">
                      GHS {currentRequest.fareGhs.toFixed(2)}
                    </h2>
                    <p className="mt-1 flex items-center gap-2 font-medium text-muted-foreground">
                      <User className="h-4 w-4" /> {currentRequest.etaMinutes} mins •{" "}
                      {currentRequest.distanceKm} km
                    </p>
                  </div>
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-4 border-muted">
                    <div className="absolute inset-0 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <span className="text-lg font-bold">{currentRequest.countdownSeconds}s</span>
                  </div>
                </div>

                <div className="mb-6 ml-2 space-y-4 border-l-2 border-border pl-4">
                  <div className="relative">
                    <div className="absolute -left-[23px] top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-primary" />
                    <div className="text-sm font-bold">{currentRequest.pickup}</div>
                    <div className="text-xs text-muted-foreground">
                      {currentRequest.pickupGuidance ?? "Pickup ready"}
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-[23px] top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-foreground" />
                    <div className="text-sm font-bold">{currentRequest.destination}</div>
                  </div>
                </div>

                <div className="mb-6 flex items-center justify-between rounded-xl bg-muted/50 p-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Wallet className="h-4 w-4 text-primary" /> {currentRequest.payment}
                  </div>
                  <div className="text-sm font-medium">{currentRequest.riderName}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => void rejectRide()}
                    disabled={isSyncing}
                    className="h-16 rounded-2xl border border-border bg-background text-lg font-bold"
                    type="button"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => void acceptRide()}
                    disabled={isSyncing}
                    className="h-16 rounded-2xl bg-primary text-lg font-bold text-primary-foreground shadow-lg shadow-primary/25"
                    type="button"
                  >
                    Accept
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {step === "active" && currentRequest ? (
            <div className="pointer-events-auto rounded-t-[2rem] border-t border-border bg-background pb-24 shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
              <div className="flex w-full justify-center pb-2 pt-3">
                <div className="h-1.5 w-12 rounded-full bg-muted-foreground/20" />
              </div>
              <div className="px-6">
                <div className="mb-4 flex items-center justify-between rounded-2xl bg-primary p-4 text-primary-foreground shadow-lg shadow-primary/20">
                  <div>
                    <div className="mb-1 text-xs font-semibold uppercase tracking-wider opacity-80">
                      Current Action
                    </div>
                    <h3 className="text-xl font-bold">Pick up rider</h3>
                  </div>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20">
                    <Navigation className="h-6 w-6 fill-current" />
                  </div>
                </div>

                <div className="mb-4 flex items-center justify-between border-b border-border py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 text-lg font-bold text-white">
                      {currentRequest.riderName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold">{currentRequest.riderName}</h4>
                      <div className="text-sm text-muted-foreground">
                        {currentRequest.payment} • {currentRequest.passengers} passenger
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href="/driver/messages"
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground"
                    >
                      <MessageSquare className="h-5 w-5" />
                    </Link>
                    <button
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10 text-secondary"
                      type="button"
                    >
                      <Phone className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="mb-4 grid grid-cols-3 gap-3">
                  <Link href="/driver/messages" className="rounded-2xl bg-muted/70 p-4 text-center">
                    <MessageSquare className="mx-auto mb-2 h-5 w-5" />
                    <span className="text-xs font-bold">Message</span>
                  </Link>
                  <button type="button" className="rounded-2xl bg-muted/70 p-4 text-center">
                    <Navigation className="mx-auto mb-2 h-5 w-5" />
                    <span className="text-xs font-bold">Share</span>
                  </button>
                  <button type="button" onClick={() => void sendEmergencyIncident()} disabled={isSendingSos} className="rounded-2xl bg-destructive/10 p-4 text-center text-destructive disabled:opacity-60">
                    <AlertTriangle className="mx-auto mb-2 h-5 w-5" />
                    <span className="text-xs font-bold">{isSendingSos ? "Sending" : "SOS"}</span>
                  </button>
                </div>

                <button
                  onClick={() => void completeRide()}
                  className="mb-4 h-14 w-full rounded-2xl bg-primary text-lg font-bold text-primary-foreground shadow-lg shadow-primary/25"
                  type="button"
                >
                  Arrived at Pickup
                </button>

                <button
                  onClick={() => void sendEmergencyIncident()}
                  disabled={isSendingSos}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl font-bold text-destructive transition-colors hover:bg-destructive/5"
                  type="button"
                >
                  <ShieldCheck className="h-5 w-5" /> {isSendingSos ? "Sending SOS..." : "Emergency SOS to Qiilu Ops"}
                </button>
                {actionMessage ? (
                  <div className="mt-3 rounded-2xl border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                    {actionMessage}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="fixed bottom-0 left-0 right-0 z-30 mx-auto h-[calc(5rem+env(safe-area-inset-bottom))] w-full border-t border-border bg-background/92 shadow-[0_-10px_30px_rgba(0,0,0,0.10)] backdrop-blur sm:max-w-[430px]">
            <div className="grid h-full grid-cols-5 items-center gap-1 px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
              <DriverBottomItem href="/driver" icon={Home} label="Home" active />
              <DriverBottomItem href="/driver/rides" icon={Navigation} label="Rides" active={step !== "idle"} />
              <DriverBottomItem href="/driver/messages" icon={MessageSquare} label="Messages" active={false} />
              <DriverBottomItem href="/driver/wallet" icon={Wallet} label="Wallet" active={false} />
              <DriverBottomItem href="/driver/account" icon={User} label="Account" active={false} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DriverRidesMobilePage({ userId }: { userId: string }) {
  const [activeTab, setActiveTab] = useState<"upcoming" | "past" | "cancelled">("past");
  const [expandedTrip, setExpandedTrip] = useState<number | null>(0);
  const [history, setHistory] = useState<DriverHistoryResponse>({
    upcoming: [],
    past: [],
    cancelled: []
  });

  useEffect(() => {
    fetchJson<DriverHistoryResponse>(`/driver/history/${userId}`)
      .then((payload) => setHistory(payload))
      .catch(() => setHistory({ upcoming: [], past: [], cancelled: [] }));
  }, [userId]);

  const currentList = history[activeTab];
  const acceptedRideCount = history.upcoming.length + history.past.length;
  const cancelledRideCount = history.cancelled.length;
  const completedRideCount = history.past.length;
  const totalRideDecisions = acceptedRideCount + cancelledRideCount;
  const acceptanceRate = totalRideDecisions ? Math.round((acceptedRideCount / totalRideDecisions) * 100) : 0;

  return (
    <DriverShell title="Ride History" active="rides">
      <div className="mb-6 grid grid-cols-2 gap-3">
        <StatCard label="Accepted" value={String(acceptedRideCount)} />
        <StatCard label="Completed" value={String(completedRideCount)} />
        <StatCard label="Cancelled" value={String(cancelledRideCount)} />
        <StatCard label="Accept Rate" value={`${acceptanceRate}%`} />
      </div>

      <div className="mb-6 flex rounded-xl border border-border bg-card p-1">
        {(["upcoming", "past", "cancelled"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-lg py-2 text-sm font-bold ${
              activeTab === tab ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
            type="button"
          >
            {tab[0].toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {currentList.length ? (
        <div className="space-y-4">
          {currentList.map((trip, index) => {
            const expanded = expandedTrip === index;
            return (
              <div key={`${trip.route}-${trip.time}`} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <button
                  className="w-full p-4 text-left hover:bg-muted/30"
                  onClick={() => setExpandedTrip(expanded ? null : index)}
                  type="button"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold">{trip.rider}</div>
                        <div className="text-[10px] text-muted-foreground">{trip.time}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-secondary">GHS {trip.net.toFixed(2)}</div>
                      <div className="mt-1 inline-block rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary">
                        -15% Comm
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex max-w-[200px] items-center gap-1 truncate font-medium">
                      <MapPin className="h-3 w-3" /> {trip.route}
                    </div>
                    {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {expanded ? (
                  <div className="border-t border-border bg-muted/10 px-4 pb-4 pt-2">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Gross Fare</span>
                        <span className="font-medium">GHS {trip.gross.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Qiilu Commission (15%)</span>
                        <span className="font-medium text-destructive">
                          -GHS {(trip.gross - trip.net).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-t border-border pt-2">
                        <span className="font-bold">Net Earnings</span>
                        <span className="font-bold text-secondary">GHS {trip.net.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <DriverEmpty
          title={`No ${activeTab} rides yet`}
          description="Driver trip activity will appear here as real rides move through the system."
        />
      )}
    </DriverShell>
  );
}

export function DriverWalletMobilePage({ userId }: { userId: string }) {
  const [wallet, setWallet] = useState<DriverWalletResponse | null>(null);
  const [walletMessage, setWalletMessage] = useState<string | null>(null);
  const [toppingUp, setToppingUp] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAccountRef, setWithdrawAccountRef] = useState("");

  const load = async () => {
    try {
      const payload = await fetchJson<DriverWalletResponse>(`/driver/wallet/${userId}`);
      setWallet(payload);
    } catch {
      setWallet(null);
    }
  };

  useEffect(() => {
    const paymentStatus = new URLSearchParams(window.location.search).get("payment");
    if (paymentStatus === "paystack") {
      setWalletMessage("Payment approval received. Your wallet will update when Paystack confirms the transaction.");
    }

    void load();
  }, [userId]);

  const topUp = async () => {
    const amountGhs = Number(topUpAmount);
    if (!topUpAmount || Number.isNaN(amountGhs) || amountGhs < WALLET_TOP_UP_MIN_GHS || amountGhs > WALLET_TOP_UP_MAX_GHS) {
      setWalletMessage(`Top-up amount must be between GHS ${WALLET_TOP_UP_MIN_GHS} and GHS ${WALLET_TOP_UP_MAX_GHS.toLocaleString()}.`);
      return;
    }

    setToppingUp(true);
    setWalletMessage(null);

    try {
      const payload = await fetchJson<WalletActionResponse>(`/driver/wallet/${userId}/top-up`, {
        method: "POST",
        body: JSON.stringify({ amountGhs, provider: "MTN MoMo" })
      });

      if (payload.result?.authorizationUrl) {
        setWalletMessage(payload.message);
        window.location.assign(payload.result.authorizationUrl);
        return;
      }

      await load();
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
      const payload = await fetchJson<{ message: string }>(`/driver/wallet/${userId}/withdraw`, {
        method: "POST",
        body: JSON.stringify({ amountGhs, provider: "MTN MoMo", accountRef: withdrawAccountRef.trim() })
      });
      await load();
      setWithdrawAmount("");
      setWalletMessage(payload.message ?? "Withdrawal request submitted.");
    } catch (error) {
      setWalletMessage(error instanceof Error ? error.message : "Could not request withdrawal.");
    } finally {
      setWithdrawing(false);
    }
  };

  const recentTransactions = wallet?.transactions.slice(0, 5) ?? [];
  const chartData = Array.from({ length: 7 }, (_, index) => {
    const target = new Date();
    target.setDate(target.getDate() - (6 - index));
    const dayKey = target.toISOString().slice(0, 10);
    const total =
      wallet?.transactions
        .filter((transaction) => transaction.createdAt.slice(0, 10) === dayKey)
        .reduce((sum, transaction) => sum + transaction.amountGhs, 0) ?? 0;

    return {
      label: target.toLocaleDateString("en-GB", { weekday: "short" }).slice(0, 1),
      total
    };
  });
  const maxChart = Math.max(...chartData.map((item) => item.total), 1);
  const withdrawAmountGhs = Number(withdrawAmount);
  const withdrawExceedsBalance = Boolean(withdrawAmount) && Number.isFinite(withdrawAmountGhs) && wallet ? withdrawAmountGhs > wallet.wallet.totalBalanceGhs : false;

  return (
    <DriverShell title="Earnings Wallet" active="wallet">
      {wallet ? (
        <>
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-secondary to-primary p-6 text-white shadow-xl shadow-secondary/20">
            <div className="absolute right-0 top-0 h-48 w-48 translate-x-1/3 -translate-y-1/2 rounded-full bg-white/10 blur-3xl" />
            <div className="relative z-10">
              <div className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white/90">
                <Activity className="h-4 w-4" /> Net Earnings
              </div>
              <div className="mb-2 text-5xl font-extrabold tracking-tight">
                <span className="mr-1 text-2xl opacity-80">GHS</span>
                {wallet.wallet.totalBalanceGhs.toFixed(2)}
              </div>
              <div className="mb-6 inline-block rounded-full bg-white/20 px-3 py-1 text-sm font-medium">
                Pending withdrawal: GHS {wallet.wallet.pendingWithdrawalGhs.toFixed(2)}
              </div>
              <div className="mb-3 rounded-2xl bg-white p-3 text-slate-950 shadow-lg">
                <label className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-slate-600">Cash-out amount</label>
                <div className="mb-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4">
                  <span className="text-sm font-bold text-secondary">GHS</span>
                  <input
                    value={withdrawAmount}
                    onChange={(event) => setWithdrawAmount(event.target.value)}
                    inputMode="decimal"
                    type="number"
                    min="1"
                    placeholder="100.00"
                    className="h-12 w-full bg-transparent text-base font-bold text-slate-950 outline-none placeholder:text-slate-500"
                  />
                </div>
                <input
                  value={withdrawAccountRef}
                  onChange={(event) => setWithdrawAccountRef(event.target.value)}
                  inputMode="tel"
                  placeholder="MoMo number"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-base font-bold text-slate-950 outline-none placeholder:text-slate-500"
                />
                {withdrawExceedsBalance ? (
                  <div className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
                    Withdrawal is higher than your available balance of GHS {wallet.wallet.totalBalanceGhs.toFixed(2)}.
                  </div>
                ) : null}
              </div>
              <button
                onClick={() => void withdraw()}
                disabled={withdrawing || !withdrawAmount || !withdrawAccountRef.trim() || withdrawExceedsBalance}
                className="h-14 w-full rounded-xl bg-white font-bold text-slate-950 shadow-lg disabled:bg-white/70 disabled:text-slate-500"
                type="button"
              >
                {withdrawing ? "Requesting..." : "Cash Out Now"}
              </button>
              <div className="mt-3 rounded-2xl bg-white/15 p-3">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/70">Top-up amount</label>
                <div className="flex items-center gap-2 rounded-xl bg-white px-4">
                  <span className="text-sm font-bold text-secondary">GHS</span>
                  <input
                    value={topUpAmount}
                    onChange={(event) => setTopUpAmount(event.target.value)}
                    inputMode="decimal"
                    type="number"
                    min={WALLET_TOP_UP_MIN_GHS}
                    max={WALLET_TOP_UP_MAX_GHS}
                    placeholder="50.00"
                    className="h-12 w-full bg-transparent text-base font-bold text-slate-950 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>
              <button
                onClick={() => void topUp()}
                disabled={toppingUp || !topUpAmount}
                className="mt-3 h-12 w-full rounded-xl bg-white/20 font-bold text-white disabled:opacity-60"
                type="button"
              >
                {toppingUp ? "Starting top-up..." : "Top up balance"}
              </button>
              <div className="mt-2 text-xs font-medium text-white/70">
                Top-up limit: GHS {WALLET_TOP_UP_MIN_GHS} to GHS {WALLET_TOP_UP_MAX_GHS.toLocaleString()}.
              </div>
            </div>
          </div>
          {walletMessage ? <div className="mt-4 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">{walletMessage}</div> : null}

          <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-4 text-lg font-bold">Today's Breakdown</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-muted-foreground">Trips Completed</span>
                <span className="font-bold">{wallet.wallet.weeklyTrips}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-muted-foreground">Cash balance</span>
                <span className="font-bold">GHS {wallet.wallet.cashGhs.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-muted-foreground">MoMo balance</span>
                <span className="font-bold">GHS {wallet.wallet.momoGhs.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="font-bold">Completion Rate</span>
                <span className="text-lg font-bold text-secondary">{wallet.wallet.completionRate}%</span>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold">Linked payout method</h4>
                  <p className="text-sm text-muted-foreground">Mobile Money payout available</p>
                </div>
              </div>
              <button onClick={() => void topUp()} disabled={toppingUp} className="text-sm font-bold text-primary disabled:opacity-60" type="button">
                {toppingUp ? "Starting..." : "Top up"}
              </button>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-6 text-lg font-bold">Last 7 Days</h3>
            <div className="mb-2 flex h-40 items-end justify-between gap-2">
              {chartData.map((item, index) => (
                <div key={`${item.label}-${index}`} className="flex h-full w-full items-end">
                  <div
                    className={`w-full rounded-t-md transition-colors ${
                      index === chartData.length - 1 ? "bg-secondary" : "bg-secondary/20 hover:bg-secondary/40"
                    }`}
                    style={{ height: `${Math.max((item.total / maxChart) * 100, item.total > 0 ? 12 : 6)}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-[10px] font-bold uppercase text-muted-foreground">
              {chartData.map((item, index) => (
                <span key={`${item.label}-stamp-${index}`} className={index === chartData.length - 1 ? "text-secondary" : ""}>
                  {item.label}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-4 text-lg font-bold">Recent Transactions</h3>
            <div className="space-y-4">
              {recentTransactions.length ? (
                recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <Wallet className="h-5 w-5 text-foreground" />
                      </div>
                      <div>
                        <div className="text-sm font-bold">{transaction.kind.replace(/_/g, " ")}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Intl.DateTimeFormat("en-GB", {
                            dateStyle: "medium",
                            timeStyle: "short"
                          }).format(new Date(transaction.createdAt))}
                        </div>
                      </div>
                    </div>
                    <div className="font-bold">GHS {transaction.amountGhs.toFixed(2)}</div>
                  </div>
                ))
              ) : (
                <DriverEmpty
                  title="No wallet activity yet"
                  description="Transactions will appear here when top-ups, ride credits, and payouts happen."
                />
              )}
            </div>
          </div>
        </>
      ) : (
        <DriverEmpty
          title="Wallet unavailable"
          description="Qiilu could not load the live driver wallet right now."
        />
      )}
    </DriverShell>
  );
}

export function DriverMessagesMobilePage() {
  return (
    <DriverShell title="Messages" active="messages">
      <DriverEmpty
        title="No live driver chat threads yet"
        description="Driver messaging UI is in place, but passenger-driver messaging is still waiting for a dedicated realtime chat backend."
      />
      <div className="mt-4 rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10 text-secondary">
            <HelpCircle className="h-5 w-5" />
          </div>
          <div>
            <div className="font-bold">Qiilu Partner Support</div>
            <div className="text-xs text-muted-foreground">
              Use the support tools from active trips for now.
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 rounded-full bg-muted px-4">
            <input
              className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
              placeholder="Type a message..."
              disabled
            />
          </div>
          <button className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white opacity-60" disabled type="button">
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </DriverShell>
  );
}

export function DriverSafetyMobilePage() {
  return (
    <DriverShell title="Safety Hub" active="account">
      <div className="space-y-4">
        <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold">Driver safety tools</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            SOS is available during an active trip. It sends incident details to Qiilu operations with the ride context.
          </p>
        </div>
        <div className="grid gap-3">
          <DriverSafetyCard title="Trip SOS" description="Use the SOS button inside an active ride when immediate support is needed." />
          <DriverSafetyCard title="Passenger identity" description="Passenger name, phone, route, and ride ID are attached to safety reports." />
          <DriverSafetyCard title="Location sharing" description="Keep location permission enabled while online so dispatch and safety tools stay accurate." />
        </div>
      </div>
    </DriverShell>
  );
}

export function DriverSupportMobilePage() {
  return (
    <DriverShell title="Help & Support" active="account">
      <div className="space-y-4">
        <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <HelpCircle className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold">Qiilu partner support</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Use these support paths for account, KYC, wallet, and ride issues. Live passenger chat stays in Messages.
          </p>
        </div>
        <div className="grid gap-3">
          <DriverSafetyCard title="KYC review" description="If documents are rejected, update them from Account or the KYC page." />
          <DriverSafetyCard title="Wallet and payouts" description="Check Wallet for cash-out status, balance, and payout warnings." />
          <DriverSafetyCard title="Ride disputes" description="For completed rides, share the ride ID and issue details with operations." />
        </div>
        <Link href="/driver/messages" className="flex h-12 items-center justify-center rounded-xl border border-border bg-card text-sm font-bold">
          Open passenger messages
        </Link>
      </div>
    </DriverShell>
  );
}

function DriverSafetyCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="font-bold">{title}</div>
      <div className="mt-1 text-sm text-muted-foreground">{description}</div>
    </div>
  );
}

export function DriverFavouritesMobilePage() {
  const [activeTab, setActiveTab] = useState<"locations" | "passengers">("locations");

  return (
    <DriverShell title="Favourites" active="account">
      <div className="mb-6 flex rounded-xl border border-border bg-card p-1">
        <button
          onClick={() => setActiveTab("locations")}
          className={`flex-1 rounded-lg py-2 text-sm font-bold ${
            activeTab === "locations" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
          type="button"
        >
          Locations
        </button>
        <button
          onClick={() => setActiveTab("passengers")}
          className={`flex-1 rounded-lg py-2 text-sm font-bold ${
            activeTab === "passengers" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
          type="button"
        >
          Passengers
        </button>
      </div>

      <DriverEmpty
        title={activeTab === "locations" ? "No favourite locations yet" : "No favourite passengers yet"}
        description={
          activeTab === "locations"
            ? "Driver bookmarks are not stored in the live backend yet, so Qiilu is keeping this screen honest until that feature lands."
            : "Favourite passenger relationships are not persisted yet, so this screen stays empty instead of showing fake riders."
        }
      />
      <div className="mt-4 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground">
            {activeTab === "locations" ? <MapPin className="h-5 w-5" /> : <ShieldBan className="h-5 w-5" />}
          </div>
          <div>
            <div className="font-bold">
              {activeTab === "locations" ? "Save repeat destinations" : "Manage trusted riders"}
            </div>
            <div className="text-xs text-muted-foreground">
              The exact Qiilu UI is here. The live persistence layer is the only missing piece.
            </div>
          </div>
        </div>
      </div>
    </DriverShell>
  );
}

export function DriverAccountMobilePage({ sessionUser }: { sessionUser: SessionUser }) {
  const [me, setMe] = useState<MeResponse["user"] | null>(null);
  const [wallet, setWallet] = useState<DriverWalletResponse["wallet"] | null>(null);
  const [kyc, setKyc] = useState<DriverKycResponse | null>(null);
  const [activeSection, setActiveSection] = useState<"overview" | "profile" | "vehicle" | "documents">("overview");
  const [documentType, setDocumentType] = useState("DRIVERS_LICENSE");
  const [documentNumber, setDocumentNumber] = useState("");
  const [legalName, setLegalName] = useState(sessionUser.name);
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
      fetchJson<DriverWalletResponse>(`/driver/wallet/${sessionUser.id}`),
      fetchJson<DriverKycResponse>(`/driver/kyc/${sessionUser.id}`)
    ]);

    setMe(mePayload.status === "fulfilled" ? mePayload.value.user : null);
    setWallet(walletPayload.status === "fulfilled" ? walletPayload.value.wallet : null);
    setKyc(kycPayload.status === "fulfilled" ? kycPayload.value : null);
  };

  useEffect(() => {
    loadAccount()
      .catch(() => {
        setMe(null);
        setWallet(null);
        setKyc(null);
      });
  }, [sessionUser.id]);

  useEffect(() => {
    const section = new URLSearchParams(window.location.search).get("section");

    if (section === "profile" || section === "vehicle" || section === "documents" || section === "overview") {
      setActiveSection(section);
    }
  }, []);

  const initials = sessionUser.name
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

  const logout = () => {
    fetchJson("/auth/logout", { method: "POST" })
      .catch(() => undefined)
      .finally(() => {
        clearSession();
        window.location.href = "/login";
      });
  };

  const links = [
    { icon: Settings, label: "Edit Profile", href: "/driver/account?section=profile" },
    { icon: Car, label: "Vehicle Information", href: "/driver/account?section=vehicle" },
    { icon: FileText, label: "Documents & KYC", href: "/driver/kyc" },
    { icon: CreditCard, label: "Bank & MoMo Details", href: "/driver/wallet" },
    { icon: ShieldCheck, label: "Safety Hub", href: "/driver/safety" },
    { icon: HelpCircle, label: "Help & Support", href: "/driver/support" }
  ];

  const submitKyc = async () => {
    setSubmittingKyc(true);
    setKycMessage(null);

    try {
      await fetchJson(`/driver/kyc/${sessionUser.id}`, {
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

  return (
    <DriverShell title="Driver Profile" active="account">
      <div className="relative rounded-[2rem] border border-border bg-card p-6 shadow-sm">
        <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-secondary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary">
          <CheckCircle2 className="h-3 w-3" /> {me?.kycStatus ?? "pending"}
        </div>
        <div className="mb-6 mt-2 flex flex-col items-center">
          <div className="mb-4 overflow-hidden rounded-full border-4 border-background shadow-lg">
            {me?.profileImageUrl ? (
              <Image
                src={me.profileImageUrl}
                alt={`${sessionUser.name} profile`}
                width={96}
                height={96}
                className="h-24 w-24 object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center bg-gradient-to-tr from-blue-500 to-purple-600 text-3xl font-extrabold text-white">
                {initials}
              </div>
            )}
          </div>
          <h2 className="text-2xl font-bold tracking-tight">{sessionUser.name}</h2>
          <p className="text-sm font-medium text-muted-foreground">{sessionUser.phone}</p>
          <div className="mt-3 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            Driver Partner Pro
          </div>
          <label className="mt-4 inline-flex cursor-pointer items-center justify-center rounded-full border border-border bg-muted px-4 py-2 text-xs font-bold text-foreground transition hover:bg-muted/80">
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
          {profileMessage ? <div className="mt-3 text-center text-xs text-muted-foreground">{profileMessage}</div> : null}
        </div>

        <div className="grid grid-cols-3 gap-2 border-t border-border pt-6">
          <StatCard label="Status" value={statusText(me?.availability)} />
          <StatCard label="Trips" value={wallet ? String(wallet.weeklyTrips) : "0"} />
          <StatCard label="Balance" value={wallet ? `GHS ${wallet.totalBalanceGhs.toFixed(0)}` : "GHS 0"} />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl border border-border bg-card p-1">
        {[
          { key: "overview", label: "Overview" },
          { key: "profile", label: "Profile" },
          { key: "vehicle", label: "Vehicle" },
          { key: "documents", label: "KYC" }
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setActiveSection(item.key as "overview" | "profile" | "vehicle" | "documents")}
            className={`rounded-lg py-2 text-sm font-bold ${activeSection === item.key ? "bg-primary text-white shadow-sm" : "text-muted-foreground"}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {activeSection === "overview" ? (
        <div className="mt-6 rounded-[2rem] border border-border bg-card p-2 shadow-sm">
        {links.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="flex items-center justify-between rounded-xl p-4 transition-colors hover:bg-muted/50"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground">
                <link.icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-bold">{link.label}</span>
            </div>
            <span className="text-muted-foreground">›</span>
          </Link>
        ))}
        </div>
      ) : activeSection === "profile" ? (
        <div className="mt-6 space-y-4 rounded-[2rem] border border-border bg-card p-5 shadow-sm">
          <div>
            <div className="text-lg font-bold">Edit profile</div>
            <div className="text-sm text-muted-foreground">Manage the driver details passengers and dispatch see.</div>
          </div>
          <div className="grid gap-3 text-sm">
            <StatCard label="Name" value={me?.name ?? sessionUser.name} />
            <StatCard label="Phone" value={me?.phone ?? sessionUser.phone} />
            <StatCard label="Email" value={me?.email ?? "Not set"} />
            <StatCard label="Availability" value={statusText(me?.availability)} />
          </div>
          <label className="inline-flex h-12 cursor-pointer items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground">
            {uploadingProfileImage ? "Uploading..." : "Change profile photo"}
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
          {profileMessage ? <div className="rounded-xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">{profileMessage}</div> : null}
        </div>
      ) : activeSection === "vehicle" ? (
        <div className="mt-6 space-y-4 rounded-[2rem] border border-border bg-card p-5 shadow-sm">
          <div>
            <div className="text-lg font-bold">Vehicle information</div>
            <div className="text-sm text-muted-foreground">Vehicle compliance is controlled through driver KYC documents.</div>
          </div>
          <div className="grid gap-3 text-sm">
            <StatCard label="Vehicle insurance" value={(kyc?.requiredDocuments ?? []).includes("VEHICLE_INSURANCE") ? "Required" : "Submitted or not required"} />
            <StatCard label="Road worthiness" value={(kyc?.requiredDocuments ?? []).includes("ROAD_WORTHINESS") ? "Required" : "Submitted or not required"} />
            <StatCard label="Driver license" value={(kyc?.requiredDocuments ?? []).includes("DRIVERS_LICENSE") ? "Required" : "Submitted or not required"} />
            <StatCard label="Verification" value={(kyc?.kycStatus ?? me?.kycStatus ?? "PENDING").replaceAll("_", " ")} />
          </div>
          <button
            type="button"
            onClick={() => setActiveSection("documents")}
            className="h-12 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
          >
            Update vehicle documents
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-bold">Documents & KYC</div>
                <div className="text-sm text-muted-foreground">Submit one verification document for review.</div>
              </div>
              <div className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${
                (kyc?.kycStatus ?? "PENDING") === "APPROVED"
                  ? "bg-secondary/10 text-secondary"
                  : (kyc?.kycStatus ?? "PENDING") === "REJECTED"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-primary/10 text-primary"
              }`}>
                {kyc?.kycStatus ?? "PENDING"}
              </div>
            </div>

            <div className="mb-4 grid gap-3">
              <label className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Document type</span>
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
              <MobileFieldInput label="Document Number" value={documentNumber} onChange={setDocumentNumber} placeholder="Enter document number" />
              <MobileFieldInput label="Legal Name" value={legalName} onChange={setLegalName} placeholder="Name on document" />
              <MobileFieldInput label="Issuing Country" value={issuingCountry} onChange={setIssuingCountry} placeholder="Ghana" />
              <label className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Front side</span>
                <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4">
                  <div className="text-sm font-semibold">{documentFileName ?? "No file selected yet"}</div>
                  <div className="mt-1 text-xs text-muted-foreground">Upload the front side as an image or PDF up to 5MB.</div>
                  <button
                    type="button"
                    disabled={submittingKyc}
                    onClick={() => kycDocumentInputRef.current?.click()}
                    className="mt-3 inline-flex rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
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
              <label className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Back side</span>
                <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4">
                  <div className="text-sm font-semibold">{documentBackFileName ?? "No file selected yet"}</div>
                  <div className="mt-1 text-xs text-muted-foreground">Upload the back side as an image or PDF up to 5MB.</div>
                  <button
                    type="button"
                    disabled={submittingKyc}
                    onClick={() => kycDocumentBackInputRef.current?.click()}
                    className="mt-3 inline-flex rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
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
              <label className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Driver selfie</span>
                <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4">
                  <div className="text-sm font-semibold">{selfieFileName ?? "No selfie selected yet"}</div>
                  <div className="mt-1 text-xs text-muted-foreground">Upload a clear face photo, or use the full KYC workflow for live camera capture.</div>
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
                    className="mt-3 inline-flex rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
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
            </div>

            {kycMessage ? <div className="mb-4 rounded-xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">{kycMessage}</div> : null}

            <button
              type="button"
              disabled={submittingKyc || !documentUrl || !documentBackUrl || !selfieImageUrl || !movementCheckPassed}
              onClick={() => void submitKyc()}
              className="h-12 w-full rounded-xl bg-primary font-bold text-primary-foreground disabled:opacity-60"
            >
              {submittingKyc ? "Submitting..." : "Submit for review"}
            </button>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 text-lg font-bold">Recent submissions</div>
            <div className="space-y-3">
              {(kyc?.submissions ?? []).length ? (
                kyc!.submissions.map((submission) => (
                  <div key={submission.id} className="rounded-xl border border-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold">{submission.documentType?.replaceAll("_", " ") ?? "Document"}</div>
                        <div className="text-xs text-muted-foreground">
                          {submission.documentNumber ?? "No number"} • {new Date(submission.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                        submission.status === "APPROVED"
                          ? "bg-secondary/10 text-secondary"
                          : submission.status === "REJECTED"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-primary/10 text-primary"
                      }`}>
                        {submission.status}
                      </div>
                    </div>
                    <a href={submission.documentUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs font-bold text-primary">
                      Open front
                    </a>
                    {submission.documentBackUrl ? <a href={submission.documentBackUrl} target="_blank" rel="noreferrer" className="ml-3 mt-3 inline-block text-xs font-bold text-primary">Open back</a> : null}
                    {submission.selfieImageUrl ? <a href={submission.selfieImageUrl} target="_blank" rel="noreferrer" className="ml-3 mt-3 inline-block text-xs font-bold text-primary">Open selfie</a> : null}
                  </div>
                ))
              ) : (
                <DriverEmpty title="No KYC submissions yet" description="Your document review history will appear here after the first upload." />
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-border bg-card p-2 shadow-sm">
        <button
          onClick={logout}
          className="flex w-full items-center justify-between rounded-xl p-4 text-destructive transition-colors hover:bg-destructive/10"
          type="button"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <User className="h-5 w-5" />
            </div>
            <span className="text-sm font-bold">Sign Out</span>
          </div>
        </button>
      </div>
    </DriverShell>
  );
}

function MobileFieldInput({
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
      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-xl border border-border bg-muted/50 px-4 text-sm outline-none"
      />
    </label>
  );
}
