import { Router } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { createRideBooking } from "../lib/ride-booking.js";
import { topUpWallet, WALLET_TOP_UP_MAX_GHS, WALLET_TOP_UP_MIN_GHS } from "../lib/payments.js";
import { getDriverFreshnessCutoff } from "../lib/dispatch.js";
import { buildVehicleFareProfile } from "../lib/pricing.js";
import { realtimeGateway } from "../lib/realtime.js";
import { estimateRoute, getRoutingStatus } from "../lib/routing.js";
import {
  isUploadedDocumentTooLarge,
  isValidDocumentReference,
  normalizeDocumentReference
} from "../lib/document-upload.js";

export const passengerRouter = Router();

const passengerKycDocumentTypes = ["GHANA_CARD", "PASSPORT", "VOTERS_ID", "DRIVERS_LICENSE"] as const;

function safeParsePassengerKycNotes(notes: string) {
  try {
    const parsed = JSON.parse(notes) as Record<string, unknown>;
    return {
      documentType: typeof parsed.documentType === "string" ? parsed.documentType : null,
      documentNumber: typeof parsed.documentNumber === "string" ? parsed.documentNumber : null,
      legalName: typeof parsed.legalName === "string" ? parsed.legalName : null,
      documentBackUrl: typeof parsed.documentBackUrl === "string" ? parsed.documentBackUrl : null,
      selfieProvided: parsed.selfieProvided === true,
      selfieImageUrl: typeof parsed.selfieImageUrl === "string" ? parsed.selfieImageUrl : null,
      notes: typeof parsed.notes === "string" ? parsed.notes : null
    };
  } catch {
    return null;
  }
}

function formatPassengerKycSubmission(submission: {
  id: string;
  documentUrl: string;
  notes: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewedAt: Date | null;
  reviewedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  const details = submission.notes ? safeParsePassengerKycNotes(submission.notes) : null;

  return {
    id: submission.id,
    status: submission.status,
    documentUrl: submission.documentUrl,
    notes: submission.notes,
    reviewedAt: submission.reviewedAt,
    reviewedBy: submission.reviewedBy,
    createdAt: submission.createdAt,
    updatedAt: submission.updatedAt,
    documentType: details?.documentType ?? null,
    documentNumber: details?.documentNumber ?? null,
    legalName: details?.legalName ?? null,
    documentBackUrl: details?.documentBackUrl ?? null,
    selfieProvided: details?.selfieProvided ?? false,
    selfieImageUrl: details?.selfieImageUrl ?? null,
    reviewerNotes: details?.notes ?? null
  };
}

function toTrustedContacts(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function formatPassengerWallet(wallet: {
  balanceGhs: number;
  cashGhs: number;
  momoGhs: number;
  pendingWithdrawalGhs: number;
}) {
  return {
    totalBalanceGhs: wallet.balanceGhs,
    cashGhs: wallet.cashGhs,
    momoGhs: wallet.momoGhs,
    pendingWithdrawalGhs: wallet.pendingWithdrawalGhs
  };
}

passengerRouter.get("/vehicle-options", async (_request, response) => {
  const availableDrivers = await prisma.user.findMany({
    where: {
      role: "DRIVER",
      availability: "AVAILABLE",
      kycStatus: "APPROVED",
      lastSeenAt: {
        gte: getDriverFreshnessCutoff()
      }
    },
    select: {
      id: true
    }
  });
  const connectedDriverCount = availableDrivers.filter((driver) => realtimeGateway.isUserConnected(driver.id, "DRIVER")).length;
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
      nearby: connectedDriverCount,
      isAvailable: connectedDriverCount > 0,
      availabilityLabel:
        connectedDriverCount > 0
          ? `${connectedDriverCount} driver${connectedDriverCount === 1 ? "" : "s"} online`
          : "No drivers online right now"
    }))
  });
});

passengerRouter.get("/routing-status", (_request, response) => {
  response.json({
    routing: getRoutingStatus()
  });
});

