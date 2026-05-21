import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { getRoutingStatus } from "../lib/routing.js";

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

healthRouter.get("/dependencies", async (_request, response) => {
  const snapshot = await getHealthSnapshot();
  const routing = getRoutingStatus();
  const paymentProvider = (process.env.PAYMENT_PROVIDER ?? "mock").trim().toLowerCase();
  const mailMode = (process.env.MAIL_MODE ?? "smtp").trim().toLowerCase();

  const dependencies = {
    database: snapshot.database,
    routing: routing.primaryProvider === "mapbox" && !routing.mapboxConfigured ? "degraded" : "up",
    payments: paymentProvider === "paystack"
      ? (process.env.PAYSTACK_SECRET_KEY ? "up" : "degraded")
      : "mock",
    email: mailMode === "mock"
      ? "mock"
      : ((process.env.SMTP_HOST && process.env.SMTP_USER) || process.env.GMAIL_OAUTH_REFRESH_TOKEN ? "configured" : "degraded"),
    realtime: "up"
  };

  const degraded = Object.values(dependencies).some((value) => value === "down" || value === "degraded");

  response.status(degraded ? 503 : 200).json({
    status: degraded ? "degraded" : "ok",
    service: "qiilu-backend",
    dependencies,
    routing,
    timestamp: new Date().toISOString()
  });
});
