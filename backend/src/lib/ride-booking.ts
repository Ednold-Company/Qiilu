import { initiateRidePayment } from "./payments.js";
import { prisma } from "./prisma.js";
import { realtimeGateway } from "./realtime.js";
import { estimateRoute } from "./routing.js";

type RideRequestSource = "APP" | "USSD" | "SCHEDULED";
type RidePaymentMethod = "MOMO" | "CASH";

export type CreateRideBookingInput = {
  passengerId: string;
  pickup: string;
  destination: string;
  pickupCoords?: { lat: number; lng: number } | null;
  destinationCoords?: { lat: number; lng: number } | null;
  vehicleId?: string;
  vehicleType?: string;
  paymentMethod: RidePaymentMethod;
  momoProvider?: string;
  requestSource?: RideRequestSource;
  trustedContacts?: string[];
  lowBandwidthBooking?: boolean;
  safetyShareEnabled?: boolean;
};

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

export async function createRideBooking(input: CreateRideBookingInput) {
  const passenger = await prisma.user.findUnique({
    where: { id: input.passengerId }
  });
  const vehicle =
    input.vehicleId
      ? await prisma.vehicle.findFirst({
          where: {
            id: input.vehicleId,
            active: true
          }
        })
      : null;

  const fallbackVehicle =
    vehicle ??
    (input.vehicleType
      ? await prisma.vehicle.findFirst({
          where: {
            category: input.vehicleType as "CAR",
            active: true
          }
        })
      : null) ??
    (await prisma.vehicle.findFirst({
      where: {
        category: "CAR",
        active: true
      }
    }));

  if (!passenger || !fallbackVehicle) {
    throw new Error("Passenger or vehicle could not be resolved");
  }

  const vehicleProfile = fallbackVehicle;

  const trustedContacts = input.trustedContacts ?? [];
  const safetyShareEnabled = input.safetyShareEnabled ?? true;
  const momoProvider =
    input.paymentMethod === "MOMO" ? input.momoProvider?.trim() || passenger.momoProvider || "MTN MoMo" : undefined;
  const safetyPin = safetyShareEnabled ? createSafetyPin() : null;
  const pickupGuidance = getPickupGuidance(input.pickup);
  const estimate = await estimateRoute(input.pickup, input.destination, {
    pickupPoint: input.pickupCoords
      ? {
          lat: input.pickupCoords.lat,
          lng: input.pickupCoords.lng,
          label: input.pickup
        }
      : null,
    destinationPoint: input.destinationCoords
      ? {
          lat: input.destinationCoords.lat,
          lng: input.destinationCoords.lng,
          label: input.destination
        }
      : null,
    fareProfile: {
      baseFareGhs: vehicleProfile.baseFareGhs,
      minimumFareGhs: vehicleProfile.baseFareGhs,
      distanceRateGhs: vehicleProfile.serviceKind === "PRIVATE" ? 2.65 : 2.15,
      timeRateGhs: vehicleProfile.serviceKind === "PRIVATE" ? 0.5 : 0.35,
      serviceFeeGhs: vehicleProfile.serviceKind === "PRIVATE" ? 3 : 2
    }
  });

  const ride = await prisma.ride.create({
    data: {
      status: "SEARCHING",
      requestSource: input.requestSource ?? "APP",
      pickup: input.pickup,
      destination: input.destination,
      pickupGuidance,
      distanceKm: estimate.distanceKm,
      etaMinutes: estimate.durationMinutes,
      passengers: 1,
      estimatedFareGhs: estimate.fareGhs,
      paymentMethod: input.paymentMethod,
      momoProvider,
      safetyPin,
      trustedContactCount: trustedContacts.length,
      lowBandwidthBooking: input.lowBandwidthBooking ?? false,
      passengerId: passenger.id,
      vehicleId: vehicleProfile.id
    }
  });

  realtimeGateway.emitRideRequested({
    rideId: ride.id,
    passengerId: passenger.id,
    pickup: ride.pickup,
    destination: ride.destination,
    fareGhs: ride.estimatedFareGhs,
    etaMinutes: ride.etaMinutes
  });

  const payment =
    input.paymentMethod === "MOMO" && momoProvider
      ? await initiateRidePayment({
          rideId: ride.id,
          userId: passenger.id,
          name: passenger.name,
          phone: passenger.phone,
          amountGhs: estimate.fareGhs,
          provider: momoProvider
        })
      : {
          provider: "Cash",
          reference: null,
          status: "accepted" as const,
          authorizationUrl: null,
          accessCode: null,
          message: "Payment will be collected in cash at the end of the trip."
        };

  if (payment.reference) {
    await prisma.ride.update({
      where: { id: ride.id },
      data: {
        momoReference: payment.reference
      }
    });
  }

  return {
    ride,
    passenger,
    estimate,
    safety: {
      safetyPin,
      pickupGuidance,
      trustedContactCount: trustedContacts.length,
      shareTripLive: safetyShareEnabled
    },
    payment: {
      method: input.paymentMethod,
      provider: payment.provider,
      status: payment.status,
      authorizationUrl: payment.authorizationUrl ?? null,
      accessCode: payment.accessCode ?? null,
      momoProvider,
      momoReference: payment.reference,
      message: payment.message
    }
  };
}
