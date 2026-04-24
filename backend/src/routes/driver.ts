import { Router } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { autoAssignRide, releaseDriverFromRide, syncDriverAvailability } from "../lib/dispatch.js";
import { requestDriverPayout, topUpDriverWallet } from "../lib/payments.js";
import { prisma } from "../lib/prisma.js";
import { realtimeGateway } from "../lib/realtime.js";
import {
  isUploadedDocumentTooLarge,
  isValidDocumentReference,
  normalizeDocumentReference
} from "../lib/document-upload.js";

export const driverRouter = Router();

const kycDocumentTypes = ["DRIVERS_LICENSE", "GHANA_CARD", "VEHICLE_INSURANCE", "ROAD_WORTHINESS"] as const;

function formatKycSubmission(submission: {
  id: string;
  documentUrl: string;
  notes: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewedAt: Date | null;
  reviewedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  const details = submission.notes ? safeParseKycNotes(submission.notes) : null;

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
    issuingCountry: details?.issuingCountry ?? null,
    reviewerNotes: details?.notes ?? null
  };
}

function safeParseKycNotes(notes: string) {
  try {
    const parsed = JSON.parse(notes) as Record<string, unknown>;
    return {
      documentType: typeof parsed.documentType === "string" ? parsed.documentType : null,
      documentNumber: typeof parsed.documentNumber === "string" ? parsed.documentNumber : null,
      legalName: typeof parsed.legalName === "string" ? parsed.legalName : null,
      issuingCountry: typeof parsed.issuingCountry === "string" ? parsed.issuingCountry : null,
      notes: typeof parsed.notes === "string" ? parsed.notes : null
    };
  } catch {
    return null;
  }
}

driverRouter.get("/requests", requireAuth, async (request: AuthenticatedRequest, response) => {
  const driver = await prisma.user.findUnique({
    where: { id: request.auth?.userId },
    select: {
      id: true,
      availability: true,
      kycStatus: true
    }
  });

  if (!driver) {
    response.status(404).json({ message: "Driver not found", requests: [] });
    return;
  }

  const dispatchEnabled =
    driver.kycStatus === "APPROVED" &&
    driver.availability === "AVAILABLE" &&
    realtimeGateway.isUserConnected(driver.id, "DRIVER");

  const openRequests = await prisma.ride.findMany({
    where: {
      OR: [
        ...(dispatchEnabled ? [{ status: "SEARCHING" as const }, { status: "SCHEDULED" as const }] : []),
        {
          status: "ACCEPTED",
          driverId: request.auth?.userId
        }
      ]
    },
    include: {
      vehicle: true,
      passenger: true
    },
    orderBy: { createdAt: "desc" }
  });

  response.json({
    dispatchEnabled,
    message: dispatchEnabled
      ? null
      : driver.kycStatus !== "APPROVED"
        ? "KYC approval is required before you can receive live ride requests."
      : driver.availability !== "AVAILABLE"
        ? "Go online to receive live ride requests."
        : "Realtime connection required before live requests can appear.",
    requests: openRequests.map((ride, index) => ({
      id: ride.id,
      source:
        ride.requestSource === "USSD" ? "USSD" : ride.requestSource === "SCHEDULED" ? "Scheduled" : "App",
      pickup: ride.pickup,
      destination: ride.destination,
      payment: ride.paymentMethod === "MOMO" ? "MoMo" : "Cash",
      paymentMethod: ride.paymentMethod,
      momoProvider: ride.momoProvider,
      fareGhs: ride.estimatedFareGhs,
      etaMinutes: ride.etaMinutes,
      passengers: ride.passengers,
      distanceKm: ride.distanceKm,
      countdownSeconds: 18 + index * 4,
      riderName: ride.passenger.name,
      pickupGuidance: ride.pickupGuidance,
      safetyPin: ride.safetyPin,
      trustedContactCount: ride.trustedContactCount,
      lowBandwidthBooking: ride.lowBandwidthBooking
    }))
  });
});

driverRouter.get("/status/:userId", requireAuth, async (request: AuthenticatedRequest, response) => {
  if (request.auth?.userId !== request.params.userId) {
    response.status(403).json({ message: "Forbidden" });
    return;
  }

  const driver = await prisma.user.findUnique({
    where: { id: request.params.userId }
  });

  if (!driver) {
    response.status(404).json({ message: "Driver not found" });
    return;
  }

  response.json({
    status: {
      availability: driver.availability,
      lastKnownLat: driver.lastKnownLat,
      lastKnownLng: driver.lastKnownLng,
      lastSeenAt: driver.lastSeenAt
    }
  });
});

