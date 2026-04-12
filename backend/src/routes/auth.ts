import { randomUUID } from "node:crypto";
import { Router } from "express";
import bcrypt from "bcryptjs";
import { OtpPurpose, UserRole } from "@prisma/client";
import { generateOtpCode, hashOtpCode, signAuthToken } from "../lib/auth.js";
import { deliverOtp } from "../lib/mail.js";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";

export const authRouter = Router();

const sessionUserSelect = {
  id: true,
  name: true,
  phone: true,
  email: true,
  profileImageUrl: true,
  role: true,
  preferredPayment: true,
  momoProvider: true,
  trustedContacts: true,
  lowBandwidthMode: true,
  safetyShareEnabled: true,
  kycStatus: true,
  availability: true
} as const;

function isValidProfileImageDataUrl(value: string) {
  return /^data:image\/(png|jpeg|jpg|webp);base64,[a-z0-9+/=]+$/i.test(value.trim());
}

function setAuthCookies(
  response: {
    cookie: (name: string, value: string, options: Record<string, unknown>) => void;
  },
  role: UserRole
) {
  const secure = process.env.NODE_ENV === "production";
  const baseOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    maxAge: 1000 * 60 * 60 * 24 * 7,
    path: "/"
  };

  response.cookie("qiilu-auth", "1", baseOptions);
  response.cookie("qiilu-role", role, baseOptions);
}

function clearAuthCookies(response: {
  clearCookie: (name: string, options?: Record<string, unknown>) => void;
}) {
  const secure = process.env.NODE_ENV === "production";
  const baseOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/"
  };

  response.clearCookie("qiilu-auth", baseOptions);
  response.clearCookie("qiilu-role", baseOptions);
}

async function issueSession(response: {
  cookie: (name: string, value: string, options: Record<string, unknown>) => void;
}, user: {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  profileImageUrl?: string | null;
  role: UserRole;
}) {
  const token = signAuthToken({
    userId: user.id,
    role: user.role,
    phone: user.phone
  });

  setAuthCookies(response, user.role);

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email ?? null,
      profileImageUrl: user.profileImageUrl ?? null,
      role: user.role
    }
  };
}

async function ensureDriverWallet(userId: string) {
  const existing = await prisma.wallet.findUnique({
    where: { userId }
  });

  if (!existing) {
    await prisma.wallet.create({
      data: {
        userId
      }
    });
  }
}

authRouter.post("/signup", async (request, response) => {
  const body = request.body as {
    name?: string;
    phone?: string;
    email?: string;
    password?: string;
    role?: string;
  };

  if (!body.name || !body.phone || !body.email || !body.password || !body.role) {
    response.status(400).json({ message: "Name, phone, email, password, and role are required" });
    return;
  }

  const role = body.role.toUpperCase() as UserRole;
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { phone: body.phone },
        { email: body.email }
      ]
    }
  });

  if (existingUser) {
    const normalizedEmail = body.email.trim().toLowerCase();
    const message =
      existingUser.email === normalizedEmail
        ? "An account with that email already exists"
        : "An account with that phone already exists";
    response.status(409).json({ message });
    return;
  }

  const user = await prisma.user.create({
    data: {
      name: body.name,
      phone: body.phone,
      email: body.email.trim().toLowerCase(),
      role,
      passwordHash: await bcrypt.hash(body.password, 10),
      preferredPayment: role === "PASSENGER" ? "MOMO" : undefined,
      momoProvider: "MTN MoMo",
      trustedContacts: [],
      lowBandwidthMode: false,
      safetyShareEnabled: true,
      kycStatus: role === "DRIVER" ? "PENDING" : undefined,
      availability: role === "DRIVER" ? "OFFLINE" : undefined
    }
  });

  if (role === "DRIVER") {
    await ensureDriverWallet(user.id);
  }

  response.status(201).json(await issueSession(response, user));
});

authRouter.post("/login", async (request, response) => {
  const body = request.body as { phone?: string; role?: string; password?: string };

  if (!body.phone || !body.role || !body.password) {
    response.status(400).json({ message: "Phone, role, and password are required" });
    return;
  }

  const user = await prisma.user.findFirst({
    where: {
      phone: body.phone,
      role: body.role?.toUpperCase() as UserRole
    }
  });

  if (!user) {
    response.status(401).json({ message: "Invalid credentials" });
    return;
  }

  const passwordValid = await bcrypt.compare(body.password, user.passwordHash);

  if (!passwordValid) {
    response.status(401).json({ message: "Invalid credentials" });
    return;
  }

  response.json(await issueSession(response, user));
});

authRouter.post("/request-otp", async (request, response) => {
  const body = request.body as {
    email?: string;
    phone?: string;
    role?: string;
    purpose?: "LOGIN" | "SIGNUP" | "PASSWORDLESS";
  };

  if (!body.email || !body.role) {
    response.status(400).json({ message: "Email and role are required" });
    return;
  }

  const role = body.role.toUpperCase() as UserRole;
  const purpose = (body.purpose?.toUpperCase() ?? "LOGIN") as OtpPurpose;
  const email = body.email.trim().toLowerCase();
  const phone = body.phone?.trim();
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (purpose === "LOGIN" && (!existingUser || existingUser.role !== role)) {
    response.status(404).json({ message: "No matching account found for email OTP login" });
    return;
  }

  if ((purpose === "SIGNUP" || purpose === "PASSWORDLESS") && !phone) {
    response.status(400).json({ message: "Phone is required to request a signup code" });
    return;
  }

  if (purpose === "SIGNUP" || purpose === "PASSWORDLESS") {
    const conflictingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          ...(phone ? [{ phone }] : [])
        ]
      }
    });

    if (conflictingUser) {
      const message =
        conflictingUser.email === email
          ? "An account with that email already exists"
          : "An account with that phone already exists";
      response.status(409).json({ message });
      return;
    }
  }

  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 10);
  const delivery = await deliverOtp({
    email,
    code,
    purpose
  });

  await prisma.otpCode.create({
    data: {
      email,
      role,
      purpose,
      codeHash: hashOtpCode(code),
      expiresAt,
      deliveryHint: delivery.deliveryHint,
      userId: existingUser?.id
    }
  });

  response.json({
    message: "OTP queued for email delivery",
    provider: delivery.provider,
    expiresAt,
    developmentCode: delivery.developmentCode
  });
});

