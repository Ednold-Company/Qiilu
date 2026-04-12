"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Car,
  CheckCircle2,
  LayoutDashboard,
  ListOrdered,
  LoaderCircle,
  LogOut,
  MessageSquare,
  Phone,
  Power,
  ShieldCheck,
  User,
  Wallet
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchJson } from "@/lib/api";
import { clearSession, type SessionUser } from "@/lib/auth-session";
import { getRealtimeUrl } from "@/lib/realtime";

const PassengerLiveMap = dynamic(() => import("@/components/passenger-live-map"), { ssr: false });

type DriverRequest = {
  id: string;
  source: string;
  status?: string;
  pickup: string;
  destination: string;
  payment: string;
  paymentMethod: string;
  momoProvider: string | null;
  fareGhs: number;
  etaMinutes: number;
  passengers: number;
  distanceKm: number;
  countdownSeconds: number;
  riderName: string;
  pickupGuidance?: string;
  safetyPin?: string | null;
  trustedContactCount?: number;
  lowBandwidthBooking?: boolean;
};

type WalletPayload = {
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
};

type HistoryRide = {
  route: string;
  time: string;
  rider: string;
  gross: number;
  net: number;
};

type HistoryPayload = {
  upcoming: HistoryRide[];
  past: HistoryRide[];
  cancelled: HistoryRide[];
};

type DriverStatusPayload = {
  status: {
    availability: "OFFLINE" | "AVAILABLE" | "ON_TRIP";
  };
};

type DriverRequestsPayload = {
  requests: DriverRequest[];
  dispatchEnabled?: boolean;
  message?: string | null;
};

type WalletActionResponse = {
  message: string;
  result?: {
    status?: string;
    authorizationUrl?: string | null;
  };
};

