import crypto from "node:crypto";
import { PayoutStatus } from "@prisma/client";
import { prisma } from "./prisma.js";

type ProviderResult = {
  provider: string;
  reference: string;
  status: "accepted" | "pending" | "paid" | "failed";
  authorizationUrl?: string | null;
  accessCode?: string | null;
  recipientCode?: string | null;
  message?: string;
};

type PaystackMetadata = {
  kind: "wallet_top_up" | "ride_payment";
  userId?: string;
  rideId?: string;
  provider?: string;
  accountRef?: string;
  amountGhs?: number;
};

type PaystackWebhookEvent = {
  event: string;
  data?: {
    reference?: string;
    amount?: number;
    metadata?: Record<string, unknown> | string | null;
    authorization_url?: string;
    access_code?: string;
    recipient?: {
      recipient_code?: string;
    };
    status?: string;
  };
};

const PAYSTACK_PROVIDER = "Paystack";
export const WALLET_TOP_UP_MIN_GHS = 1;
export const WALLET_TOP_UP_MAX_GHS = 5000;

function createReference(prefix: string) {
  return `${prefix}-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
}

function getConfiguredPaymentProvider() {
  return (process.env.PAYMENT_PROVIDER ?? "mock").trim().toLowerCase();
}

function isPaystackEnabled() {
  return getConfiguredPaymentProvider() === "paystack" && Boolean(process.env.PAYSTACK_SECRET_KEY);
}

function getPaystackSecret() {
  const secret = process.env.PAYSTACK_SECRET_KEY;

  if (!secret) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured");
  }

  return secret;
}

function getPaystackBaseUrl() {
  return (process.env.PAYSTACK_BASE_URL ?? "https://api.paystack.co").replace(/\/+$/, "");
}

function amountToMinorUnits(amountGhs: number) {
  return Math.round(amountGhs * 100);
}

function minorUnitsToAmount(amountMinor: number) {
  return Number((amountMinor / 100).toFixed(2));
}

function parseMetadata(value: Record<string, unknown> | string | null | undefined) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    try {
      return JSON.parse(value) as PaystackMetadata;
    } catch {
      return null;
    }
  }

  return value as PaystackMetadata;
}

function getSyntheticEmail(input: { userId: string; phone?: string | null }) {
  const digits = (input.phone ?? "").replace(/\D/g, "") || input.userId;
  return `pay-${digits}@qiilu.app`;
}

function getPaystackCallbackUrl(callbackPath = "/passenger?payment=paystack") {
  if (process.env.PAYSTACK_CALLBACK_URL?.trim()) {
    return process.env.PAYSTACK_CALLBACK_URL.trim();
  }

  const origin = (process.env.FRONTEND_ORIGIN ?? "http://localhost:3000")
    .split(",")
    .map((value) => value.trim())
    .find(Boolean);

  return origin ? `${origin}${callbackPath}` : undefined;
}

function normalizeProviderLabel(provider: string) {
  const value = provider.trim().toLowerCase();

  if (value.includes("mtn")) {
    return "mtn";
  }

  if (value.includes("telecel") || value.includes("vod")) {
    return "vod";
  }

  if (value.includes("tigo") || value.includes("airtel") || value.includes("atl")) {
    return "atl";
  }

  return "mtn";
}

async function paystackRequest<T>(path: string, init: RequestInit) {
  const response = await fetch(`${getPaystackBaseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getPaystackSecret()}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {})
    }
  });

  const payload = (await response.json()) as {
    status?: boolean;
    message?: string;
    data?: T;
  };

  if (!response.ok || payload.status === false || !payload.data) {
    throw new Error(payload.message ?? "Paystack request failed");
  }

  return payload.data;
}

