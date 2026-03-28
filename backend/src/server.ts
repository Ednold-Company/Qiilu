import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import { app } from "./app.js";
import { realtimeGateway } from "./lib/realtime.js";

const port = Number(process.env.PORT ?? 4000);
const server = createServer(app);
const wss = new WebSocketServer({ server, path: "/realtime" });

wss.on("connection", (socket, request) => {
  realtimeGateway.registerConnection(socket, request);
});

server.listen(port, () => {
  console.log(`Qiilu backend listening on http://localhost:${port}`);
});
