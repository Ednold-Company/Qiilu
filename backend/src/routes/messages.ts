import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { realtimeGateway } from "../lib/realtime.js";

export const messagesRouter = Router();

type Role = "PASSENGER" | "DRIVER";

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function getRideConversationForUser(rideId: string, userId: string, role: Role) {
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
    include: {
      passenger: {
        select: {
          id: true,
          name: true,
          phone: true,
          role: true
        }
      },
      driver: {
        select: {
          id: true,
          name: true,
          phone: true,
          role: true
        }
      }
    }
  });

  if (!ride || !ride.driver) {
    return null;
  }

  const isPassenger = ride.passengerId === userId;
  const isDriver = ride.driverId === userId;

  if (!isPassenger && !isDriver) {
    return null;
  }

  const otherParticipant = isPassenger ? ride.driver : ride.passenger;

  return {
    ride,
    otherParticipant,
    currentRole: role
  };
}

messagesRouter.get("/conversations", requireAuth, async (request: AuthenticatedRequest, response) => {
  const auth = request.auth!;

  const rides = await prisma.ride.findMany({
    where: {
      OR: [{ passengerId: auth.userId }, { driverId: auth.userId }],
      driverId: { not: null }
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    include: {
      passenger: {
        select: {
          id: true,
          name: true,
          phone: true,
          role: true
        }
      },
      driver: {
        select: {
          id: true,
          name: true,
          phone: true,
          role: true
        }
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              role: true
            }
          }
        }
      }
    }
  });

  const conversations = await Promise.all(
    rides.map(async (ride) => {
      const unreadCount = await prisma.rideMessage.count({
        where: {
          rideId: ride.id,
          senderId: { not: auth.userId },
          readAt: null
        }
      });

      const latestMessage = ride.messages[0] ?? null;
      const otherParticipant = ride.passengerId === auth.userId ? ride.driver : ride.passenger;

      return {
        rideId: ride.id,
        status: ride.status,
        pickup: ride.pickup,
        destination: ride.destination,
        updatedAt: ride.updatedAt,
        otherParticipant,
        unreadCount,
        latestMessage: latestMessage
          ? {
              id: latestMessage.id,
              body: latestMessage.body,
              createdAt: latestMessage.createdAt,
              senderId: latestMessage.senderId,
              senderName: latestMessage.sender.name,
              senderRole: latestMessage.sender.role,
              readAt: latestMessage.readAt
            }
          : null
      };
    })
  );

  response.json({ conversations });
});

messagesRouter.get(
  "/conversations/:rideId",
  requireAuth,
  async (request: AuthenticatedRequest, response) => {
    const auth = request.auth!;
    const rideId = getParam(request.params.rideId);

    if (!rideId) {
      response.status(400).json({ message: "Ride id is required" });
      return;
    }

    const context = await getRideConversationForUser(
      rideId,
      auth.userId,
      auth.role as Role
    );

    if (!context) {
      response.status(404).json({ message: "Conversation not found" });
      return;
    }

    await prisma.rideMessage.updateMany({
      where: {
        rideId,
        senderId: { not: auth.userId },
        readAt: null
      },
      data: {
        readAt: new Date()
      }
    });

    const messages = await prisma.rideMessage.findMany({
      where: { rideId },
      orderBy: { createdAt: "asc" },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    });

    response.json({
      conversation: {
        rideId: context.ride.id,
        status: context.ride.status,
        pickup: context.ride.pickup,
        destination: context.ride.destination,
        otherParticipant: context.otherParticipant
      },
      messages: messages.map((message: (typeof messages)[number]) => ({
        id: message.id,
        body: message.body,
        createdAt: message.createdAt,
        readAt: message.readAt,
        sender: {
          id: message.sender.id,
          name: message.sender.name,
          role: message.sender.role
        },
        isMine: message.senderId === auth.userId
      }))
    });
  }
);

messagesRouter.post(
  "/conversations/:rideId",
  requireAuth,
  async (request: AuthenticatedRequest, response) => {
    const auth = request.auth!;
    const rideId = getParam(request.params.rideId);
    const body = request.body as { body?: string };
    const messageBody = body.body?.trim();

    if (!rideId) {
      response.status(400).json({ message: "Ride id is required" });
      return;
    }

    if (!messageBody) {
      response.status(400).json({ message: "Message body is required" });
      return;
    }

    const context = await getRideConversationForUser(
      rideId,
      auth.userId,
      auth.role as Role
    );

    if (!context) {
      response.status(404).json({ message: "Conversation not found" });
      return;
    }

    const message = await prisma.rideMessage.create({
      data: {
        rideId,
        senderId: auth.userId,
        body: messageBody
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    });

    realtimeGateway.emitChatMessage({
      rideId,
      passengerId: context.ride.passengerId,
      driverId: context.ride.driverId!,
      message: {
        id: message.id,
        body: message.body,
        createdAt: message.createdAt.toISOString(),
        senderId: message.sender.id,
        senderName: message.sender.name,
        senderRole: message.sender.role,
        readAt: message.readAt?.toISOString() ?? null
      }
    });

    response.status(201).json({
      message: {
        id: message.id,
        body: message.body,
        createdAt: message.createdAt,
        readAt: message.readAt,
        sender: {
          id: message.sender.id,
          name: message.sender.name,
          role: message.sender.role
        },
        isMine: true
      }
    });
  }
);
