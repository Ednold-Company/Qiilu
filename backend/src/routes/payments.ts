import { Router } from "express";
import { handlePaystackWebhook, verifyPaystackSignature } from "../lib/payments.js";
import { captureException, captureMessage } from "../lib/monitoring.js";

export const paymentsRouter = Router();

paymentsRouter.post("/", async (request, response) => {
  const signature = request.headers["x-paystack-signature"];
  const header = Array.isArray(signature) ? signature[0] : signature;
  const rawBody = Buffer.isBuffer(request.body) ? request.body : Buffer.from([]);

  if (!verifyPaystackSignature(rawBody, header)) {
    captureMessage("Invalid Paystack webhook signature", "warning", {
      scope: "qiilu.payments.webhook"
    });
    response.status(401).json({ message: "Invalid Paystack signature" });
    return;
  }

  try {
    const event = JSON.parse(rawBody.toString("utf8")) as Parameters<typeof handlePaystackWebhook>[0];
    const result = await handlePaystackWebhook(event);
    captureMessage("Paystack webhook processed", "info", {
      scope: "qiilu.payments.webhook",
      event: event.event,
      result
    });
    response.status(200).json({ received: true, result });
  } catch (error) {
    captureException(error, {
      scope: "qiilu.payments.webhook"
    });
    response.status(400).json({
      message: error instanceof Error ? error.message : "Invalid Paystack webhook payload"
    });
  }
});
