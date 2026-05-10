"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowDownUp,
  Bell,
  Car,
  CheckCircle2,
  CreditCard,
  Home,
  LoaderCircle,
  LogOut,
  MapPinned,
  Menu,
  MessageSquare,
  Navigation,
  ShieldAlert,
  User
} from "lucide-react";
import { PassengerMobileExact } from "@/components/qiilu/passenger-mobile-exact";
import { passengerNavItems } from "@/components/qiilu/passenger-shell";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MobileInstallPrompt } from "@/components/mobile-install-prompt";
import { clearSession, type SessionUser } from "@/lib/auth-session";
import { fetchJson } from "@/lib/api";
import { savePlace } from "@/lib/passenger-favourites";
import { locationCatalog } from "@/lib/location-catalog";
import {
  createPlaceSearchSession,
  retrievePlace,
  suggestNearbyPopularPlaces,
  suggestPlaces,
  type PlaceSuggestion,
  type ResolvedPlace
} from "@/lib/place-search";
import { getRealtimeUrl } from "@/lib/realtime";

const PassengerLiveMap = dynamic(() => import("@/components/passenger-live-map"), { ssr: false });

type VehicleOption = {
  id: string;
  label: string;
  type: string;
  etaMinutes: number;
  seats: number;
  priceGhs: number;
  description: string;
  nearby: number;
  isAvailable: boolean;
  availabilityLabel: string;
};

type RouteEstimate = {
  provider: string;
  distanceKm: number;
  durationMinutes: number;
  fareGhs: number;
  route?: [number, number][];
  pickup?: { label: string; lat: number; lng: number };
  destination?: { label: string; lat: number; lng: number };
};

type RideState = {
  id: string;
  pickup: string;
  destination: string;
  status: string;
  estimatedFareGhs: number;
  etaMinutes: number;
  safetyPin: string | null;
};

type RideResponse = {
  message: string;
  ride: RideState;
  safety: {
    trustedContactCount: number;
    safetyShareEnabled: boolean;
    pickupGuidance?: string;
  };
  payment: {
    method: string;
    provider: string | null;
    status?: string;
    momoReference?: string | null;
    authorizationUrl?: string | null;
    message?: string;
  };
  estimate: RouteEstimate;
};

type PassengerExperience = {
  preferredPayment: "MOMO" | "CASH";
  momoProvider: string | null;
  trustedContacts: string[];
  lowBandwidthMode: boolean;
  safetyShareEnabled: boolean;
};

type DriverLocationPayload = {
  lat: number;
  lng: number;
  progress: number;
  stage: string;
};

type LiveLocation = {
  lat: number;
  lng: number;
};

function LocationSuggestionMenu({
  suggestions,
  onSelect
}: {
  suggestions: PlaceSuggestion[];
  onSelect: (suggestion: PlaceSuggestion) => void;
}) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="absolute left-0 right-0 top-[calc(100%+0.4rem)] z-30 overflow-hidden rounded-2xl border border-border bg-background shadow-xl dark:bg-[#171c22]">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion.id}
          type="button"
          className="flex w-full flex-col px-4 py-3 text-left transition-colors hover:bg-muted/50 dark:hover:bg-white/5"
          onClick={() => onSelect(suggestion)}
        >
          <span className="text-sm font-semibold">{suggestion.name}</span>
          <span className="text-xs text-muted-foreground">{suggestion.fullAddress}</span>
        </button>
      ))}
    </div>
  );
}

function formatRouteEstimateError(error: unknown) {
  if (!(error instanceof Error)) {
    return "We couldn't estimate this trip right now.";
  }

  if (error.message.toLowerCase().includes("could not calculate a real route")) {
    return "We couldn't resolve one of those locations. Try a more specific pickup or destination.";
  }

  return error.message;
}

