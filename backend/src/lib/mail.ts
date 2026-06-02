import dns from "node:dns/promises";
import nodemailer from "nodemailer";
import { google } from "googleapis";

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

function shouldExposeDevelopmentCode() {
  return process.env.NODE_ENV !== "production" || String(process.env.OTP_EXPOSE_DEVELOPMENT_CODE ?? "").toLowerCase() === "true";
}

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

async function resolveSmtpHost(host: string) {
  const forceIpv4 = String(process.env.SMTP_FORCE_IPV4 ?? "true").toLowerCase() !== "false";

  if (!forceIpv4) {
    return { host, servername: host };
  }

  try {
    const resolved = await dns.lookup(host, { family: 4 });
    return {
      host: resolved.address,
      servername: host
    };
  } catch {
    return { host, servername: host };
  }
}

async function createTransport() {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const secure = String(process.env.SMTP_SECURE ?? "").toLowerCase() === "true" || port === 465;

  if (!host || !port || !user || !pass) {
    throw new Error("SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS must be configured");
  }

  const { host: transportHost, servername } = await resolveSmtpHost(host);

  return nodemailer.createTransport({
    host: transportHost,
    port,
    secure,
    connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS ?? "15000"),
    greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS ?? "10000"),
    socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS ?? "20000"),
    auth: {
      user,
      pass
    },
    tls: {
      servername
    }
  });
}

async function createGmailOauthTransport() {
  const { clientId, clientSecret, refreshToken, redirectUri, user, accessToken } =
    await getGoogleOauthContext();

  const oauthHost = process.env.GMAIL_OAUTH_HOST?.trim() || "smtp.gmail.com";
  const oauthPort = Number(process.env.GMAIL_OAUTH_PORT ?? "465");
  const oauthSecure =
    String(process.env.GMAIL_OAUTH_SECURE ?? "").toLowerCase() === "true" || oauthPort === 465;
  const { host: transportHost, servername } = await resolveSmtpHost(oauthHost);

  return nodemailer.createTransport({
    host: transportHost,
    port: oauthPort,
    secure: oauthSecure,
    connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS ?? "15000"),
    greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS ?? "10000"),
    socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS ?? "20000"),
    auth: {
      type: "OAuth2",
      user,
      clientId,
      clientSecret,
      refreshToken,
      accessToken
    },
    tls: {
      servername
    }
  });
}

