import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn()
    },
    otpCode: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn()
    },
    wallet: {
      findUnique: vi.fn(),
      create: vi.fn()
    }
  },
  deliverOtp: vi.fn()
}));

vi.mock("../src/lib/prisma.js", () => ({
  prisma: mocks.prisma
}));

vi.mock("../src/lib/mail.js", () => ({
  deliverOtp: mocks.deliverOtp
}));

import { authRouter } from "../src/routes/auth.js";

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use("/auth", authRouter);
  return app;
}

describe("authRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks duplicate signup OTP requests before sending mail", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue(null);
    mocks.prisma.user.findFirst.mockResolvedValue({
      id: "existing-user",
      email: "another@example.com",
      phone: "+233201111111"
    });

    const app = createTestApp();
    const response = await request(app).post("/auth/request-otp").send({
      email: "new@example.com",
      phone: "+233201111111",
      role: "PASSENGER",
      purpose: "SIGNUP"
    });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe("An account with that phone already exists");
    expect(mocks.deliverOtp).not.toHaveBeenCalled();
  });

  it("returns a clean conflict when OTP signup phone is already registered", async () => {
    mocks.prisma.otpCode.findFirst.mockResolvedValue({
      id: "otp-1",
      email: "new@example.com",
      role: "PASSENGER",
      purpose: "SIGNUP",
      codeHash: "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92",
      consumedAt: null,
      expiresAt: new Date(Date.now() + 60_000)
    });
    mocks.prisma.otpCode.update.mockResolvedValue({});
    mocks.prisma.user.findUnique.mockImplementation(async ({ where }: { where: { email?: string; phone?: string } }) => {
      if (where.email) {
        return null;
      }

      return {
        id: "existing-user",
        phone: where.phone,
        email: "existing@example.com",
        role: "PASSENGER"
      };
    });

    const app = createTestApp();
    const response = await request(app).post("/auth/verify-otp").send({
      email: "new@example.com",
      phone: "+233201111111",
      role: "PASSENGER",
      purpose: "SIGNUP",
      code: "123456",
      name: "Test Passenger"
    });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe("An account with that phone already exists");
    expect(mocks.prisma.otpCode.update).toHaveBeenCalledWith({
      where: { id: "otp-1" },
      data: { consumedAt: expect.any(Date) }
    });
  });
});
