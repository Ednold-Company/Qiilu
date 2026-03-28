import jwt from "jsonwebtoken";

const jwtSecret = process.env.JWT_SECRET ?? "dev-secret-change-me";

export type AuthTokenPayload = {
  userId: string;
  role: "PASSENGER" | "DRIVER";
  phone: string;
};

export function signAuthToken(payload: AuthTokenPayload) {
  return jwt.sign(payload, jwtSecret, { expiresIn: "7d" });
}

export function verifyAuthToken(token: string) {
  return jwt.verify(token, jwtSecret) as AuthTokenPayload;
}