passengerRouter.post("/route-estimate", requireAuth, async (request: AuthenticatedRequest, response) => {
  const body = request.body as {
    pickup?: string;
    destination?: string;
    vehicleId?: string;
    pickupCoords?: { lat?: number; lng?: number } | null;
    destinationCoords?: { lat?: number; lng?: number } | null;
  };

  if (!body.pickup || !body.destination) {
    response.status(400).json({ message: "Pickup and destination are required" });
    return;
  }

  if (!body.vehicleId) {
    response.status(400).json({ message: "Select a vehicle before estimating the fare" });
    return;
  }

  const vehicle = await prisma.vehicle.findFirst({
    where: {
      id: body.vehicleId,
      active: true
    }
  });

  if (!vehicle) {
    response.status(404).json({ message: "Selected vehicle is not available right now" });
    return;
  }

  try {
    const estimate = await estimateRoute(body.pickup, body.destination, {
      pickupPoint:
        typeof body.pickupCoords?.lat === "number" && typeof body.pickupCoords?.lng === "number"
          ? {
              lat: body.pickupCoords.lat,
              lng: body.pickupCoords.lng,
              label: body.pickup
            }
          : null,
      destinationPoint:
        typeof body.destinationCoords?.lat === "number" && typeof body.destinationCoords?.lng === "number"
          ? {
              lat: body.destinationCoords.lat,
              lng: body.destinationCoords.lng,
              label: body.destination
            }
          : null,
      fareProfile: buildVehicleFareProfile({
        baseFareGhs: vehicle.baseFareGhs,
        serviceKind: vehicle.serviceKind
      })
    });
    response.json({ estimate });
  } catch {
    response.status(422).json({
      message: "We could not calculate a real route for that destination yet. Try a more specific place name."
    });
  }
});

passengerRouter.get("/rides", requireAuth, async (request: AuthenticatedRequest, response) => {
  const rides = await prisma.ride.findMany({
    where: { passengerId: request.auth!.userId },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      driver: {
        select: {
          id: true,
          name: true,
          phone: true
        }
      },
      vehicle: {
        select: {
          category: true,
          serviceKind: true,
          seats: true
        }
      }
    }
  });

  response.json({
    rides: rides.map((ride) => ({
      id: ride.id,
      status: ride.status,
      pickup: ride.pickup,
      destination: ride.destination,
      requestSource: ride.requestSource,
      distanceKm: ride.distanceKm,
      etaMinutes: ride.etaMinutes,
      estimatedFareGhs: ride.estimatedFareGhs,
      actualFareGhs: ride.actualFareGhs,
      paymentMethod: ride.paymentMethod,
      momoProvider: ride.momoProvider,
      passengers: ride.passengers,
      createdAt: ride.createdAt,
      driver: ride.driver,
      vehicle: ride.vehicle
    }))
  });
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

passengerRouter.get("/wallet", requireAuth, async (request: AuthenticatedRequest, response) => {
  const user = await prisma.user.findUnique({
    where: { id: request.auth!.userId },
    select: {
      role: true
    }
  });

  if (!user || user.role !== "PASSENGER") {
    response.status(404).json({ message: "Passenger wallet not found" });
    return;
  }

  let wallet = await prisma.wallet.findUnique({
    where: { userId: request.auth!.userId },
    include: {
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 20
      }
    }
  });

  if (!wallet) {
    await prisma.wallet.create({
      data: {
        userId: request.auth!.userId
      }
    });

    wallet = await prisma.wallet.findUnique({
      where: { userId: request.auth!.userId },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 20
        }
      }
    });
  }

  if (!wallet) {
    response.status(500).json({ message: "Could not prepare passenger wallet" });
    return;
  }

  response.json({
    wallet: formatPassengerWallet(wallet),
    transactions: wallet.transactions
  });
});

passengerRouter.post("/wallet/top-up", requireAuth, async (request: AuthenticatedRequest, response) => {
  const user = await prisma.user.findUnique({
    where: { id: request.auth!.userId },
    select: {
      role: true
    }
  });

  if (!user || user.role !== "PASSENGER") {
    response.status(404).json({ message: "Passenger not found" });
    return;
  }

  const body = request.body as { amountGhs?: number; provider?: string };

  if (!body.amountGhs || body.amountGhs <= 0) {
    response.status(400).json({ message: "A valid top-up amount is required" });
    return;
  }

  if (body.amountGhs < WALLET_TOP_UP_MIN_GHS || body.amountGhs > WALLET_TOP_UP_MAX_GHS) {
    response.status(400).json({ message: `Top-up amount must be between GHS ${WALLET_TOP_UP_MIN_GHS} and GHS ${WALLET_TOP_UP_MAX_GHS.toLocaleString()}` });
    return;
  }

  const result = await topUpWallet({
    userId: request.auth!.userId,
    amountGhs: body.amountGhs,
    provider: body.provider?.trim() || "MTN MoMo",
    callbackPath: "/passenger/payment?payment=paystack"
  });

  response.json({
    message:
      result.status === "pending"
        ? "Wallet top-up initialized. Complete the mobile money approval to finish it."
        : "Wallet top-up processed",
    result
  });
});

