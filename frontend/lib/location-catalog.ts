export type KnownLocation = {
  label: string;
  lat: number;
  lng: number;
};

export const locationCatalog: KnownLocation[] = [
  { label: "Current location, East Legon", lat: 5.6382, lng: -0.1537 },
  { label: "Airport City", lat: 5.6052, lng: -0.1714 },
  { label: "Osu Oxford Street", lat: 5.5601, lng: -0.1847 },
  { label: "Accra Mall", lat: 5.6394, lng: -0.1527 },
  { label: "East Legon Hills", lat: 5.6912, lng: -0.1044 }
];

export function resolveLocation(query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return locationCatalog[0];
  }

  return (
    locationCatalog.find((location) => normalized.includes(location.label.toLowerCase())) ??
    locationCatalog.find((location) => location.label.toLowerCase().includes(normalized)) ??
    locationCatalog[0]
  );
}
