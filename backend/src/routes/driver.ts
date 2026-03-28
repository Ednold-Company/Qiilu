import { Router } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { realtimeGateway } from "../lib/realtime.js";

export const driverRouter = Router();

driverRouter.get("/requests", requireAuth, async (_request: AuthenticatedRequest, response) => {
  const openRequests = await prisma.ride.findMany({
    where: {
      status: {
        in: ["SEARCHING", "SCHEDULED", "ACCEPTED"]
      }
    },
    include: {
      vehicle: true,
      passenger: true
    },
    orderBy: { createdAt: "desc" }
  });

  response.json({
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

driverRouter.post("/requests/:rideId/accept", requireAuth, async (request: AuthenticatedRequest, response) => {
  const rideId = Array.isArray(request.params.rideId) ? request.params.rideId[0] : request.params.rideId;
  const driver = await prisma.user.findUnique({ where: { id: request.auth?.userId } });

  if (!driver) {
    response.status(400).json({ message: "Driver not found" });
    return;
  }

  const ride = await prisma.ride.update({
    where: { id: rideId },
    data: {
      status: "ACCEPTED",
      driverId: driver.id
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
  const ride = await prisma.ride.update({
    where: { id: rideId },
    data: {
      status: "CANCELLED"
    }
  });

  realtimeGateway.emitRideCancelled({
    rideId: ride.id,
    passengerId: ride.passengerId,
    driverId: ride.driverId
  });

  response.json({ message: "Ride rejected", ride });
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
      status: nextStatus
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
    transactions: wallet.transactions
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
    gross: ride.estimatedFareGhs,
    net: Number((ride.estimatedFareGhs * 0.85).toFixed(2))
  });

  response.json({
    upcoming: rides.filter((ride) => ride.status === "SCHEDULED" || ride.status === "ACCEPTED").map(mapRide),
    past: rides.filter((ride) => ride.status === "COMPLETED").map(mapRide),
    cancelled: rides.filter((ride) => ride.status === "CANCELLED").map(mapRide)
  });
});
