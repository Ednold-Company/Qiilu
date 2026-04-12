import { locationCatalog, resolveKnownLocation } from "./location-catalog.js";

export type RoutePoint = {
  lat: number;
  lng: number;
  label: string;
};

export type RouteEstimate = {
  provider: "mapbox" | "osrm" | "catalog";
  pickup: RoutePoint;
  destination: RoutePoint;
  distanceKm: number;
  durationMinutes: number;
  fareGhs: number;
  route: [number, number][];
};

type OptionalRoutePoint = {
  lat: number;
  lng: number;
  label?: string;
};

const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN;

function round(value: number, digits = 2) {
  return Number(value.toFixed(digits));
}

function haversineDistanceKm(start: RoutePoint, end: RoutePoint) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(end.lat - start.lat);
  const dLng = toRadians(end.lng - start.lng);
  const lat1 = toRadians(start.lat);
  const lat2 = toRadians(end.lat);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function calculateFare(distanceKm: number, durationMinutes: number) {
  const baseFare = 8.5;
  const distanceComponent = distanceKm * 2.65;
  const timeComponent = durationMinutes * 0.5;
  const serviceFee = 3;
  const minimumFare = 18;

  return round(Math.max(minimumFare, baseFare + distanceComponent + timeComponent + serviceFee));
}

