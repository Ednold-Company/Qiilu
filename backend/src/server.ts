import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import { app } from "./app.js";
import { validateRuntimeEnv } from "./lib/env.js";
import { captureException, flushMonitoring, initMonitoring } from "./lib/monitoring.js";
import { realtimeGateway } from "./lib/realtime.js";

validateRuntimeEnv();
initMonitoring();

const host = process.env.HOST ?? "0.0.0.0";
const port = Number(process.env.PORT ?? 4000);
const server = createServer(app);
const wss = new WebSocketServer({ server, path: "/realtime" });

process.on("unhandledRejection", (reason) => {
  captureException(reason instanceof Error ? reason : new Error(String(reason)), {
    scope: "process.unhandledRejection"
  });
});

process.on("uncaughtException", async (error) => {
  captureException(error, {
    scope: "process.uncaughtException"
  });

  await flushMonitoring();
  process.exit(1);
});

wss.on("connection", (socket, request) => {
  realtimeGateway.registerConnection(socket, request);
});

server.on("error", async (error) => {
  captureException(error, {
    scope: "server.error",
    host,
    port
  });

  await flushMonitoring();
  throw error;
});

server.listen(port, host, () => {
  console.log(`Qiilu backend listening on ${host}:${port} (${process.env.NODE_ENV ?? "development"})`);
});