authRouter.post("/verify-otp", async (request, response) => {
  const body = request.body as {
    email?: string;
    role?: string;
    code?: string;
    purpose?: "LOGIN" | "SIGNUP" | "PASSWORDLESS";
    name?: string;
    phone?: string;
    password?: string;
  };

  if (!body.email || !body.role || !body.code) {
    response.status(400).json({ message: "Email, role, and code are required" });
    return;
  }

  const role = body.role.toUpperCase() as UserRole;
  const purpose = (body.purpose?.toUpperCase() ?? "LOGIN") as OtpPurpose;
  const email = body.email.trim().toLowerCase();
  const now = new Date();
  const otp = await prisma.otpCode.findFirst({
    where: {
      email,
      role,
      purpose,
      consumedAt: null,
      expiresAt: {
        gt: now
      }
    },
    orderBy: { createdAt: "desc" }
  });

  if (!otp || otp.codeHash !== hashOtpCode(body.code)) {
    response.status(401).json({ message: "Invalid or expired OTP" });
    return;
  }

  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { consumedAt: now }
  });

  let user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user && (purpose === "SIGNUP" || purpose === "PASSWORDLESS")) {
    if (!body.phone) {
      response.status(400).json({ message: "Phone is required to complete signup" });
      return;
    }

    const normalizedPhone = body.phone.trim();
    const existingPhoneOwner = await prisma.user.findUnique({
      where: { phone: normalizedPhone }
    });

    if (existingPhoneOwner) {
      response.status(409).json({ message: "An account with that phone already exists" });
      return;
    }

    user = await prisma.user.create({
      data: {
        name: body.name?.trim() || `Qiilu ${role.toLowerCase()} ${normalizedPhone.slice(-4)}`,
        phone: normalizedPhone,
        email,
        role,
        passwordHash: await bcrypt.hash(body.password?.trim() || randomUUID(), 10),
        preferredPayment: role === "PASSENGER" ? "MOMO" : undefined,
        momoProvider: "MTN MoMo",
        trustedContacts: [],
        lowBandwidthMode: false,
        safetyShareEnabled: true,
        kycStatus: role === "DRIVER" ? "PENDING" : undefined
      }
    });

    if (role === "DRIVER") {
      await ensureDriverWallet(user.id);
    }
  }

  if (!user || user.role !== role) {
    response.status(404).json({ message: "No matching account found" });
    return;
  }

  response.json(await issueSession(response, user));
});

authRouter.post("/logout", (_request, response) => {
  clearAuthCookies(response);
  response.json({ message: "Logged out" });
});

authRouter.get("/me", requireAuth, async (request: AuthenticatedRequest, response) => {
  const user = await prisma.user.findUnique({
    where: { id: request.auth?.userId },
    select: sessionUserSelect
  });

  if (!user) {
    response.status(404).json({ message: "User not found" });
    return;
  }

  response.json({
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      profileImageUrl: user.profileImageUrl,
      role: user.role,
      preferredPayment: user.preferredPayment,
      momoProvider: user.momoProvider,
      trustedContacts: Array.isArray(user.trustedContacts) ? user.trustedContacts : [],
      lowBandwidthMode: user.lowBandwidthMode,
      safetyShareEnabled: user.safetyShareEnabled,
      kycStatus: user.kycStatus,
      availability: user.availability
    }
  });
});

authRouter.put("/profile", requireAuth, async (request: AuthenticatedRequest, response) => {
  const body = request.body as {
    name?: string;
    profileImageUrl?: string | null;
  };

  const nextName = body.name?.trim();
  const nextProfileImage = typeof body.profileImageUrl === "string" ? body.profileImageUrl.trim() : body.profileImageUrl;

  if (nextName !== undefined && nextName.length > 0 && nextName.length < 2) {
    response.status(400).json({ message: "Name must be at least 2 characters" });
    return;
  }

  if (typeof nextProfileImage === "string" && nextProfileImage.length > 0) {
    if (!isValidProfileImageDataUrl(nextProfileImage)) {
      response.status(400).json({ message: "Profile image must be a valid PNG, JPG, JPEG, or WebP upload" });
      return;
    }

    if (nextProfileImage.length > 2_000_000) {
      response.status(400).json({ message: "Profile image is too large. Use a smaller image." });
      return;
    }
  }

  const user = await prisma.user.update({
    where: { id: request.auth?.userId },
    data: {
      ...(nextName ? { name: nextName } : {}),
      ...(body.profileImageUrl !== undefined
        ? { profileImageUrl: nextProfileImage ? nextProfileImage : null }
        : {})
    },
    select: sessionUserSelect
  });

  response.json({
    message: "Profile updated",
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      profileImageUrl: user.profileImageUrl,
      role: user.role,
      preferredPayment: user.preferredPayment,
      momoProvider: user.momoProvider,
      trustedContacts: Array.isArray(user.trustedContacts) ? user.trustedContacts : [],
      lowBandwidthMode: user.lowBandwidthMode,
      safetyShareEnabled: user.safetyShareEnabled,
      kycStatus: user.kycStatus,
      availability: user.availability
    }
  });
});
