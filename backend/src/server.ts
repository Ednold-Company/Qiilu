import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import { app } from "./app.js";
import { validateRuntimeEnv } from "./lib/env.js";
import { realtimeGateway } from "./lib/realtime.js";

validateRuntimeEnv();

const host = process.env.HOST ?? "0.0.0.0";
const port = Number(process.env.PORT ?? 4000);
const server = createServer(app);
const wss = new WebSocketServer({ server, path: "/realtime" });

wss.on("connection", (socket, request) => {
  realtimeGateway.registerConnection(socket, request);
});

server.listen(port, host, () => {
  console.log(`Qiilu backend listening on ${host}:${port} (${process.env.NODE_ENV ?? "development"})`);
});
