import cors from "cors";
import "dotenv/config";
import express from "express";
import { authRouter } from "./routes/auth.js";
import { driverRouter } from "./routes/driver.js";
import { healthRouter } from "./routes/health.js";
import { passengerRouter } from "./routes/passenger.js";

export const app = express();

const frontendOrigin = process.env.FRONTEND_ORIGIN ?? "http://localhost:3000";

app.use(cors({
  origin: frontendOrigin,
  credentials: true
}));
app.use(express.json());

app.get("/", (_request, response) => {
  response.json({
    service: "Qiilu API",
    version: "0.1.0",
    modules: ["auth", "passenger", "driver", "realtime"]
  });
});

app.use("/health", healthRouter);
app.use("/auth", authRouter);
app.use("/passenger", passengerRouter);
app.use("/driver", driverRouter);
