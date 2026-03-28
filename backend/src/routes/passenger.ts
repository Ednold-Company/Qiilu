import { Router } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { realtimeGateway } from "../lib/realtime.js";
import { estimateRoute, getRoutingStatus } from "../lib/routing.js";

export const passengerRouter = Router();

function toTrustedContacts(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function getPickupGuidance(pickup: string) {
  const value = pickup.toLowerCase();

  if (value.includes("airport")) {
    return "Use the departures forecourt short-stay lane and keep your phone visible for plate verification.";
  }

  if (value.includes("mall")) {
    return "Meet beside the main entrance security post to avoid pickup delays.";
  }

  if (value.includes("campus")) {
    return "Stand near the main gate and confirm the 4-digit safety pin before boarding.";
  }

  return "Meet at a bright roadside landmark and confirm the driver plate plus your safety pin.";
}

function createSafetyPin() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function createMomoReference() {
  return `QMO-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

passengerRouter.get("/vehicle-options", async (_request, response) => {
  const vehicles = await prisma.vehicle.findMany({
    where: { active: true, category: "CAR" },
    orderBy: { baseFareGhs: "asc" }
  });

  response.json({
    currency: "GHS",
    options: vehicles.map((vehicle) => ({
      id: vehicle.id,
      label: vehicle.category,
      type: vehicle.serviceKind,
      etaMinutes: vehicle.etaMinutes,
      seats: vehicle.seats,
      priceGhs: vehicle.baseFareGhs,
      description: vehicle.description,
      nearby: vehicle.nearbyCount
    }))
  });
});

passengerRouter.get("/routing-status", (_request, response) => {
  response.json({
    routing: getRoutingStatus()
  });
});

passengerRouter.post("/route-estimate", requireAuth, async (request: AuthenticatedRequest, response) => {
  const body = request.body as { pickup?: string; destination?: string };

  if (!body.pickup || !body.destination) {
    response.status(400).json({ message: "Pickup and destination are required" });
    return;
  }

  try {
    const estimate = await estimateRoute(body.pickup, body.destination);
    response.json({ estimate });
  } catch {
    response.status(422).json({
      message: "We could not calculate a real route for that destination yet. Try a more specific place name."
    });
  }
});

passengerRouter.get("/experience", requireAuth, async (request: AuthenticatedRequest, response) => {
  const user = await prisma.user.findUnique({
    where: { id: request.auth?.userId }
  });

  if (!user) {
    response.status(404).json({ message: "Passenger not found" });
    return;
  }

  response.json({
    experience: {
      preferredPayment: user.preferredPayment ?? "MOMO",
      momoProvider: user.momoProvider,
      trustedContacts: toTrustedContacts(user.trustedContacts),
      lowBandwidthMode: user.lowBandwidthMode,
      safetyShareEnabled: user.safetyShareEnabled
    }
  });
});

passengerRouter.put("/experience", requireAuth, async (request: AuthenticatedRequest, response) => {
  const body = request.body as {
    preferredPayment?: "MOMO" | "CASH";
    momoProvider?: string;
    trustedContacts?: string[];
    lowBandwidthMode?: boolean;
    safetyShareEnabled?: boolean;
  };

  const trustedContacts = toTrustedContacts(body.trustedContacts);
  const user = await prisma.user.update({
    where: { id: request.auth?.userId },
    data: {
      preferredPayment: body.preferredPayment,
      momoProvider: body.momoProvider?.trim() || "MTN MoMo",
      trustedContacts,
      lowBandwidthMode: Boolean(body.lowBandwidthMode),
      safetyShareEnabled: body.safetyShareEnabled ?? true
    }
  });

  response.json({
    message: "Experience preferences saved",
    experience: {
      preferredPayment: user.preferredPayment ?? "MOMO",
      momoProvider: user.momoProvider,
      trustedContacts: toTrustedContacts(user.trustedContacts),
      lowBandwidthMode: user.lowBandwidthMode,
      safetyShareEnabled: user.safetyShareEnabled
    }
  });
});

passengerRouter.post("/rides", requireAuth, async (request: AuthenticatedRequest, response) => {
  const body = request.body as {
    pickup?: string;
    destination?: string;
    vehicleType?: string;
    paymentMethod?: "MOMO" | "CASH" | string;
    momoProvider?: string;
    trustedContacts?: string[];
    lowBandwidthMode?: boolean;
    safetyShareEnabled?: boolean;
  };

  const passenger = await prisma.user.findUnique({
    where: { id: request.auth?.userId }
  });
  const vehicle = await prisma.vehicle.findFirst({
    where: {
      category: "CAR",
      active: true
    }
  });

  if (!passenger || !vehicle) {
    response.status(400).json({ message: "Passenger or vehicle could not be resolved" });
    return;
  }

  const paymentMethod = (body.paymentMethod?.toUpperCase() ?? passenger.preferredPayment ?? "MOMO") as "CASH" | "MOMO";
  const trustedContacts = toTrustedContacts(body.trustedContacts ?? passenger.trustedContacts);
  const lowBandwidthBooking = body.lowBandwidthMode ?? passenger.lowBandwidthMode;
  const safetyShareEnabled = body.safetyShareEnabled ?? passenger.safetyShareEnabled;
  const momoProvider =
    paymentMethod === "MOMO" ? body.momoProvider?.trim() || passenger.momoProvider || "MTN MoMo" : undefined;
  const pickupLocation = body.pickup ?? "Current location, East Legon";
  const destination = body.destination ?? "Unknown destination";
  const safetyPin = safetyShareEnabled ? createSafetyPin() : null;
  const pickupGuidance = getPickupGuidance(pickupLocation);
  const momoReference = paymentMethod === "MOMO" ? createMomoReference() : null;
  const estimate = await estimateRoute(pickupLocation, destination);

  const newRide = await prisma.ride.create({
    data: {
      status: "SEARCHING",
      pickup: pickupLocation,
      destination,
      pickupGuidance,
      distanceKm: estimate.distanceKm,
      etaMinutes: estimate.durationMinutes,
      passengers: 1,
      estimatedFareGhs: estimate.fareGhs,
      paymentMethod,
      momoProvider,
      momoReference,
      safetyPin,
      trustedContactCount: trustedContacts.length,
      lowBandwidthBooking,
      passengerId: passenger.id,
      vehicleId: vehicle.id
    }
  });

  response.status(201).json({
    message: "Ride request created",
    ride: newRide,
    safety: {
      safetyPin,
      pickupGuidance,
      trustedContactCount: trustedContacts.length,
      shareTripLive: safetyShareEnabled
    },
    payment: {
      method: paymentMethod,
      momoProvider,
      momoReference
    },
    estimate: {
      provider: estimate.provider,
      distanceKm: estimate.distanceKm,
      durationMinutes: estimate.durationMinutes,
      fareGhs: estimate.fareGhs,
      route: estimate.route,
      pickup: estimate.pickup,
      destination: estimate.destination
    }
  });

  realtimeGateway.emitRideRequested({
    rideId: newRide.id,
    passengerId: passenger.id,
    pickup: newRide.pickup,
    destination: newRide.destination,
    fareGhs: newRide.estimatedFareGhs,
    etaMinutes: newRide.etaMinutes
  });
});
