import type { NextFunction, Request, Response } from "express";
import { verifyAuthToken } from "../lib/auth.js";
import type { UserRole } from "@prisma/client";
import type { RequestWithContext } from "./request-context.js";

export type AuthenticatedRequest = RequestWithContext & {
  auth?: {
    userId: string;
    role: UserRole;
    phone: string;
  };
};

export function requireAuth(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    response.status(401).json({ message: "Missing or invalid authorization header" });
    return;
  }

  try {
    request.auth = verifyAuthToken(authHeader.slice(7));
    next();
  } catch {
    response.status(401).json({ message: "Invalid or expired token" });
  }
}

export function requireRole(...roles: UserRole[]) {
  return (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
    if (!request.auth) {
      response.status(401).json({ message: "Authentication required" });
      return;
    }

    if (!roles.includes(request.auth.role)) {
      response.status(403).json({ message: "Forbidden" });
      return;
    }

    next();
  };
}
