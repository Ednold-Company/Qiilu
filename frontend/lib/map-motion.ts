export type MapCoords = {
  lat: number;
  lng: number;
};

export function shouldUpdateLiveCoords(
  current: MapCoords | null,
  next: MapCoords,
  minimumDelta = 0.00005
) {
  if (!current) {
    return true;
  }

  return (
    Math.abs(current.lat - next.lat) >= minimumDelta ||
    Math.abs(current.lng - next.lng) >= minimumDelta
  );
}
