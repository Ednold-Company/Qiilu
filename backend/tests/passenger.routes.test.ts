import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    vehicle: {
      findFirst: vi.fn()
    },
    user: {
      findUnique: vi.fn()
    },
    ride: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn()
    }
  },
  estimateRoute: vi.fn(),
  getRoutingStatus: vi.fn(),
  createRideBooking: vi.fn(),
  requireAuth: vi.fn((req: express.Request, _res: express.Response, next: express.NextFunction) => {
    (req as express.Request & { auth?: { userId: string; role: string; phone: string } }).auth = {
      userId: "passenger-1",
      role: "PASSENGER",
      phone: "+233201111111"
    };
    next();
  }),
  realtimeGateway: {
    emitRideCancelled: vi.fn()
  }
}));

vi.mock("../src/lib/prisma.js", () => ({
  prisma: mocks.prisma
}));

vi.mock("../src/lib/routing.js", () => ({
  estimateRoute: mocks.estimateRoute,
  getRoutingStatus: mocks.getRoutingStatus
}));

vi.mock("../src/lib/ride-booking.js", () => ({
  createRideBooking: mocks.createRideBooking
}));

vi.mock("../src/lib/realtime.js", () => ({
  realtimeGateway: mocks.realtimeGateway
}));

vi.mock("../src/middleware/auth.js", () => ({
  requireAuth: mocks.requireAuth
}));

import { passengerRouter } from "../src/routes/passenger.js";

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use("/passenger", passengerRouter);
  return app;
}

describe("passengerRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a vehicle-aware route estimate", async () => {
    mocks.prisma.vehicle.findFirst.mockResolvedValue({
      id: "vehicle-1",
      active: true,
      baseFareGhs: 12,
      serviceKind: "PRIVATE"
    });
    mocks.estimateRoute.mockResolvedValue({
      provider: "mapbox",
      distanceKm: 8.4,
      durationMinutes: 19,
      fareGhs: 37.2,
      route: [
        [5.6, -0.17],
        [5.61, -0.18]
      ],
      pickup: { lat: 5.6, lng: -0.17, label: "Pickup" },
      destination: { lat: 5.61, lng: -0.18, label: "Destination" }
    });

    const app = createTestApp();
    const response = await request(app).post("/passenger/route-estimate").send({
      pickup: "East Legon",
      destination: "Airport",
      vehicleId: "vehicle-1"
    });

    expect(response.status).toBe(200);
    expect(response.body.estimate.fareGhs).toBe(37.2);
    expect(mocks.estimateRoute).toHaveBeenCalledWith(
      "East Legon",
      "Airport",
      expect.objectContaining({
        fareProfile: expect.objectContaining({
          baseFareGhs: 12
        })
      })
    );
  });

  it("creates a ride booking with the selected vehicle", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue({
      id: "passenger-1",
      preferredPayment: "MOMO",
      momoProvider: "MTN MoMo",
      trustedContacts: [],
      lowBandwidthMode: false,
      safetyShareEnabled: true
    });
    mocks.createRideBooking.mockResolvedValue({
      ride: {
        id: "ride-1",
        status: "SEARCHING"
      },
      payment: null,
      safety: {
        trustedContacts: [],
        safetyShareEnabled: true
      },
      estimate: {
        provider: "mapbox",
        distanceKm: 5.2,
        durationMinutes: 13,
        fareGhs: 22.4,
        route: [],
        pickup: { lat: 5.6, lng: -0.17, label: "East Legon" },
        destination: { lat: 5.61, lng: -0.18, label: "Airport" }
      }
    });

    const app = createTestApp();
    const response = await request(app).post("/passenger/rides").send({
      pickup: "East Legon",
      destination: "Airport",
      vehicleId: "vehicle-1",
      paymentMethod: "MOMO"
    });

    expect(response.status).toBe(201);
    expect(response.body.ride.id).toBe("ride-1");
    expect(mocks.createRideBooking).toHaveBeenCalledWith(
      expect.objectContaining({
        passengerId: "passenger-1",
        vehicleId: "vehicle-1",
        pickup: "East Legon",
        destination: "Airport"
      })
    );
  });
});
