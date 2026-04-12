export type SessionUser = {
  id: string;
  name: string;
  phone: string;
  role: "ADMIN" | "PASSENGER" | "DRIVER";
};

export type AuthSession = {
  token: string;
  user: SessionUser;
};

const storageKey = "qiilu-auth-session";
const routingCookieMaxAge = 60 * 60 * 24 * 7;

function setRoutingCookie(name: string, value: string, maxAge = routingCookieMaxAge) {
  const secure = typeof window !== "undefined" && window.location.protocol === "https:";
  const cookie = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "SameSite=Lax",
    `Max-Age=${maxAge}`
  ];

  if (secure) {
    cookie.push("Secure");
  }

  document.cookie = cookie.join("; ");
}

function clearRoutingCookie(name: string) {
  document.cookie = `${name}=; Path=/; SameSite=Lax; Max-Age=0`;
}

export function getSession() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(storageKey);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    window.localStorage.removeItem(storageKey);
    return null;
  }
}

export function setSession(session: AuthSession) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(session));
  setRoutingCookie("qiilu-auth", "1");
  setRoutingCookie("qiilu-role", session.user.role);
}

export function clearSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(storageKey);
  clearRoutingCookie("qiilu-auth");
  clearRoutingCookie("qiilu-role");
}
