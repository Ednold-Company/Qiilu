import type { NextFunction, Response } from "express";
import type { RequestWithContext } from "./request-context.js";

export function requestLog(request: RequestWithContext, response: Response, next: NextFunction) {
  const startedAt = Date.now();

  response.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    console.log(
      `[qiilu] [${request.requestId ?? "no-id"}] ${request.method} ${request.originalUrl} ${response.statusCode} ${durationMs}ms`
    );
  });

  next();
}
