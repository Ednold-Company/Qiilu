"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { fetchJson } from "@/lib/api";
import { clearSession, getSession, type SessionUser } from "@/lib/auth-session";
import { locationCatalog } from "@/lib/location-catalog";
import { getRealtimeUrl } from "@/lib/realtime";

type RideOption = {
  id: string;
  label: string;
  type: "Private" | "Shared";
  etaMinutes: number;
  seats: number;
  priceGhs: number;
  description: string;
  nearby: number;
  accent: string;
};

type ApiRideOption = {
  id: string;
  label: string;
  type: "PRIVATE" | "SHARED";
  etaMinutes: number;
  seats: number;
  priceGhs: number;
  description: string;
  nearby: number;
};

type PassengerExperience = {
  preferredPayment: "MOMO" | "CASH";
  momoProvider: string;
  trustedContacts: string[];
  lowBandwidthMode: boolean;
  safetyShareEnabled: boolean;
};

type RouteEstimate = {
  provider: "mapbox" | "osrm" | "catalog";
  pickup: { lat: number; lng: number; label: string };
  destination: { lat: number; lng: number; label: string };
  distanceKm: number;
  durationMinutes: number;
  fareGhs: number;
  route: [number, number][];
};

type RideConfirmation = {
  safetyPin: string | null;
  pickupGuidance: string;
  trustedContactCount: number;
  shareTripLive: boolean;
  paymentMethod: "MOMO" | "CASH";
  momoProvider: string | null;
  momoReference: string | null;
  queuedForRetry?: boolean;
};

type LiveTripState = {
  rideId: string;
  status: "SEARCHING" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  driverName?: string;
  fareGhs?: number;
  etaMinutes?: number;
  safetyPin?: string | null;
};

type BookingDraft = {
  destination: string;
  preferredPayment: "MOMO" | "CASH";
  momoProvider: string;
  trustedContacts: string[];
  lowBandwidthMode: boolean;
  safetyShareEnabled: boolean;
};

const PassengerLiveMap = dynamic(() => import("@/components/passenger-live-map"), {
  ssr: false,
  loading: () => <div className="map-loading">Loading map...</div>
});

const pickup = "Current location, East Legon";
const draftStorageKey = "qiilu-passenger-draft";
const queuedStorageKey = "qiilu-passenger-queued-booking";

