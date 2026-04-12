import nodemailer from "nodemailer";

type OtpDeliveryInput = {
  email: string;
  code: string;
  purpose: "LOGIN" | "SIGNUP" | "PASSWORDLESS";
};

export type OtpDeliveryResult = {
  provider: string;
  deliveryHint: string;
  developmentCode?: string;
};

function getOtpSubject(purpose: OtpDeliveryInput["purpose"]) {
  if (purpose === "SIGNUP") {
    return "Verify your Qiilu account";
  }

  if (purpose === "PASSWORDLESS") {
    return "Your Qiilu sign-in code";
  }

  return "Your Qiilu login code";
}

function getOtpText(input: OtpDeliveryInput) {
  return [
    `Your Qiilu verification code is ${input.code}.`,
    "",
    "It expires in 10 minutes.",
    "",
    "If you did not request this code, you can ignore this email."
  ].join("\n");
}

function getOtpHtml(input: OtpDeliveryInput) {
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;background:#f6f7fb;padding:32px;color:#111827;">
      <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:20px;padding:32px;border:1px solid #e5e7eb;">
        <div style="font-size:28px;font-weight:800;color:#f97316;margin-bottom:12px;">Qiilu</div>
        <div style="font-size:24px;font-weight:700;margin-bottom:12px;">Your verification code</div>
        <p style="font-size:15px;line-height:1.7;color:#4b5563;margin:0 0 24px;">
          Use the code below to continue your ${input.purpose.toLowerCase()} flow. It expires in 10 minutes.
        </p>
        <div style="font-size:36px;letter-spacing:10px;font-weight:800;text-align:center;padding:18px 24px;border-radius:18px;background:#111827;color:#ffffff;margin-bottom:24px;">
          ${input.code}
        </div>
        <p style="font-size:14px;line-height:1.6;color:#6b7280;margin:0;">
          If you did not request this code, you can safely ignore this email.
        </p>
      </div>
    </div>
  `;
}

function createTransport() {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const secure = String(process.env.SMTP_SECURE ?? "").toLowerCase() === "true" || port === 465;

  if (!host || !port || !user || !pass) {
    throw new Error("SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS must be configured");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass
    }
  });
}

async function deliverViaSmtp(input: OtpDeliveryInput): Promise<OtpDeliveryResult> {
  const transporter = createTransport();
  const from = process.env.SMTP_FROM?.trim() || process.env.SMTP_USER?.trim();

  if (!from) {
    throw new Error("SMTP_FROM or SMTP_USER must be configured");
  }

  const result = await transporter.sendMail({
    from,
    to: input.email,
    subject: getOtpSubject(input.purpose),
    text: getOtpText(input),
    html: getOtpHtml(input)
  });

  if (process.env.NODE_ENV !== "production") {
    console.log("[qiilu:smtp]", {
      to: input.email,
      purpose: input.purpose,
      messageId: result.messageId,
      accepted: result.accepted,
      rejected: result.rejected
    });
  }

  if (!result.accepted.length || result.rejected.length) {
    throw new Error("SMTP provider did not accept the OTP email");
  }

  return {
    provider: "smtp",
    deliveryHint: `OTP email queued for ${input.email}`
  };
}

export async function deliverOtp(input: OtpDeliveryInput): Promise<OtpDeliveryResult> {
  const provider = (process.env.OTP_PROVIDER ?? "console").trim().toLowerCase();

  if (provider === "console") {
    console.log(`[qiilu:otp] ${input.email} ${input.purpose} code ${input.code}`);
    return {
      provider: "console",
      deliveryHint: `OTP generated for ${input.email}`,
      developmentCode: input.code
    };
  }

  if (provider === "smtp") {
    return deliverViaSmtp(input);
  }

  return {
    provider,
    deliveryHint: `OTP queued for ${input.email}`
  };
}
