import { Router } from "express";
import {
  IncidentStatus,
  KycSubmissionStatus,
  PayoutStatus,
  RideStatus
} from "@prisma/client";
import { getAdminMetricsHistory } from "../lib/admin-metrics.js";
import { logAdminAction } from "../lib/audit-log.js";
import { prisma } from "../lib/prisma.js";
import { markPayoutPaid } from "../lib/payments.js";
import {
  requireAuth,
  requireRole,
  type AuthenticatedRequest
} from "../middleware/auth.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole("ADMIN"));

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function mergeKycReviewNotes(existingNotes: string | null, reviewerNotes?: string) {
  const trimmedReviewerNotes = reviewerNotes?.trim() || null;

  if (!existingNotes) {
    return trimmedReviewerNotes;
  }

  try {
    const parsed = JSON.parse(existingNotes) as Record<string, unknown>;
    return JSON.stringify({
      ...parsed,
      notes: trimmedReviewerNotes
    });
  } catch {
    return trimmedReviewerNotes ?? existingNotes;
  }
}

adminRouter.get("/summary", async (_request: AuthenticatedRequest, response) => {
  const [users, rides, payouts, incidents, kycs, driversOnline] = await Promise.all([
    prisma.user.groupBy({
      by: ["role"],
      _count: { _all: true }
    }),
    prisma.ride.groupBy({
      by: ["status"],
      _count: { _all: true }
    }),
    prisma.payoutRequest.groupBy({
      by: ["status"],
      _count: { _all: true }
    }),
    prisma.supportIncident.groupBy({
      by: ["status"],
      _count: { _all: true }
    }),
    prisma.kycSubmission.groupBy({
      by: ["status"],
      _count: { _all: true }
    }),
    prisma.user.count({
      where: {
        role: "DRIVER",
        availability: {
          in: ["AVAILABLE", "ON_TRIP"]
        }
      }
    })
  ]);

  response.json({
    users,
    rides,
    payouts,
    incidents,
    kycs,
    driversOnline
  });
});

adminRouter.get("/metrics-history", async (request: AuthenticatedRequest, response) => {
  const rawLimit = request.query.limit;
  const limitText = Array.isArray(rawLimit)
    ? (typeof rawLimit[0] === "string" ? rawLimit[0] : undefined)
    : (typeof rawLimit === "string" ? rawLimit : undefined);
  const limitValue = Number.parseInt(limitText ?? "", 10);
  const limit = Number.isFinite(limitValue) ? limitValue : 24;
  const snapshots = await getAdminMetricsHistory(limit);

  response.json({
    snapshots: snapshots.map((snapshot) => ({
      at: snapshot.createdAt.toISOString(),
      driversOnline: snapshot.driversOnline,
      liveRides: snapshot.liveRides,
      pendingKyc: snapshot.pendingKyc,
      pendingPayouts: snapshot.pendingPayouts,
      openIncidents: snapshot.openIncidents
    }))
  });
});

adminRouter.get("/dispatch", async (_request: AuthenticatedRequest, response) => {
  const [liveRides, drivers] = await Promise.all([
    prisma.ride.findMany({
      where: {
        status: {
          in: [RideStatus.SEARCHING, RideStatus.ACCEPTED, RideStatus.IN_PROGRESS]
        }
      },
      orderBy: { createdAt: "desc" },
      take: 25,
      include: {
        passenger: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            availability: true
          }
        },
        vehicle: true
      }
    }),
    prisma.user.findMany({
      where: { role: "DRIVER" },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: {
        id: true,
        name: true,
        phone: true,
        availability: true,
        kycStatus: true,
        lastKnownLat: true,
        lastKnownLng: true,
        lastSeenAt: true
      }
    })
  ]);

  response.json({
    liveRides,
    drivers
  });
});

adminRouter.get("/kyc", async (_request: AuthenticatedRequest, response) => {
  const submissions = await prisma.kycSubmission.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          role: true
        }
      }
    }
  });

  response.json({ submissions });
});

adminRouter.post("/kyc/:submissionId/review", async (request: AuthenticatedRequest, response) => {
  const body = request.body as {
    status?: "APPROVED" | "REJECTED";
    notes?: string;
  };

  if (!body.status || ![KycSubmissionStatus.APPROVED, KycSubmissionStatus.REJECTED].includes(body.status)) {
    response.status(400).json({ message: "A review status of APPROVED or REJECTED is required" });
    return;
  }

  const submissionId = getParam(request.params.submissionId);

  if (!submissionId) {
    response.status(400).json({ message: "Submission id is required" });
    return;
  }

  const existingSubmission = await prisma.kycSubmission.findUnique({
    where: { id: submissionId },
    select: {
      id: true,
      userId: true,
      notes: true
    }
  });

  if (!existingSubmission) {
    response.status(404).json({ message: "KYC submission not found" });
    return;
  }

  const submission = await prisma.kycSubmission.update({
    where: { id: submissionId },
    data: {
      status: body.status,
      notes: mergeKycReviewNotes(existingSubmission.notes, body.notes),
      reviewedAt: new Date(),
      reviewedBy: request.auth!.userId
    }
  });

  await prisma.user.update({
    where: { id: existingSubmission.userId },
    data: {
      kycStatus: body.status
    }
  });

  logAdminAction({
    requestId: request.requestId,
    actorId: request.auth!.userId,
    action: "kyc.review",
    targetType: "kyc_submission",
    targetId: submission.id,
    metadata: { status: body.status }
  });

  response.json({
    message: `KYC ${body.status.toLowerCase()} successfully`,
    submission
  });
});