async function initializePaystackCheckout(input: {
  reference: string;
  amountGhs: number;
  name: string;
  phone?: string | null;
  email: string;
  metadata: PaystackMetadata;
  callbackPath?: string;
}) {
  const data = await paystackRequest<{
    authorization_url?: string;
    access_code?: string;
    reference: string;
  }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      amount: amountToMinorUnits(input.amountGhs),
      currency: "GHS",
      reference: input.reference,
      channels: ["mobile_money"],
      callback_url: getPaystackCallbackUrl(input.callbackPath),
      mobile_money: {
        phone: input.phone,
        provider: normalizeProviderLabel(input.metadata.provider ?? "mtn")
      },
      metadata: JSON.stringify({
        ...input.metadata,
        amountGhs: Number(input.amountGhs.toFixed(2))
      }),
      custom_fields: [
        {
          display_name: "Customer",
          variable_name: "customer_name",
          value: input.name
        },
        {
          display_name: "Phone number",
          variable_name: "phone_number",
          value: input.phone ?? "Not provided"
        }
      ]
    })
  });

  return {
    provider: PAYSTACK_PROVIDER,
    reference: data.reference,
    status: "pending" as const,
    authorizationUrl: data.authorization_url ?? null,
    accessCode: data.access_code ?? null,
    message: "Complete the mobile money approval to finish this payment."
  };
}

async function createPaystackTransferRecipient(input: {
  name: string;
  accountRef: string;
  provider: string;
}) {
  return paystackRequest<{
    recipient_code: string;
    details?: {
      account_number?: string;
    };
  }>("/transferrecipient", {
    method: "POST",
    body: JSON.stringify({
      type: "mobile_money",
      name: input.name,
      account_number: input.accountRef,
      bank_code: normalizeProviderLabel(input.provider),
      currency: "GHS"
    })
  });
}

async function initiatePaystackTransfer(input: {
  reference: string;
  amountGhs: number;
  recipientCode: string;
  reason: string;
}) {
  return paystackRequest<{
    transfer_code?: string;
    reference: string;
    status?: string;
  }>("/transfer", {
    method: "POST",
    body: JSON.stringify({
      source: "balance",
      amount: amountToMinorUnits(input.amountGhs),
      recipient: input.recipientCode,
      reason: input.reason,
      reference: input.reference,
      currency: "GHS"
    })
  });
}

async function simulateProvider(provider: string, prefix: string): Promise<ProviderResult> {
  return {
    provider,
    reference: createReference(prefix),
    status: "accepted"
  };
}

async function creditWalletTopUp(input: {
  userId: string;
  amountGhs: number;
  provider: string;
  reference: string;
}) {
  const existing = await prisma.transaction.findFirst({
    where: {
      reference: input.reference,
      wallet: {
        userId: input.userId
      }
    }
  });

  if (existing) {
    return false;
  }

  await prisma.wallet.update({
    where: { userId: input.userId },
    data: {
      balanceGhs: {
        increment: input.amountGhs
      },
      momoGhs: {
        increment: input.amountGhs
      },
      transactions: {
        create: {
          kind: "TOP_UP",
          amountGhs: input.amountGhs,
          channel: `${input.provider} wallet top-up`,
          reference: input.reference
        }
      }
    }
  });

  return true;
}

export async function topUpWallet(input: {
  userId: string;
  amountGhs: number;
  provider: string;
  callbackPath?: string;
}) {
  if (!Number.isFinite(input.amountGhs) || input.amountGhs < WALLET_TOP_UP_MIN_GHS) {
    throw new Error(`Top-up amount must be at least GHS ${WALLET_TOP_UP_MIN_GHS}`);
  }

  if (input.amountGhs > WALLET_TOP_UP_MAX_GHS) {
    throw new Error(`Top-up limit is GHS ${WALLET_TOP_UP_MAX_GHS.toLocaleString()} per transaction`);
  }

  let wallet = await prisma.wallet.findUnique({
    where: { userId: input.userId },
    include: {
      user: true
    }
  });

  if (!wallet) {
    const user = await prisma.user.findUnique({
      where: { id: input.userId }
    });

    if (!user) {
      throw new Error("Wallet not found");
    }

    await prisma.wallet.create({
      data: {
        userId: input.userId
      }
    });

    wallet = await prisma.wallet.findUnique({
      where: { userId: input.userId },
      include: {
        user: true
      }
    });
  }

  if (!wallet) {
    throw new Error("Wallet not found");
  }

  if (isPaystackEnabled()) {
    const reference = createReference("TOP");
    return initializePaystackCheckout({
      reference,
      amountGhs: input.amountGhs,
      name: wallet.user.name,
      phone: wallet.user.phone,
      email: getSyntheticEmail({
        userId: wallet.userId,
        phone: wallet.user.phone
      }),
      metadata: {
        kind: "wallet_top_up",
        userId: wallet.userId,
        provider: input.provider,
        accountRef: wallet.user.phone
      },
      callbackPath: input.callbackPath
    });
  }

  const providerResult = await simulateProvider(input.provider, "TOP");
  await creditWalletTopUp({
    userId: input.userId,
    amountGhs: input.amountGhs,
    provider: input.provider,
    reference: providerResult.reference
  });

  return providerResult;
}

