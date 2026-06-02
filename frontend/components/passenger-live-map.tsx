"use client";

import { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import { getDefaultLocation, resolveLocation } from "@/lib/location-catalog";

type PassengerLiveMapProps = {
  pickup?: string;
  destination?: string;
  route?: [number, number][];
  pickupCoords?: { lat: number; lng: number } | null;
  destinationCoords?: { lat: number; lng: number } | null;
  driverCoords?: { lat: number; lng: number } | null;
  currentCoords?: { lat: number; lng: number } | null;
  fullScreen?: boolean;
  backgroundMode?: boolean;
};

const pickupIcon = L.divIcon({
  className: "leaflet-custom-icon",
  html: '<div class="leaflet-marker pickup"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const destinationIcon = L.divIcon({
  className: "leaflet-custom-icon",
  html: '<div class="leaflet-marker destination"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const driverIcon = L.divIcon({
  className: "leaflet-custom-icon",
  html: '<div class="leaflet-marker driver"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const passengerIcon = L.divIcon({
  className: "leaflet-custom-icon",
  html: '<div class="leaflet-marker passenger"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const mapboxPublicToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim();
const mapboxStyle = process.env.NEXT_PUBLIC_MAPBOX_STYLE_ID?.trim() || "mapbox/streets-v12";
const defaultMapboxStyle = "mapbox/streets-v12";
const allowCustomMapboxStyle = (process.env.NEXT_PUBLIC_MAPBOX_USE_CUSTOM_STYLE ?? "").trim().toLowerCase() === "true";

async function geocodePreviewLocation(query: string) {
  const trimmed = query.trim();

  if (!trimmed) {
    return null;
  }

  if (mapboxPublicToken) {
    const endpoint = new URL(
      `https://api.mapbox.com/geocoding/v6/mapbox.places/${encodeURIComponent(trimmed)}.json`
    );
    endpoint.searchParams.set("access_token", mapboxPublicToken);
    endpoint.searchParams.set("limit", "1");
    endpoint.searchParams.set("proximity", "-0.187,5.6037");
    endpoint.searchParams.set("country", "gh");

    const response = await fetch(endpoint.toString());

    if (response.ok) {
      const payload = (await response.json()) as {
        features?: Array<{
          properties?: { full_address?: string; name?: string };
          geometry?: { coordinates?: [number, number] };
        }>;
      };
      const feature = payload.features?.[0];
      const coordinates = feature?.geometry?.coordinates;

      if (coordinates) {
        return {
          lat: coordinates[1],
          lng: coordinates[0],
          label: feature?.properties?.full_address ?? feature?.properties?.name ?? trimmed
        };
      }
    }
  }

  const endpoint = new URL("https://nominatim.openstreetmap.org/search");
  endpoint.searchParams.set("format", "jsonv2");
  endpoint.searchParams.set("limit", "1");
  endpoint.searchParams.set("countrycodes", "gh");
  endpoint.searchParams.set("q", trimmed);

  const response = await fetch(endpoint.toString(), {
    headers: {
      "User-Agent": "Qiilu/0.1 map-preview"
    }
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as Array<{
    lat: string;
    lon: string;
    display_name: string;
  }>;

  const firstResult = payload[0];

  if (!firstResult) {
    return null;
  }

  return {
    lat: Number(firstResult.lat),
    lng: Number(firstResult.lon),
    label: firstResult.display_name
  };
}

async function fetchVisualRoadRoute(start: { lat: number; lng: number }, end: { lat: number; lng: number }) {
  if (mapboxPublicToken) {
    const endpoint = new URL(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${start.lng},${start.lat};${end.lng},${end.lat}`
    );
    endpoint.searchParams.set("access_token", mapboxPublicToken);
    endpoint.searchParams.set("overview", "full");
    endpoint.searchParams.set("geometries", "geojson");
    endpoint.searchParams.set("alternatives", "false");
    endpoint.searchParams.set("steps", "false");

    const response = await fetch(endpoint.toString());

    if (response.ok) {
      const payload = (await response.json()) as {
        routes?: Array<{
          geometry?: { coordinates?: Array<[number, number]> };
        }>;
      };
      const coordinates = payload.routes?.[0]?.geometry?.coordinates;

      if (coordinates && coordinates.length > 2) {
        return coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
      }
    }
  }

  const endpoint = new URL(
    `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}`
  );
  endpoint.searchParams.set("overview", "full");
  endpoint.searchParams.set("geometries", "geojson");

  const response = await fetch(endpoint.toString());

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    routes?: Array<{
      geometry?: { coordinates?: Array<[number, number]> };
    }>;
  };
  const coordinates = payload.routes?.[0]?.geometry?.coordinates;

  return coordinates && coordinates.length > 2
    ? coordinates.map(([lng, lat]) => [lat, lng] as [number, number])
    : null;
}

function distanceMeters(start: { lat: number; lng: number }, end: { lat: number; lng: number }) {
  const radiusMeters = 6371000;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const dLat = toRadians(end.lat - start.lat);
  const dLng = toRadians(end.lng - start.lng);
  const lat1 = toRadians(start.lat);
  const lat2 = toRadians(end.lat);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return radiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getTileConfig(styleId?: string | null) {
  if (mapboxPublicToken && styleId) {
    return {
      attribution:
        '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      isMapbox: true,
      url: `https://api.mapbox.com/styles/v1/${styleId}/tiles/512/{z}/{x}/{y}@2x?access_token=${mapboxPublicToken}`
    };
  }

  return {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    isMapbox: false,
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  };
}

function MapSizeSync({
  center,
  zoom
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();
  const [hasManualInteraction, setHasManualInteraction] = useState(false);

  useEffect(() => {
    const markManualInteraction = () => {
      setHasManualInteraction(true);
    };

    map.on("dragstart zoomstart", markManualInteraction);

    return () => {
      map.off("dragstart zoomstart", markManualInteraction);
    };
  }, [map]);

  useEffect(() => {
    const syncSize = () => {
      map.invalidateSize();
    };

    const frame = window.requestAnimationFrame(syncSize);
    const timeout = window.setTimeout(syncSize, 180);
    const container = map.getContainer();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(syncSize) : null;

    if (observer) {
      observer.observe(container);
    }

    window.addEventListener("resize", syncSize);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
      observer?.disconnect();
      window.removeEventListener("resize", syncSize);
    };
  }, [map]);

  useEffect(() => {
    if (!hasManualInteraction) {
      map.setView(center, zoom, { animate: false });
    }
  }, [center, hasManualInteraction, map, zoom]);

  return null;
}

export default function PassengerLiveMap({
  pickup,
  destination,
  route,
  pickupCoords,
  destinationCoords,
  driverCoords,
  currentCoords,
  fullScreen = false,
  backgroundMode = false
}: PassengerLiveMapProps) {
  const [tileMode, setTileMode] = useState<"custom" | "defaultMapbox" | "osm">(
    mapboxPublicToken ? (allowCustomMapboxStyle ? "custom" : "defaultMapbox") : "osm"
  );
  const [tileWarning, setTileWarning] = useState<string | null>(null);
  const tileStyleId =
    tileMode === "custom"
      ? mapboxStyle
      : tileMode === "defaultMapbox"
        ? defaultMapboxStyle
        : null;
  const tileConfig = useMemo(() => getTileConfig(tileStyleId), [tileStyleId]);
  const fallbackLocation = useMemo(() => getDefaultLocation(), []);
  const [previewPickupLocation, setPreviewPickupLocation] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [previewDestinationLocation, setPreviewDestinationLocation] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [visualRoadRoute, setVisualRoadRoute] = useState<[number, number][] | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!pickup?.trim() || pickupCoords || currentCoords) {
      setPreviewPickupLocation(null);
      return () => {
        cancelled = true;
      };
    }

    const knownPickup = resolveLocation(pickup);

    if (knownPickup) {
      setPreviewPickupLocation(null);
      return () => {
        cancelled = true;
      };
    }

    geocodePreviewLocation(pickup)
      .then((location) => {
        if (!cancelled) {
          setPreviewPickupLocation(location);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPreviewPickupLocation(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentCoords, pickup, pickupCoords]);

  useEffect(() => {
    let cancelled = false;

    if (!destination?.trim() || destinationCoords) {
      setPreviewDestinationLocation(null);
      return () => {
        cancelled = true;
      };
    }

    const knownDestination = resolveLocation(destination);

    if (knownDestination) {
      setPreviewDestinationLocation(null);
      return () => {
        cancelled = true;
      };
    }

    geocodePreviewLocation(destination)
      .then((location) => {
        if (!cancelled) {
          setPreviewDestinationLocation(location);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPreviewDestinationLocation(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [destination, destinationCoords]);

  const pickupLocation = useMemo(() => {
    if (pickupCoords) {
      return {
        lat: pickupCoords.lat,
        lng: pickupCoords.lng,
        label: pickup?.trim() || "Pickup"
      };
    }

    if (pickup?.trim()) {
      const knownPickup = resolveLocation(pickup);

      if (knownPickup) {
        return knownPickup;
      }
    }

    if (previewPickupLocation) {
      return previewPickupLocation;
    }

    if (currentCoords) {
      return {
        lat: currentCoords.lat,
        lng: currentCoords.lng,
        label: "Current location"
      };
    }

    return fallbackLocation;
  }, [currentCoords, fallbackLocation, pickup, pickupCoords, previewPickupLocation]);
  const destinationLocation = useMemo(() => {
    if (destinationCoords) {
      return {
        lat: destinationCoords.lat,
        lng: destinationCoords.lng,
        label: destination?.trim() || "Destination"
      };
    }

    if (destination?.trim()) {
      return resolveLocation(destination) ?? previewDestinationLocation;
    }

    return null;
  }, [destination, destinationCoords, previewDestinationLocation]);

  const center: [number, number] = destinationLocation
    ? [
        (pickupLocation.lat + destinationLocation.lat) / 2,
        (pickupLocation.lng + destinationLocation.lng) / 2
      ]
    : [pickupLocation.lat, pickupLocation.lng];

  const zoom = destinationLocation ? 13 : 15;

  const isPickupAtCurrentLocation = Boolean(
    currentCoords &&
      pickupLocation &&
      (pickup?.trim().toLowerCase() === "current location" ||
        distanceMeters(currentCoords, pickupLocation) < 35)
  );
  const shouldShowPickupMarker = Boolean(pickup?.trim() && !isPickupAtCurrentLocation);
  const path = route && route.length > 2 ? route : visualRoadRoute;

  useEffect(() => {
    let cancelled = false;

    if ((route && route.length > 2) || !destinationLocation) {
      setVisualRoadRoute(null);
      return () => {
        cancelled = true;
      };
    }

    fetchVisualRoadRoute(pickupLocation, destinationLocation)
      .then((nextRoute) => {
        if (!cancelled) {
          setVisualRoadRoute(nextRoute);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setVisualRoadRoute(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [destinationLocation, pickupLocation, route]);

  useEffect(() => {
    setTileMode(mapboxPublicToken ? (allowCustomMapboxStyle ? "custom" : "defaultMapbox") : "osm");
    setTileWarning(null);
  }, []);

  const handleTileError = () => {
    if (tileMode === "custom") {
      setTileMode("defaultMapbox");
      setTileWarning("Your custom Mapbox style could not be loaded, so Qiilu switched to the default streets map.");
      return;
    }

    if (tileMode === "defaultMapbox") {
      setTileMode("osm");
      setTileWarning("Mapbox tiles could not be loaded right now, so Qiilu switched to the OpenStreetMap fallback.");
    }
  };

  return (
    <div
      className={`${fullScreen ? "real-map-shell real-map-shell-full" : "real-map-shell"}${
        backgroundMode ? " real-map-shell-background" : ""
      }`}
      style={fullScreen ? { position: "absolute", inset: 0, width: "100%", height: "100%" } : undefined}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        zoomControl={!backgroundMode}
        dragging
        doubleClickZoom
        touchZoom
        boxZoom
        keyboard
        className={fullScreen ? "real-map-canvas real-map-canvas-full" : "real-map-canvas"}
        style={fullScreen ? { width: "100%", height: "100%" } : undefined}
      >
        <MapSizeSync center={center} zoom={zoom} />
        <TileLayer
          attribution={tileConfig.attribution}
          url={tileConfig.url}
          tileSize={tileConfig.isMapbox ? 512 : 256}
          zoomOffset={tileConfig.isMapbox ? -1 : 0}
          eventHandlers={{
            tileerror: handleTileError
          }}
        />
        {path ? (
          <>
            <Polyline positions={path} pathOptions={{ color: "#ffffff", weight: 9, opacity: 0.85 }} />
            <Polyline positions={path} pathOptions={{ color: "#f97316", weight: 5, opacity: 0.95 }} />
          </>
        ) : null}
        <CircleMarker
          center={[currentCoords?.lat ?? pickupLocation.lat, currentCoords?.lng ?? pickupLocation.lng]}
          radius={22}
          pathOptions={{ color: "#21c45d", fillColor: "#21c45d", fillOpacity: 0.12 }}
        />
        <Marker position={[currentCoords?.lat ?? pickupLocation.lat, currentCoords?.lng ?? pickupLocation.lng]} icon={passengerIcon}>
          <Tooltip direction="top" offset={[0, -10]} permanent>
            You
          </Tooltip>
        </Marker>
        {shouldShowPickupMarker ? (
          <Marker position={[pickupLocation.lat, pickupLocation.lng]} icon={pickupIcon}>
          <Tooltip direction="top" offset={[0, -10]} permanent>
            Pickup
          </Tooltip>
        </Marker>
        ) : null}
        {destinationLocation ? (
          <Marker position={[destinationLocation.lat, destinationLocation.lng]} icon={destinationIcon}>
          <Tooltip direction="top" offset={[0, -10]} permanent>
            Destination
          </Tooltip>
        </Marker>
        ) : null}
        {driverCoords ? (
          <Marker position={[driverCoords.lat, driverCoords.lng]} icon={driverIcon}>
            <Tooltip direction="top" offset={[0, -10]} permanent>
              Driver
            </Tooltip>
          </Marker>
        ) : null}
      </MapContainer>
      {tileWarning ? (
        <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-[500] rounded-xl border border-amber-300/40 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-700 shadow-sm dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          {tileWarning}
        </div>
      ) : null}
      {fullScreen ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[420] h-28 bg-gradient-to-t from-background/72 via-background/18 to-transparent dark:from-[#10151b]/78 dark:via-[#10151b]/24 dark:to-transparent" />
      ) : null}
    </div>
  );
}
