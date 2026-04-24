import { RideStatus } from "@prisma/client";
import { prisma } from "./prisma.js";

const SNAPSHOT_INTERVAL_MS = 5 * 60 * 1000;

type SummaryBucket = {
  role?: string;
  status?: string;
  _count: { _all: number };
};

function getBucketCount(items: SummaryBucket[], key: string) {
  return items.find((item) => item.role === key || item.status === key)?._count._all ?? 0;
}

export async function collectAdminMetrics() {
  const [payouts, incidents, kycs, driversOnline, liveRides] = await Promise.all([
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
    }),
    prisma.ride.count({
      where: {
        status: {
          in: [RideStatus.SEARCHING, RideStatus.ACCEPTED, RideStatus.IN_PROGRESS]
        }
      }
    })
  ]);

  return {
    driversOnline,
    liveRides,
    pendingKyc: getBucketCount(kycs, "PENDING"),
    pendingPayouts: getBucketCount(payouts, "PENDING"),
    openIncidents: getBucketCount(incidents, "OPEN")
  };
}

export async function ensureAdminMetricsSnapshot() {
  const latest = await prisma.adminMetricsSnapshot.findFirst({
    orderBy: { createdAt: "desc" }
  });

  if (latest && Date.now() - latest.createdAt.getTime() < SNAPSHOT_INTERVAL_MS) {
    return latest;
  }

  const metrics = await collectAdminMetrics();

  return prisma.adminMetricsSnapshot.create({
    data: metrics
  });
}

export async function getAdminMetricsHistory(limit = 24) {
  await ensureAdminMetricsSnapshot();

  return prisma.adminMetricsSnapshot.findMany({
    orderBy: { createdAt: "asc" },
    take: Math.max(1, Math.min(limit, 96))
  });
}