export async function topUpDriverWallet(input: {
  userId: string;
  amountGhs: number;
  provider: string;
  callbackPath?: string;
}) {
  return topUpWallet(input);
}

export async function initiateRidePayment(input: {
  rideId: string;
  userId: string;
  name: string;
  phone?: string | null;
  amountGhs: number;
  provider: string;
}) {
  const reference = createReference("RIDE");

  if (isPaystackEnabled()) {
    return initializePaystackCheckout({
      reference,
      amountGhs: input.amountGhs,
      name: input.name,
      phone: input.phone,
      email: getSyntheticEmail({
        userId: input.userId,
        phone: input.phone
      }),
      metadata: {
        kind: "ride_payment",
        rideId: input.rideId,
        userId: input.userId,
        provider: input.provider,
        accountRef: input.phone ?? undefined
      }
    });
  }

  return simulateProvider(input.provider, "RIDE");
}

export async function requestDriverPayout(input: {
  userId: string;
  amountGhs: number;
  provider: string;
  accountRef: string;
}) {
  const wallet = await prisma.wallet.findUnique({
    where: { userId: input.userId },
    include: {
      user: true
    }
  });

  if (!wallet) {
    throw new Error("Wallet not found");
  }

  if (wallet.balanceGhs < input.amountGhs) {
    throw new Error(`Insufficient balance. Available balance is GHS ${wallet.balanceGhs.toFixed(2)}`);
  }

  let providerResult: ProviderResult | null = null;

  if (isPaystackEnabled()) {
    const recipient = await createPaystackTransferRecipient({
      name: wallet.user.name,
      accountRef: input.accountRef,
      provider: input.provider
    });
    const reference = createReference("PAYOUT");
    const transfer = await initiatePaystackTransfer({
      reference,
      amountGhs: input.amountGhs,
      recipientCode: recipient.recipient_code,
      reason: "Qiilu driver payout"
    });

    providerResult = {
      provider: PAYSTACK_PROVIDER,
      reference: transfer.reference,
      recipientCode: recipient.recipient_code,
      status: "pending",
      message: "Payout has been submitted to Paystack for processing."
    };
  }

  const updatedWallet = await prisma.wallet.update({
    where: { userId: input.userId },
    data: {
      balanceGhs: {
        decrement: input.amountGhs
      },
      pendingWithdrawalGhs: {
        increment: input.amountGhs
      },
      transactions: {
        create: {
          kind: "WITHDRAWAL",
          amountGhs: input.amountGhs,
          channel: `${providerResult?.provider ?? input.provider} payout requested`,
          reference: providerResult?.reference ?? createReference("PAYOUT")
        }
      },
      payoutRequests: {
        create: {
          amountGhs: input.amountGhs,
          provider: providerResult?.provider ?? input.provider,
          accountRef: input.accountRef,
          status: providerResult ? PayoutStatus.PROCESSING : PayoutStatus.PENDING,
          providerRef: providerResult?.reference ?? null
        }
      }
    },
    include: {
      payoutRequests: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    }
  });

  return {
    wallet: updatedWallet,
    providerResult: providerResult ?? {
      provider: input.provider,
      reference: updatedWallet.payoutRequests[0]?.providerRef ?? createReference("PAYOUT"),
      status: "accepted",
      message: "Payout request has been created."
    }
  };
}

