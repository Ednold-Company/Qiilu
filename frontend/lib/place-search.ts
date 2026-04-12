export type PlaceSuggestion = {
  id: string;
  name: string;
  fullAddress: string;
};

export type ResolvedPlace = {
  id: string;
  name: string;
  fullAddress: string;
  lat: number;
  lng: number;
};

const mapboxPublicToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim();

function getSearchSessionToken() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createPlaceSearchSession() {
  return getSearchSessionToken();
}

export async function suggestPlaces(input: {
  query: string;
  sessionToken: string;
  proximity?: { lat: number; lng: number } | null;
}) {
  const query = input.query.trim();

  if (!mapboxPublicToken || query.length < 3) {
    return [] as PlaceSuggestion[];
  }

  const endpoint = new URL("https://api.mapbox.com/search/searchbox/v1/suggest");
  endpoint.searchParams.set("q", query);
  endpoint.searchParams.set("access_token", mapboxPublicToken);
  endpoint.searchParams.set("session_token", input.sessionToken);
  endpoint.searchParams.set("language", "en");
  endpoint.searchParams.set("limit", "5");
  endpoint.searchParams.set("country", "gh");

  if (input.proximity) {
    endpoint.searchParams.set("proximity", `${input.proximity.lng},${input.proximity.lat}`);
  }

  const response = await fetch(endpoint.toString());

  if (!response.ok) {
    throw new Error(`Search suggestions failed with ${response.status}`);
  }

  const payload = (await response.json()) as {
    suggestions?: Array<{
      mapbox_id?: string;
      name?: string;
      full_address?: string;
      place_formatted?: string;
    }>;
  };

  return (payload.suggestions ?? [])
    .filter((item): item is Required<Pick<typeof item, "mapbox_id">> & typeof item => Boolean(item.mapbox_id))
    .map((item) => ({
      id: item.mapbox_id,
      name: item.name?.trim() || item.place_formatted?.trim() || item.full_address?.trim() || query,
      fullAddress: item.full_address?.trim() || item.place_formatted?.trim() || item.name?.trim() || query
    }));
}

export async function retrievePlace(input: {
  suggestion: PlaceSuggestion;
  sessionToken: string;
}) {
  if (!mapboxPublicToken) {
    throw new Error("Mapbox search is not configured");
  }

  const endpoint = new URL(`https://api.mapbox.com/search/searchbox/v1/retrieve/${encodeURIComponent(input.suggestion.id)}`);
  endpoint.searchParams.set("access_token", mapboxPublicToken);
  endpoint.searchParams.set("session_token", input.sessionToken);
  endpoint.searchParams.set("language", "en");

  const response = await fetch(endpoint.toString());

  if (!response.ok) {
    throw new Error(`Place lookup failed with ${response.status}`);
  }

  const payload = (await response.json()) as {
    features?: Array<{
      geometry?: { coordinates?: [number, number] };
      properties?: {
        name?: string;
        full_address?: string;
      };
    }>;
  };

  const feature = payload.features?.[0];
  const coordinates = feature?.geometry?.coordinates;

  if (!coordinates) {
    throw new Error("Selected place has no coordinates");
  }

  return {
    id: input.suggestion.id,
    name: feature?.properties?.name?.trim() || input.suggestion.name,
    fullAddress: feature?.properties?.full_address?.trim() || input.suggestion.fullAddress,
    lat: coordinates[1],
    lng: coordinates[0]
  } satisfies ResolvedPlace;
}
