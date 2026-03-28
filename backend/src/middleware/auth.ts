import type { NextFunction, Request, Response } from "express";
import { verifyAuthToken } from "../lib/auth.js";

export type AuthenticatedRequest = Request & {
  auth?: {
    userId: string;
    role: "PASSENGER" | "DRIVER";
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
