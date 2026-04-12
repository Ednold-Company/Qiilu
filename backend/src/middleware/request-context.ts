import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";

export type RequestWithContext = Request & {
  requestId?: string;
};

export function requestContext(request: RequestWithContext, response: Response, next: NextFunction) {
  const incoming = request.headers["x-request-id"];
  const requestId =
    typeof incoming === "string" && incoming.trim().length > 0
      ? incoming.trim()
      : crypto.randomUUID();

  request.requestId = requestId;
  response.setHeader("x-request-id", requestId);
  next();
}
