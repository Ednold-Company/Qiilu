"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { fetchJson } from "@/lib/api";
import { clearSession, getSession, type SessionUser } from "@/lib/auth-session";
import { getRealtimeUrl } from "@/lib/realtime";

type TripStage = "Go to pickup" | "Start trip" | "Complete trip";

type DriverRequestItem = {
  id: string;
  source: "App" | "USSD" | "Scheduled";
  riderName: string;
  pickup: string;
  destination: string;
  pickupGuidance?: string | null;
  safetyPin?: string | null;
  trustedContactCount: number;
  lowBandwidthBooking: boolean;
  distanceKm: number;
  etaMinutes: number;
  passengers: number;
  payment: "Cash" | "MoMo";
  momoProvider?: string | null;
  fareGhs: number;
  countdownSeconds: number;
};

type WalletState = {
  totalBalanceGhs: number;
  cashGhs: number;
  momoGhs: number;
  weeklyTrips: number;
  completionRate: number;
  commissionRate: number;
  instantMomoCashoutEligible?: boolean;
};

type RideHistoryItem = {
  route: string;
  time: string;
  rider: string;
  gross: number;
  net: number;
};

type RideHistoryState = {
  upcoming: RideHistoryItem[];
  past: RideHistoryItem[];
  cancelled: RideHistoryItem[];
};

const tripStages: TripStage[] = ["Go to pickup", "Start trip", "Complete trip"];
const emptyWallet: WalletState = {
  totalBalanceGhs: 0,
  cashGhs: 0,
  momoGhs: 0,
  weeklyTrips: 0,
  completionRate: 0,
  commissionRate: 15
};

const emptyHistory: RideHistoryState = {
  upcoming: [],
  past: [],
  cancelled: []
};