driverRouter.put("/status/:userId", requireAuth, async (request: AuthenticatedRequest, response) => {
  if (request.auth?.userId !== request.params.userId) {
    response.status(403).json({ message: "Forbidden" });
    return;
  }

  const body = request.body as {
    availability?: "OFFLINE" | "AVAILABLE" | "ON_TRIP";
    lat?: number;
    lng?: number;
  };

  if (body.availability === "AVAILABLE") {
    const driver = await prisma.user.findUnique({
      where: { id: request.params.userId },
      select: {
        kycStatus: true
      }
    });

    if (!driver || driver.kycStatus !== "APPROVED") {
      response.status(409).json({ message: "KYC approval is required before going online" });
      return;
    }
  }

  const updatedDriver = await syncDriverAvailability({
    userId: request.params.userId,
    availability: body.availability ?? "OFFLINE",
    lat: body.lat,
    lng: body.lng
  });

  response.json({
    message: "Driver status updated",
    status: {
      availability: updatedDriver.availability,
      lastKnownLat: updatedDriver.lastKnownLat,
      lastKnownLng: updatedDriver.lastKnownLng,
      lastSeenAt: updatedDriver.lastSeenAt
    }
  });
});

driverRouter.post("/requests/:rideId/accept", requireAuth, async (request: AuthenticatedRequest, response) => {
  const rideId = Array.isArray(request.params.rideId) ? request.params.rideId[0] : request.params.rideId;
  const driver = await prisma.user.findUnique({ where: { id: request.auth?.userId } });

  if (!driver) {
    response.status(400).json({ message: "Driver not found" });
    return;
  }

  if (driver.availability !== "AVAILABLE") {
    response.status(409).json({ message: "Go online before accepting ride requests" });
    return;
  }

  if (driver.kycStatus !== "APPROVED") {
    response.status(409).json({ message: "KYC approval is required before accepting rides" });
    return;
  }

  if (!realtimeGateway.isUserConnected(driver.id, "DRIVER")) {
    response.status(409).json({ message: "Realtime connection is required before accepting a ride" });
    return;
  }

  const currentRide = await prisma.ride.findUnique({
    where: { id: rideId }
  });

  if (!currentRide) {
    response.status(404).json({ message: "Ride not found" });
    return;
  }

  if (currentRide.driverId && currentRide.driverId !== driver.id) {
    response.status(409).json({ message: "Ride is already assigned to another driver" });
    return;
  }

  const ride = await prisma.ride.update({
    where: { id: rideId },
    data: {
      status: "ACCEPTED",
      driverId: driver.id,
      assignedAt: currentRide.assignedAt ?? new Date()
    }
  });

  await prisma.user.update({
    where: { id: driver.id },
    data: {
      availability: "ON_TRIP",
      lastSeenAt: new Date()
    }
  });

  realtimeGateway.emitRideAccepted({
    rideId: ride.id,
    passengerId: ride.passengerId,
    driverId: driver.id,
    driverName: driver.name,
    pickup: ride.pickup,
    destination: ride.destination,
    etaMinutes: ride.etaMinutes,
    fareGhs: ride.estimatedFareGhs,
    safetyPin: ride.safetyPin
  });

  response.json({ message: "Ride accepted", ride });
});

driverRouter.post("/requests/:rideId/reject", requireAuth, async (request: AuthenticatedRequest, response) => {
  const rideId = Array.isArray(request.params.rideId) ? request.params.rideId[0] : request.params.rideId;
  const existingRide = await prisma.ride.findUnique({
    where: { id: rideId }
  });

  if (!existingRide) {
    response.status(404).json({ message: "Ride not found" });
    return;
  }

  if (existingRide.driverId && existingRide.driverId === request.auth?.userId) {
    await releaseDriverFromRide(existingRide);
  }

  const ride = await prisma.ride.update({
    where: { id: rideId },
    data: {
      status: "SEARCHING",
      driverId: null,
      assignedAt: null,
      cancelledReason: "Driver declined dispatch"
    }
  });

  const reassignedRide = await autoAssignRide(ride.id);

  if (!reassignedRide) {
    realtimeGateway.broadcastQueueRefresh?.();
  }

  response.json({
    message: reassignedRide ? "Ride reassigned" : "Ride returned to search queue",
    ride: reassignedRide ?? ride
  });
});

