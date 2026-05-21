import { Router } from "express";
import { requireRole } from "../middleware/auth.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

export const supportRouter = Router();

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

supportRouter.post("/incidents", requireAuth, async (request: AuthenticatedRequest, response) => {
  const body = request.body as {
    rideId?: string;
    category?: string;
    severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    description?: string;
  };

  if (!body.category || !body.description) {
    response.status(400).json({ message: "Category and description are required" });
    return;
  }

  const incident = await prisma.supportIncident.create({
    data: {
      rideId: body.rideId,
      reporterId: request.auth!.userId,
      category: body.category,
      severity: body.severity ?? "MEDIUM",
      description: body.description
    }
  });

  response.status(201).json({
    message: "Incident report submitted",
    incident
  });
});

supportRouter.post("/incidents/emergency", requireAuth, async (request: AuthenticatedRequest, response) => {
  const body = request.body as {
    rideId?: string;
    lat?: number;
    lng?: number;
    note?: string;
  };

  const ride = body.rideId
    ? await prisma.ride.findUnique({
        where: { id: body.rideId },
        include: {
          passenger: {
            select: { id: true, name: true, phone: true }
          },
          driver: {
            select: { id: true, name: true, phone: true }
          }
        }
      })
    : null;

  if (body.rideId && !ride) {
    response.status(404).json({ message: "Ride not found for emergency report" });
    return;
  }

  if (ride && ride.passengerId !== request.auth!.userId && ride.driverId !== request.auth!.userId) {
    response.status(403).json({ message: "You can only raise an emergency for your own ride" });
    return;
  }

  const locationText =
    typeof body.lat === "number" && typeof body.lng === "number"
      ? `Location snapshot: ${body.lat.toFixed(6)}, ${body.lng.toFixed(6)}`
      : "Location snapshot: unavailable";

  const incident = await prisma.supportIncident.create({
    data: {
      rideId: ride?.id,
      reporterId: request.auth!.userId,
      category: "EMERGENCY",
      severity: "CRITICAL",
      description: [
        "Emergency button pressed.",
        body.note?.trim() ? `Note: ${body.note.trim()}` : null,
        locationText,
        ride ? `Ride: ${ride.pickup} to ${ride.destination} (${ride.status})` : null,
        ride?.passenger ? `Passenger: ${ride.passenger.name} ${ride.passenger.phone ?? ""}` : null,
        ride?.driver ? `Driver: ${ride.driver.name} ${ride.driver.phone ?? ""}` : null
      ].filter(Boolean).join("\n")
    }
  });

  response.status(201).json({
    message: "Emergency alert submitted to Qiilu safety operations",
    incident
  });
});

supportRouter.get("/incidents", requireAuth, async (request: AuthenticatedRequest, response) => {
  const where =
    request.auth?.role === "ADMIN"
      ? undefined
      : {
          reporterId: request.auth!.userId
        };

  const incidents = await prisma.supportIncident.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      ride: {
        select: {
          id: true,
          pickup: true,
          destination: true,
          status: true
        }
      }
    }
  });

  response.json({ incidents });
});

supportRouter.post(
  "/incidents/:incidentId/claim",
  requireAuth,
  requireRole("ADMIN"),
  async (request: AuthenticatedRequest, response) => {
    const incidentId = getParam(request.params.incidentId);

    if (!incidentId) {
      response.status(400).json({ message: "Incident id is required" });
      return;
    }

    const incident = await prisma.supportIncident.update({
      where: { id: incidentId },
      data: {
        handlerId: request.auth!.userId,
        status: "INVESTIGATING"
      }
    });

    response.json({
      message: "Incident assigned to admin handler",
      incident
    });
  }
);