export default function DriverPage() {
  const router = useRouter();
  const [online, setOnline] = useState(true);
  const [networkOnline, setNetworkOnline] = useState(true);
  const [requests, setRequests] = useState<DriverRequestItem[]>([]);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [tripStageIndex, setTripStageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<keyof RideHistoryState>("upcoming");
  const [wallet, setWallet] = useState<WalletState>(emptyWallet);
  const [history, setHistory] = useState<RideHistoryState>(emptyHistory);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [dispatchMessage, setDispatchMessage] = useState("Live dispatch connected");
  const [liveDriverPosition, setLiveDriverPosition] = useState<{ lat: number; lng: number; progress: number } | null>(null);

  useEffect(() => {
    const session = getSession();

    if (!session || session.user.role !== "DRIVER") {
      router.replace("/login");
      return;
    }

    setUser(session.user);

    const offlineHandler = () => setNetworkOnline(false);
    const onlineHandler = () => setNetworkOnline(true);
    setNetworkOnline(typeof navigator === "undefined" ? true : navigator.onLine);

    window.addEventListener("offline", offlineHandler);
    window.addEventListener("online", onlineHandler);

    return () => {
      window.removeEventListener("offline", offlineHandler);
      window.removeEventListener("online", onlineHandler);
    };
  }, [router]);

  useEffect(() => {
    if (!user) {
      return;
    }

    let active = true;

    Promise.all([
      fetchJson<{ requests: DriverRequestItem[] }>("/driver/requests"),
      fetchJson<{ wallet: WalletState }>(`/driver/wallet/${user.id}`),
      fetchJson<RideHistoryState>(`/driver/history/${user.id}`)
    ])
      .then(([requestPayload, walletPayload, historyPayload]) => {
        if (!active) return;
        setRequests(requestPayload.requests);
        setActiveRequestId(requestPayload.requests[0]?.id ?? null);
        setWallet(walletPayload.wallet);
        setHistory(historyPayload);
        window.localStorage.setItem("qiilu-driver-requests-cache", JSON.stringify(requestPayload.requests));
        setDispatchMessage("Live dispatch connected");
      })
      .catch(() => {
        if (!active) return;
        const cachedRequestsRaw = window.localStorage.getItem("qiilu-driver-requests-cache");
        const cachedRequests = cachedRequestsRaw ? (JSON.parse(cachedRequestsRaw) as DriverRequestItem[]) : [];
        setRequests(cachedRequests);
        setActiveRequestId(null);
        setWallet(emptyWallet);
        setHistory(emptyHistory);
        setDispatchMessage(
          cachedRequests.length
            ? "Using cached dispatch queue while the network recovers."
            : "No live queue available. Reconnect to refresh dispatch."
        );
      });

    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    const session = getSession();

    if (!session || session.user.role !== "DRIVER") {
      return;
    }

    const socket = new WebSocket(getRealtimeUrl(session.token));

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data) as {
        type: string;
        payload?: Record<string, unknown>;
      };

      switch (message.type) {
        case "driver.queue.updated":
          fetchJson<{ requests: DriverRequestItem[] }>("/driver/requests")
            .then((payload) => {
              setRequests(payload.requests);
              setActiveRequestId((current) => current ?? payload.requests[0]?.id ?? null);
            })
            .catch(() => undefined);
          break;
        case "ride.assigned":
          setActiveRequestId(String(message.payload?.rideId ?? ""));
          setDispatchMessage(`Ride assigned. Passenger ${String(message.payload?.pickup ?? "")} to ${String(message.payload?.destination ?? "")}.`);
          break;
        case "ride.stage.updated":
          setDispatchMessage(`Live stage update: ${String(message.payload?.status ?? "").replaceAll("_", " ").toLowerCase()}.`);
          break;
        case "driver.location":
          setLiveDriverPosition({
            lat: Number(message.payload?.lat ?? 0),
            lng: Number(message.payload?.lng ?? 0),
            progress: Number(message.payload?.progress ?? 0)
          });
          setDispatchMessage(`Live tracking active. Route progress ${(Number(message.payload?.progress ?? 0) * 100).toFixed(0)}%.`);
          break;
        case "ride.cancelled":
          setDispatchMessage("A ride was cancelled and removed from live tracking.");
          setLiveDriverPosition(null);
          break;
        default:
          break;
      }
    };

    socket.onclose = () => {
      setDispatchMessage("Realtime dispatch link closed. HTTP data remains available.");
    };

    return () => {
      socket.close();
    };
  }, [user]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRequests((current) =>
        current
          .map((request) => ({
            ...request,
            countdownSeconds: Math.max(0, request.countdownSeconds - 1)
          }))
          .filter((request) => request.countdownSeconds > 0 || request.id === activeRequestId)
      );
    }, 1000);

    return () => window.clearInterval(timer);
  }, [activeRequestId]);

  const activeRequest = useMemo(
    () => requests.find((request) => request.id === activeRequestId) ?? null,
    [activeRequestId, requests]
  );

  const acceptRequest = (id: string) => {
    fetchJson(`/driver/requests/${id}/accept`, {
      method: "POST"
    })
      .then(() => setDispatchMessage("Ride accepted and locked to your console."))
      .catch(() => setDispatchMessage("Could not confirm acceptance with the server."));
    setActiveRequestId(id);
    setTripStageIndex(0);
  };

  const rejectRequest = (id: string) => {
    fetchJson(`/driver/requests/${id}/reject`, {
      method: "POST"
    })
      .then(() => setDispatchMessage("Ride removed from your queue."))
      .catch(() => setDispatchMessage("Could not sync the rejection."));
    setRequests((current) => current.filter((request) => request.id !== id));
    if (activeRequestId === id) {
      setActiveRequestId(null);
    }
  };

  const advanceStage = () => {
    setTripStageIndex((current) => {
      const next = Math.min(current + 1, tripStages.length - 1);
      const status = next === 1 ? "IN_PROGRESS" : next === 2 ? "COMPLETED" : "ACCEPTED";

      if (activeRequestId) {
        fetchJson(`/driver/rides/${activeRequestId}/stage`, {
          method: "POST",
          body: JSON.stringify({ status })
        })
          .then(() =>
            setDispatchMessage(
              status === "COMPLETED"
                ? "Trip completed. Wallet updated with fare and commission."
                : "Trip stage synced successfully."
            )
          )
          .catch(() => setDispatchMessage("Trip stage could not be synced."));
      }

      return next;
    });
  };

  return (
    <main className="product-shell driver-shell">
      <header className="app-topbar">
        <div className="brand-lockup">
          <div className="brand-mark">Qiilu</div>
          <div className="brand-sub">Driver operations</div>
        </div>
        <nav className="top-nav">
          <span className="top-nav-item active">Dispatch</span>
          <span className="top-nav-item">Trips</span>
          <span className="top-nav-item">Wallet</span>
          <Link className="top-nav-item" href="/passenger">
            Passenger app
          </Link>
        </nav>
        <div className="top-actions">
          <button type="button" className={`status-chip ${online ? "online" : "offline"}`} onClick={() => setOnline((state) => !state)}>
            {online ? "Online" : "Offline"}
          </button>
          <button
            type="button"
            className="avatar-chip logout-chip"
            onClick={() => {
              fetchJson("/auth/logout", { method: "POST" })
                .catch(() => undefined)
                .finally(() => {
                  clearSession();
                  router.push("/login");
                });
            }}
          >
            {user?.name.slice(0, 2).toUpperCase() ?? "KM"}
          </button>
        </div>
      </header>

      <div className="driver-grid">
        <section className="driver-main">
          <div className="stage-card live-map-card">
            <div className="panel-head">
              <div>
                <p className="section-kicker">Live dispatch</p>
                <h1>Operate with trust signals, payout clarity, and a queue that survives rough networks.</h1>
              </div>
              <div className="map-chip-row">
                <span className="status-chip soft">{requests.length} pending requests</span>
                <span className="status-chip soft">{wallet.completionRate}% completion</span>
                <span className="status-chip soft">{networkOnline ? "Full sync" : "Cached queue"}</span>
              </div>
            </div>

            <div className="city-map driver-map-scene">
              <div className="map-grid-lines" />
              <div className="map-road horizontal a" />
              <div className="map-road horizontal b" />
              <div className="map-road vertical a" />
              <div className="map-road vertical b" />
              <div className="driver-dot a" />
              <div className="driver-dot b" />
              <div className="driver-dot c" />
              <div className="driver-car">Qi</div>
              <div className="map-float-card ops-card top-left">
                <strong>Dispatch zone</strong>
                <span>{dispatchMessage}</span>
              </div>
              <div className="map-float-card ops-card bottom-right">
                <strong>{online ? "Available" : "Offline"}</strong>
                <span>
                  {liveDriverPosition
                    ? `Tracking ${(liveDriverPosition.progress * 100).toFixed(0)}%`
                    : online
                      ? "Ready to accept"
                      : "Hidden from riders"}
                </span>
              </div>
            </div>
          </div>

          {activeRequest ? (
            <section className="stage-card active-job-card">
              <div className="panel-head">
                <div>
                  <p className="section-kicker">Active trip</p>
                  <h2>{activeRequest.pickup} to {activeRequest.destination}</h2>
                </div>
                <span className="ghost-chip">{activeRequest.payment}</span>
              </div>

              <div className="active-job-grid">
                <div>
                  <span className="summary-label">Passenger</span>
                  <strong>{activeRequest.riderName}</strong>
                </div>
                <div>
                  <span className="summary-label">Fare</span>
                  <strong>GHS {activeRequest.fareGhs.toFixed(2)}</strong>
                </div>
                <div>
                  <span className="summary-label">Distance</span>
                  <strong>{activeRequest.distanceKm} km</strong>
                </div>
                <div>
                  <span className="summary-label">ETA</span>
                  <strong>{activeRequest.etaMinutes} min</strong>
                </div>
                <div>
                  <span className="summary-label">Trust mode</span>
                  <strong>{activeRequest.trustedContactCount} contacts watching</strong>
                </div>
                <div>
                  <span className="summary-label">Payment rail</span>
                  <strong>{activeRequest.payment === "MoMo" ? activeRequest.momoProvider ?? "Mobile Money" : "Cash"}</strong>
                </div>
              </div>

              <div className="trust-banner">
                <strong>{activeRequest.safetyPin ? `Safety pin ${activeRequest.safetyPin}` : "Standard verification"}</strong>
                <span>{activeRequest.pickupGuidance ?? "Verify the rider and confirm a safe, visible pickup point."}</span>
              </div>

              <div className="stage-progress">
                {tripStages.map((stage, index) => (
                  <button
                    key={stage}
                    type="button"
                    className={`progress-chip ${index === tripStageIndex ? "active" : ""} ${index < tripStageIndex ? "done" : ""}`}
                    onClick={() => setTripStageIndex(index)}
                  >
                    {stage}
                  </button>
                ))}
              </div>

              <div className="job-actions">
                <button type="button" className="secondary-button">Call rider</button>
                <button type="button" className="secondary-button">Chat</button>
                <button type="button" className="alert-button">SOS</button>
                <button type="button" className="cta-button inline-cta" onClick={advanceStage}>
                  Advance stage
                </button>
              </div>
            </section>
          ) : (
            <section className="stage-card empty-panel-state">No active trip yet. Accept a live request to begin.</section>
          )}
        </section>

        <aside className="driver-sidebar">
          <section className="dock-card earnings-panel">
            <div className="panel-head">
              <div>
                <p className="section-kicker">Today&apos;s earnings</p>
                <h2>GHS {wallet.totalBalanceGhs.toFixed(2)}</h2>
              </div>
              <span className="ghost-chip bright">{wallet.weeklyTrips} trips</span>
            </div>
            <p className="panel-copy">
              Cash GHS {wallet.cashGhs.toFixed(2)} and MoMo GHS {wallet.momoGhs.toFixed(2)} currently available.
              {wallet.instantMomoCashoutEligible ? " Instant MoMo cashout is available." : " Instant MoMo cashout unlocks after your next mobile money trip."}
            </p>
            <div className="stat-grid">
              <div className="stat-tile">
                <strong>{wallet.weeklyTrips}</strong>
                <span>Trips</span>
              </div>
              <div className="stat-tile">
                <strong>{wallet.completionRate}%</strong>
                <span>Completion</span>
              </div>
              <div className="stat-tile">
                <strong>{wallet.commissionRate}%</strong>
                <span>Commission</span>
              </div>
            </div>
          </section>

          <section className="dock-card requests-panel">
            <div className="panel-head">
              <div>
                <p className="section-kicker">Incoming requests</p>
                <h2>Dispatch queue</h2>
              </div>
              <span className="ghost-chip">{requests.length} live</span>
            </div>

            <div className="request-stack">
              {requests.length ? (
                requests.map((request) => (
                  <article key={request.id} className="request-item">
                    <div className="request-item-head">
                      <span className={`request-source ${request.source.toLowerCase()}`}>{request.source}</span>
                      <span className="request-timer">{request.countdownSeconds}s</span>
                    </div>
                    <strong>{request.riderName}</strong>
                    <p>{request.pickup} to {request.destination}</p>
                    <div className="request-meta-row">
                      <span>{request.distanceKm} km</span>
                      <span>{request.etaMinutes} min</span>
                      <span>{request.passengers} pax</span>
                      <span>{request.payment}</span>
                      <span>{request.trustedContactCount} trusted</span>
                      {request.lowBandwidthBooking ? <span>lite mode</span> : null}
                    </div>
                    {request.safetyPin || request.pickupGuidance ? (
                      <div className="request-note">
                        {request.safetyPin ? `Pin ${request.safetyPin}` : "Safety share active"} . {request.pickupGuidance ?? "Confirm a visible pickup point."}
                      </div>
                    ) : null}
                    <div className="request-action-row">
                      <span className="request-fare">GHS {request.fareGhs.toFixed(2)}</span>
                      <div className="request-buttons">
                        <button type="button" className="decline-button" onClick={() => rejectRequest(request.id)}>
                          Reject
                        </button>
                        <button type="button" className="confirm-button" onClick={() => acceptRequest(request.id)}>
                          {request.source === "Scheduled" ? "Confirm" : "Accept"}
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="empty-panel-state">No live requests available right now.</div>
              )}
            </div>
          </section>

          <section className="dock-card utility-card">
            <div className="panel-head">
              <div>
                <p className="section-kicker">Ride history</p>
                <h2>Recent activity</h2>
              </div>
            </div>
            <div className="history-tabs">
              {(["upcoming", "past", "cancelled"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`history-tab ${activeTab === tab ? "active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="history-list">
              {history[activeTab].length ? (
                history[activeTab].map((item) => (
                  <div key={`${item.route}-${item.time}`} className="history-row">
                    <div>
                      <strong>{item.route}</strong>
                      <span>{item.time} . {item.rider}</span>
                    </div>
                    <div className="history-amounts">
                      <strong>GHS {item.gross.toFixed(2)}</strong>
                      <span>Net {item.net.toFixed(2)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-panel-state">No {activeTab} rides found.</div>
              )}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