export default function PassengerPage() {
  const router = useRouter();
  const [destination, setDestination] = useState("Airport City");
  const [rideOptions, setRideOptions] = useState<RideOption[]>([]);
  const [selectedRideId, setSelectedRideId] = useState<string | null>(null);
  const [bookingState, setBookingState] = useState<"loading" | "idle" | "saving" | "submitting" | "success" | "error">("loading");
  const [routeState, setRouteState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [preferredPayment, setPreferredPayment] = useState<"MOMO" | "CASH">("MOMO");
  const [momoProvider, setMomoProvider] = useState("MTN MoMo");
  const [trustedContacts, setTrustedContacts] = useState<string[]>([]);
  const [newTrustedContact, setNewTrustedContact] = useState("");
  const [lowBandwidthMode, setLowBandwidthMode] = useState(false);
  const [safetyShareEnabled, setSafetyShareEnabled] = useState(true);
  const [networkOnline, setNetworkOnline] = useState(true);
  const [syncMessage, setSyncMessage] = useState("Live dispatch ready");
  const [rideConfirmation, setRideConfirmation] = useState<RideConfirmation | null>(null);
  const [routeEstimate, setRouteEstimate] = useState<RouteEstimate | null>(null);
  const [liveTrip, setLiveTrip] = useState<LiveTripState | null>(null);
  const [driverPosition, setDriverPosition] = useState<{ lat: number; lng: number; stage: string; progress: number } | null>(null);

  useEffect(() => {
    const session = getSession();

    if (!session || session.user.role !== "PASSENGER") {
      router.replace("/login");
      return;
    }

    setUser(session.user);

    const offlineHandler = () => setNetworkOnline(false);
    const onlineHandler = () => setNetworkOnline(true);
    setNetworkOnline(typeof navigator === "undefined" ? true : navigator.onLine);

    window.addEventListener("offline", offlineHandler);
    window.addEventListener("online", onlineHandler);

    const storedDraftRaw = window.localStorage.getItem(draftStorageKey);
    if (storedDraftRaw) {
      try {
        const storedDraft = JSON.parse(storedDraftRaw) as Partial<BookingDraft>;
        if (storedDraft.destination) setDestination(storedDraft.destination);
        if (storedDraft.preferredPayment) setPreferredPayment(storedDraft.preferredPayment);
        if (storedDraft.momoProvider) setMomoProvider(storedDraft.momoProvider);
        if (Array.isArray(storedDraft.trustedContacts)) setTrustedContacts(storedDraft.trustedContacts);
        if (typeof storedDraft.lowBandwidthMode === "boolean") setLowBandwidthMode(storedDraft.lowBandwidthMode);
        if (typeof storedDraft.safetyShareEnabled === "boolean") setSafetyShareEnabled(storedDraft.safetyShareEnabled);
      } catch {
        window.localStorage.removeItem(draftStorageKey);
      }
    }

    if (window.localStorage.getItem(queuedStorageKey)) {
      setSyncMessage("A booking draft is queued locally and ready when your connection stabilizes.");
    }

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
      fetchJson<{ options: ApiRideOption[] }>("/passenger/vehicle-options"),
      fetchJson<{ experience: PassengerExperience }>("/passenger/experience")
    ])
      .then(([vehiclePayload, experiencePayload]) => {
        if (!active) return;

        const mapped: RideOption[] = vehiclePayload.options.map((option) => ({
          id: option.id,
          label: "Car",
          type: option.type === "PRIVATE" ? "Private" : "Shared",
          etaMinutes: option.etaMinutes,
          seats: option.seats,
          priceGhs: option.priceGhs,
          description: option.description,
          nearby: option.nearby,
          accent: "sunrise"
        }));

        setRideOptions(mapped);
        setSelectedRideId(mapped[0]?.id ?? null);
        setPreferredPayment(experiencePayload.experience.preferredPayment);
        setMomoProvider(experiencePayload.experience.momoProvider);
        setTrustedContacts(experiencePayload.experience.trustedContacts);
        setLowBandwidthMode(experiencePayload.experience.lowBandwidthMode);
        setSafetyShareEnabled(experiencePayload.experience.safetyShareEnabled);
        setBookingState("idle");
        setLoadError(mapped.length ? null : "No cars are available right now.");
      })
      .catch(() => {
        if (!active) return;
        setRideOptions([]);
        setSelectedRideId(null);
        setBookingState("error");
        setLoadError("Live vehicle options could not be loaded.");
      });

    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const draft: BookingDraft = {
      destination,
      preferredPayment,
      momoProvider,
      trustedContacts,
      lowBandwidthMode,
      safetyShareEnabled
    };

    window.localStorage.setItem(draftStorageKey, JSON.stringify(draft));
  }, [destination, preferredPayment, momoProvider, trustedContacts, lowBandwidthMode, safetyShareEnabled]);

  useEffect(() => {
    if (!user || !destination.trim()) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setRouteState("loading");
      setRouteError(null);

      fetchJson<{ estimate: RouteEstimate }>("/passenger/route-estimate", {
        method: "POST",
        body: JSON.stringify({
          pickup,
          destination
        })
      })
        .then((payload) => {
          setRouteEstimate(payload.estimate);
          setRouteState("ready");
        })
        .catch(() => {
          setRouteEstimate(null);
          setRouteState("error");
          setRouteError("We could not calculate a live route for that destination yet.");
        });
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [destination, user]);

  useEffect(() => {
    const session = getSession();

    if (!session) {
      return;
    }

    const socket = new WebSocket(getRealtimeUrl(session.token));

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data) as {
        type: string;
        payload?: Record<string, unknown>;
      };

      switch (message.type) {
        case "ride.searching":
          setLiveTrip({
            rideId: String(message.payload?.rideId ?? ""),
            status: "SEARCHING",
            fareGhs: Number(message.payload?.fareGhs ?? 0),
            etaMinutes: Number(message.payload?.etaMinutes ?? 0)
          });
          setSyncMessage("Searching for the best driver near your route.");
          break;
        case "ride.accepted":
          setLiveTrip({
            rideId: String(message.payload?.rideId ?? ""),
            status: "ACCEPTED",
            driverName: String(message.payload?.driverName ?? "Qiilu driver"),
            fareGhs: Number(message.payload?.fareGhs ?? 0),
            etaMinutes: Number(message.payload?.etaMinutes ?? 0),
            safetyPin: (message.payload?.safetyPin as string | null | undefined) ?? null
          });
          setSyncMessage(`Driver ${String(message.payload?.driverName ?? "assigned")} is heading to pickup now.`);
          break;
        case "ride.stage.updated":
          setLiveTrip((current) =>
            current
              ? {
                  ...current,
                  status: String(message.payload?.status ?? current.status) as LiveTripState["status"]
                }
              : current
          );
          setSyncMessage(`Trip status updated to ${String(message.payload?.status ?? "").replaceAll("_", " ").toLowerCase()}.`);
          break;
        case "ride.cancelled":
          setLiveTrip((current) =>
            current
              ? {
                  ...current,
                  status: "CANCELLED"
                }
              : current
          );
          setSyncMessage("This trip was cancelled.");
          break;
        case "driver.location":
          setDriverPosition({
            lat: Number(message.payload?.lat ?? 0),
            lng: Number(message.payload?.lng ?? 0),
            stage: String(message.payload?.stage ?? ""),
            progress: Number(message.payload?.progress ?? 0)
          });
          break;
        default:
          break;
      }
    };

    socket.onclose = () => {
      setSyncMessage((current) =>
        current.includes("connected") ? "Realtime link dropped. Core booking still works over HTTP." : current
      );
    };

    return () => {
      socket.close();
    };
  }, [user]);

  const selectedRide = useMemo(
    () => rideOptions.find((option) => option.id === selectedRideId) ?? null,
    [rideOptions, selectedRideId]
  );

  async function persistExperience(nextExperience: BookingDraft) {
    if (!user) {
      return;
    }

    setBookingState((current) => (current === "submitting" ? current : "saving"));

    try {
      await fetchJson<{ experience: PassengerExperience }>("/passenger/experience", {
        method: "PUT",
        body: JSON.stringify(nextExperience)
      });
      setSyncMessage("Your trust and payment preferences are synced across sessions.");
      setBookingState("idle");
    } catch {
      setSyncMessage("Preferences were saved locally and will sync again when the connection improves.");
      setBookingState("idle");
    }
  }

  async function updatePayment(nextPayment: "MOMO" | "CASH") {
    setPreferredPayment(nextPayment);
    await persistExperience({
      destination,
      preferredPayment: nextPayment,
      momoProvider,
      trustedContacts,
      lowBandwidthMode,
      safetyShareEnabled
    });
  }

  async function updateMomoProvider(nextProvider: string) {
    setMomoProvider(nextProvider);
    await persistExperience({
      destination,
      preferredPayment,
      momoProvider: nextProvider,
      trustedContacts,
      lowBandwidthMode,
      safetyShareEnabled
    });
  }

  async function updateTrustSettings(next: Partial<BookingDraft>) {
    const nextExperience: BookingDraft = {
      destination,
      preferredPayment,
      momoProvider,
      trustedContacts,
      lowBandwidthMode,
      safetyShareEnabled,
      ...next
    };

    if (typeof next.lowBandwidthMode === "boolean") setLowBandwidthMode(next.lowBandwidthMode);
    if (typeof next.safetyShareEnabled === "boolean") setSafetyShareEnabled(next.safetyShareEnabled);
    if (next.trustedContacts) setTrustedContacts(next.trustedContacts);

    await persistExperience(nextExperience);
  }

  function addTrustedContact() {
    const value = newTrustedContact.trim();
    if (!value) {
      return;
    }

    if (trustedContacts.includes(value)) {
      setNewTrustedContact("");
      return;
    }

    const nextContacts = [...trustedContacts, value].slice(0, 4);
    setNewTrustedContact("");
    void updateTrustSettings({ trustedContacts: nextContacts });
  }

  function removeTrustedContact(contact: string) {
    void updateTrustSettings({
      trustedContacts: trustedContacts.filter((item) => item !== contact)
    });
  }

  async function submitRide() {
    if (!selectedRide) {
      return;
    }

    const payload = {
      pickup,
      destination,
      vehicleType: "Car",
      paymentMethod: preferredPayment,
      momoProvider,
      trustedContacts,
      lowBandwidthMode,
      safetyShareEnabled
    };

    setBookingState("submitting");
    setRideConfirmation(null);

    try {
      const response = await fetchJson<{
        ride: { id: string };
        safety: {
          safetyPin: string | null;
          pickupGuidance: string;
          trustedContactCount: number;
          shareTripLive: boolean;
        };
        payment: {
          method: "MOMO" | "CASH";
          momoProvider: string | null;
          momoReference: string | null;
        };
        estimate: RouteEstimate;
      }>("/passenger/rides", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      window.localStorage.removeItem(queuedStorageKey);
      setRouteEstimate(response.estimate);
      setLiveTrip({
        rideId: response.ride.id,
        status: "SEARCHING",
        fareGhs: response.estimate.fareGhs,
        etaMinutes: response.estimate.durationMinutes
      });
      setRideConfirmation({
        ...response.safety,
        paymentMethod: response.payment.method,
        momoProvider: response.payment.momoProvider,
        momoReference: response.payment.momoReference
      });
      setSyncMessage(
        response.payment.method === "MOMO"
          ? "Your ride is being matched and the MoMo authorization is ready."
          : "Your ride is being matched with cash payment at the end of the trip."
      );
      setBookingState("success");
    } catch {
      const queuedConfirmation: RideConfirmation = {
        safetyPin: safetyShareEnabled ? "Pending" : null,
        pickupGuidance: "Your trip draft was saved locally. Reconnect to finish matching a driver.",
        trustedContactCount: trustedContacts.length,
        shareTripLive: safetyShareEnabled,
        paymentMethod: preferredPayment,
        momoProvider: preferredPayment === "MOMO" ? momoProvider : null,
        momoReference: null,
        queuedForRetry: true
      };

      if (typeof window !== "undefined") {
        window.localStorage.setItem(queuedStorageKey, JSON.stringify(payload));
      }

      setRideConfirmation(queuedConfirmation);
      setSyncMessage(
        networkOnline
          ? "The request could not be completed now. Your details are queued locally for retry."
          : "You are offline. The booking draft is stored locally until you reconnect."
      );
      setBookingState("error");
    }
  }

  return (
    <main className="product-shell passenger-shell">
      <header className="app-topbar">
        <div className="brand-lockup">
          <div className="brand-mark">Qiilu</div>
          <div className="brand-sub">Passenger web</div>
        </div>
        <nav className="top-nav">
          <span className="top-nav-item active">Book</span>
          <span className="top-nav-item">Trips</span>
          <span className="top-nav-item">Trusted circle</span>
          <Link className="top-nav-item" href="/driver">
            Driver console
          </Link>
        </nav>
        <div className="top-actions">
          <span className={`status-chip ${networkOnline ? "online" : "offline"}`}>
            {networkOnline ? "Connected" : "Offline-safe"}
          </span>
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
            {user?.name.slice(0, 2).toUpperCase() ?? "AB"}
          </button>
        </div>
      </header>

      <div className="product-layout">
        <section className="map-stage">
          <div className="stage-card stage-map">
            <div className="panel-head">
              <div>
                <p className="section-kicker">Live map</p>
                <h1>Safer ride booking built around trust, MoMo, and real route intelligence.</h1>
              </div>
              <div className="map-chip-row">
                <span className="status-chip soft">{selectedRide?.nearby ?? 0} cars nearby</span>
                <span className="status-chip soft">
                  {routeEstimate ? `${routeEstimate.durationMinutes} min trip` : selectedRide?.etaMinutes ?? "--"}
                </span>
                {lowBandwidthMode ? <span className="status-chip soft">Lite mode on</span> : null}
              </div>
            </div>

            <PassengerLiveMap
              pickup={pickup}
              destination={destination}
              route={routeEstimate?.route}
              pickupCoords={routeEstimate?.pickup ?? null}
              destinationCoords={routeEstimate?.destination ?? null}
              driverCoords={driverPosition ? { lat: driverPosition.lat, lng: driverPosition.lng } : null}
            />

            <div className="market-strip single-offer-strip">
              <div>
                <span className="market-label">Trusted circle</span>
                <strong>{trustedContacts.length} contacts linked</strong>
              </div>
              <div>
                <span className="market-label">Primary payment</span>
                <strong>{preferredPayment === "MOMO" ? momoProvider : "Cash fallback"}</strong>
              </div>
              <div>
                <span className="market-label">Route engine</span>
                <strong>{routeEstimate ? routeEstimate.provider.toUpperCase() : "Calculating..."}</strong>
              </div>
            </div>

            {liveTrip ? (
              <div className="trust-banner realtime-trip-banner">
                <strong>
                  {liveTrip.status === "SEARCHING"
                    ? "Searching for a driver"
                    : liveTrip.status === "ACCEPTED"
                      ? `${liveTrip.driverName ?? "Driver"} is coming to pickup`
                      : liveTrip.status === "IN_PROGRESS"
                        ? "Trip is in progress"
                        : liveTrip.status === "COMPLETED"
                          ? "Trip completed"
                          : "Trip cancelled"}
                </strong>
                <span>
                  {driverPosition
                    ? `Driver live progress ${(driverPosition.progress * 100).toFixed(0)}%`
                    : liveTrip.safetyPin
                      ? `Use safety pin ${liveTrip.safetyPin} before boarding.`
                      : "Realtime trip updates will appear here."}
                </span>
              </div>
            ) : null}
          </div>
        </section>

        <aside className="booking-dock passenger-dock-expanded">
          <section className="dock-card booking-card">
            <div className="panel-head">
              <div>
                <p className="section-kicker">Plan trip</p>
                <h2>Where to?</h2>
              </div>
              <span className="ghost-chip">Car only</span>
            </div>

            <div className="journey-stack">
              <label className="journey-field">
                <span className="journey-dot pickup-dot" />
                <div>
                  <small>Pickup</small>
                  <input value={pickup} disabled />
                </div>
              </label>
              <label className="journey-field">
                <span className="journey-dot drop-dot" />
                <div>
                  <small>Destination</small>
                  <input
                    value={destination}
                    onChange={(event) => setDestination(event.target.value)}
                    placeholder="Enter destination"
                  />
                </div>
              </label>
            </div>

            <div className="quick-destinations">
              {locationCatalog.slice(1).map((location) => (
                <button key={location.label} type="button" className="quick-chip" onClick={() => setDestination(location.label)}>
                  {location.label}
                </button>
              ))}
            </div>
          </section>

          <section className="dock-card trust-card">
            <div className="panel-head">
              <div>
                <p className="section-kicker">Trust features</p>
                <h2>Trusted Circle</h2>
              </div>
              <span className="ghost-chip">{trustedContacts.length}/4 contacts</span>
            </div>

            <div className="toggle-grid">
              <button
                type="button"
                className={`preference-tile ${safetyShareEnabled ? "active" : ""}`}
                onClick={() => void updateTrustSettings({ safetyShareEnabled: !safetyShareEnabled })}
              >
                <strong>Auto-share trip</strong>
                <span>Share trip progress and the safety pin with your trusted people.</span>
              </button>
              <button
                type="button"
                className={`preference-tile ${lowBandwidthMode ? "active lite" : ""}`}
                onClick={() => void updateTrustSettings({ lowBandwidthMode: !lowBandwidthMode })}
              >
                <strong>Low-bandwidth mode</strong>
                <span>Preserve booking drafts and reduce dependency on a perfect connection.</span>
              </button>
            </div>

            <div className="trusted-contact-entry">
              <input
                value={newTrustedContact}
                onChange={(event) => setNewTrustedContact(event.target.value)}
                placeholder="Add a phone number or contact name"
              />
              <button type="button" className="secondary-button" onClick={addTrustedContact}>
                Add contact
              </button>
            </div>

            <div className="contact-chip-row">
              {trustedContacts.length ? (
                trustedContacts.map((contact) => (
                  <button key={contact} type="button" className="contact-chip" onClick={() => removeTrustedContact(contact)}>
                    {contact}
                  </button>
                ))
              ) : (
                <div className="empty-panel-state compact-empty-state">No trusted contacts added yet.</div>
              )}
            </div>
          </section>

          <section className="dock-card ride-card">
            <div className="panel-head">
              <div>
                <p className="section-kicker">Ride option</p>
                <h2>Car</h2>
              </div>
              <span className="ghost-chip">Only available vehicle</span>
            </div>

            {selectedRide ? (
              <button type="button" className="ride-row selected single-car-row" onClick={() => setSelectedRideId(selectedRide.id)}>
                <div className="ride-badge sunrise">Ca</div>
                <div className="ride-row-copy">
                  <div className="ride-row-head">
                    <strong>{selectedRide.label}</strong>
                    <span>{selectedRide.type}</span>
                  </div>
                  <p>{selectedRide.description}</p>
                  <div className="ride-meta-line">
                    <span>{routeEstimate ? `${routeEstimate.durationMinutes} min` : `${selectedRide.etaMinutes} min`}</span>
                    <span>{selectedRide.seats} seats</span>
                    <span>{selectedRide.nearby} nearby</span>
                    <span>{routeEstimate ? `${routeEstimate.distanceKm.toFixed(1)} km` : "-- km"}</span>
                  </div>
                </div>
                <div className="ride-row-price">GHS {(routeEstimate?.fareGhs ?? selectedRide.priceGhs).toFixed(2)}</div>
              </button>
            ) : (
              <div className="empty-panel-state">{loadError ?? "Checking for available cars..."}</div>
            )}
          </section>

          <section className="dock-card summary-card">
            <div className="panel-head">
              <div>
                <p className="section-kicker">Checkout</p>
                <h2>{selectedRide ? "Confirm trusted ride" : "Waiting for vehicle data"}</h2>
              </div>
              <span className="ghost-chip">{preferredPayment === "MOMO" ? "MoMo-first" : "Cash fallback"}</span>
            </div>

            <div className="payment-choice-grid">
              <button
                type="button"
                className={`payment-option ${preferredPayment === "MOMO" ? "active" : ""}`}
                onClick={() => void updatePayment("MOMO")}
              >
                <strong>Mobile Money</strong>
                <span>Recommended for faster matching and instant trust receipt sharing.</span>
              </button>
              <button
                type="button"
                className={`payment-option ${preferredPayment === "CASH" ? "active" : ""}`}
                onClick={() => void updatePayment("CASH")}
              >
                <strong>Cash</strong>
                <span>Use when MoMo is unavailable, with the same safety flow.</span>
              </button>
            </div>

            {preferredPayment === "MOMO" ? (
              <div className="provider-row">
                {["MTN MoMo", "Telecel Cash"].map((provider) => (
                  <button
                    key={provider}
                    type="button"
                    className={`quick-chip ${momoProvider === provider ? "selected-chip" : ""}`}
                    onClick={() => void updateMomoProvider(provider)}
                  >
                    {provider}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="summary-grid">
              <div>
                <span className="summary-label">Pickup</span>
                <strong>{routeEstimate?.pickup.label ?? pickup}</strong>
              </div>
              <div>
                <span className="summary-label">Destination</span>
                <strong>{routeEstimate?.destination.label ?? (destination || "Add destination")}</strong>
              </div>
              <div>
                <span className="summary-label">Trusted circle</span>
                <strong>{trustedContacts.length ? `${trustedContacts.length} contacts` : "Not yet configured"}</strong>
              </div>
              <div>
                <span className="summary-label">Safety mode</span>
                <strong>{safetyShareEnabled ? "Auto-share enabled" : "Private trip"}</strong>
              </div>
            </div>

            <div className="fare-breakdown">
              <div><span>Estimated fare</span><strong>{routeEstimate ? `GHS ${routeEstimate.fareGhs.toFixed(2)}` : selectedRide ? `GHS ${selectedRide.priceGhs.toFixed(2)}` : "--"}</strong></div>
              <div><span>Trip ETA</span><strong>{routeEstimate ? `${routeEstimate.durationMinutes} min` : selectedRide ? `${selectedRide.etaMinutes} min` : "--"}</strong></div>
              <div><span>Distance</span><strong>{routeEstimate ? `${routeEstimate.distanceKm.toFixed(1)} km` : "--"}</strong></div>
              <div><span>Connection mode</span><strong>{lowBandwidthMode ? "Draft will survive reconnects" : "Live dispatch sync"}</strong></div>
              <div><span>Routing provider</span><strong>{routeEstimate ? routeEstimate.provider.toUpperCase() : routeState === "loading" ? "Calculating..." : "--"}</strong></div>
            </div>

            <button
              className="cta-button"
              type="button"
              onClick={submitRide}
              disabled={!selectedRide || bookingState === "submitting" || routeState === "loading" || !destination.trim()}
            >
              {bookingState === "submitting"
                ? "Matching driver..."
                : routeState === "loading"
                  ? "Calculating live route..."
                  : !networkOnline
                    ? "Queue ride until reconnect"
                    : preferredPayment === "MOMO"
                      ? "Confirm with Mobile Money"
                      : "Confirm cash ride"}
            </button>

            <div className="network-banner">
              <strong>{networkOnline ? "Connection healthy" : "Offline-safe mode active"}</strong>
              <span>{syncMessage}</span>
            </div>

            {routeError ? <div className="feedback-banner warning">{routeError}</div> : null}

            {rideConfirmation ? (
              <div className={`feedback-banner ${rideConfirmation.queuedForRetry || bookingState === "error" ? "warning" : "success"}`}>
                <strong>
                  {rideConfirmation.queuedForRetry
                    ? "Ride draft queued locally."
                    : `Driver matching started. Expect trip time of about ${routeEstimate?.durationMinutes ?? selectedRide?.etaMinutes ?? "--"} minutes.`}
                </strong>
                <div className="feedback-detail-list">
                  <span>Pickup guidance: {rideConfirmation.pickupGuidance}</span>
                  {rideConfirmation.safetyPin ? <span>Safety pin: {rideConfirmation.safetyPin}</span> : null}
                  <span>Trusted contacts notified: {rideConfirmation.shareTripLive ? rideConfirmation.trustedContactCount : 0}</span>
                  {rideConfirmation.paymentMethod === "MOMO" && rideConfirmation.momoProvider ? (
                    <span>
                      Payment: {rideConfirmation.momoProvider}
                      {rideConfirmation.momoReference ? ` • ${rideConfirmation.momoReference}` : ""}
                    </span>
                  ) : (
                    <span>Payment: Cash on trip completion</span>
                  )}
                  {routeEstimate ? (
                    <span>
                      Route: {routeEstimate.distanceKm.toFixed(1)} km • {routeEstimate.durationMinutes} min • GHS {routeEstimate.fareGhs.toFixed(2)}
                    </span>
                  ) : null}
                </div>
              </div>
            ) : null}
          </section>
        </aside>
      </div>
    </main>
  );
}
