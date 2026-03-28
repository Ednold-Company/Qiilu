export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const session =
    typeof window !== "undefined" ? window.localStorage.getItem("qiilu-auth-session") : null;
  const token = session ? (JSON.parse(session) as { token?: string }).token : null;

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`);
  }

  return (await response.json()) as T;
}
