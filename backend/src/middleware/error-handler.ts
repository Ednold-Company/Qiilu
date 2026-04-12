import type { NextFunction, Response } from "express";
import type { RequestWithContext } from "./request-context.js";
import { captureException } from "../lib/monitoring.js";

export function errorHandler(
  error: unknown,
  request: RequestWithContext,
  response: Response,
  _next: NextFunction
) {
  const requestId = request.requestId ?? "unknown";

  console.error(
    JSON.stringify({
      scope: "qiilu.error",
      requestId,
      method: request.method,
      path: request.originalUrl,
      message: error instanceof Error ? error.message : "Internal server error",
      stack: error instanceof Error ? error.stack : undefined
    })
  );

  captureException(error, {
    scope: "qiilu.error",
    requestId,
    method: request.method,
    path: request.originalUrl
  });

  if (response.headersSent) {
    return;
  }

  response.status(500).json({
    message: "Something went wrong. Please try again.",
    requestId
  });
}
