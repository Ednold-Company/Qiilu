import cors from "cors";
import "dotenv/config";
import express from "express";
import { requestLog } from "./middleware/request-log.js";
import { rateLimit } from "./middleware/rate-limit.js";
import { getFrontendOrigins } from "./lib/env.js";
import { authRouter } from "./routes/auth.js";
import { adminRouter } from "./routes/admin.js";
import { driverRouter } from "./routes/driver.js";
import { healthRouter } from "./routes/health.js";
import { passengerRouter } from "./routes/passenger.js";
import { paymentsRouter } from "./routes/payments.js";
import { messagesRouter } from "./routes/messages.js";
import { supportRouter } from "./routes/support.js";
import { ussdRouter } from "./routes/ussd.js";

export const app = express();

const frontendOrigins = getFrontendOrigins();

app.use(cors({
  origin(origin, callback) {
    if (!origin || frontendOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true
}));
app.set("trust proxy", 1);
app.use(requestLog);
app.use(rateLimit({ windowMs: 60_000, max: 180 }));
app.use("/payments/webhooks/paystack", express.raw({ type: "application/json" }), paymentsRouter);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", (_request, response) => {
  response.json({
    service: "Qiilu API",
    version: "0.1.0",
    modules: ["auth", "passenger", "driver", "messages", "admin", "support", "payments", "realtime", "ussd"]
  });
});

app.use("/health", healthRouter);
app.use("/auth", authRouter);
app.use("/passenger", passengerRouter);
app.use("/driver", driverRouter);
app.use("/messages", messagesRouter);
app.use("/admin", adminRouter);
app.use("/support", supportRouter);
app.use("/ussd", ussdRouter);