passengerRouter.get("/kyc/:userId", requireAuth, async (request: AuthenticatedRequest, response) => {
  if (request.auth?.userId !== request.params.userId) {
    response.status(403).json({ message: "Forbidden" });
    return;
  }

  const [user, submissions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: request.params.userId },
      select: {
        id: true,
        role: true,
        kycStatus: true
      }
    }),
    prisma.kycSubmission.findMany({
      where: { userId: request.params.userId },
      orderBy: { createdAt: "desc" },
      take: 8
    })
  ]);

  if (!user || user.role !== "PASSENGER") {
    response.status(404).json({ message: "Passenger not found" });
    return;
  }

  response.json({
    kycStatus: user.kycStatus ?? "PENDING",
    latestSubmission: submissions[0] ? formatPassengerKycSubmission(submissions[0]) : null,
    submissions: submissions.map(formatPassengerKycSubmission),
    requiredDocuments: passengerKycDocumentTypes
  });
});

passengerRouter.post("/kyc/:userId", requireAuth, async (request: AuthenticatedRequest, response) => {
  if (request.auth?.userId !== request.params.userId) {
    response.status(403).json({ message: "Forbidden" });
    return;
  }

  const body = request.body as {
    documentType?: (typeof passengerKycDocumentTypes)[number];
    documentNumber?: string;
    legalName?: string;
    documentUrl?: string;
    documentBackUrl?: string;
    selfieProvided?: boolean;
    selfieImageUrl?: string;
    notes?: string;
  };

  if (!body.documentType || !passengerKycDocumentTypes.includes(body.documentType)) {
    response.status(400).json({ message: "A valid document type is required" });
    return;
  }

  if (!body.documentUrl?.trim()) {
    response.status(400).json({ message: "A front document upload is required" });
    return;
  }

  const documentReference = normalizeDocumentReference(body.documentUrl);

  if (!isValidDocumentReference(documentReference)) {
    response.status(400).json({ message: "Upload a valid image or PDF document" });
    return;
  }

  if (isUploadedDocumentTooLarge(documentReference)) {
    response.status(400).json({ message: "Front document upload is too large. Use a smaller file." });
    return;
  }

  if (!body.documentBackUrl?.trim()) {
    response.status(400).json({ message: "A back document upload is required" });
    return;
  }

  const documentBackReference = normalizeDocumentReference(body.documentBackUrl);

  if (!isValidDocumentReference(documentBackReference)) {
    response.status(400).json({ message: "Upload a valid back image or PDF document" });
    return;
  }

  if (isUploadedDocumentTooLarge(documentBackReference)) {
    response.status(400).json({ message: "Back document upload is too large. Use a smaller file." });
    return;
  }

  if (!body.documentNumber?.trim()) {
    response.status(400).json({ message: "Document number is required" });
    return;
  }

  if (!body.legalName?.trim()) {
    response.status(400).json({ message: "Legal name is required" });
    return;
  }

  if (!body.selfieProvided) {
    response.status(400).json({ message: "Selfie verification is required" });
    return;
  }

  if (!body.selfieImageUrl?.trim()) {
    response.status(400).json({ message: "A selfie capture is required" });
    return;
  }

  const selfieReference = normalizeDocumentReference(body.selfieImageUrl);

  if (!isValidDocumentReference(selfieReference)) {
    response.status(400).json({ message: "Upload a valid selfie image" });
    return;
  }

  if (isUploadedDocumentTooLarge(selfieReference)) {
    response.status(400).json({ message: "Selfie upload is too large. Use a smaller file." });
    return;
  }

  const latestSubmission = await prisma.kycSubmission.findFirst({
    where: { userId: request.params.userId },
    orderBy: { createdAt: "desc" }
  });

  if (latestSubmission?.status === "PENDING") {
    response.status(409).json({ message: "Your previous KYC submission is still under review" });
    return;
  }

  const submission = await prisma.kycSubmission.create({
    data: {
      userId: request.params.userId,
      documentUrl: documentReference,
      notes: JSON.stringify({
        documentType: body.documentType,
        documentNumber: body.documentNumber.trim(),
        legalName: body.legalName.trim(),
        documentBackUrl: documentBackReference,
        selfieProvided: true,
        selfieImageUrl: selfieReference,
        notes: body.notes?.trim() || null
      })
    }
  });

  await prisma.user.update({
    where: { id: request.params.userId },
    data: {
      kycStatus: "PENDING"
    }
  });

  response.status(201).json({
    message: "Passenger KYC submission received",
    submission: formatPassengerKycSubmission(submission)
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

  const currentUser = await prisma.user.findUnique({
    where: { id: request.auth?.userId }
  });

  if (!currentUser) {
    response.status(404).json({ message: "Passenger not found" });
    return;
  }

  const user = await prisma.user.update({
    where: { id: request.auth?.userId },
    data: {
      preferredPayment: body.preferredPayment,
      momoProvider: body.momoProvider === undefined ? undefined : body.momoProvider.trim() || "MTN MoMo",
      trustedContacts: body.trustedContacts === undefined ? undefined : toTrustedContacts(body.trustedContacts),
      lowBandwidthMode: body.lowBandwidthMode === undefined ? undefined : Boolean(body.lowBandwidthMode),
      safetyShareEnabled: body.safetyShareEnabled
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
    pickupCoords?: { lat?: number; lng?: number } | null;
    destinationCoords?: { lat?: number; lng?: number } | null;
    vehicleId?: string;
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

  if (!passenger) {
    response.status(400).json({ message: "Passenger could not be resolved" });
    return;
  }

  const paymentMethod = (body.paymentMethod?.toUpperCase() ?? passenger.preferredPayment ?? "MOMO") as "CASH" | "MOMO";
  const trustedContacts = toTrustedContacts(body.trustedContacts ?? passenger.trustedContacts);
  const lowBandwidthBooking = body.lowBandwidthMode ?? passenger.lowBandwidthMode;
  const safetyShareEnabled = body.safetyShareEnabled ?? passenger.safetyShareEnabled;
  const pickupLocation = body.pickup ?? "Current location, East Legon";
  const destination = body.destination ?? "Unknown destination";
  const { ride, estimate, payment, safety } = await createRideBooking({
    passengerId: passenger.id,
    pickup: pickupLocation,
    destination,
    pickupCoords:
      typeof body.pickupCoords?.lat === "number" && typeof body.pickupCoords?.lng === "number"
        ? {
            lat: body.pickupCoords.lat,
            lng: body.pickupCoords.lng
          }
        : null,
    destinationCoords:
      typeof body.destinationCoords?.lat === "number" && typeof body.destinationCoords?.lng === "number"
        ? {
            lat: body.destinationCoords.lat,
            lng: body.destinationCoords.lng
          }
        : null,
    vehicleId: body.vehicleId,
    vehicleType: body.vehicleType,
    paymentMethod,
    momoProvider: body.momoProvider,
    requestSource: "APP",
    trustedContacts,
    lowBandwidthBooking,
    safetyShareEnabled
  });

  response.status(201).json({
    message: "Ride request created",
    ride,
    safety,
    payment,
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
});

passengerRouter.post("/rides/:rideId/cancel", requireAuth, async (request: AuthenticatedRequest, response) => {
  const rideId = Array.isArray(request.params.rideId) ? request.params.rideId[0] : request.params.rideId;
  const ride = await prisma.ride.findUnique({
    where: { id: rideId }
  });

  if (!ride || ride.passengerId !== request.auth?.userId) {
    response.status(404).json({ message: "Ride not found" });
    return;
  }

  if (!["SEARCHING", "SCHEDULED", "ACCEPTED"].includes(ride.status)) {
    response.status(409).json({ message: "This ride can no longer be cancelled from the passenger app" });
    return;
  }

  const cancelledRide = await prisma.ride.update({
    where: { id: ride.id },
    data: {
      status: "CANCELLED",
      cancelledReason:
        ride.status === "ACCEPTED"
          ? "Passenger cancelled after assignment"
          : "Passenger cancelled search"
    }
  });

  if (ride.driverId) {
    await prisma.user.update({
      where: { id: ride.driverId },
      data: { availability: "AVAILABLE" }
    });
  }

  realtimeGateway.emitRideCancelled({
    rideId: cancelledRide.id,
    passengerId: cancelledRide.passengerId,
    driverId: cancelledRide.driverId
  });

  response.json({
    message: "Ride cancelled",
    ride: cancelledRide
  });
});
