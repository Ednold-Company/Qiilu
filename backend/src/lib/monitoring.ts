import * as Sentry from "@sentry/node";

type MonitoringContext = Record<string, unknown>;

let monitoringEnabled = false;

function parseSampleRate(value: string | undefined, fallback: number) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    return fallback;
  }

  return parsed;
}

export function initMonitoring() {
  const dsn = process.env.SENTRY_DSN?.trim();

  if (!dsn) {
    monitoringEnabled = false;
    return { enabled: false };
  }

  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? "development",
    tracesSampleRate: parseSampleRate(process.env.SENTRY_TRACES_SAMPLE_RATE, 0),
    sendDefaultPii: false
  });

  monitoringEnabled = true;

  return {
    enabled: true
  };
}

export function captureException(error: unknown, context: MonitoringContext = {}) {
  if (!monitoringEnabled) {
    return;
  }

  Sentry.withScope((scope) => {
    for (const [key, value] of Object.entries(context)) {
      scope.setExtra(key, value);
    }

    if (typeof context.requestId === "string") {
      scope.setTag("request_id", context.requestId);
    }

    Sentry.captureException(error);
  });
}

export function captureMessage(
  message: string,
  level: "info" | "warning" | "error" = "info",
  context: MonitoringContext = {}
) {
  if (!monitoringEnabled) {
    return;
  }

  Sentry.withScope((scope) => {
    scope.setLevel(level);

    for (const [key, value] of Object.entries(context)) {
      scope.setExtra(key, value);
    }

    Sentry.captureMessage(message);
  });
}

export async function flushMonitoring(timeout = 2_000) {
  if (!monitoringEnabled) {
    return true;
  }

  return Sentry.close(timeout);
}
