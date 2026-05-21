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
  const errorStatus = typeof error === "object" && error !== null && "status" in error && typeof error.status === "number"
    ? error.status
    : null;
  const errorType = typeof error === "object" && error !== null && "type" in error && typeof error.type === "string"
    ? error.type
    : null;

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

  if (errorStatus === 413 || errorType === "entity.too.large") {
    response.status(413).json({
      message: "The uploaded files are too large. Please use clearer but smaller photos and try again.",
      requestId
    });
    return;
  }

  response.status(500).json({
    message: "Something went wrong. Please try again.",
    requestId
  });
}
