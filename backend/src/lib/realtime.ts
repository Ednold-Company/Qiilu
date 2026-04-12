import type { IncomingMessage } from "node:http";
import { WebSocket } from "ws";
import { verifyAuthToken } from "./auth.js";
import { estimateRoute } from "./routing.js";

type Role = "ADMIN" | "PASSENGER" | "DRIVER";

type ClientContext = {
  socket: WebSocket;
  userId: string;
  role: Role;
};

type RealtimeEnvelope = {
  type: string;
  payload?: Record<string, unknown>;
  message?: string;
};

type TrackingSession = {
  interval: NodeJS.Timeout;
};

class RealtimeGateway {
  private clients = new Map<string, ClientContext>();
  private tracking = new Map<string, TrackingSession>();

  isUserConnected(userId: string, role?: Role) {
    for (const client of this.clients.values()) {
      if (client.userId === userId && (!role || client.role === role) && client.socket.readyState === WebSocket.OPEN) {
        return true;
      }
    }

    return false;
  }

  registerConnection(socket: WebSocket, request: IncomingMessage) {
    const requestUrl = new URL(request.url ?? "/realtime", "http://localhost:4000");
    const token = requestUrl.searchParams.get("token");

    if (!token) {
      socket.close(1008, "Missing token");
      return;
    }

    try {
      const auth = verifyAuthToken(token);
      const clientId = `${auth.userId}:${Math.random().toString(36).slice(2, 8)}`;
      this.clients.set(clientId, {
        socket,
        userId: auth.userId,
        role: auth.role
      });

      this.send(socket, {
        type: "welcome",
        message: "Connected to Qiilu realtime gateway",
        payload: {
          userId: auth.userId,
          role: auth.role
        }
      });

      socket.on("close", () => {
        this.clients.delete(clientId);
      });
    } catch {
      socket.close(1008, "Invalid token");
    }
  }

  emitRideRequested(payload: {
    rideId: string;
    passengerId: string;
    pickup: string;
    destination: string;
    fareGhs: number;
    etaMinutes: number;
  }) {
    this.sendToUser(payload.passengerId, {
      type: "ride.searching",
      payload
    });

    this.broadcastToRole("DRIVER", {
      type: "driver.queue.updated",
      payload: {
        rideId: payload.rideId
      }
    });
  }

  broadcastQueueRefresh() {
    this.broadcastToRole("DRIVER", {
      type: "driver.queue.updated",
      payload: {
        refreshedAt: new Date().toISOString()
      }
    });
  }

  emitRideAccepted(payload: {
    rideId: string;
    passengerId: string;
    driverId: string;
    driverName: string;
    pickup: string;
    destination: string;
    etaMinutes: number;
    fareGhs: number;
    safetyPin?: string | null;
  }) {
    this.sendToUser(payload.passengerId, {
      type: "ride.accepted",
      payload
    });

    this.sendToUser(payload.driverId, {
      type: "ride.assigned",
      payload
    });

    this.broadcastToRole("DRIVER", {
      type: "driver.queue.updated",
      payload: {
        rideId: payload.rideId
      }
    });

    this.startTracking({
      rideId: payload.rideId,
      passengerId: payload.passengerId,
      driverId: payload.driverId,
      pickup: payload.pickup,
      destination: payload.destination,
      stage: "ACCEPTED"
    });
  }

  emitRideCancelled(payload: {
    rideId: string;
    passengerId?: string | null;
    driverId?: string | null;
  }) {
    if (payload.passengerId) {
      this.sendToUser(payload.passengerId, {
        type: "ride.cancelled",
        payload
      });
    }

    if (payload.driverId) {
      this.sendToUser(payload.driverId, {
        type: "ride.cancelled",
        payload
      });
    }

    this.broadcastToRole("DRIVER", {
      type: "driver.queue.updated",
      payload: {
        rideId: payload.rideId
      }
    });

    this.stopTracking(payload.rideId);
  }

  emitRideStageUpdated(payload: {
    rideId: string;
    passengerId?: string | null;
    driverId?: string | null;
    status: string;
  }) {
    if (payload.passengerId) {
      this.sendToUser(payload.passengerId, {
        type: "ride.stage.updated",
        payload
      });
    }

    if (payload.driverId) {
      this.sendToUser(payload.driverId, {
        type: "ride.stage.updated",
        payload
      });
    }
  }

  emitChatMessage(payload: {
    rideId: string;
    passengerId: string;
    driverId: string;
    message: {
      id: string;
      body: string;
      createdAt: string;
      senderId: string;
      senderName: string;
      senderRole: Role;
      readAt?: string | null;
    };
  }) {
    this.sendToUser(payload.passengerId, {
      type: "chat.message",
      payload
    });

    this.sendToUser(payload.driverId, {
      type: "chat.message",
      payload
    });
  }

  async startTracking(input: {
    rideId: string;
    passengerId: string;
    driverId: string;
    pickup: string;
    destination: string;
    stage: "ACCEPTED" | "IN_PROGRESS";
  }) {
    this.stopTracking(input.rideId);

    try {
      const estimate = await estimateRoute(input.pickup, input.destination);
      const points = estimate.route.length > 1 ? estimate.route : [[estimate.pickup.lat, estimate.pickup.lng], [estimate.destination.lat, estimate.destination.lng]];
      const startIndex = input.stage === "ACCEPTED" ? 0 : Math.min(1, points.length - 1);
      let currentIndex = startIndex;

      const interval = setInterval(() => {
        if (currentIndex >= points.length) {
          clearInterval(interval);
          this.tracking.delete(input.rideId);
          return;
        }

        const [lat, lng] = points[currentIndex];
        const payload = {
          rideId: input.rideId,
          lat,
          lng,
          stage: input.stage,
          progress: Number((currentIndex / Math.max(1, points.length - 1)).toFixed(2))
        };

        this.sendToUser(input.passengerId, {
          type: "driver.location",
          payload
        });
        this.sendToUser(input.driverId, {
          type: "driver.location",
          payload
        });

        currentIndex += 1;
      }, 3500);

      this.tracking.set(input.rideId, { interval });
    } catch {
      // If routing fails at realtime start, leave websocket connected without location stream.
    }
  }

  stopTracking(rideId: string) {
    const existing = this.tracking.get(rideId);

    if (existing) {
      clearInterval(existing.interval);
      this.tracking.delete(rideId);
    }
  }

  private broadcastToRole(role: Role, envelope: RealtimeEnvelope) {
    for (const client of this.clients.values()) {
      if (client.role === role) {
        this.send(client.socket, envelope);
      }
    }
  }

  private sendToUser(userId: string, envelope: RealtimeEnvelope) {
    for (const client of this.clients.values()) {
      if (client.userId === userId) {
        this.send(client.socket, envelope);
      }
    }
  }

  private send(socket: WebSocket, envelope: RealtimeEnvelope) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(envelope));
    }
  }
}

export const realtimeGateway = new RealtimeGateway();