export function PassengerScreen({ user, token }: { user: SessionUser; token: string }) {
  const router = useRouter();
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
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [vehicleOptions, setVehicleOptions] = useState<VehicleOption[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<RouteEstimate | null>(null);
  const [activeRide, setActiveRide] = useState<RideResponse | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"MOMO" | "CASH">("MOMO");
  const [trustedContacts, setTrustedContacts] = useState("");
  const [momoProvider, setMomoProvider] = useState("MTN MoMo");
  const [lowBandwidthMode, setLowBandwidthMode] = useState(false);
  const [safetyShareEnabled, setSafetyShareEnabled] = useState(true);
  const [incidentDescription, setIncidentDescription] = useState("");
  const [driverLocation, setDriverLocation] = useState<DriverLocationPayload | null>(null);
  const [liveLocation, setLiveLocation] = useState<LiveLocation | null>(null);
  const [currentPickupAnchor, setCurrentPickupAnchor] = useState<LiveLocation | null>(null);
  const [pickupSuggestions, setPickupSuggestions] = useState<PlaceSuggestion[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<PlaceSuggestion[]>([]);
  const [popularDestinations, setPopularDestinations] = useState<PlaceSuggestion[]>([]);
  const [pickupSelection, setPickupSelection] = useState<ResolvedPlace | null>(null);
  const [destinationSelection, setDestinationSelection] = useState<ResolvedPlace | null>(null);
  const [isResolvingPickupSuggestion, setIsResolvingPickupSuggestion] = useState(false);
  const [isResolvingDestinationSuggestion, setIsResolvingDestinationSuggestion] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isLoadingExperience, setIsLoadingExperience] = useState(true);
  const [isEstimating, setIsEstimating] = useState(false);
  const [isSavingExperience, setIsSavingExperience] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [isCancellingRide, setIsCancellingRide] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(true);
  const socketRef = useRef<WebSocket | null>(null);
  const searchTimeoutRef = useRef<number | null>(null);
  const pickupSearchSessionRef = useRef(createPlaceSearchSession());
  const destinationSearchSessionRef = useRef(createPlaceSearchSession());
  const nearbySuggestionKey = liveLocation ? `${liveLocation.lat.toFixed(3)},${liveLocation.lng.toFixed(3)}` : null;
  const nearbySuggestionAnchor = useMemo(() => {
    if (!nearbySuggestionKey) {
      return null;
    }

    const [lat, lng] = nearbySuggestionKey.split(",").map(Number);
    return { lat, lng };
  }, [nearbySuggestionKey]);
  const fallbackQuickDestinations = useMemo(
    () => locationCatalog.filter((location) => location.label !== "Current location, East Legon").slice(0, 4),
    []
  );
  const quickDestinations = useMemo(() => {
    const seenNearbyLabels = new Set<string>();
    const nearby = popularDestinations.filter((place) => {
      const key = place.name.trim().toLowerCase();

      if (seenNearbyLabels.has(key)) {
        return false;
      }

      seenNearbyLabels.add(key);
      return true;
    }).slice(0, 4).map((place) => ({
      id: place.id,
      label: place.name,
      suggestion: place
    }));

    if (nearby.length > 0) {
      return nearby;
    }

    return fallbackQuickDestinations.map((location) => ({
      id: `catalog-${location.label}`,
      label: location.label,
      suggestion: {
        id: `catalog-${location.label}`,
        name: location.label,
        fullAddress: location.label,
        lat: location.lat,
        lng: location.lng
      } satisfies PlaceSuggestion
    }));
  }, [fallbackQuickDestinations, popularDestinations]);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setFeedback("Live location is not supported on this device.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const nextLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        setLiveLocation(nextLocation);
        setPickup((current) => (current.trim() ? current : "Current location"));
        setCurrentPickupAnchor((current) => current ?? nextLocation);
      },
      () => {
        setFeedback((current) => current ?? "Location access was blocked. You can still enter a pickup manually.");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 15000,
        timeout: 12000
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    fetchJson<{ options: VehicleOption[] }>("/passenger/vehicle-options")
      .then((payload) => {
        setVehicleOptions(payload.options);
        setSelectedVehicleId(payload.options.find((option) => option.isAvailable)?.id ?? payload.options[0]?.id ?? null);
      })
      .catch((error) => {
        setFeedback(error instanceof Error ? error.message : "Could not load vehicle options.");
      })
      .finally(() => setIsLoadingOptions(false));

    fetchJson<{ experience: PassengerExperience }>("/passenger/experience", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(({ experience }) => {
        setPaymentMethod(experience.preferredPayment);
        setMomoProvider(experience.momoProvider ?? "MTN MoMo");
        setTrustedContacts(experience.trustedContacts.join(", "));
        setLowBandwidthMode(experience.lowBandwidthMode);
        setSafetyShareEnabled(experience.safetyShareEnabled);
      })
      .catch((error) => {
        setFeedback(error instanceof Error ? error.message : "Could not load passenger preferences.");
      })
      .finally(() => setIsLoadingExperience(false));
  }, [token]);

  useEffect(() => {
    const query = pickup.trim();

    if (!query || query.length < 3 || query === "Current location") {
      setPickupSuggestions([]);
      return;
    }

    if (pickupSelection && query === pickupSelection.fullAddress) {
      setPickupSuggestions([]);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      suggestPlaces({
        query,
        sessionToken: pickupSearchSessionRef.current,
        proximity: liveLocation
      })
        .then((results) => {
          setPickupSuggestions(results);
        })
        .catch(() => {
          setPickupSuggestions([]);
        });
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [liveLocation, pickup, pickupSelection]);

  useEffect(() => {
    const query = destination.trim();

    if (!query || query.length < 3) {
      setDestinationSuggestions([]);
      return;
    }

    if (destinationSelection && query === destinationSelection.fullAddress) {
      setDestinationSuggestions([]);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      suggestPlaces({
        query,
        sessionToken: destinationSearchSessionRef.current,
        proximity: liveLocation
      })
        .then((results) => {
          setDestinationSuggestions(results);
        })
        .catch(() => {
          setDestinationSuggestions([]);
        });
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [destination, destinationSelection, liveLocation]);

  useEffect(() => {
    if (!nearbySuggestionAnchor) {
      return;
    }

    let cancelled = false;

    suggestNearbyPopularPlaces({ proximity: nearbySuggestionAnchor, limit: 6 })
      .then((results) => {
        if (!cancelled) {
          setPopularDestinations(results);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPopularDestinations([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [nearbySuggestionAnchor]);

  useEffect(() => {
    const currentVehicle = vehicleOptions.find((option) => option.id === selectedVehicleId) ?? null;

    if (!pickup.trim() || !destination.trim() || (currentVehicle && !currentVehicle.isAvailable)) {
      setEstimate(null);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (!selectedVehicleId) {
        setEstimate(null);
        setIsEstimating(false);
        return;
      }

      setIsEstimating(true);
      fetchJson<{ estimate: RouteEstimate }>("/passenger/route-estimate", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          pickup,
          destination,
          vehicleId: selectedVehicleId,
          pickupCoords:
            pickupSelection
              ? { lat: pickupSelection.lat, lng: pickupSelection.lng }
              : pickup === "Current location" && currentPickupAnchor
                ? currentPickupAnchor
                : null,
          destinationCoords: destinationSelection
            ? { lat: destinationSelection.lat, lng: destinationSelection.lng }
            : null
        })
      })
        .then((payload) => {
          setEstimate(payload.estimate);
          setFeedback(null);
        })
        .catch((error) => {
          setEstimate(null);
          setFeedback(formatRouteEstimateError(error));
        })
        .finally(() => setIsEstimating(false));
    }, 450);

    return () => window.clearTimeout(timeoutId);
  }, [currentPickupAnchor, destination, destinationSelection, pickup, pickupSelection, selectedVehicleId, token, vehicleOptions]);

  useEffect(() => {
    const socket = new WebSocket(getRealtimeUrl(token));
    socketRef.current = socket;

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as { type: string; payload?: Record<string, unknown> };

        if (message.type === "ride.searching") {
          setActiveRide((current) => current ? { ...current, ride: { ...current.ride, status: "SEARCHING" } } : current);
          setFeedback("Searching for available drivers near your pickup.");
        }

        if (message.type === "ride.accepted") {
          const payload = message.payload as { etaMinutes: number; fareGhs: number; safetyPin?: string | null };
          setActiveRide((current) =>
            current
              ? {
                  ...current,
                  ride: {
                    ...current.ride,
                    status: "ACCEPTED",
                    etaMinutes: payload.etaMinutes ?? current.ride.etaMinutes,
                    estimatedFareGhs: payload.fareGhs ?? current.ride.estimatedFareGhs,
                    safetyPin: payload.safetyPin ?? current.ride.safetyPin
                  }
                }
              : current
          );
          setFeedback("A driver has accepted your ride.");
        }

        if (message.type === "ride.stage.updated") {
          const payload = message.payload as { status?: string };
          setActiveRide((current) => current ? { ...current, ride: { ...current.ride, status: payload.status ?? current.ride.status } } : current);
        }

        if (message.type === "ride.cancelled") {
          setFeedback("This trip was cancelled or returned to the queue.");
          setDriverLocation(null);
        }

        if (message.type === "driver.location") {
          setDriverLocation(message.payload as DriverLocationPayload);
        }
      } catch {
        // Ignore malformed realtime messages.
      }
    };

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }

    if (activeRide?.ride.status === "SEARCHING") {
      searchTimeoutRef.current = window.setTimeout(() => {
        setFeedback((current) =>
          current === "A driver has accepted your ride."
            ? current
            : "No drivers have accepted yet. Qiilu is still searching nearby, or you can wait a little longer."
        );
      }, 20000);
    }

    return () => {
      if (searchTimeoutRef.current) {
        window.clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
    };
  }, [activeRide?.ride.status]);

  const selectedVehicle = vehicleOptions.find((option) => option.id === selectedVehicleId) ?? null;
  const canBook = Boolean(pickup.trim() && destination.trim() && selectedVehicle?.isAvailable && estimate && !isBooking);
  const fareLabel =
    estimate
      ? `GHS ${estimate.fareGhs.toFixed(2)}`
      : isEstimating
        ? "Estimating..."
        : selectedVehicle && selectedVehicle.isAvailable
          ? `From GHS ${selectedVehicle.priceGhs.toFixed(2)}`
          : "Unavailable";
  const fareSummaryLabel =
    estimate
      ? `GHS ${estimate.fareGhs.toFixed(2)}`
      : selectedVehicle && selectedVehicle.isAvailable
        ? `From GHS ${selectedVehicle.priceGhs.toFixed(2)}`
        : "Waiting for drivers";
  const routeNotice =
    estimate?.provider === "catalog"
      ? "Live road routing is unavailable for this trip right now, so Qiilu is showing a straight-line backup estimate."
      : null;

  const saveExperience = async () => {
    setIsSavingExperience(true);
    setFeedback(null);

    try {
      await fetchJson("/passenger/experience", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          preferredPayment: paymentMethod,
          momoProvider,
          trustedContacts: trustedContacts.split(",").map((item) => item.trim()).filter(Boolean),
          lowBandwidthMode,
          safetyShareEnabled
        })
      });
      setFeedback("Passenger preferences saved.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Could not save passenger preferences.");
    } finally {
      setIsSavingExperience(false);
    }
  };

  const createRide = async () => {
    if (!canBook || !selectedVehicle) {
      return;
    }

    setIsBooking(true);
    setFeedback(null);

    try {
      const payload = await fetchJson<RideResponse>("/passenger/rides", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          pickup,
          destination,
          pickupCoords:
            pickupSelection
              ? { lat: pickupSelection.lat, lng: pickupSelection.lng }
              : pickup === "Current location" && currentPickupAnchor
                ? currentPickupAnchor
                : null,
          destinationCoords: destinationSelection
            ? { lat: destinationSelection.lat, lng: destinationSelection.lng }
            : null,
          vehicleId: selectedVehicle.id,
          vehicleType: selectedVehicle.label,
          paymentMethod,
          trustedContacts: trustedContacts.split(",").map((item) => item.trim()).filter(Boolean),
          momoProvider,
          lowBandwidthMode,
          safetyShareEnabled
        })
      });

      setActiveRide(payload);
      setEstimate(payload.estimate);
      setDriverLocation(null);
      setFeedback(
        payload.payment.message
          ? `Searching for available drivers near your pickup. ${payload.payment.message}`
          : "Searching for available drivers near your pickup."
      );
    } catch (error) {
      setFeedback(formatRouteEstimateError(error));
    } finally {
      setIsBooking(false);
    }
  };

  const cancelRide = async () => {
    if (!activeRide) {
      return;
    }

    setIsCancellingRide(true);
    setFeedback(null);

    try {
      await fetchJson(`/passenger/rides/${activeRide.ride.id}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      setActiveRide(null);
      setDriverLocation(null);
      setFeedback("Ride request cancelled.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Could not cancel the ride right now.");
    } finally {
      setIsCancellingRide(false);
    }
  };

  const reportIncident = async () => {
    if (!activeRide || !incidentDescription.trim()) {
      return;
    }

    setIsReporting(true);
    setFeedback(null);

    try {
      await fetchJson("/support/incidents", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          rideId: activeRide.ride.id,
          category: "Ride support",
          severity: "MEDIUM",
          description: incidentDescription.trim()
        })
      });
      setIncidentDescription("");
      setFeedback("Support incident sent to the Qiilu operations team.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Could not send incident report.");
    } finally {
      setIsReporting(false);
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

  const useLivePickup = () => {
    if (!liveLocation) {
      setFeedback("Allow location access first so Qiilu can pin your pickup.");
      return;
    }

    setPickup("Current location");
    setPickupSelection(null);
    setCurrentPickupAnchor(liveLocation);
    setPickupSuggestions([]);
    setFeedback("Using your live location as pickup.");
  };

  const swapRoute = () => {
    const nextPickup = destination;
    const nextDestination = pickup === "Current location" ? "" : pickup;
    const nextPickupSelection = destinationSelection;
    const nextDestinationSelection = pickup === "Current location" ? null : pickupSelection;

    setPickup(nextPickup);
    setDestination(nextDestination);
    setPickupSelection(nextPickupSelection);
    setDestinationSelection(nextDestinationSelection);
    setCurrentPickupAnchor(nextPickup === "Current location" ? currentPickupAnchor : null);
    setPickupSuggestions([]);
    setDestinationSuggestions([]);
  };

  const chooseQuickDestination = (id: string) => {
    if (!pickup.trim() && liveLocation) {
      setPickup("Current location");
      setPickupSelection(null);
      setCurrentPickupAnchor(liveLocation);
    }

    const quickDestination = quickDestinations.find((location) => location.id === id);

    if (quickDestination?.suggestion) {
      void selectDestinationSuggestion(quickDestination.suggestion).finally(() => setMobileDrawerOpen(false));
      return;
    }

    setDestination(quickDestination?.label ?? "");
    setDestinationSelection(null);
    setDestinationSuggestions([]);
    setMobileDrawerOpen(false);
  };

  const handlePickupInputChange = (value: string) => {
    setPickup(value);
    setPickupSuggestions([]);

    if (pickupSelection && value.trim() !== pickupSelection.fullAddress) {
      setPickupSelection(null);
    }

    if (value.trim() !== "Current location") {
      setCurrentPickupAnchor(null);
    } else if (liveLocation) {
      setCurrentPickupAnchor((current) => current ?? liveLocation);
    }
  };

  const handleDestinationInputChange = (value: string) => {
    setDestination(value);
    setDestinationSuggestions([]);

    if (destinationSelection && value.trim() !== destinationSelection.fullAddress) {
      setDestinationSelection(null);
    }
  };

  const selectPickupSuggestion = async (suggestion: PlaceSuggestion) => {
    setIsResolvingPickupSuggestion(true);
    setFeedback(null);

    try {
      const place = await retrievePlace({
        suggestion,
        sessionToken: pickupSearchSessionRef.current
      });
      setPickup(place.fullAddress);
      setPickupSelection(place);
      setCurrentPickupAnchor(null);
      setPickupSuggestions([]);
      pickupSearchSessionRef.current = createPlaceSearchSession();
    } catch {
      setFeedback("We couldn't pin that pickup yet. Try another result.");
    } finally {
      setIsResolvingPickupSuggestion(false);
    }
  };

  const selectDestinationSuggestion = async (suggestion: PlaceSuggestion) => {
    setIsResolvingDestinationSuggestion(true);
    setFeedback(null);

    try {
      const place = await retrievePlace({
        suggestion,
        sessionToken: destinationSearchSessionRef.current
      });
      setDestination(place.fullAddress);
      setDestinationSelection(place);
      setDestinationSuggestions([]);
      destinationSearchSessionRef.current = createPlaceSearchSession();
    } catch {
      setFeedback("We couldn't pin that destination yet. Try another result.");
    } finally {
      setIsResolvingDestinationSuggestion(false);
    }
  };

  const bookmarkPlace = (label: string, kind: "pickup" | "destination") => {
    if (!label.trim()) {
      setFeedback(`Enter a ${kind} first so Qiilu can save it.`);
      return;
    }

    savePlace(label, kind);
    setFeedback(`${kind === "pickup" ? "Pickup" : "Destination"} saved to favourites.`);
  };

  const routePath = estimate?.route;
  const pickupCoords =
    pickupSelection
      ? { lat: pickupSelection.lat, lng: pickupSelection.lng }
      : pickup === "Current location" && currentPickupAnchor
      ? currentPickupAnchor
      : estimate?.pickup
        ? { lat: estimate.pickup.lat, lng: estimate.pickup.lng }
        : null;
  const destinationCoords =
    destinationSelection
      ? { lat: destinationSelection.lat, lng: destinationSelection.lng }
      : estimate?.destination
        ? { lat: estimate.destination.lat, lng: estimate.destination.lng }
        : null;
  const mobileStep =
    activeRide?.ride.status === "SEARCHING"
      ? "searching"
      : activeRide
        ? "riding"
        : isBooking
          ? "searching"
          : "booking";
  const canCancelActiveRide = Boolean(
    activeRide && ["SEARCHING", "SCHEDULED", "ACCEPTED"].includes(activeRide.ride.status)
  );
  const cancelRideLabel = activeRide?.ride.status === "ACCEPTED" ? "Cancel assigned ride" : "Cancel request";

  useEffect(() => {
    if (mobileStep !== "booking") {
      setMobileDrawerOpen(true);
    }
  }, [mobileStep]);

  return (
    <>
      <div className="hidden min-h-screen w-full bg-background text-foreground lg:flex">
        <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col justify-between border-r border-border bg-card dark:bg-[#151a20]">
          <div>
            <div className="flex items-center gap-3 p-6">
              <Image src="/qiilu.png" alt="Qiilu" width={132} height={40} className="h-9 w-auto" priority />
            </div>
            <nav className="space-y-2 px-4">
              {passengerNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.href === "/passenger";

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
                      isActive
                        ? "bg-primary/10 font-bold text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
            <div className="flex items-center gap-3 rounded-xl p-3 hover:bg-muted">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-secondary font-bold text-white">{initials}</div>
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

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-card/92 px-6 shadow-sm backdrop-blur dark:bg-[#12171dcc]">
            <div>
              <h1 className="text-lg font-bold">Book a Ride</h1>
              <p className="text-sm text-muted-foreground">
                {activeRide ? "Track the live ride state and report issues if needed." : "Enter a route to get live pricing and request a driver."}
              </p>
            </div>
            <ThemeToggle />
          </header>

          <div className="flex min-h-[calc(100vh-4rem)]">
            <section className="sticky top-16 h-[calc(100vh-4rem)] flex-1 overflow-hidden bg-[#e5e3df] dark:bg-[#15191f]">
              {pickup || liveLocation ? (
                <PassengerLiveMap
                  pickup={pickup}
                  destination={destination}
                  route={routePath}
                  pickupCoords={pickupCoords}
                  destinationCoords={destinationCoords}
                  driverCoords={driverLocation ? { lat: driverLocation.lat, lng: driverLocation.lng } : null}
                  currentCoords={liveLocation}
                  fullScreen
                />
              ) : (
                <>
                  <div className="absolute inset-0 opacity-20 dark:opacity-10 [background-image:linear-gradient(#000_1px,transparent_1px),linear-gradient(90deg,#000_1px,transparent_1px)] dark:[background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:60px_60px]" />
                  <div className="absolute left-8 top-8 rounded-full border border-border/70 bg-card/95 px-4 py-2 text-sm font-semibold shadow-md dark:bg-[#171c22]">
                    Live route canvas
                  </div>
                </>
              )}

              <div className="absolute bottom-8 left-8 max-w-sm rounded-[1.6rem] border border-border/80 bg-card/95 p-5 shadow-md dark:bg-[#171c22]">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <MapPinned className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold">
                      {estimate
                        ? estimate.provider === "catalog"
                          ? `${estimate.distanceKm.toFixed(1)} km backup estimate`
                          : `${estimate.distanceKm.toFixed(1)} km live estimate`
                        : "Enter a route to estimate"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {estimate
                        ? `${estimate.durationMinutes} min • ${estimate.provider}${estimate.provider === "catalog" ? " fallback" : ""}`
                        : liveLocation
                          ? "Your live location is pinned. Add a destination to calculate the route."
                          : "Allow location access or enter a pickup and destination to start routing."}
                    </div>
                    {routeNotice ? (
                      <div className="mt-3 rounded-xl border border-amber-300/40 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                        {routeNotice}
                      </div>
                    ) : null}
                  </div>
                </div>
                {driverLocation ? (
                  <div className="mt-3 rounded-xl bg-muted/60 px-3 py-2 text-sm text-muted-foreground dark:bg-white/5">
                    Driver tracking live • {Math.round(driverLocation.progress * 100)}% route progress
                  </div>
                ) : null}
              </div>
            </section>

            <section className="flex max-h-[calc(100vh-4rem)] w-[470px] shrink-0 flex-col overflow-y-auto border-l border-border bg-background p-6 dark:bg-[#10151b]">
              {!activeRide ? (
                <>
                  <h2 className="mb-2 text-2xl font-bold">Where can we take you?</h2>
                  <p className="mb-6 text-sm text-muted-foreground">Enter a real pickup and destination to get a live estimate.</p>

                  <div className="mb-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      className="rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary"
                      onClick={useLivePickup}
                    >
                      Use my current location
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground dark:bg-[#171c22]"
                      onClick={swapRoute}
                    >
                      Swap pickup and destination
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground dark:bg-[#171c22]"
                      onClick={() => bookmarkPlace(pickup, "pickup")}
                    >
                      Save pickup
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground dark:bg-[#171c22]"
                      onClick={() => bookmarkPlace(destination, "destination")}
                    >
                      Save destination
                    </button>
                  </div>

                  <div className="relative mb-6 rounded-2xl border border-border bg-card p-5 dark:bg-[#171c22]">
                    <div className="absolute bottom-10 left-[31px] top-10 w-0.5 bg-border" />
                    <div className="relative z-10 mb-4 flex items-center gap-4">
                      <div className="h-3 w-3 rounded-full bg-primary ring-4 ring-card" />
                      <div className="relative flex-1">
                        <Input value={pickup} onChange={(event) => handlePickupInputChange(event.target.value)} placeholder="Pickup location" className="h-12 border-transparent bg-muted/50 dark:bg-white/5" />
                        <LocationSuggestionMenu suggestions={pickupSuggestions} onSelect={selectPickupSuggestion} />
                      </div>
                    </div>
                    <div className="relative z-10 flex items-center gap-4">
                      <div className="h-3 w-3 rounded-full bg-foreground ring-4 ring-card" />
                      <div className="relative flex-1">
                        <Input value={destination} onChange={(event) => handleDestinationInputChange(event.target.value)} placeholder="Destination" className="h-12 border-transparent bg-muted/50 dark:bg-white/5" />
                        <LocationSuggestionMenu suggestions={destinationSuggestions} onSelect={selectDestinationSuggestion} />
                      </div>
                    </div>
                  </div>

                  <div className="mb-6 rounded-2xl border border-border bg-muted/30 p-4 dark:bg-white/5">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="font-bold">Quick destinations</div>
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tap to autofill</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {quickDestinations.map((location) => (
                        <button
                          key={location.id}
                          type="button"
                          className={`rounded-full border px-3 py-2 text-sm font-medium transition-colors ${
                            destination === location.label
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-background text-muted-foreground dark:bg-[#171c22]"
                          }`}
                          onClick={() => chooseQuickDestination(location.id)}
                        >
                          {location.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-lg font-bold">Available Options</div>
                    {isEstimating ? <LoaderCircle className="h-4 w-4 animate-spin text-primary" /> : null}
                  </div>

                  {isLoadingOptions ? (
                    <div className="rounded-2xl border border-border bg-muted/40 p-6 text-center dark:bg-white/5">
                      <LoaderCircle className="mx-auto mb-3 h-5 w-5 animate-spin text-primary" />
                      <div className="font-medium">Loading live vehicle configuration...</div>
                    </div>
                  ) : selectedVehicle ? (
                    <button
                      type="button"
                      className={`rounded-2xl border-2 p-4 text-left ${
                        selectedVehicle.isAvailable
                          ? "border-primary bg-primary/5"
                          : "border-border bg-muted/40 opacity-95 dark:bg-white/5"
                      }`}
                      onClick={() => setSelectedVehicleId(selectedVehicle.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted dark:bg-white/8"><Car className="h-8 w-8" /></div>
                          <div>
                            <div className="font-bold">{selectedVehicle.label}</div>
                            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                              <User className="h-3 w-3" /> {selectedVehicle.seats} seats{selectedVehicle.isAvailable ? ` • ${selectedVehicle.etaMinutes} min ETA` : ""}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {selectedVehicle.isAvailable ? selectedVehicle.description : "This ride type is configured, but no drivers are online for it right now."}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">{fareLabel}</div>
                          <div className={`text-[10px] font-bold uppercase ${selectedVehicle.isAvailable ? "text-primary" : "text-amber-600 dark:text-amber-300"}`}>
                            {selectedVehicle.isAvailable ? selectedVehicle.availabilityLabel : "Unavailable"}
                          </div>
                        </div>
                      </div>
                    </button>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border p-6 text-center text-muted-foreground">
                      No active car product is configured right now.
                    </div>
                  )}

                  <div className="mt-6 rounded-2xl border border-border bg-muted/40 p-4 dark:bg-white/5">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="font-bold">Payment & trust</div>
                      {isLoadingExperience ? <LoaderCircle className="h-4 w-4 animate-spin text-primary" /> : <CreditCard className="h-4 w-4 text-primary" />}
                    </div>
                    <div className="mb-3 flex gap-3">
                      <button type="button" className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold ${paymentMethod === "MOMO" ? "border-primary bg-primary/10 text-primary" : "border-border bg-background dark:bg-[#171c22]"}`} onClick={() => setPaymentMethod("MOMO")}>Mobile Money</button>
                      <button type="button" className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold ${paymentMethod === "CASH" ? "border-primary bg-primary/10 text-primary" : "border-border bg-background dark:bg-[#171c22]"}`} onClick={() => setPaymentMethod("CASH")}>Cash</button>
                    </div>
                    <Input value={momoProvider} onChange={(event) => setMomoProvider(event.target.value)} placeholder="MoMo provider" className="mb-3 h-11 border-transparent bg-background dark:bg-[#171c22]" />
                    <Input value={trustedContacts} onChange={(event) => setTrustedContacts(event.target.value)} placeholder="Trusted contacts, comma separated" className="mb-3 h-11 border-transparent bg-background dark:bg-[#171c22]" />
                    <div className="grid grid-cols-2 gap-3">
                      <ToggleTile label="Safety sharing" active={safetyShareEnabled} onClick={() => setSafetyShareEnabled((value) => !value)} />
                      <ToggleTile label="Low bandwidth mode" active={lowBandwidthMode} onClick={() => setLowBandwidthMode((value) => !value)} />
                    </div>
                    <Button variant="outline" className="mt-3 w-full rounded-xl" disabled={isSavingExperience} onClick={saveExperience}>
                      {isSavingExperience ? "Saving..." : "Save preferences"}
                    </Button>
                  </div>

                  <div className="mt-6 rounded-2xl border border-border bg-muted/40 p-4 dark:bg-white/5">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Estimated fare</span>
                      <strong>{fareSummaryLabel}</strong>
                    </div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Estimated time</span>
                      <strong>{estimate ? `${estimate.durationMinutes} min` : "—"}</strong>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Distance</span>
                      <strong>{estimate ? `${estimate.distanceKm.toFixed(1)} km` : "—"}</strong>
                    </div>
                  </div>

                  {feedback ? <div className="mt-4 rounded-2xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground dark:bg-white/5">{feedback}</div> : null}
                  {(isResolvingPickupSuggestion || isResolvingDestinationSuggestion) ? <div className="mt-4 rounded-2xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground dark:bg-white/5">Resolving the selected place on the map...</div> : null}

                  <Button size="lg" className="mt-auto h-14 w-full rounded-xl text-lg" disabled={!canBook} onClick={createRide}>
                    {isBooking ? "Requesting ride..." : "Request Qiilu Car"}
                  </Button>
                </>
              ) : (
                <div className="flex h-full flex-col">
                  <div className="rounded-2xl bg-primary p-8 text-primary-foreground">
                    <div className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary-foreground/80">Ride status</div>
                    <div className="text-4xl font-extrabold">{activeRide.ride.status.replaceAll("_", " ")}</div>
                    <div className="mt-2 text-primary-foreground/80">
                      {activeRide.ride.status === "SEARCHING"
                        ? "Qiilu is searching for an available driver."
                        : activeRide.ride.status === "ACCEPTED"
                          ? "A driver is heading to your pickup."
                          : activeRide.ride.status === "IN_PROGRESS"
                            ? "Your trip is currently in progress."
                            : "This trip has been completed."}
                    </div>
                  </div>

                  <div className="mt-6 rounded-2xl border border-border bg-card p-5 dark:bg-[#171c22]">
                    <div className="mb-4 font-bold">Trip summary</div>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between"><span className="text-muted-foreground">Pickup</span><strong>{activeRide.ride.pickup}</strong></div>
                      <div className="flex items-center justify-between"><span className="text-muted-foreground">Destination</span><strong>{activeRide.ride.destination}</strong></div>
                      <div className="flex items-center justify-between"><span className="text-muted-foreground">Fare</span><strong>GHS {activeRide.ride.estimatedFareGhs.toFixed(2)}</strong></div>
                      <div className="flex items-center justify-between"><span className="text-muted-foreground">ETA</span><strong>{activeRide.ride.etaMinutes} min</strong></div>
                      <div className="flex items-center justify-between"><span className="text-muted-foreground">Payment</span><strong>{activeRide.payment.provider ?? activeRide.payment.method}</strong></div>
                      <div className="flex items-center justify-between"><span className="text-muted-foreground">Payment status</span><strong>{activeRide.payment.status ?? "Pending"}</strong></div>
                    </div>
                    {activeRide.payment.authorizationUrl ? (
                      <Button
                        variant="outline"
                        className="mt-4 w-full rounded-xl"
                        onClick={() => window.open(activeRide.payment.authorizationUrl ?? "", "_blank", "noopener,noreferrer")}
                      >
                        Continue MoMo approval
                      </Button>
                    ) : null}
                    {canCancelActiveRide ? (
                      <Button
                        variant="outline"
                        className="mt-3 w-full rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10"
                        onClick={cancelRide}
                        disabled={isCancellingRide}
                      >
                        {isCancellingRide ? "Cancelling..." : cancelRideLabel}
                      </Button>
                    ) : null}
                  </div>

                  <div className="mt-4 rounded-2xl border border-border bg-muted/40 p-4 dark:bg-white/5">
                    <div className="mb-1 font-bold">Safety coverage</div>
                    <div className="text-sm text-muted-foreground">
                      {activeRide.safety.trustedContactCount > 0
                        ? `${activeRide.safety.trustedContactCount} trusted contacts will receive trip updates.`
                        : "No trusted contacts are attached to this booking yet."}
                    </div>
                    {activeRide.safety.pickupGuidance ? (
                      <div className="mt-3 text-sm text-muted-foreground">
                        Pickup guidance: <strong className="text-foreground">{activeRide.safety.pickupGuidance}</strong>
                      </div>
                    ) : null}
                    {activeRide.ride.safetyPin ? (
                      <div className="mt-3 text-sm">
                        <span className="text-muted-foreground">Safety PIN </span>
                        <strong>{activeRide.ride.safetyPin}</strong>
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-4 rounded-2xl border border-border bg-muted/40 p-4 dark:bg-white/5">
                    <div className="mb-3 flex items-center gap-2 font-bold">
                      <ShieldAlert className="h-4 w-4 text-primary" />
                      Support
                    </div>
                    <Input
                      value={incidentDescription}
                      onChange={(event) => setIncidentDescription(event.target.value)}
                      placeholder="Describe an issue with this ride"
                      className="mb-3 h-11 border-transparent bg-background dark:bg-[#171c22]"
                    />
                    <Button variant="outline" className="w-full rounded-xl" disabled={isReporting || !incidentDescription.trim()} onClick={reportIncident}>
                      {isReporting ? "Sending..." : "Report issue"}
                    </Button>
                  </div>

              {feedback ? <div className="mt-4 rounded-2xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground dark:bg-white/5">{feedback}</div> : null}
              {routeNotice && !feedback ? <div className="mt-4 rounded-2xl border border-amber-300/40 bg-amber-500/10 p-4 text-sm font-medium text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">{routeNotice}</div> : null}

              <Button variant="outline" className="mt-auto h-12 rounded-xl" onClick={() => { setActiveRide(null); setDriverLocation(null); }}>
                Book another ride
                  </Button>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>

      <div className="block lg:hidden">
      <PassengerMobileExact
        step={mobileStep}
        drawerOpen={mobileDrawerOpen}
        onToggleDrawer={() => setMobileDrawerOpen((current) => !current)}
        mapNode={
          pickup || liveLocation ? (
            <PassengerLiveMap
              pickup={pickup}
              destination={destination}
              route={routePath}
              pickupCoords={pickupCoords}
              destinationCoords={destinationCoords}
              driverCoords={driverLocation ? { lat: driverLocation.lat, lng: driverLocation.lng } : null}
              currentCoords={liveLocation}
              fullScreen
            />
          ) : (
            <div className="absolute inset-0 opacity-20 dark:opacity-10 [background-image:linear-gradient(#000_1px,transparent_1px),linear-gradient(90deg,#000_1px,transparent_1px)] dark:[background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:40px_40px]" />
          )
        }
        showDropoffPin={mobileStep === "riding" && Boolean(destination)}
        pickup={pickup}
        destination={destination}
        onPickupChange={handlePickupInputChange}
        onDestinationChange={handleDestinationInputChange}
        pickupSuggestions={pickupSuggestions}
        destinationSuggestions={destinationSuggestions}
        onSelectPickupSuggestion={selectPickupSuggestion}
        onSelectDestinationSuggestion={selectDestinationSuggestion}
        isResolvingPickupSuggestion={isResolvingPickupSuggestion}
        isResolvingDestinationSuggestion={isResolvingDestinationSuggestion}
        onSwapRoute={swapRoute}
        quickDestinations={quickDestinations.map((location) => ({ id: location.id, label: location.label }))}
        onQuickDestination={chooseQuickDestination}
        onUseLivePickup={useLivePickup}
        selectedVehicle={
          selectedVehicle
            ? {
                label: selectedVehicle.label,
                seats: selectedVehicle.seats,
                etaMinutes: selectedVehicle.etaMinutes,
                priceGhs: selectedVehicle.priceGhs,
                isAvailable: selectedVehicle.isAvailable,
                availabilityLabel: selectedVehicle.availabilityLabel
              }
            : null
        }
        fareLabel={fareLabel}
        feedback={feedback}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={setPaymentMethod}
        canBook={canBook}
        onRequestRide={createRide}
        onCancelRide={canCancelActiveRide ? cancelRide : undefined}
        isCancelling={isCancellingRide}
        initials={initials}
        rideSummary={
          mobileStep === "riding"
            ? {
                etaMinutes: activeRide?.ride.etaMinutes ?? estimate?.durationMinutes ?? 5,
                destination: activeRide?.ride.destination ?? destination,
                paymentLabel: activeRide?.payment.provider ?? activeRide?.payment.method ?? "Mobile Money",
                safetyPin: activeRide?.ride.safetyPin ?? null,
                fareLabel: activeRide ? `GHS ${activeRide.ride.estimatedFareGhs.toFixed(2)}` : fareSummaryLabel,
                routeLabel: activeRide ? `${activeRide.ride.pickup} to ${activeRide.ride.destination}` : "Pending route",
                authorizationUrl: activeRide?.payment.authorizationUrl ?? null,
                routeNotice
              }
            : null
        }
      />
      </div>

      <div className="hidden min-h-screen bg-background text-foreground lg:hidden">
        <div className="relative h-[46vh] overflow-hidden bg-[#e5e3df] dark:bg-[#15191f]">
          {pickup || liveLocation ? (
            <PassengerLiveMap
              pickup={pickup}
              destination={destination}
              route={routePath}
              pickupCoords={pickupCoords}
              destinationCoords={destinationCoords}
              driverCoords={driverLocation ? { lat: driverLocation.lat, lng: driverLocation.lng } : null}
              currentCoords={liveLocation}
            />
          ) : (
            <div className="absolute inset-0 opacity-20 dark:opacity-10 [background-image:linear-gradient(#000_1px,transparent_1px),linear-gradient(90deg,#000_1px,transparent_1px)] dark:[background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:40px_40px]" />
          )}
          {mobileStep === "riding" && destination ? (
            <div className="absolute left-[34%] top-[18%] z-20 flex -translate-x-1/2 flex-col items-center">
              <div className="mb-2 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground shadow-lg">
                Dropoff
              </div>
              <div className="h-4 w-4 rounded-full border-2 border-white bg-primary shadow-md" />
            </div>
          ) : null}
          <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-background/85 to-transparent p-6 pt-12">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen((current) => !current)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-background shadow-md"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <ThemeToggle className="flex h-10 w-10 items-center justify-center rounded-full bg-background shadow-md" />
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-background shadow-md">
                <Bell className="h-5 w-5" />
                <div className="absolute right-2 top-2 h-2 w-2 rounded-full border border-background bg-primary" />
              </div>
            </div>
          </div>
        </div>

        <div
          className={`relative z-20 -mt-8 rounded-t-[2rem] bg-background shadow-[0_-10px_40px_rgba(0,0,0,0.1)] transition-transform duration-300 dark:bg-[#10151b] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.45)] ${
            mobileDrawerOpen ? "translate-y-0" : "translate-y-[60%]"
          }`}
        >
          <div className="w-full cursor-pointer pt-3 pb-2" onClick={() => setMobileDrawerOpen((current) => !current)}>
            <div className="mx-auto h-1.5 w-12 rounded-full bg-muted-foreground/20" />
          </div>

          <div className="px-6 pb-24">
            {mobileStep === "booking" ? (
              <>
                <div className="mb-4">
                  <MobileInstallPrompt />
                </div>
                <h2 className="mb-4 text-xl font-bold">Choose a ride</h2>
                <div className="relative mb-5 rounded-2xl bg-muted/50 p-4 dark:bg-white/5">
                  <div className="absolute bottom-[28px] left-6 top-[28px] w-0.5 bg-border" />
                  <div className="relative z-10 mb-4 flex items-center gap-3">
                    <div className="h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
                    <Input value={pickup} onChange={(event) => setPickup(event.target.value)} placeholder="Pickup location" className="h-12 border-border/50 bg-background text-sm font-medium dark:bg-[#171c22]" />
                  </div>
                  <div className="relative z-10 flex items-center gap-3">
                    <div className="h-2.5 w-2.5 rounded-full bg-foreground ring-4 ring-background" />
                    <Input value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="Where to?" className="h-12 border-border/50 bg-background text-sm font-medium dark:bg-[#171c22]" />
                  </div>
                  <button type="button" onClick={swapRoute} className="absolute right-6 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background shadow-sm dark:bg-[#171c22]">
                    <ArrowDownUp className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>

                <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
                  <button
                    type="button"
                    className="shrink-0 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary"
                    onClick={useLivePickup}
                  >
                    Current location
                  </button>
                  {quickDestinations.map((location) => (
                    <button
                      key={location.id}
                      type="button"
                      className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold ${
                        destination === location.label
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground dark:bg-[#171c22]"
                      }`}
                    onClick={() => chooseQuickDestination(location.id)}
                    >
                      {location.label}
                    </button>
                  ))}
                </div>

                <div className="mb-5 space-y-3">
                  <button
                    type="button"
                    className={`w-full rounded-2xl border-2 p-4 text-left ${
                      selectedVehicle?.isAvailable ? "border-primary bg-primary/5" : "border-border bg-muted/40 dark:bg-white/5"
                    }`}
                    onClick={() => selectedVehicle && setSelectedVehicleId(selectedVehicle.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted dark:bg-white/8">
                          <Car className="h-7 w-7 text-foreground" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-foreground">{selectedVehicle?.label ?? "Qiilu Car"}</h4>
                            <div className="flex items-center text-xs font-medium text-muted-foreground">
                              <User className="mr-1 h-3 w-3" /> {selectedVehicle?.seats ?? 4}
                            </div>
                          </div>
                          <div className="mt-0.5 text-sm text-muted-foreground">
                            {selectedVehicle
                              ? selectedVehicle.isAvailable
                                ? `${selectedVehicle.etaMinutes} min away`
                                : "No drivers online for this ride type"
                              : "Waiting for vehicle configuration"}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">{fareLabel}</div>
                        <div className={`mt-1 inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          selectedVehicle?.isAvailable
                            ? "bg-primary/10 text-primary"
                            : "bg-amber-500/10 text-amber-700 dark:text-amber-200"
                        }`}>
                          {selectedVehicle?.isAvailable ? selectedVehicle.availabilityLabel : "Unavailable"}
                        </div>
                      </div>
                    </div>
                  </button>
                </div>

                {selectedVehicle && !selectedVehicle.isAvailable ? (
                  <div className="mb-4 rounded-2xl border border-amber-300/40 bg-amber-500/10 p-4 text-sm font-medium text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                    No drivers are online for this option right now. Keep your route set and try again when a driver comes online.
                  </div>
                ) : null}

                {feedback ? <div className="mb-4 rounded-2xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground dark:bg-white/5">{feedback}</div> : null}

                <div className="flex gap-4">
                  <button type="button" className={`flex h-14 w-1/3 items-center justify-center gap-2 rounded-2xl border font-semibold ${paymentMethod === "MOMO" ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted/50 dark:bg-white/5"}`} onClick={() => setPaymentMethod("MOMO")}>
                    <CreditCard className="h-5 w-5" /> MoMo
                  </button>
                  <Button className="h-14 w-2/3 rounded-2xl text-lg font-bold" disabled={!canBook} onClick={createRide}>
                    Request {selectedVehicle?.label ?? "Qiilu Car"}
                  </Button>
                </div>
              </>
            ) : mobileStep === "searching" ? (
              <div className="flex min-h-[300px] flex-col items-center justify-center rounded-t-[2rem] pb-24 pt-6 text-center">
                <div className="mb-6 h-24 w-24 animate-spin rounded-full border-4 border-muted border-t-primary" />
                <h2 className="mb-2 text-xl font-bold">Connecting to nearby drivers...</h2>
                <p className="text-muted-foreground">Finding the closest Qiilu Car for you</p>
                <Button variant="outline" className="mt-6 rounded-2xl" onClick={cancelRide} disabled={isCancellingRide}>
                  {isCancellingRide ? "Cancelling..." : "Cancel request"}
                </Button>
              </div>
            ) : (
              <>
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-extrabold text-foreground">{activeRide?.ride.etaMinutes ?? estimate?.durationMinutes ?? 5} min</h2>
                    <p className="font-medium text-muted-foreground">{(activeRide?.ride.destination ?? destination) || "Destination in progress"}</p>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-secondary/10 px-3 py-1.5 font-bold text-secondary">
                    <CheckCircle2 className="h-4 w-4" /> On Trip
                  </div>
                </div>

                <div className="mb-6 rounded-2xl border border-border bg-muted/30 p-4 dark:bg-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary p-0.5">
                        <div className="flex h-full w-full items-center justify-center rounded-full border-2 border-background bg-card text-lg font-bold dark:bg-[#171c22]">
                          {initials}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-lg font-bold">Assigned driver</h4>
                        <div className="text-sm font-medium text-muted-foreground">
                          {activeRide?.payment.provider ?? activeRide?.payment.method ?? "Mobile Money"}
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg border border-border bg-background px-3 py-1 text-sm font-bold shadow-sm dark:bg-[#171c22]">
                      {activeRide?.ride.safetyPin ?? "Pending"}
                    </div>
                  </div>
                </div>

                <div className="mb-6 grid grid-cols-3 gap-3">
                  <button className="flex h-20 flex-col items-center justify-center rounded-2xl bg-muted/50 transition-colors hover:bg-muted dark:bg-white/5">
                    <MessageSquare className="mb-1 h-6 w-6 text-primary" />
                    <span className="text-xs font-semibold">Message</span>
                  </button>
                  <button className="flex h-20 flex-col items-center justify-center rounded-2xl bg-muted/50 transition-colors hover:bg-muted dark:bg-white/5">
                    <Navigation className="mb-1 h-6 w-6 text-primary" />
                    <span className="text-xs font-semibold">Share</span>
                  </button>
                  <button className="flex h-20 flex-col items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <ShieldAlert className="mb-1 h-6 w-6" />
                    <span className="text-xs font-semibold">SOS</span>
                  </button>
                </div>

                <div className="rounded-2xl border border-border bg-background p-4 dark:bg-[#171c22]">
                  <div className="mb-3 font-bold">Trip details</div>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between"><span className="text-muted-foreground">Fare</span><strong>GHS {activeRide?.ride.estimatedFareGhs.toFixed(2)}</strong></div>
                    <div className="flex items-center justify-between"><span className="text-muted-foreground">Payment</span><strong>{activeRide?.payment.provider ?? activeRide?.payment.method}</strong></div>
                    <div className="flex items-center justify-between"><span className="text-muted-foreground">Route</span><strong>{activeRide?.ride.pickup} to {activeRide?.ride.destination}</strong></div>
                  </div>
                  {activeRide?.payment.authorizationUrl ? (
                    <Button
                      variant="outline"
                      className="mt-4 h-11 w-full rounded-xl"
                      onClick={() => window.open(activeRide?.payment.authorizationUrl ?? "", "_blank", "noopener,noreferrer")}
                    >
                      Continue MoMo approval
                    </Button>
                  ) : null}
                  {canCancelActiveRide ? (
                    <Button
                      variant="outline"
                      className="mt-3 h-11 w-full rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10"
                      onClick={cancelRide}
                      disabled={isCancellingRide}
                    >
                      {isCancellingRide ? "Cancelling..." : cancelRideLabel}
                    </Button>
                  ) : null}
                </div>
              </>
            )}
          </div>

        </div>

        <div className="absolute bottom-0 left-0 z-40 flex h-20 w-full items-center justify-around border-t border-border bg-background px-4 pb-4 pt-2 pointer-events-auto">
          <Link href="/passenger" className="flex flex-col items-center text-primary">
            <Home className="mb-1 h-6 w-6" />
            <span className="text-[10px] font-semibold">Home</span>
          </Link>
          <Link href="/passenger/rides" className={`flex flex-col items-center ${mobileStep !== "booking" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            <Car className="mb-1 h-6 w-6" />
            <span className="text-[10px] font-semibold">Rides</span>
          </Link>
          <Link href="/passenger/messages" className="relative flex flex-col items-center text-muted-foreground hover:text-foreground">
            <MessageSquare className="mb-1 h-6 w-6" />
            <div className="absolute right-1 top-0 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary" />
            <span className="text-[10px] font-semibold">Messages</span>
          </Link>
          <Link href="/passenger/account" className="flex flex-col items-center text-muted-foreground hover:text-foreground">
            <User className="mb-1 h-6 w-6" />
            <span className="text-[10px] font-semibold">Account</span>
          </Link>
        </div>
      </div>
    </>
  );
}

function ToggleTile({
  label,
  active,
  onClick,
  compact = false
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold ${active ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground dark:bg-[#171c22]"}`}
    >
      <div className={compact ? "text-xs" : "text-sm"}>{label}</div>
      <div className="mt-1 text-[11px] uppercase tracking-wide">{active ? "Enabled" : "Disabled"}</div>
    </button>
  );
}
