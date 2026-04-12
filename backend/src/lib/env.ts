const production = process.env.NODE_ENV === "production";

function requireEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

export function isProduction() {
  return production;
}

export function getFrontendOrigins() {
  return (process.env.FRONTEND_ORIGIN ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function validateRuntimeEnv() {
  requireEnv("DATABASE_URL");

  const jwtSecret = requireEnv("JWT_SECRET");

  if (production && jwtSecret.length < 24) {
    throw new Error("JWT_SECRET must be at least 24 characters in production");
  }

  requireEnv("FRONTEND_ORIGIN");

  const otpProvider = (process.env.OTP_PROVIDER ?? "console").trim().toLowerCase();

  if (production && otpProvider === "console") {
    throw new Error("OTP_PROVIDER=console is not allowed in production");
  }

  if (otpProvider === "smtp") {
    requireEnv("SMTP_HOST");
    requireEnv("SMTP_PORT");
    requireEnv("SMTP_USER");
    requireEnv("SMTP_PASS");
  }

  const paymentProvider = (process.env.PAYMENT_PROVIDER ?? "mock").trim().toLowerCase();

  if (paymentProvider === "paystack") {
    requireEnv("PAYSTACK_SECRET_KEY");
  }

  if (process.env.SENTRY_DSN?.trim()) {
    const tracesSampleRate = process.env.SENTRY_TRACES_SAMPLE_RATE?.trim();

    if (tracesSampleRate) {
      const parsed = Number(tracesSampleRate);

      if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
        throw new Error("SENTRY_TRACES_SAMPLE_RATE must be between 0 and 1");
      }
    }
  }
}
