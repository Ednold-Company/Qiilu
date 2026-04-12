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
