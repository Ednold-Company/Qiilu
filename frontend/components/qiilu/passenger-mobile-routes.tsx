"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Car,
  CheckCircle2,
  Clock,
  CreditCard,
  Heart,
  Home,
  Info,
  MapPin,
  MapPinned,
  MessageSquare,
  Moon,
  Phone,
  Send,
  ShieldCheck,
  FileText,
  Star,
  Sun,
  Trash2,
  User,
  Wallet,
  XCircle
} from "lucide-react";
import { fetchJson } from "@/lib/api";
import { clearSession, type SessionUser } from "@/lib/auth-session";
import { getSavedPlaces, removeSavedPlace, type SavedPlace } from "@/lib/passenger-favourites";
import { readImageFileAsDataUrl } from "@/lib/profile-image";
import { useTheme } from "@/lib/theme";

type RideItem = {
  id: string;
  status: string;
  pickup: string;
  destination: string;
  distanceKm: number;
  etaMinutes: number;
  estimatedFareGhs: number;
  actualFareGhs: number | null;
  paymentMethod: string;
  momoProvider: string | null;
  createdAt: string;
  driver: { id: string; name: string; phone: string } | null;
};

type MeResponse = {
  user: {
    id: string;
    name: string;
    phone: string;
    email?: string | null;
    profileImageUrl?: string | null;
    role: "PASSENGER";
    preferredPayment?: string | null;
    momoProvider?: string | null;
    trustedContacts?: string[];
    lowBandwidthMode?: boolean;
    safetyShareEnabled?: boolean;
    kycStatus?: string | null;
  };
};

type IncidentItem = {
  id: string;
  category: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  status: string;
  createdAt: string;
  ride?: {
    id: string;
    pickup: string;
    destination: string;
    status: string;
  } | null;
};

type PassengerExperience = {
  preferredPayment: "MOMO" | "CASH";
  momoProvider: string | null;
  trustedContacts: string[];
  lowBandwidthMode: boolean;
  safetyShareEnabled: boolean;
};

