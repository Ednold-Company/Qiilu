"use client";

import { useEffect, useMemo } from "react";
import { CircleMarker, MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import { resolveLocation } from "@/lib/location-catalog";

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
  const pickupLocation = useMemo(() => {
    if (pickupCoords) {
      return {
        lat: pickupCoords.lat,
        lng: pickupCoords.lng,
        label: pickup?.trim() || "Pickup"
      };
    }

    if (pickup?.trim()) {
      return resolveLocation(pickup);
    }

    if (currentCoords) {
      return {
        lat: currentCoords.lat,
        lng: currentCoords.lng,
        label: "Current location"
      };
    }

    return resolveLocation("");
  }, [currentCoords, pickup, pickupCoords]);
  const destinationLocation = useMemo(() => {
    if (destinationCoords) {
      return {
        lat: destinationCoords.lat,
        lng: destinationCoords.lng,
        label: destination?.trim() || "Destination"
      };
    }

    if (destination?.trim()) {
      return resolveLocation(destination);
    }

    return null;
  }, [destination, destinationCoords]);

  const center: [number, number] = destinationLocation
    ? [
        (pickupLocation.lat + destinationLocation.lat) / 2,
        (pickupLocation.lng + destinationLocation.lng) / 2
      ]
    : [pickupLocation.lat, pickupLocation.lng];

  const zoom = destinationLocation ? 13 : 15;

  const path = destinationLocation
    ? route ?? [
        [pickupLocation.lat, pickupLocation.lng],
        [destinationLocation.lat, destinationLocation.lng]
      ]
    : null;

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
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
