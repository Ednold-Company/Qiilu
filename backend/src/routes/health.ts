import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const healthRouter = Router();

async function getHealthSnapshot() {
  const startedAt = Date.now();
  let database = "down";

  try {
    await prisma.$queryRaw`SELECT 1`;
    database = "up";
  } catch {
    database = "down";
  }

  return {
    status: database === "up" ? "ok" : "degraded",
    service: "qiilu-backend",
    database,
    environment: process.env.NODE_ENV ?? "development",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    latencyMs: Date.now() - startedAt
  };
}

healthRouter.get("/", async (_request, response) => {
  response.json(await getHealthSnapshot());
});

healthRouter.get("/live", (_request, response) => {
  response.json({
    status: "ok",
    service: "qiilu-backend",
    environment: process.env.NODE_ENV ?? "development",
    timestamp: new Date().toISOString()
  });
});

healthRouter.get("/ready", async (_request, response) => {
  const snapshot = await getHealthSnapshot();
  response.status(snapshot.database === "up" ? 200 : 503).json(snapshot);
});
