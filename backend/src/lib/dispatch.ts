import { DriverAvailability, type Ride, type User } from "@prisma/client";
import { prisma } from "./prisma.js";
import { realtimeGateway } from "./realtime.js";
import { estimateRoute } from "./routing.js";

type DriverCandidate = Pick<User, "id" | "name" | "lastKnownLat" | "lastKnownLng">;

export function getDistanceScoreKm(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number }
) {
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

export function rankDriverCandidates(
  pickup: { lat: number; lng: number },
  drivers: DriverCandidate[]
) {
  return drivers
    .filter((driver) => typeof driver.lastKnownLat === "number" && typeof driver.lastKnownLng === "number")
    .map((driver) => ({
      driver,
      score: Number(
        getDistanceScoreKm(
          pickup,
          { lat: driver.lastKnownLat as number, lng: driver.lastKnownLng as number }
        ).toFixed(2)
      )
    }))
    .sort((left, right) => left.score - right.score);
}

export async function syncDriverAvailability(input: {
  userId: string;
  availability: DriverAvailability;
  lat?: number;
  lng?: number;
}) {
  return prisma.user.update({
    where: { id: input.userId },
    data: {
      availability: input.availability,
      lastKnownLat: input.lat,
      lastKnownLng: input.lng,
      lastSeenAt: new Date()
    }
  });
}

export async function autoAssignRide(rideId: string) {
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
    include: {
      passenger: true
    }
  });

  if (!ride || ride.driverId || ride.status !== "SEARCHING") {
    return null;
  }

  try {
    const estimate = await estimateRoute(ride.pickup, ride.destination);
    const candidates = await prisma.user.findMany({
      where: {
        role: "DRIVER",
        availability: "AVAILABLE",
        kycStatus: "APPROVED"
      },
      select: {
        id: true,
        name: true,
        lastKnownLat: true,
        lastKnownLng: true
      }
    });

    const ranked = rankDriverCandidates(
      { lat: estimate.pickup.lat, lng: estimate.pickup.lng },
      candidates
    );
    const best = ranked[0];

    if (!best) {
      return null;
    }

    const assignedRide = await prisma.ride.update({
      where: { id: ride.id },
      data: {
        status: "ACCEPTED",
        driverId: best.driver.id,
        assignedAt: new Date(),
        assignmentScore: best.score
      }
    });

    await prisma.user.update({
      where: { id: best.driver.id },
      data: {
        availability: "ON_TRIP",
        lastSeenAt: new Date()
      }
    });

    realtimeGateway.emitRideAccepted({
      rideId: assignedRide.id,
      passengerId: assignedRide.passengerId,
      driverId: best.driver.id,
      driverName: best.driver.name,
      pickup: assignedRide.pickup,
      destination: assignedRide.destination,
      etaMinutes: assignedRide.etaMinutes,
      fareGhs: assignedRide.estimatedFareGhs,
      safetyPin: assignedRide.safetyPin
    });

    return assignedRide;
  } catch {
    return null;
  }
}

export async function releaseDriverFromRide(ride: Pick<Ride, "driverId" | "status" | "id">) {
  if (!ride.driverId) {
    return;
  }

  await prisma.user.update({
    where: { id: ride.driverId },
    data: {
      availability: "AVAILABLE",
      lastSeenAt: new Date()
    }
  });
}