async function getGoogleOauthContext() {
  const clientId = process.env.GMAIL_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.GMAIL_OAUTH_CLIENT_SECRET?.trim();
  const refreshToken = process.env.GMAIL_OAUTH_REFRESH_TOKEN?.trim();
  const user = process.env.GMAIL_OAUTH_USER?.trim() || process.env.SMTP_USER?.trim();
  const redirectUri =
    process.env.GMAIL_OAUTH_REDIRECT_URI?.trim() || "https://developers.google.com/oauthplayground";

  if (!clientId || !clientSecret || !refreshToken || !user) {
    throw new Error(
      "GMAIL_OAUTH_CLIENT_ID, GMAIL_OAUTH_CLIENT_SECRET, GMAIL_OAUTH_REFRESH_TOKEN, and GMAIL_OAUTH_USER must be configured"
    );
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const accessTokenResult = await oauth2Client.getAccessToken();
  const accessToken = accessTokenResult.token?.trim();

  if (!accessToken) {
    throw new Error("Could not obtain Gmail OAuth access token");
  }

  return {
    clientId,
    clientSecret,
    refreshToken,
    redirectUri,
    user,
    accessToken,
    oauth2Client
  };
}

async function deliverViaSmtp(input: OtpDeliveryInput): Promise<OtpDeliveryResult> {
  const transporter = await createTransport();
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

async function deliverViaGmailOauth(input: OtpDeliveryInput): Promise<OtpDeliveryResult> {
  const transporter = await createGmailOauthTransport();
  const from =
    process.env.SMTP_FROM?.trim() ||
    process.env.GMAIL_OAUTH_FROM?.trim() ||
    process.env.GMAIL_OAUTH_USER?.trim();

  if (!from) {
    throw new Error("GMAIL_OAUTH_FROM, SMTP_FROM, or GMAIL_OAUTH_USER must be configured");
  }

  const result = await transporter.sendMail({
    from,
    to: input.email,
    subject: getOtpSubject(input.purpose),
    text: getOtpText(input),
    html: getOtpHtml(input)
  });

  if (process.env.NODE_ENV !== "production") {
    console.log("[qiilu:gmail-oauth]", {
      to: input.email,
      purpose: input.purpose,
      messageId: result.messageId,
      accepted: result.accepted,
      rejected: result.rejected
    });
  }

  if (!result.accepted.length || result.rejected.length) {
    throw new Error("Gmail OAuth provider did not accept the OTP email");
  }

  return {
    provider: "gmail_oauth",
    deliveryHint: `OTP email queued for ${input.email}`
  };
}

function toBase64Url(value: string) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function buildMimeMessage(input: OtpDeliveryInput, from: string) {
  return [
    `From: ${from}`,
    `To: ${input.email}`,
    `Subject: ${getOtpSubject(input.purpose)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: 7bit",
    "",
    getOtpHtml(input)
  ].join("\r\n");
}

async function deliverViaGmailApi(input: OtpDeliveryInput): Promise<OtpDeliveryResult> {
  const { oauth2Client, user } = await getGoogleOauthContext();
  const from =
    process.env.GMAIL_OAUTH_FROM?.trim() ||
    process.env.SMTP_FROM?.trim() ||
    process.env.GMAIL_OAUTH_USER?.trim();

  if (!from) {
    throw new Error("GMAIL_OAUTH_FROM, SMTP_FROM, or GMAIL_OAUTH_USER must be configured");
  }

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });
  const raw = toBase64Url(buildMimeMessage(input, from));

  const result = await gmail.users.messages.send({
    userId: user,
    requestBody: { raw }
  });

  if (process.env.NODE_ENV !== "production") {
    console.log("[qiilu:gmail-api]", {
      to: input.email,
      purpose: input.purpose,
      messageId: result.data.id,
      threadId: result.data.threadId
    });
  }

  if (!result.data.id) {
    throw new Error("Gmail API did not accept the OTP email");
  }

  return {
    provider: "gmail_api",
    deliveryHint: `OTP email queued for ${input.email}`
  };
}

async function deliverViaProvider(provider: string, input: OtpDeliveryInput): Promise<OtpDeliveryResult> {
  if (provider === "console") {
    console.log(`[qiilu:otp] ${input.email} ${input.purpose} code ${input.code}`);
    return {
      provider: "console",
      deliveryHint: `OTP generated for ${input.email}`,
      developmentCode: shouldExposeDevelopmentCode() ? input.code : undefined
    };
  }

  if (provider === "smtp") {
    return deliverViaSmtp(input);
  }

  if (provider === "gmail_oauth") {
    return deliverViaGmailOauth(input);
  }

  if (provider === "gmail_api") {
    return deliverViaGmailApi(input);
  }

  return {
    provider,
    deliveryHint: `OTP queued for ${input.email}`
  };
}

export async function deliverOtp(input: OtpDeliveryInput): Promise<OtpDeliveryResult> {
  const provider = (process.env.OTP_PROVIDER ?? "console").trim().toLowerCase();
  const fallbackProvider = process.env.OTP_FALLBACK_PROVIDER?.trim().toLowerCase();

  try {
    return await deliverViaProvider(provider, input);
  } catch (error) {
    if (fallbackProvider && fallbackProvider !== provider) {
      console.error("[qiilu:otp:fallback]", {
        provider,
        fallbackProvider,
        message: error instanceof Error ? error.message : "OTP provider failed"
      });
      return deliverViaProvider(fallbackProvider, input);
    }

    throw error;
  }
}