driverRouter.post("/rides/:rideId/stage", requireAuth, async (request: AuthenticatedRequest, response) => {
  const rideId = Array.isArray(request.params.rideId) ? request.params.rideId[0] : request.params.rideId;
  const body = request.body as { status?: "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" };
  const nextStatus = body.status ?? "IN_PROGRESS";
  const existingRide = await prisma.ride.findUnique({
    where: { id: rideId },
    include: {
      driver: {
        include: {
          wallet: true
        }
      }
    }
  });

  if (!existingRide) {
    response.status(404).json({ message: "Ride not found" });
    return;
  }

  const ride = await prisma.ride.update({
    where: { id: rideId },
    data: {
      status: nextStatus,
      actualFareGhs: nextStatus === "COMPLETED" ? existingRide.estimatedFareGhs : existingRide.actualFareGhs
    }
  });

  if (
    nextStatus === "COMPLETED" &&
    existingRide.status !== "COMPLETED" &&
    existingRide.driverId &&
    existingRide.driver?.wallet
  ) {
    const gross = existingRide.estimatedFareGhs;
    const commission = Number((gross * 0.15).toFixed(2));
    const net = Number((gross - commission).toFixed(2));
    const cashIncrement = existingRide.paymentMethod === "CASH" ? net : 0;
    const momoIncrement = existingRide.paymentMethod === "MOMO" ? net : 0;

    await prisma.wallet.update({
      where: { userId: existingRide.driverId },
      data: {
        balanceGhs: {
          increment: net
        },
        cashGhs: {
          increment: cashIncrement
        },
        momoGhs: {
          increment: momoIncrement
        },
        transactions: {
          create: [
            {
              kind: "TRIP_CREDIT",
              amountGhs: net,
              channel:
                existingRide.paymentMethod === "MOMO"
                  ? `${existingRide.momoProvider ?? "Mobile Money"} instant settlement`
                  : "Cash collection"
            },
            {
              kind: "COMMISSION_DEBIT",
              amountGhs: commission,
              channel: "Platform commission"
            }
          ]
        }
      }
    });

    await releaseDriverFromRide(ride);
  }

  realtimeGateway.emitRideStageUpdated({
    rideId: ride.id,
    passengerId: existingRide.passengerId,
    driverId: existingRide.driverId,
    status: nextStatus
  });

  if (nextStatus === "IN_PROGRESS" && existingRide.driverId) {
    void realtimeGateway.startTracking({
      rideId: ride.id,
      passengerId: existingRide.passengerId,
      driverId: existingRide.driverId,
      pickup: existingRide.pickup,
      destination: existingRide.destination,
      stage: "IN_PROGRESS"
    });
  }

  if (nextStatus === "COMPLETED") {
    realtimeGateway.stopTracking(ride.id);
  }

  response.json({ message: "Ride stage updated", ride });
});

driverRouter.post("/wallet/:userId/top-up", requireAuth, async (request: AuthenticatedRequest, response) => {
  if (request.auth?.userId !== request.params.userId) {
    response.status(403).json({ message: "Forbidden" });
    return;
  }

  const body = request.body as { amountGhs?: number; provider?: string };

  if (!body.amountGhs || body.amountGhs <= 0) {
    response.status(400).json({ message: "A valid amount is required" });
    return;
  }

  const result = await topUpDriverWallet({
    userId: request.params.userId,
    amountGhs: body.amountGhs,
    provider: body.provider?.trim() || "MTN MoMo"
  });

  response.json({
    message:
      result.status === "pending"
        ? "Wallet top-up initialized. Complete the mobile money approval to finish it."
        : "Wallet top-up processed",
    result
  });
});

driverRouter.post("/wallet/:userId/withdraw", requireAuth, async (request: AuthenticatedRequest, response) => {
  if (request.auth?.userId !== request.params.userId) {
    response.status(403).json({ message: "Forbidden" });
    return;
  }

  const body = request.body as { amountGhs?: number; provider?: string; accountRef?: string };

  if (!body.amountGhs || !body.accountRef) {
    response.status(400).json({ message: "Amount and account reference are required" });
    return;
  }

  try {
    const payout = await requestDriverPayout({
      userId: request.params.userId,
      amountGhs: body.amountGhs,
      provider: body.provider?.trim() || "MTN MoMo",
      accountRef: body.accountRef
    });

    response.json({
      message: payout.providerResult.message ?? "Payout request created",
      payoutRequest: payout.wallet.payoutRequests[0],
      result: payout.providerResult
    });
  } catch (error) {
    response.status(400).json({
      message: error instanceof Error ? error.message : "Payout request failed"
    });
  }
});

driverRouter.get("/kyc/:userId", requireAuth, async (request: AuthenticatedRequest, response) => {
  if (request.auth?.userId !== request.params.userId) {
    response.status(403).json({ message: "Forbidden" });
    return;
  }

  const [user, submissions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: request.params.userId },
      select: {
        id: true,
        kycStatus: true,
        role: true
      }
    }),
    prisma.kycSubmission.findMany({
      where: { userId: request.params.userId },
      orderBy: { createdAt: "desc" },
      take: 8
    })
  ]);

  if (!user || user.role !== "DRIVER") {
    response.status(404).json({ message: "Driver not found" });
    return;
  }

  response.json({
    kycStatus: user.kycStatus ?? "PENDING",
    latestSubmission: submissions[0] ? formatKycSubmission(submissions[0]) : null,
    submissions: submissions.map(formatKycSubmission),
    requiredDocuments: kycDocumentTypes
  });
});