async function geocodeWithMapbox(query: string) {
  if (!mapboxToken) {
    return null;
  }

  const endpoint = new URL(
    `https://api.mapbox.com/geocoding/v6/mapbox.places/${encodeURIComponent(query)}.json`
  );
  endpoint.searchParams.set("access_token", mapboxToken);
  endpoint.searchParams.set("limit", "1");
  endpoint.searchParams.set("proximity", "-0.187,5.6037");
  endpoint.searchParams.set("country", "gh");

  const response = await fetch(endpoint, {
    headers: {
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Mapbox geocoding failed with ${response.status}`);
  }

  const payload = (await response.json()) as {
    features?: Array<{
      properties?: { full_address?: string; name?: string };
      geometry?: { coordinates?: [number, number] };
    }>;
  };

  const feature = payload.features?.[0];
  const coordinates = feature?.geometry?.coordinates;

  if (!feature || !coordinates) {
    return null;
  }

  return {
    lat: coordinates[1],
    lng: coordinates[0],
    label: feature.properties?.full_address ?? feature.properties?.name ?? query
  } satisfies RoutePoint;
}

async function geocodeWithNominatim(query: string) {
  const endpoint = new URL("https://nominatim.openstreetmap.org/search");
  endpoint.searchParams.set("format", "jsonv2");
  endpoint.searchParams.set("limit", "1");
  endpoint.searchParams.set("countrycodes", "gh");
  endpoint.searchParams.set("q", query);

  const response = await fetch(endpoint, {
    headers: {
      "User-Agent": "Qiilu/0.1 route-estimator"
    }
  });

  if (!response.ok) {
    throw new Error(`Nominatim geocoding failed with ${response.status}`);
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
  } satisfies RoutePoint;
}

async function geocodeLocation(query: string) {
  const known = resolveKnownLocation(query);

  if (known) {
    return { ...known } satisfies RoutePoint;
  }

  if (mapboxToken) {
    const mapboxResult = await geocodeWithMapbox(query);

    if (mapboxResult) {
      return mapboxResult;
    }
  }

  const nominatimResult = await geocodeWithNominatim(query);

  if (nominatimResult) {
    return nominatimResult;
  }

  throw new Error("Location could not be geocoded");
}

async function resolveRoutePoint(query: string, fallbackPoint?: OptionalRoutePoint | null) {
  if (fallbackPoint) {
    return {
      lat: fallbackPoint.lat,
      lng: fallbackPoint.lng,
      label: fallbackPoint.label?.trim() || query || "Current location"
    } satisfies RoutePoint;
  }

  return geocodeLocation(query);
}

async function routeWithMapbox(start: RoutePoint, end: RoutePoint) {
  if (!mapboxToken) {
    return null;
  }

  const endpoint = new URL(
    `https://api.mapbox.com/directions/v5/mapbox/driving/${start.lng},${start.lat};${end.lng},${end.lat}`
  );
  endpoint.searchParams.set("access_token", mapboxToken);
  endpoint.searchParams.set("overview", "full");
  endpoint.searchParams.set("geometries", "geojson");
  endpoint.searchParams.set("alternatives", "false");
  endpoint.searchParams.set("steps", "false");

  const response = await fetch(endpoint, {
    headers: {
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Mapbox directions failed with ${response.status}`);
  }

  const payload = (await response.json()) as {
    routes?: Array<{
      distance: number;
      duration: number;
      geometry?: { coordinates?: Array<[number, number]> };
    }>;
  };

  const route = payload.routes?.[0];

  if (!route?.geometry?.coordinates?.length) {
    return null;
  }

  const distanceKm = round(route.distance / 1000);
  const durationMinutes = Math.max(1, Math.round(route.duration / 60));

  return {
    provider: "mapbox" as const,
    distanceKm,
    durationMinutes,
    fareGhs: calculateFare(distanceKm, durationMinutes),
    route: route.geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number])
  };
}

async function routeWithOsrm(start: RoutePoint, end: RoutePoint) {
  const endpoint = new URL(
    `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}`
  );
  endpoint.searchParams.set("overview", "full");
  endpoint.searchParams.set("geometries", "geojson");

  const response = await fetch(endpoint);

  if (!response.ok) {
    throw new Error(`OSRM directions failed with ${response.status}`);
  }

  const payload = (await response.json()) as {
    routes?: Array<{
      distance: number;
      duration: number;
      geometry?: { coordinates?: Array<[number, number]> };
    }>;
  };

  const route = payload.routes?.[0];

  if (!route?.geometry?.coordinates?.length) {
    return null;
  }

  const distanceKm = round(route.distance / 1000);
  const durationMinutes = Math.max(1, Math.round(route.duration / 60));

  return {
    provider: "osrm" as const,
    distanceKm,
    durationMinutes,
    fareGhs: calculateFare(distanceKm, durationMinutes),
    route: route.geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number])
  };
}

function routeFromCatalog(start: RoutePoint, end: RoutePoint) {
  const straightLineKm = haversineDistanceKm(start, end);
  const networkDistanceKm = round(Math.max(1.2, straightLineKm * 1.28));
  const durationMinutes = Math.max(4, Math.round(networkDistanceKm * 3.6));

  return {
    provider: "catalog" as const,
    distanceKm: networkDistanceKm,
    durationMinutes,
    fareGhs: calculateFare(networkDistanceKm, durationMinutes),
    route: [
      [start.lat, start.lng] as [number, number],
      [end.lat, end.lng] as [number, number]
    ]
  };
}

export async function estimateRoute(
  pickupQuery: string,
  destinationQuery: string,
  options?: {
    pickupPoint?: OptionalRoutePoint | null;
    destinationPoint?: OptionalRoutePoint | null;
  }
): Promise<RouteEstimate> {
  const pickup = await resolveRoutePoint(pickupQuery, options?.pickupPoint);
  const destination = await resolveRoutePoint(destinationQuery, options?.destinationPoint);

  try {
    const routed = mapboxToken
      ? await routeWithMapbox(pickup, destination)
      : await routeWithOsrm(pickup, destination);

    if (routed) {
      return {
        ...routed,
        pickup,
        destination
      };
    }
  } catch {
    const knownPickup = resolveKnownLocation(pickup.label);
    const knownDestination = resolveKnownLocation(destination.label);

    if (!knownPickup || !knownDestination) {
      throw new Error("Live routing is unavailable for this trip right now");
    }
  }

  return {
    ...routeFromCatalog(pickup, destination),
    pickup,
    destination
  };
}

export function getRoutingStatus() {
  return {
    primaryProvider: mapboxToken ? "mapbox" : "osrm",
    mapboxConfigured: Boolean(mapboxToken),
    supportedCatalogLocations: locationCatalog.map((location) => location.label)
  };
}
