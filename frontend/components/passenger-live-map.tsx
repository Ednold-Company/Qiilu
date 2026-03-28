"use client";

import { useMemo } from "react";
import { CircleMarker, MapContainer, Marker, Polyline, TileLayer, Tooltip } from "react-leaflet";
import L from "leaflet";
import { resolveLocation } from "@/lib/location-catalog";

type PassengerLiveMapProps = {
  pickup: string;
  destination: string;
  route?: [number, number][];
  pickupCoords?: { lat: number; lng: number } | null;
  destinationCoords?: { lat: number; lng: number } | null;
  driverCoords?: { lat: number; lng: number } | null;
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

export default function PassengerLiveMap({
  pickup,
  destination,
  route,
  pickupCoords,
  destinationCoords,
  driverCoords
}: PassengerLiveMapProps) {
  const pickupLocation = useMemo(
    () => pickupCoords ?? resolveLocation(pickup),
    [pickup, pickupCoords]
  );
  const destinationLocation = useMemo(
    () => destinationCoords ?? resolveLocation(destination),
    [destination, destinationCoords]
  );

  const center: [number, number] = [
    (pickupLocation.lat + destinationLocation.lat) / 2,
    (pickupLocation.lng + destinationLocation.lng) / 2
  ];

  const path = route ?? [
    [pickupLocation.lat, pickupLocation.lng],
    [destinationLocation.lat, destinationLocation.lng]
  ];

  return (
    <div className="real-map-shell">
      <MapContainer center={center} zoom={13} scrollWheelZoom className="real-map-canvas">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline positions={path} pathOptions={{ color: "#111315", weight: 5, opacity: 0.75 }} />
        <CircleMarker
          center={[pickupLocation.lat, pickupLocation.lng]}
          radius={22}
          pathOptions={{ color: "#21c45d", fillColor: "#21c45d", fillOpacity: 0.12 }}
        />
        <Marker position={[pickupLocation.lat, pickupLocation.lng]} icon={pickupIcon}>
          <Tooltip direction="top" offset={[0, -10]} permanent>
            Pickup
          </Tooltip>
        </Marker>
        <Marker position={[destinationLocation.lat, destinationLocation.lng]} icon={destinationIcon}>
          <Tooltip direction="top" offset={[0, -10]} permanent>
            Destination
          </Tooltip>
        </Marker>
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