export async function markPayoutPaid(payoutRequestId: string, reviewerNotes?: string) {
  const payout = await prisma.payoutRequest.findUnique({
    where: { id: payoutRequestId },
    include: { wallet: true }
  });

  if (!payout) {
    throw new Error("Payout request not found");
  }

  const providerResult =
    payout.provider === PAYSTACK_PROVIDER
      ? {
          provider: PAYSTACK_PROVIDER,
          reference: payout.providerRef ?? createReference("PAY"),
          status: "paid" as const,
          message: "Paystack payout marked as settled."
        }
      : await simulateProvider(payout.provider, "PAY");

  await prisma.payoutRequest.update({
    where: { id: payoutRequestId },
    data: {
      status: "PAID",
      providerRef: providerResult.reference,
      reviewerNotes,
      processedAt: new Date()
    }
  });

  await prisma.wallet.update({
    where: { id: payout.walletId },
    data: {
      pendingWithdrawalGhs: {
        decrement: payout.amountGhs
      }
    }
  });

  return providerResult;
}

export function verifyPaystackSignature(rawBody: Buffer, signature: string | undefined) {
  if (!signature) {
    return false;
  }

  const secret = process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY;

  if (!secret) {
    return false;
  }

  const expected = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
  const received = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (received.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(received, expectedBuffer);
}

export async function handlePaystackWebhook(event: PaystackWebhookEvent) {
  if (!event.data?.reference) {
    return { ignored: true, reason: "Missing Paystack reference" };
  }

  if (event.event === "charge.success") {
    const metadata = parseMetadata(event.data.metadata);

    if (metadata?.kind === "wallet_top_up" && metadata.userId) {
      await creditWalletTopUp({
        userId: metadata.userId,
        amountGhs: metadata.amountGhs ?? minorUnitsToAmount(event.data.amount ?? 0),
        provider: PAYSTACK_PROVIDER,
        reference: event.data.reference
      });

      return { ignored: false, kind: metadata.kind };
    }

    if (metadata?.kind === "ride_payment" && metadata.rideId) {
      await prisma.ride.update({
        where: { id: metadata.rideId },
        data: {
          momoReference: event.data.reference
        }
      });

      return { ignored: false, kind: metadata.kind };
    }

    return { ignored: true, reason: "Unsupported charge metadata" };
  }

  if (event.event === "transfer.success") {
    const payout = await prisma.payoutRequest.findFirst({
      where: { providerRef: event.data.reference }
    });

    if (!payout || payout.status === "PAID") {
      return { ignored: true, reason: "Unknown or already settled payout" };
    }

    await prisma.$transaction([
      prisma.payoutRequest.update({
        where: { id: payout.id },
        data: {
          status: "PAID",
          processedAt: new Date()
        }
      }),
      prisma.wallet.update({
        where: { id: payout.walletId },
        data: {
          pendingWithdrawalGhs: {
            decrement: payout.amountGhs
          }
        }
      })
    ]);

    return { ignored: false, kind: "transfer.success" };
  }

  if (event.event === "transfer.failed" || event.event === "transfer.reversed") {
    const payout = await prisma.payoutRequest.findFirst({
      where: { providerRef: event.data.reference }
    });

    if (!payout || payout.status === "REJECTED" || payout.status === "PAID") {
      return { ignored: true, reason: "Unknown or already finalized payout" };
    }

    await prisma.$transaction([
      prisma.payoutRequest.update({
        where: { id: payout.id },
        data: {
          status: "REJECTED",
          reviewerNotes: `Paystack reported ${event.event}.`,
          processedAt: new Date()
        }
      }),
      prisma.wallet.update({
        where: { id: payout.walletId },
        data: {
          balanceGhs: {
            increment: payout.amountGhs
          },
          pendingWithdrawalGhs: {
            decrement: payout.amountGhs
          }
        }
      })
    ]);

    return { ignored: false, kind: event.event };
  }

  return { ignored: true, reason: `Unhandled event ${event.event}` };
}
