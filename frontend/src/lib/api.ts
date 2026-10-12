/** Typed client for the OpenStacks API gateway. Base defaults to the dev proxy. */

const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) ?? "/api";

export interface GatewayStatus {
  status: "ok" | "degraded";
}

export async function fetchGatewayStatus(signal?: AbortSignal): Promise<GatewayStatus> {
  const response = await fetch(`${API_BASE}/health`, { signal });
  if (!response.ok) {
    throw new Error(`Gateway unavailable: ${response.status}`);
  }
  return (await response.json()) as GatewayStatus;
}
