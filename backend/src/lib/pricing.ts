import type { FareProfile } from "./routing.js";

type VehiclePricingInput = {
  baseFareGhs: number;
  serviceKind: string;
};

function normalizeBaseFare(value: number) {
  if (!Number.isFinite(value)) {
    return 12;
  }

  return Math.max(12, Number(value.toFixed(2)));
}

export function buildVehicleFareProfile(input: VehiclePricingInput): FareProfile {
  const baseFareGhs = normalizeBaseFare(input.baseFareGhs);
  const isPrivate = input.serviceKind === "PRIVATE";

  return {
    baseFareGhs,
    minimumFareGhs: Math.max(15, baseFareGhs),
    distanceRateGhs: isPrivate ? 1.35 : 1.05,
    timeRateGhs: isPrivate ? 0.22 : 0.16,
    serviceFeeGhs: isPrivate ? 2.5 : 1.5
  };
}
