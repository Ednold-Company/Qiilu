import jwt from "jsonwebtoken";
import crypto from "node:crypto";

const jwtSecret = process.env.JWT_SECRET ?? "dev-secret-change-me";

export type AuthTokenPayload = {
  userId: string;
  role: "ADMIN" | "PASSENGER" | "DRIVER";
  phone: string;
};

export function signAuthToken(payload: AuthTokenPayload) {
  return jwt.sign(payload, jwtSecret, { expiresIn: "7d" });
}

export function verifyAuthToken(token: string) {
  return jwt.verify(token, jwtSecret) as AuthTokenPayload;
}

export function generateOtpCode() {
  return String(crypto.randomInt(100000, 999999));
}

export function hashOtpCode(code: string) {
  return crypto.createHash("sha256").update(code).digest("hex");
}
