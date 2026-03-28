import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { signAuthToken } from "../lib/auth.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";

export const authRouter = Router();

function setAuthCookies(
  response: {
    cookie: (name: string, value: string, options: Record<string, unknown>) => void;
  },
  role: "PASSENGER" | "DRIVER"
) {
  const secure = process.env.NODE_ENV === "production";
  const baseOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    maxAge: 1000 * 60 * 60 * 24 * 7,
    path: "/"
  };

  response.cookie("qiilu-auth", "1", baseOptions);
  response.cookie("qiilu-role", role, baseOptions);
}

function clearAuthCookies(response: {
  clearCookie: (name: string, options?: Record<string, unknown>) => void;
}) {
  const secure = process.env.NODE_ENV === "production";
  const baseOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/"
  };

  response.clearCookie("qiilu-auth", baseOptions);
  response.clearCookie("qiilu-role", baseOptions);
}

authRouter.post("/signup", async (request, response) => {
  const body = request.body as {
    name?: string;
    phone?: string;
    password?: string;
    role?: string;
  };

  if (!body.name || !body.phone || !body.password || !body.role) {
    response.status(400).json({ message: "Name, phone, password, and role are required" });
    return;
  }

  const role = body.role.toUpperCase() as "PASSENGER" | "DRIVER";
  const existingUser = await prisma.user.findUnique({
    where: { phone: body.phone }
  });

  if (existingUser) {
    response.status(409).json({ message: "An account with that phone already exists" });
    return;
  }

  const user = await prisma.user.create({
    data: {
      name: body.name,
      phone: body.phone,
      role,
      passwordHash: await bcrypt.hash(body.password, 10),
      preferredPayment: role === "PASSENGER" ? "MOMO" : undefined,
      momoProvider: "MTN MoMo",
      trustedContacts: [],
      lowBandwidthMode: false,
      safetyShareEnabled: true,
      kycStatus: role === "DRIVER" ? "pending" : undefined,
      wallet:
        role === "DRIVER"
          ? {
              create: {
                balanceGhs: 0,
                cashGhs: 0,
                momoGhs: 0,
                pendingWithdrawalGhs: 0
              }
            }
          : undefined
    }
  });

  const token = signAuthToken({
    userId: user.id,
    role: user.role,
    phone: user.phone
  });

  setAuthCookies(response, user.role);

  response.status(201).json({
    token,
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role
    }
  });
});

authRouter.post("/login", async (request, response) => {
  const body = request.body as { phone?: string; role?: string; password?: string };

  if (!body.phone || !body.role || !body.password) {
    response.status(400).json({ message: "Phone, role, and password are required" });
    return;
  }

  const user = await prisma.user.findFirst({
    where: {
      phone: body.phone,
      role: body.role?.toUpperCase() as "PASSENGER" | "DRIVER" | undefined
    }
  });

  if (!user) {
    response.status(401).json({
      message: "Invalid credentials"
    });
    return;
  }

  const passwordValid = await bcrypt.compare(body.password, user.passwordHash);

  if (!passwordValid) {
    response.status(401).json({
      message: "Invalid credentials"
    });
    return;
  }

  const token = signAuthToken({
    userId: user.id,
    role: user.role,
    phone: user.phone
  });

  setAuthCookies(response, user.role);

  response.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role
    }
  });
});

authRouter.post("/logout", (_request, response) => {
  clearAuthCookies(response);
  response.json({ message: "Logged out" });
});

authRouter.get("/me", requireAuth, async (request: AuthenticatedRequest, response) => {
  const user = await prisma.user.findUnique({
    where: { id: request.auth?.userId }
  });

  if (!user) {
    response.status(404).json({ message: "User not found" });
    return;
  }

  response.json({
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      preferredPayment: user.preferredPayment,
      momoProvider: user.momoProvider,
      trustedContacts: Array.isArray(user.trustedContacts) ? user.trustedContacts : [],
      lowBandwidthMode: user.lowBandwidthMode,
      safetyShareEnabled: user.safetyShareEnabled
    }
  });
});
