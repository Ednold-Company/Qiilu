export type SavedPlace = {
  id: string;
  label: string;
  kind: "pickup" | "destination";
  createdAt: string;
};

const storageKey = "qiilu-passenger-saved-places";

function isSavedPlace(value: unknown): value is SavedPlace {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.label === "string" &&
    (candidate.kind === "pickup" || candidate.kind === "destination") &&
    typeof candidate.createdAt === "string"
  );
}

export function getSavedPlaces() {
  if (typeof window === "undefined") {
    return [] as SavedPlace[];
  }

  const raw = window.localStorage.getItem(storageKey);

  if (!raw) {
    return [] as SavedPlace[];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isSavedPlace);
  } catch {
    return [];
  }
}

function persistSavedPlaces(savedPlaces: SavedPlace[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(savedPlaces));
}

export function savePlace(label: string, kind: SavedPlace["kind"]) {
  const nextLabel = label.trim();

  if (!nextLabel) {
    return getSavedPlaces();
  }

  const existing = getSavedPlaces();
  const withoutDuplicate = existing.filter(
    (item) => !(item.label.toLowerCase() === nextLabel.toLowerCase() && item.kind === kind)
  );

  const next = [
    {
      id: `${kind}-${nextLabel.toLowerCase().replace(/\s+/g, "-")}`,
      label: nextLabel,
      kind,
      createdAt: new Date().toISOString()
    },
    ...withoutDuplicate
  ].slice(0, 12);

  persistSavedPlaces(next);
  return next;
}

export function removeSavedPlace(id: string) {
  const next = getSavedPlaces().filter((item) => item.id !== id);
  persistSavedPlaces(next);
  return next;
}
