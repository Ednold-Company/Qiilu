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

function getTileConfig() {
  if (mapboxPublicToken) {
    return {
      attribution:
        '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      url: `https://api.mapbox.com/styles/v1/${mapboxStyle}/tiles/512/{z}/{x}/{y}@2x?access_token=${mapboxPublicToken}`
    };
  }

  return {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
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

  useEffect(() => {
    const sync = () => {
      map.invalidateSize();
      map.setView(center, zoom, { animate: false });
    };

    const frame = window.requestAnimationFrame(sync);
    const timeout = window.setTimeout(sync, 180);
    const container = map.getContainer();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(sync) : null;

    if (observer) {
      observer.observe(container);
    }

    window.addEventListener("resize", sync);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
      observer?.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, [center, map, zoom]);

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
  const tileConfig = useMemo(() => getTileConfig(), []);
  const fallbackLocation = useMemo(() => getDefaultLocation(), []);
  const [previewPickupLocation, setPreviewPickupLocation] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [previewDestinationLocation, setPreviewDestinationLocation] = useState<{ lat: number; lng: number; label: string } | null>(null);

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

  const path = route && route.length > 2 ? route : null;

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
          tileSize={mapboxPublicToken ? 512 : 256}
          zoomOffset={mapboxPublicToken ? -1 : 0}
        />
        {path ? <Polyline positions={path} pathOptions={{ color: "#111315", weight: 5, opacity: 0.75 }} /> : null}
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
        {pickup?.trim() ? (
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
    </div>
  );
}