adminRouter.get("/payouts", async (_request: AuthenticatedRequest, response) => {
  const payouts = await prisma.payoutRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      wallet: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true
            }
          }
        }
      }
    }
  });

  response.json({ payouts });
});

adminRouter.post("/payouts/:payoutId/process", async (_request: AuthenticatedRequest, response) => {
  const payoutId = getParam(_request.params.payoutId);

  if (!payoutId) {
    response.status(400).json({ message: "Payout id is required" });
    return;
  }

  const payout = await prisma.payoutRequest.update({
    where: { id: payoutId },
    data: { status: PayoutStatus.PROCESSING }
  });

  logAdminAction({
    requestId: _request.requestId,
    actorId: _request.auth!.userId,
    action: "payout.process",
    targetType: "payout_request",
    targetId: payout.id,
    metadata: { status: "PROCESSING" }
  });

  response.json({
    message: "Payout moved into processing",
    payout
  });
});

adminRouter.post("/payouts/:payoutId/approve", async (request: AuthenticatedRequest, response) => {
  const body = request.body as { reviewerNotes?: string };
  const payoutId = getParam(request.params.payoutId);

  if (!payoutId) {
    response.status(400).json({ message: "Payout id is required" });
    return;
  }

  const providerResult = await markPayoutPaid(payoutId, body.reviewerNotes);
  logAdminAction({
    requestId: request.requestId,
    actorId: request.auth!.userId,
    action: "payout.approve",
    targetType: "payout_request",
    targetId: payoutId,
    metadata: { reviewerNotes: body.reviewerNotes ?? null }
  });
  response.json({
    message: "Payout marked as paid",
    providerResult
  });
});

adminRouter.post("/payouts/:payoutId/reject", async (request: AuthenticatedRequest, response) => {
  const body = request.body as { reviewerNotes?: string };
  const payoutId = getParam(request.params.payoutId);

  if (!payoutId) {
    response.status(400).json({ message: "Payout id is required" });
    return;
  }

  const payout = await prisma.payoutRequest.findUnique({
    where: { id: payoutId }
  });

  if (!payout) {
    response.status(404).json({ message: "Payout not found" });
    return;
  }

  await prisma.$transaction([
    prisma.payoutRequest.update({
      where: { id: payout.id },
      data: {
        status: PayoutStatus.REJECTED,
        reviewerNotes: body.reviewerNotes?.trim(),
        processedAt: new Date()
      }
    }),
    prisma.wallet.update({
      where: { id: payout.walletId },
      data: {
        balanceGhs: {
          increment: payout.amountGhs
        },
        pendingWithdrawalGhs: {
          decrement: payout.amountGhs
        }
      }
    })
  ]);

  logAdminAction({
    requestId: request.requestId,
    actorId: request.auth!.userId,
    action: "payout.reject",
    targetType: "payout_request",
    targetId: payout.id,
    metadata: { reviewerNotes: body.reviewerNotes?.trim() ?? null }
  });

  response.json({ message: "Payout rejected and funds returned to the wallet" });
});

adminRouter.get("/incidents", async (_request: AuthenticatedRequest, response) => {
  const incidents = await prisma.supportIncident.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      reporter: {
        select: {
          id: true,
          name: true,
          phone: true,
          role: true
        }
      },
      handler: {
        select: {
          id: true,
          name: true
        }
      },
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

adminRouter.post("/incidents/:incidentId/resolve", async (request: AuthenticatedRequest, response) => {
  const body = request.body as {
    status?: "INVESTIGATING" | "RESOLVED" | "CLOSED";
  };
  const nextStatus = body.status ?? "RESOLVED";

  if (![IncidentStatus.INVESTIGATING, IncidentStatus.RESOLVED, IncidentStatus.CLOSED].includes(nextStatus)) {
    response.status(400).json({ message: "Invalid incident status" });
    return;
  }

  const incidentId = getParam(request.params.incidentId);

  if (!incidentId) {
    response.status(400).json({ message: "Incident id is required" });
    return;
  }

  const incident = await prisma.supportIncident.update({
    where: { id: incidentId },
    data: {
      status: nextStatus,
      handlerId: request.auth!.userId
    }
  });

  logAdminAction({
    requestId: request.requestId,
    actorId: request.auth!.userId,
    action: "incident.resolve",
    targetType: "support_incident",
    targetId: incident.id,
    metadata: { status: nextStatus }
  });

  response.json({
    message: `Incident moved to ${nextStatus.toLowerCase()}`,
    incident
  });
});