export function DriverScreen({ user, token }: { user: SessionUser; token: string }) {
  const router = useRouter();
  const initials = useMemo(() => user.name.split(" ").map((item) => item[0]).join("").slice(0, 2).toUpperCase(), [user.name]);
  const [requests, setRequests] = useState<DriverRequest[]>([]);
  const [wallet, setWallet] = useState<WalletPayload["wallet"] | null>(null);
  const [history, setHistory] = useState<HistoryPayload | null>(null);
  const [online, setOnline] = useState(false);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [topUpAmount, setTopUpAmount] = useState("20");
  const [withdrawAmount, setWithdrawAmount] = useState("15");
  const [withdrawAccountRef, setWithdrawAccountRef] = useState(user.phone);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);

  const loadDriverState = async () => {
    setIsLoading(true);

    try {
      const [requestPayload, walletPayload, historyPayload, statusPayload] = await Promise.all([
        fetchJson<DriverRequestsPayload>("/driver/requests", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetchJson<WalletPayload>(`/driver/wallet/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetchJson<HistoryPayload>(`/driver/history/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetchJson<DriverStatusPayload>(`/driver/status/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setRequests(requestPayload.requests);
      setWallet(walletPayload.wallet);
      setHistory(historyPayload);
      setOnline(statusPayload.status.availability !== "OFFLINE");
      setActiveRequestId(
        requestPayload.requests.find((request) => request.source === "App" || request.source === "Scheduled")?.id ?? null
      );
      setMessage(requestPayload.message ?? null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load driver dashboard.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDriverState();
  }, [token, user.id]);

  useEffect(() => {
    const socket = new WebSocket(getRealtimeUrl(token));

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as { type: string };

        if (["driver.queue.updated", "ride.assigned", "ride.stage.updated", "ride.cancelled"].includes(message.type)) {
          void loadDriverState();
        }
      } catch {
        // Ignore malformed websocket events.
      }
    };

    return () => socket.close();
  }, [token, user.id]);

  useEffect(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
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

  const syncAvailability = async (nextOnline: boolean) => {
    setIsSyncing(true);
    const availability = nextOnline ? "AVAILABLE" : "OFFLINE";

    try {
      await fetchJson(`/driver/status/${user.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ availability })
      });
      setOnline(nextOnline);
      setMessage(nextOnline ? "Driver status is now online." : "Driver status is now offline.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update status.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRideAction = async (rideId: string, action: "accept" | "reject") => {
    setIsSyncing(true);

    try {
      await fetchJson(`/driver/requests/${rideId}/${action}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      await loadDriverState();
      setMessage(action === "accept" ? "Ride accepted." : "Ride returned to the queue.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update the ride.");
    } finally {
      setIsSyncing(false);
    }
  };

  const updateRideStage = async (rideId: string, status: "IN_PROGRESS" | "COMPLETED") => {
    setIsSyncing(true);

    try {
      await fetchJson(`/driver/rides/${rideId}/stage`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      await loadDriverState();
      setMessage(status === "IN_PROGRESS" ? "Trip started." : "Trip completed and wallet updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update the trip stage.");
    } finally {
      setIsSyncing(false);
    }
  };

  const topUpWallet = async () => {
    setIsSyncing(true);

    try {
      const payload = await fetchJson<WalletActionResponse>(`/driver/wallet/${user.id}/top-up`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amountGhs: Number(topUpAmount), provider: "MTN MoMo" })
      });
      await loadDriverState();
      setMessage(payload.message);

      if (payload.result?.authorizationUrl) {
        window.open(payload.result.authorizationUrl, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not top up the wallet.");
    } finally {
      setIsSyncing(false);
    }
  };

  const withdrawWallet = async () => {
    setIsSyncing(true);

    try {
      const payload = await fetchJson<WalletActionResponse>(`/driver/wallet/${user.id}/withdraw`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          amountGhs: Number(withdrawAmount),
          provider: "MTN MoMo",
          accountRef: withdrawAccountRef
        })
      });
      await loadDriverState();
      setMessage(payload.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not submit payout request.");
    } finally {
      setIsSyncing(false);
    }
  };

  const logout = () => {
    fetchJson("/auth/logout", { method: "POST" })
      .catch(() => undefined)
      .finally(() => {
        clearSession();
        router.push("/login");
      });
  };

  const liveRide = requests.find((request) => request.id === activeRequestId) ?? requests[0] ?? null;

  return (
    <>
      <div className="hidden h-screen w-full bg-background text-foreground lg:flex">
        <aside className="flex w-64 shrink-0 flex-col justify-between border-r border-border bg-card dark:bg-[#151a20]">
          <div>
            <div className="flex items-center gap-3 border-b border-border p-6">
              <div className="flex flex-col gap-1">
                <Image src="/qiilu.png" alt="Qiilu" width={132} height={40} className="h-9 w-auto" priority />
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Driver Partner</span>
              </div>
            </div>
            <nav className="space-y-1 px-4 py-4">
              {[LayoutDashboard, ListOrdered, Car, MessageSquare, Wallet].map((Icon, index) => (
                <div key={index} className={`flex items-center gap-3 rounded-xl px-4 py-3 ${index === 0 ? "bg-primary/10 font-bold text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                  <Icon className="h-5 w-5" />
                  <span>{["Dashboard", "Requests", "My Rides", "Messages", "Wallet"][index]}</span>
                </div>
              ))}
            </nav>
          </div>
          <div className="border-t border-border p-4">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/50 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-card font-bold">{initials}</div>
              <div className="flex-1">
                <div className="text-sm font-bold">{user.name}</div>
                <div className="text-xs text-muted-foreground">{user.phone}</div>
              </div>
              <button type="button" onClick={logout} className="rounded-full p-2 text-muted-foreground hover:bg-background hover:text-foreground">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          <header className="sticky top-0 flex h-20 items-center justify-between border-b border-border bg-card/95 px-8 shadow-sm dark:bg-[#12171d]">
            <div className="flex items-center gap-6">
              <h1 className="text-2xl font-bold">Driver dashboard</h1>
              <div className={`flex items-center gap-2 rounded-full border px-4 py-1.5 ${online ? "border-secondary/30 bg-secondary/10 text-secondary" : "border-border bg-muted text-muted-foreground"}`}>
                <div className={`h-2.5 w-2.5 rounded-full ${online ? "animate-pulse bg-secondary" : "bg-muted-foreground"}`} />
                <span className="text-sm font-bold uppercase tracking-wider">{online ? "Online" : "Offline"}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant={online ? "outline" : "default"} className="rounded-full px-6 font-bold" disabled={isSyncing} onClick={() => syncAvailability(!online)}>
                <Power className="mr-2 h-4 w-4" /> {online ? "Go Offline" : "Go Online"}
              </Button>
              <ThemeToggle />
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Bell className="h-5 w-5" />
                <div className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-muted bg-destructive" />
              </div>
            </div>
          </header>

          <div className="grid grid-cols-12 gap-8 p-8">
            <div className="col-span-12 flex flex-col gap-8 lg:col-span-8">
              <section className="rounded-[2rem] bg-gradient-to-br from-primary to-orange-600 p-8 text-white shadow-xl shadow-primary/20">
                <div className="mb-2 text-sm font-medium uppercase tracking-wide text-white/80">Live wallet balance</div>
                <div className="text-5xl font-extrabold tracking-tight"><span className="mr-2 text-2xl opacity-80">GHS</span>{wallet ? wallet.totalBalanceGhs.toFixed(2) : "0.00"}</div>
                <div className="mt-8 grid grid-cols-3 gap-4 border-t border-white/20 pt-8">
                  {[
                    ["Weekly trips", String(wallet?.weeklyTrips ?? 0)],
                    ["Completion rate", `${wallet?.completionRate ?? 0}%`],
                    ["Commission", `${wallet?.commissionRate ?? 0}%`]
                  ].map(([label, value]) => (
                    <div key={label}>
                      <div className="mb-1 text-sm text-white/70">{label}</div>
                      <div className="text-2xl font-bold">{value}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xl font-bold">Incoming requests</h3>
                  {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin text-primary" /> : null}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {requests.length ? requests.map((request) => (
                    <div key={request.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm dark:bg-[#171c22]">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-primary">{request.source}</div>
                        <div className="text-xs text-muted-foreground">{request.countdownSeconds}s</div>
                      </div>
                      <div className="mb-2 text-2xl font-extrabold">GHS {request.fareGhs.toFixed(2)}</div>
                      <div className="mb-1 text-sm font-semibold">{request.pickup} to {request.destination}</div>
                      <div className="mb-4 text-sm text-muted-foreground">
                        {request.riderName} • {request.distanceKm.toFixed(1)} km • {request.etaMinutes} min • {request.payment}
                      </div>
                      {request.pickupGuidance ? (
                        <div className="mb-3 rounded-xl bg-muted/40 px-3 py-2 text-xs text-muted-foreground dark:bg-white/5">
                          Pickup guidance: {request.pickupGuidance}
                        </div>
                      ) : null}
                      {request.safetyPin ? <div className="mb-3 text-xs font-semibold text-primary">Safety PIN: {request.safetyPin}</div> : null}
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" className="rounded-xl" disabled={isSyncing} onClick={() => handleRideAction(request.id, "reject")}>Reject</Button>
                        <Button className="rounded-xl" disabled={isSyncing} onClick={() => handleRideAction(request.id, "accept")}>Accept</Button>
                      </div>
                    </div>
                  )) : (
                    <div className="rounded-2xl border border-dashed border-border p-6 text-center text-muted-foreground">
                      No live requests are available right now.
                    </div>
                  )}
                </div>
              </section>

              <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm dark:bg-[#171c22]">
                <div className="flex items-center justify-between border-b border-border bg-muted/30 p-4 dark:bg-white/5">
                  <div>
                    <div className="font-bold">Current dispatch focus</div>
                    <div className="text-sm text-muted-foreground">
                      {liveRide ? `${liveRide.pickup} to ${liveRide.destination}` : "No active dispatch selected"}
                    </div>
                    {liveRide ? (
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <Button className="rounded-xl" disabled={isSyncing} onClick={() => updateRideStage(liveRide.id, "IN_PROGRESS")}>
                          Start trip
                        </Button>
                        <Button variant="outline" className="rounded-xl" disabled={isSyncing} onClick={() => updateRideStage(liveRide.id, "COMPLETED")}>
                          Complete
                        </Button>
                      </div>
                    ) : null}
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-extrabold text-secondary">{liveRide ? `${liveRide.etaMinutes} min` : "—"}</div>
                    <div className="text-sm">{liveRide ? `${liveRide.distanceKm.toFixed(1)} km away` : "Waiting for ride queue"}</div>
                  </div>
                </div>
                <div className="relative h-[300px] bg-[#e5e3df] dark:bg-[#15191f]">
                  <PassengerLiveMap
                    pickup={liveRide?.pickup}
                    destination={liveRide?.destination}
                    currentCoords={currentCoords}
                  />
                  <div className="absolute inset-0 opacity-20 dark:opacity-10 [background-image:linear-gradient(#000_1px,transparent_1px),linear-gradient(90deg,#000_1px,transparent_1px)] dark:[background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:60px_60px]" />
                  <div className="absolute left-6 top-6 z-[500] rounded-full border border-border/70 bg-card/95 px-4 py-2 text-sm font-semibold shadow-md backdrop-blur dark:bg-[#171c22]/95">
                    {liveRide ? "Live dispatch map" : "Driver live map"}
                  </div>
                  <div className="absolute bottom-6 left-6 z-[500] max-w-sm rounded-[1.4rem] border border-border/80 bg-card/95 p-4 shadow-md dark:bg-[#171c22]/95">
                    <div className="font-bold">{liveRide ? liveRide.riderName : "No rider assigned"}</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {liveRide ? `${liveRide.passengers} passenger(s) • ${liveRide.payment}` : "Accept a live request to populate this panel."}
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="col-span-12 flex flex-col gap-8 lg:col-span-4">
              <section className="rounded-2xl border border-border bg-card p-6 shadow-sm dark:bg-[#171c22]">
                <h3 className="mb-6 text-lg font-bold">Wallet breakdown</h3>
                <div className="space-y-4">
                  {[
                    ["Cash balance", wallet?.cashGhs ?? 0],
                    ["MoMo balance", wallet?.momoGhs ?? 0],
                    ["Pending withdrawal", wallet?.pendingWithdrawalGhs ?? 0]
                  ].map(([label, amount]) => (
                    <div key={label} className="flex items-center justify-between rounded-xl bg-muted/40 p-4 dark:bg-white/5">
                      <div className="text-sm text-muted-foreground">{label}</div>
                      <div className="font-bold">GHS {Number(amount).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid gap-3">
                  <Input value={topUpAmount} onChange={(event) => setTopUpAmount(event.target.value)} placeholder="Top-up amount" className="h-11 border-transparent bg-muted/40 dark:bg-white/5" />
                  <Button variant="outline" className="rounded-xl" disabled={isSyncing} onClick={topUpWallet}>
                    Add wallet funds
                  </Button>
                  <Input value={withdrawAmount} onChange={(event) => setWithdrawAmount(event.target.value)} placeholder="Withdraw amount" className="h-11 border-transparent bg-muted/40 dark:bg-white/5" />
                  <Input value={withdrawAccountRef} onChange={(event) => setWithdrawAccountRef(event.target.value)} placeholder="MoMo number" className="h-11 border-transparent bg-muted/40 dark:bg-white/5" />
                  <Button className="rounded-xl" disabled={isSyncing} onClick={withdrawWallet}>
                    Request payout
                  </Button>
                </div>
              </section>

              <section className="rounded-2xl border border-border bg-card p-6 shadow-sm dark:bg-[#171c22]">
                <div className="mb-4 flex items-center gap-2 text-lg font-bold">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  KYC management
                </div>
                <p className="mb-4 text-sm text-muted-foreground">
                  Manage documents from your profile and keep verification current for trips and payouts.
                </p>
                <div className="mb-4 rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground dark:bg-white/5">
                  Open your driver account to upload documents, track review status, and resubmit if the last review was rejected.
                </div>
                <Link href="/driver/account" className="block">
                  <Button variant="outline" className="w-full rounded-xl">
                    Open documents & KYC
                  </Button>
                </Link>
              </section>

              <section className="rounded-2xl border border-border bg-card p-6 shadow-sm dark:bg-[#171c22]">
                <h3 className="mb-6 text-lg font-bold">Recent trips</h3>
                <div className="space-y-4">
                  {history?.past.length ? history.past.slice(0, 4).map((ride) => (
                    <div key={`${ride.route}-${ride.time}`} className="flex items-center justify-between rounded-xl p-3 hover:bg-muted/50">
                      <div>
                        <div className="text-sm font-bold">{ride.route}</div>
                        <div className="text-xs text-muted-foreground">{ride.time}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold">GHS {ride.net.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">Net</div>
                      </div>
                    </div>
                  )) : (
                    <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                      No completed trips have been recorded yet.
                    </div>
                  )}
                </div>
              </section>

              {message ? (
                <section className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground shadow-sm dark:bg-[#171c22]">
                  {message}
                </section>
              ) : null}
            </div>
          </div>
        </main>
      </div>

      <div className="min-h-screen bg-background text-foreground lg:hidden">
        <div className="relative h-[36vh] overflow-hidden bg-[#e5e3df] dark:bg-[#15191f]">
          <PassengerLiveMap
            pickup={liveRide?.pickup}
            destination={liveRide?.destination}
            currentCoords={currentCoords}
            fullScreen
          />
        </div>
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-6 pt-12">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background shadow-md"><ListOrdered className="h-5 w-5" /></div>
          <button onClick={() => syncAvailability(!online)} className={`rounded-full px-5 py-2.5 font-bold shadow-lg ${online ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"}`}>
            {online ? "ONLINE" : "OFFLINE"}
          </button>
          <ThemeToggle className="flex h-10 w-10 items-center justify-center rounded-full bg-background shadow-md" />
        </div>
        <div className="relative z-20 -mt-8 rounded-t-[2rem] bg-background p-6 pb-24 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] dark:bg-[#10151b]">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted-foreground/20" />
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border bg-card p-4 text-center dark:bg-[#171c22]">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Wallet</div>
                <div className="mt-2 text-xl font-bold">GHS {wallet ? wallet.totalBalanceGhs.toFixed(2) : "0.00"}</div>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4 text-center dark:bg-[#171c22]">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Trips</div>
                <div className="mt-2 text-xl font-bold">{wallet?.weeklyTrips ?? 0}</div>
              </div>
            </div>
            {requests.length ? (
              <>
                <div className="mb-4 rounded-2xl border border-border bg-card p-4 dark:bg-[#171c22]">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Dispatch status</div>
                  <div className="mt-2 text-xl font-bold">{online ? "Ready for requests" : "Currently offline"}</div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {online
                      ? `${requests.length} request${requests.length === 1 ? "" : "s"} in your queue right now.`
                      : "Go online to receive live ride requests and dispatch updates."}
                  </div>
                </div>
                <div className="mb-6 rounded-2xl bg-primary p-4 text-primary-foreground">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wider opacity-80">Current request</div>
                  <div className="text-xl font-bold">{requests[0].pickup} to {requests[0].destination}</div>
                </div>
                <div className="mb-6 rounded-2xl border border-border p-4 dark:bg-white/5">
                  <div className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">{requests[0].source}</div>
                  <div className="text-3xl font-extrabold">GHS {requests[0].fareGhs.toFixed(2)}</div>
                  <div className="mt-2 text-sm text-muted-foreground">{requests[0].riderName} • {requests[0].payment}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="h-16 rounded-2xl text-lg font-bold" disabled={isSyncing} onClick={() => handleRideAction(requests[0].id, "reject")}>Reject</Button>
                  <Button className="h-16 rounded-2xl text-lg font-bold" disabled={isSyncing} onClick={() => handleRideAction(requests[0].id, "accept")}>Accept</Button>
                </div>
                {liveRide ? (
                  <div className="mt-4 rounded-2xl border border-border bg-card p-4 dark:bg-[#171c22]">
                    <div className="mb-1 text-sm font-semibold text-muted-foreground">Current dispatch focus</div>
                    <div className="text-lg font-bold">{liveRide.pickup} to {liveRide.destination}</div>
                    <div className="mt-2 text-sm text-muted-foreground">{liveRide.passengers} passenger(s) • {liveRide.etaMinutes} min ETA</div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <Button className="rounded-xl" disabled={isSyncing} onClick={() => updateRideStage(liveRide.id, "IN_PROGRESS")}>Start trip</Button>
                      <Button variant="outline" className="rounded-xl" disabled={isSyncing} onClick={() => updateRideStage(liveRide.id, "COMPLETED")}>Complete</Button>
                    </div>
                  </div>
                ) : null}
                <div className="mt-4 rounded-2xl border border-border bg-card p-4 dark:bg-[#171c22]">
                  <div className="mb-3 text-sm font-semibold">Wallet actions</div>
                  <Input value={topUpAmount} onChange={(event) => setTopUpAmount(event.target.value)} placeholder="Top-up amount" className="mb-3 h-11 border-transparent bg-muted/40 dark:bg-white/5" />
                  <Button variant="outline" className="mb-3 w-full rounded-xl" disabled={isSyncing} onClick={topUpWallet}>Add wallet funds</Button>
                  <Input value={withdrawAmount} onChange={(event) => setWithdrawAmount(event.target.value)} placeholder="Withdraw amount" className="mb-3 h-11 border-transparent bg-muted/40 dark:bg-white/5" />
                  <Input value={withdrawAccountRef} onChange={(event) => setWithdrawAccountRef(event.target.value)} placeholder="MoMo number" className="mb-3 h-11 border-transparent bg-muted/40 dark:bg-white/5" />
                  <Button className="w-full rounded-xl" disabled={isSyncing} onClick={withdrawWallet}>Request payout</Button>
                </div>
                {message ? (
                  <section className="mt-4 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground dark:bg-[#171c22]">
                    {message}
                  </section>
                ) : null}
              </>
            ) : (
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted dark:bg-white/8"><Power className="h-8 w-8 text-muted-foreground" /></div>
                <div className="mb-2 text-2xl font-bold">No live requests</div>
                <div className="mb-6 text-muted-foreground">
                  {online ? "Qiilu will show real ride requests here when demand comes in." : "Go online to start receiving live ride requests."}
                </div>
              </div>
            )}
          </div>
      </div>
    </>
  );
}