driverRouter.post("/kyc/:userId", requireAuth, async (request: AuthenticatedRequest, response) => {
  if (request.auth?.userId !== request.params.userId) {
    response.status(403).json({ message: "Forbidden" });
    return;
  }

  const body = request.body as {
    documentType?: (typeof kycDocumentTypes)[number];
    documentNumber?: string;
    legalName?: string;
    issuingCountry?: string;
    documentUrl?: string;
    notes?: string;
  };

  if (!body.documentUrl) {
    response.status(400).json({ message: "A document upload is required" });
    return;
  }

  const documentReference = normalizeDocumentReference(body.documentUrl);

  if (!isValidDocumentReference(documentReference)) {
    response.status(400).json({ message: "Upload a valid image or PDF document" });
    return;
  }

  if (isUploadedDocumentTooLarge(documentReference)) {
    response.status(400).json({ message: "Document upload is too large. Use a smaller file." });
    return;
  }

  if (!body.documentType || !kycDocumentTypes.includes(body.documentType)) {
    response.status(400).json({ message: "A valid document type is required" });
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

  const latestSubmission = await prisma.kycSubmission.findFirst({
    where: { userId: request.params.userId },
    orderBy: { createdAt: "desc" }
  });

  if (latestSubmission?.status === "PENDING") {
    response.status(409).json({
      message: "Your previous KYC submission is still under review"
    });
    return;
  }

  const serializedNotes = JSON.stringify({
    documentType: body.documentType,
    documentNumber: body.documentNumber.trim(),
    legalName: body.legalName.trim(),
    issuingCountry: body.issuingCountry?.trim() || "Ghana",
    notes: body.notes?.trim() || null
  });

  const submission = await prisma.kycSubmission.create({
    data: {
      userId: request.params.userId,
      documentUrl: documentReference,
      notes: serializedNotes
    }
  });

  await prisma.user.update({
    where: { id: request.params.userId },
    data: {
      kycStatus: "PENDING"
    }
  });

  response.status(201).json({
    message: "KYC submission received",
    submission: formatKycSubmission(submission)
  });
});

driverRouter.get("/wallet/:userId", requireAuth, async (request: AuthenticatedRequest, response) => {
  if (request.auth?.userId !== request.params.userId) {
    response.status(403).json({ message: "Forbidden" });
    return;
  }

  const wallet = await prisma.wallet.findUnique({
    where: { userId: request.params.userId },
    include: {
      transactions: {
        orderBy: { createdAt: "desc" }
      },
      payoutRequests: {
        orderBy: { createdAt: "desc" }
      },
      user: {
        include: {
          driverRides: true
        }
      }
    }
  });

  if (!wallet) {
    response.status(404).json({ message: "Wallet not found" });
    return;
  }

  const completedRides = wallet.user.driverRides.filter((ride) => ride.status === "COMPLETED");

  response.json({
    wallet: {
      totalBalanceGhs: wallet.balanceGhs,
      cashGhs: wallet.cashGhs,
      momoGhs: wallet.momoGhs,
      pendingWithdrawalGhs: wallet.pendingWithdrawalGhs,
      weeklyTrips: wallet.user.driverRides.length,
      completionRate: wallet.user.driverRides.length
        ? Math.round((completedRides.length / wallet.user.driverRides.length) * 100)
        : 0,
      commissionRate: 15,
      instantMomoCashoutEligible: wallet.momoGhs > 0
    },
    transactions: wallet.transactions,
    payoutRequests: wallet.payoutRequests
  });
});

driverRouter.get("/history/:userId", requireAuth, async (request: AuthenticatedRequest, response) => {
  if (request.auth?.userId !== request.params.userId) {
    response.status(403).json({ message: "Forbidden" });
    return;
  }

  const rides = await prisma.ride.findMany({
    where: {
      driverId: request.params.userId
    },
    include: {
      passenger: true
    },
    orderBy: { createdAt: "desc" }
  });

  const mapRide = (ride: (typeof rides)[number]) => ({
    route: `${ride.pickup} to ${ride.destination}`,
    time: new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(ride.createdAt),
    rider: ride.requestSource === "USSD" ? "USSD request" : ride.passenger.name,
    gross: ride.actualFareGhs ?? ride.estimatedFareGhs,
    net: Number(((ride.actualFareGhs ?? ride.estimatedFareGhs) * 0.85).toFixed(2))
  });

  response.json({
    upcoming: rides.filter((ride) => ride.status === "SCHEDULED" || ride.status === "ACCEPTED").map(mapRide),
    past: rides.filter((ride) => ride.status === "COMPLETED").map(mapRide),
    cancelled: rides.filter((ride) => ride.status === "CANCELLED").map(mapRide)
  });
});
