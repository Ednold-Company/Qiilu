import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  verifyPaystackSignature: vi.fn(),
  handlePaystackWebhook: vi.fn()
}));

vi.mock("../src/lib/payments.js", () => ({
  verifyPaystackSignature: mocks.verifyPaystackSignature,
  handlePaystackWebhook: mocks.handlePaystackWebhook
}));

import { paymentsRouter } from "../src/routes/payments.js";

function createTestApp() {
  const app = express();
  app.use("/payments/webhooks/paystack", express.raw({ type: "application/json" }), paymentsRouter);
  return app;
}

describe("paymentsRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects webhook requests with an invalid signature", async () => {
    mocks.verifyPaystackSignature.mockReturnValue(false);

    const app = createTestApp();
    const response = await request(app)
      .post("/payments/webhooks/paystack")
      .set("Content-Type", "application/json")
      .set("x-paystack-signature", "invalid")
      .send(JSON.stringify({ event: "charge.success" }));

    expect(response.status).toBe(401);
    expect(mocks.handlePaystackWebhook).not.toHaveBeenCalled();
  });

  it("rejects malformed webhook payloads even when the signature is valid", async () => {
    mocks.verifyPaystackSignature.mockReturnValue(true);

    const app = createTestApp();
    const response = await request(app)
      .post("/payments/webhooks/paystack")
      .set("Content-Type", "application/json")
      .set("x-paystack-signature", "valid")
      .send("{not-json}");

    expect(response.status).toBe(400);
    expect(response.body.message).toBeDefined();
  });

  it("accepts a valid webhook payload", async () => {
    mocks.verifyPaystackSignature.mockReturnValue(true);
    mocks.handlePaystackWebhook.mockResolvedValue({
      ignored: false,
      kind: "ride_payment"
    });

    const app = createTestApp();
    const response = await request(app)
      .post("/payments/webhooks/paystack")
      .set("Content-Type", "application/json")
      .set("x-paystack-signature", "valid")
      .send(JSON.stringify({
        event: "charge.success",
        data: {
          reference: "RIDE-123"
        }
      }));

    expect(response.status).toBe(200);
    expect(response.body.received).toBe(true);
    expect(mocks.handlePaystackWebhook).toHaveBeenCalledWith({
      event: "charge.success",
      data: {
        reference: "RIDE-123"
      }
    });
  });
});
