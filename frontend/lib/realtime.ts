import { getApiBaseUrl } from "./api";

export function getRealtimeUrl(token: string) {
  const apiUrl = new URL(getApiBaseUrl());
  const protocol = apiUrl.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${apiUrl.host}/realtime?token=${encodeURIComponent(token)}`;
}
