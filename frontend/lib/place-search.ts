export type PlaceSuggestion = {
  id: string;
  name: string;
  fullAddress: string;
  lat?: number;
  lng?: number;
};

export type ResolvedPlace = {
  id: string;
  name: string;
  fullAddress: string;
  lat: number;
  lng: number;
};

const geoapifyApiKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY?.trim();
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

  if (query.length < 3) {
    return [] as PlaceSuggestion[];
  }

  if (geoapifyApiKey) {
    const endpoint = new URL("https://api.geoapify.com/v1/geocode/autocomplete");
    endpoint.searchParams.set("text", query);
    endpoint.searchParams.set("format", "json");
    endpoint.searchParams.set("limit", "5");
    endpoint.searchParams.set("lang", "en");
    endpoint.searchParams.set("filter", "countrycode:gh");
    endpoint.searchParams.set("apiKey", geoapifyApiKey);

    if (input.proximity) {
      endpoint.searchParams.set("bias", `proximity:${input.proximity.lng},${input.proximity.lat}`);
    } else {
      endpoint.searchParams.set("bias", "proximity:-0.187,5.6037");
    }

    const response = await fetch(endpoint.toString());

    if (!response.ok) {
      throw new Error(`Geoapify suggestions failed with ${response.status}`);
    }

    const payload = (await response.json()) as {
      results?: Array<{
        place_id?: string;
        formatted?: string;
        address_line1?: string;
        address_line2?: string;
        lat?: number;
        lon?: number;
      }>;
    };

    return (payload.results ?? [])
      .filter(
        (item): item is NonNullable<typeof item> & { place_id: string; lat: number; lon: number } =>
          Boolean(item.place_id) && typeof item.lat === "number" && typeof item.lon === "number"
      )
      .map((item) => ({
        id: item.place_id,
        name: item.address_line1?.trim() || item.formatted?.trim() || query,
        fullAddress:
          item.formatted?.trim() ||
          [item.address_line1?.trim(), item.address_line2?.trim()].filter(Boolean).join(", ") ||
          query,
        lat: item.lat,
        lng: item.lon
      }));
  }

  if (!mapboxPublicToken) {
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
  if (typeof input.suggestion.lat === "number" && typeof input.suggestion.lng === "number") {
    return {
      id: input.suggestion.id,
      name: input.suggestion.name,
      fullAddress: input.suggestion.fullAddress,
      lat: input.suggestion.lat,
      lng: input.suggestion.lng
    } satisfies ResolvedPlace;
  }

  if (!mapboxPublicToken) {
    throw new Error("No place search provider is configured");
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