type PassengerWalletResponse = {
  wallet: {
    totalBalanceGhs: number;
    cashGhs: number;
    momoGhs: number;
    pendingWithdrawalGhs: number;
  };
  transactions: Array<{
    id: string;
    kind: string;
    amountGhs: number;
    channel: string;
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

const momoProviders = ["MTN MoMo", "Telecel Cash", "AirtelTigo Money"];

type MobileShellProps = {
  title: string;
  active: "home" | "rides" | "messages" | "account";
  children: ReactNode;
};

export function MobileShell({ title, active, children }: MobileShellProps) {
  const { isDark, ready, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground sm:mx-auto sm:max-w-[430px] sm:overflow-hidden sm:rounded-[3rem] sm:border-8 sm:border-gray-900 sm:shadow-2xl">
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/90 p-6 pt-10 backdrop-blur sm:pt-12">
        <h1 className="text-xl font-bold">{title}</h1>
        <button
          onClick={toggleTheme}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-muted"
          type="button"
        >
          {ready && isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>

      <div className="min-h-[calc(100dvh-9rem)] overflow-y-auto px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-6 sm:px-6">
        {children}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 mx-auto h-[calc(5rem+env(safe-area-inset-bottom))] w-full border-t border-border bg-background/92 shadow-[0_-10px_30px_rgba(0,0,0,0.10)] backdrop-blur sm:max-w-[430px]">
        <div className="grid h-full grid-cols-4 items-center gap-1 px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
          <BottomItem href="/passenger" icon={Home} label="Home" active={active === "home"} />
          <BottomItem href="/passenger/rides" icon={Car} label="Rides" active={active === "rides"} />
          <BottomItem
            href="/passenger/messages"
            icon={MessageSquare}
            label="Messages"
            active={active === "messages"}
          />
          <BottomItem
            href="/passenger/account"
            icon={User}
            label="Account"
            active={active === "account"}
          />
        </div>
      </div>
    </div>
  );
}

function BottomItem({
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

function EmptyState({
  icon: Icon,
  title,
  description
}: {
  icon: typeof XCircle;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <Icon className="mb-3 h-12 w-12 text-muted-foreground opacity-20" />
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function PassengerRidesMobilePage({ user }: { user: SessionUser }) {
  const [activeTab, setActiveTab] = useState<"upcoming" | "past" | "cancelled">("upcoming");
  const [rides, setRides] = useState<RideItem[]>([]);

  useEffect(() => {
    fetchJson<{ rides: RideItem[] }>("/passenger/rides")
      .then((payload) => setRides(payload.rides))
      .catch(() => setRides([]));
  }, []);

  const grouped = useMemo(
    () => ({
      upcoming: rides.filter((ride) => ["SEARCHING", "SCHEDULED", "ACCEPTED", "IN_PROGRESS"].includes(ride.status)),
      past: rides.filter((ride) => ride.status === "COMPLETED"),
      cancelled: rides.filter((ride) => ride.status === "CANCELLED")
    }),
    [rides]
  );

  const current = grouped[activeTab];

  return (
    <MobileShell title="My Rides" active="rides">
      <div className="mb-6 flex rounded-xl bg-muted p-1">
        {(["upcoming", "past", "cancelled"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-lg py-2 text-sm font-bold ${
              activeTab === tab ? "bg-background shadow-sm" : "text-muted-foreground"
            }`}
            type="button"
          >
            {tab[0].toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {current.length ? (
          current.map((ride) => {
            const statusLabel =
              ride.status === "COMPLETED"
                ? "COMPLETED"
                : ride.status === "CANCELLED"
                  ? "CANCELLED"
                  : "ACTIVE";
            const statusTone =
              ride.status === "COMPLETED"
                ? "bg-lime-500/10 text-lime-500"
                : ride.status === "CANCELLED"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-orange-500/10 text-orange-500";

            return (
              <div key={ride.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <span className={`rounded px-2 py-1 text-xs font-bold ${statusTone}`}>
                    {statusLabel}
                  </span>
                  <span className="font-bold">
                    GHS {(ride.actualFareGhs ?? ride.estimatedFareGhs).toFixed(2)}
                  </span>
                </div>
                <div className="mb-4 flex gap-3">
                  <div className="mt-1 flex flex-col items-center">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <div className="h-6 w-0.5 bg-border" />
                    <div className="h-2 w-2 rounded-full bg-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="mb-2 font-bold text-sm">{ride.pickup}</div>
                    <div className="font-bold text-sm text-muted-foreground">{ride.destination}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {new Intl.DateTimeFormat("en-GB", {
                      dateStyle: "medium",
                      timeStyle: "short"
                    }).format(new Date(ride.createdAt))}
                  </div>
                  <div className="rounded bg-secondary/10 px-2 py-1 text-xs font-bold text-secondary">
                    {ride.paymentMethod === "MOMO" ? ride.momoProvider ?? "MoMo" : "Cash"}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <EmptyState
            icon={activeTab === "cancelled" ? XCircle : Car}
            title={activeTab === "cancelled" ? "No cancelled rides" : `No ${activeTab} rides yet`}
            description={
              activeTab === "cancelled"
                ? "Cancelled trips will appear here when they happen."
                : `Your ${activeTab} ride activity will appear here once you start booking.`
            }
          />
        )}
      </div>
      <Link
        href="/passenger"
        className="fixed bottom-24 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg sm:right-[calc(50%-195px+1.5rem)]"
      >
        <Car className="h-6 w-6" />
      </Link>
    </MobileShell>
  );
}

export function PassengerMessagesMobilePage() {
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [activeChat, setActiveChat] = useState<IncidentItem | null>(null);

  useEffect(() => {
    fetchJson<{ incidents: IncidentItem[] }>("/support/incidents")
      .then((payload) => setIncidents(payload.incidents))
      .catch(() => setIncidents([]));
  }, []);

  if (activeChat) {
    return (
      <div className="min-h-screen bg-background text-foreground sm:mx-auto sm:max-w-[430px] sm:overflow-hidden sm:rounded-[3rem] sm:border-8 sm:border-gray-900 sm:shadow-2xl">
        <div className="flex items-center gap-4 border-b border-border bg-background p-6 pt-10 sm:pt-12">
          <button
            onClick={() => setActiveChat(null)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-muted"
            type="button"
          >
            <span className="text-lg">←</span>
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-bold text-lg">{activeChat.category}</h2>
            <p className="truncate text-xs font-bold text-primary">
              {activeChat.ride
                ? `${activeChat.ride.pickup} → ${activeChat.ride.destination}`
                : "General support"}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10 text-secondary">
            <Phone className="h-5 w-5" />
          </div>
        </div>

        <div className="flex items-center gap-3 bg-primary/10 p-3 text-sm font-semibold text-primary">
          <Info className="h-4 w-4" />
          Status: {activeChat.status}
        </div>

        <div className="flex min-h-[calc(100vh-12rem)] flex-col gap-4 overflow-y-auto p-6 pb-28">
          <div className="self-center rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
            {new Intl.DateTimeFormat("en-GB", {
              dateStyle: "medium",
              timeStyle: "short"
            }).format(new Date(activeChat.createdAt))}
          </div>
          <div className="self-end max-w-[80%] rounded-2xl rounded-tr-sm bg-primary p-3 text-primary-foreground">
            {activeChat.description}
          </div>
          <div className="self-start max-w-[80%] rounded-2xl rounded-tl-sm bg-muted p-3 text-foreground">
            Qiilu support has received this report and will continue updating the incident status here.
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background p-4 pb-8 sm:left-auto sm:right-auto sm:w-full sm:max-w-[430px]">
          <div className="flex gap-3">
            <div className="flex-1 rounded-full bg-muted px-4">
              <input
                className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                placeholder="Reply is disabled until live support chat is enabled"
                disabled
              />
            </div>
            <button
              className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-md opacity-60"
              disabled
              type="button"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <MobileShell title="Messages" active="messages">
      <div className="space-y-3">
        {incidents.length ? (
          incidents.map((incident) => (
            <button
              key={incident.id}
              onClick={() => setActiveChat(incident)}
              className="flex w-full items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left transition hover:bg-muted/50"
              type="button"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-secondary text-lg font-bold text-white">
                {incident.category.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <h3 className="truncate font-bold">{incident.category}</h3>
                  <span className="text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat("en-GB", {
                      day: "2-digit",
                      month: "short"
                    }).format(new Date(incident.createdAt))}
                  </span>
                </div>
                <p className="truncate text-sm text-muted-foreground">{incident.description}</p>
              </div>
            </button>
          ))
        ) : (
          <EmptyState
            icon={MessageSquare}
            title="No support threads yet"
            description="Ride support messages will appear here after you submit an issue from an active trip."
          />
        )}
      </div>
    </MobileShell>
  );
}

export function PassengerFavouritesMobilePage() {
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);

  useEffect(() => {
    setSavedPlaces(getSavedPlaces());
  }, []);

  return (
    <MobileShell title="Favourites" active="account">
      <div className="space-y-4">
        {savedPlaces.length ? (
          savedPlaces.map((place) => (
            <div key={place.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <MapPinned className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate font-bold">{place.label}</h3>
                    <p className="text-sm text-muted-foreground">
                      Saved as {place.kind} • {new Date(place.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground"
                  onClick={() => setSavedPlaces(removeSavedPlace(place.id))}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            icon={Heart}
            title="No favourites yet"
            description="Save your pickup and destination entries from the booking flow to see them here."
          />
        )}
      </div>
    </MobileShell>
  );
}

export function PassengerPaymentsMobilePage() {
  const [rides, setRides] = useState<RideItem[]>([]);
  const [wallet, setWallet] = useState<PassengerWalletResponse | null>(null);
  const [experience, setExperience] = useState<PassengerExperience | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"MOMO" | "CASH">("MOMO");
  const [momoProvider, setMomoProvider] = useState("MTN MoMo");
  const [savingPayment, setSavingPayment] = useState(false);
  const [toppingUp, setToppingUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);

  const loadWallet = async () => {
    const payload = await fetchJson<PassengerWalletResponse>("/passenger/wallet");
    setWallet(payload);
  };

  useEffect(() => {
    fetchJson<{ experience: PassengerExperience }>("/passenger/experience")
      .then((payload) => {
        setExperience(payload.experience);
        setPaymentMethod(payload.experience.preferredPayment);
        setMomoProvider(payload.experience.momoProvider ?? "MTN MoMo");
      })
      .catch(() => undefined);
    fetchJson<{ rides: RideItem[] }>("/passenger/rides")
      .then((payload) => setRides(payload.rides))
      .catch(() => setRides([]));
    loadWallet().catch(() => setWallet(null));
  }, []);

  const spent = rides.reduce((total, ride) => total + (ride.actualFareGhs ?? ride.estimatedFareGhs), 0);
  const walletBalance = wallet?.wallet.totalBalanceGhs ?? 0;

  const topUpWallet = async () => {
    const amountGhs = Number(topUpAmount);

    if (!topUpAmount || Number.isNaN(amountGhs) || amountGhs <= 0) {
      setPaymentMessage("Enter a valid top-up amount.");
      return;
    }

    setToppingUp(true);
    setPaymentMessage(null);

    try {
      const payload = await fetchJson<WalletActionResponse>("/passenger/wallet/top-up", {
        method: "POST",
        body: JSON.stringify({ amountGhs, provider: momoProvider })
      });

      if (payload.result?.authorizationUrl) {
        setPaymentMessage(payload.message);
        window.location.assign(payload.result.authorizationUrl);
        return;
      }

      await loadWallet();
      setTopUpAmount("");
      setPaymentMessage(payload.message ?? "Wallet top-up processed.");
    } catch (error) {
      setPaymentMessage(error instanceof Error ? error.message : "Could not top up wallet.");
    } finally {
      setToppingUp(false);
    }
  };

  const savePaymentMethod = async () => {
    setSavingPayment(true);
    setPaymentMessage(null);

    try {
      const payload = await fetchJson<{ experience: PassengerExperience }>("/passenger/experience", {
        method: "PUT",
        body: JSON.stringify({
          preferredPayment: paymentMethod,
          momoProvider,
          trustedContacts: experience?.trustedContacts ?? [],
          lowBandwidthMode: experience?.lowBandwidthMode ?? false,
          safetyShareEnabled: experience?.safetyShareEnabled ?? true
        })
      });
      setExperience(payload.experience);
      setPaymentMessage("Payment preference saved. New ride requests will use this by default.");
    } catch (error) {
      setPaymentMessage(error instanceof Error ? error.message : "Could not save payment preference.");
    } finally {
      setSavingPayment(false);
    }
  };

  return (
    <MobileShell title="Payments" active="account">
      <div className="relative mb-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary to-orange-600 p-6 text-white shadow-xl shadow-primary/20">
        <div className="absolute right-0 top-0 h-32 w-32 translate-x-1/4 -translate-y-1/2 rounded-full bg-white/10 blur-2xl" />
        <div className="mb-1 flex items-center gap-2 text-sm font-medium text-white/80">
          <Wallet className="h-4 w-4" /> Current Balance
        </div>
        <div className="mb-6 text-4xl font-extrabold tracking-tight">
          <span className="mr-1 text-xl opacity-80">GHS</span>
          {walletBalance.toFixed(2)}
        </div>
        <div className="relative z-10 mb-3 rounded-2xl bg-white/15 p-3">
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/70">Top-up amount</label>
          <div className="flex items-center gap-2 rounded-xl bg-white px-4">
            <span className="text-sm font-bold text-primary">GHS</span>
            <input
              value={topUpAmount}
              onChange={(event) => setTopUpAmount(event.target.value)}
              inputMode="decimal"
              type="number"
              min="1"
              placeholder="50.00"
              className="h-12 w-full bg-transparent text-base font-bold text-slate-950 outline-none placeholder:text-slate-400"
            />
          </div>
        </div>
        <button type="button" disabled={toppingUp || !topUpAmount} onClick={() => void topUpWallet()} className="relative z-10 mb-4 h-12 w-full rounded-xl bg-white font-bold text-primary disabled:opacity-60">
          {toppingUp ? "Starting top-up..." : "Top up balance"}
        </button>
        <div className="relative z-10 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white/20 p-4">
            <div className="text-xs font-medium text-white/70">Preferred</div>
            <div className="mt-1 font-bold">{paymentMethod === "MOMO" ? "MoMo" : "Cash"}</div>
          </div>
          <div className="rounded-xl bg-white/20 p-4">
            <div className="text-xs font-medium text-white/70">Ride spend</div>
            <div className="mt-1 font-bold">GHS {spent.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <h3 className="mb-4 text-lg font-bold">Default payment method</h3>
      <div className="mb-8 space-y-3">
        <button
          type="button"
          onClick={() => setPaymentMethod("MOMO")}
          className={`flex w-full items-center justify-between rounded-2xl border-2 bg-card p-4 text-left shadow-sm ${
            paymentMethod === "MOMO" ? "border-primary shadow-primary/10" : "border-border"
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold">Mobile Money</h4>
              <p className="text-sm text-muted-foreground">Passenger approves MoMo after requesting</p>
            </div>
          </div>
          {paymentMethod === "MOMO" ? (
            <div className="rounded bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase text-primary">Default</div>
          ) : null}
        </button>

        {paymentMethod === "MOMO" ? (
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-3 text-sm font-bold">MoMo network</div>
            <div className="grid gap-2">
              {momoProviders.map((provider) => (
                <button
                  key={provider}
                  type="button"
                  onClick={() => setMomoProvider(provider)}
                  className={`rounded-xl border px-4 py-3 text-left text-sm font-bold ${
                    momoProvider === provider ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted/40"
                  }`}
                >
                  {provider}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setPaymentMethod("CASH")}
          className={`flex w-full items-center justify-between rounded-2xl border bg-card p-4 text-left shadow-sm ${
            paymentMethod === "CASH" ? "border-primary bg-primary/5" : "border-border"
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold">Cash</h4>
              <p className="text-sm text-muted-foreground">Pay the driver directly after the trip</p>
            </div>
          </div>
          {paymentMethod === "CASH" ? (
            <div className="rounded bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase text-primary">Default</div>
          ) : null}
        </button>

        <button
          type="button"
          onClick={() => void savePaymentMethod()}
          disabled={savingPayment}
          className="h-12 w-full rounded-xl bg-primary font-bold text-primary-foreground disabled:opacity-60"
        >
          {savingPayment ? "Saving..." : "Save payment preference"}
        </button>
        {paymentMessage ? <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">{paymentMessage}</div> : null}
      </div>

      <h3 className="mb-4 text-lg font-bold">Recent Transactions</h3>
      <div className="space-y-4">
        {rides.length ? (
          rides.slice(0, 6).map((ride) => (
            <div key={ride.id} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <Car className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <div className="text-sm font-bold">{ride.destination}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat("en-GB", {
                      dateStyle: "medium",
                      timeStyle: "short"
                    }).format(new Date(ride.createdAt))}
                  </div>
                </div>
              </div>
              <div className="font-bold text-foreground">
                -{(ride.actualFareGhs ?? ride.estimatedFareGhs).toFixed(2)}
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            icon={Wallet}
            title="No transactions yet"
            description="Your ride charges and payment history will appear here once you complete trips."
          />
        )}
      </div>
    </MobileShell>
  );
}

export function PassengerAccountMobilePage({ sessionUser }: { sessionUser: SessionUser }) {
  const [user, setUser] = useState<MeResponse["user"] | null>(null);
  const [rides, setRides] = useState<RideItem[]>([]);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [uploadingProfileImage, setUploadingProfileImage] = useState(false);

  useEffect(() => {
    fetchJson<MeResponse>("/auth/me")
      .then((payload) => setUser(payload.user))
      .catch(() => setUser(null));
    fetchJson<{ rides: RideItem[] }>("/passenger/rides")
      .then((payload) => setRides(payload.rides))
      .catch(() => setRides([]));
    setSavedPlaces(getSavedPlaces());
  }, []);

  const initials = sessionUser.name
    .split(" ")
    .map((item) => item[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const logout = () => {
    fetchJson("/auth/logout", { method: "POST" })
      .catch(() => undefined)
      .finally(() => {
        clearSession();
        window.location.href = "/login";
      });
  };

  const uploadProfileImage = async (file: File | null) => {
    if (!file) {
      return;
    }

    setUploadingProfileImage(true);
    setProfileMessage(null);

    try {
      const profileImageUrl = await readImageFileAsDataUrl(file);
      const payload = await fetchJson<MeResponse & { message: string }>("/auth/profile", {
        method: "PUT",
        body: JSON.stringify({ profileImageUrl })
      });
      setUser(payload.user);
      setProfileMessage("Profile image updated.");
    } catch (error) {
      setProfileMessage(error instanceof Error ? error.message : "Could not update profile image.");
    } finally {
      setUploadingProfileImage(false);
    }
  };

  const links = [
    { icon: CreditCard, label: "Payment Methods", href: "/passenger/payment" },
    { icon: Heart, label: "Favourites", href: "/passenger/favourites" },
    { icon: ShieldCheck, label: "Safety Settings", href: "/passenger/safety" },
    { icon: FileText, label: "Identity Verification", href: "/passenger/kyc" }
  ];

  return (
    <MobileShell title="Account" active="account">
      <div className="mb-6 rounded-[2rem] border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-5">
          <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gradient-to-tr from-primary to-secondary text-3xl font-extrabold text-white shadow-lg shadow-primary/20">
            {user?.profileImageUrl ? (
              <Image src={user.profileImageUrl} alt={`${sessionUser.name} profile`} fill className="object-cover" unoptimized />
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-2xl font-bold tracking-tight">{sessionUser.name}</h2>
            <p className="mt-1 text-sm font-medium text-muted-foreground">{sessionUser.phone}</p>
            <div className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase ${
              user?.kycStatus === "APPROVED" ? "bg-secondary/10 text-secondary" : user?.kycStatus === "REJECTED" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
            }`}>
              <CheckCircle2 className="h-3 w-3" /> {user?.kycStatus ?? "PENDING"}
            </div>
          </div>
        </div>

        <div className="mb-5">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
            {uploadingProfileImage ? "Uploading..." : "Upload photo"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="hidden"
              onChange={(event) => void uploadProfileImage(event.target.files?.[0] ?? null)}
            />
          </label>
          {profileMessage ? <div className="mt-3 text-sm text-muted-foreground">{profileMessage}</div> : null}
        </div>

        <div className="grid grid-cols-3 gap-4 border-t border-border pt-6">
          <div className="text-center">
            <div className="text-2xl font-extrabold">{rides.length}</div>
            <div className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Trips</div>
          </div>
          <div className="border-x border-border text-center">
            <div className="text-2xl font-extrabold">{savedPlaces.length}</div>
            <div className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Saved</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-extrabold">{user?.trustedContacts?.length ?? 0}</div>
            <div className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Trusted</div>
          </div>
        </div>
      </div>

      <div className="mb-8 rounded-[2rem] border border-border bg-card p-2 shadow-sm">
        {links.map((link) => (
          <Link
            key={link.href}
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

      <div className="rounded-[2rem] border border-border bg-card p-2 shadow-sm">
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center justify-between rounded-xl p-4 text-destructive transition-colors hover:bg-destructive/10"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <User className="h-5 w-5" />
            </div>
            <span className="text-sm font-bold">Logout</span>
          </div>
        </button>
      </div>
    </MobileShell>
  );
}
