import { getAgentByApiKey } from "@/lib/auth";

/**
 * Get the authenticated agent ID from a request.
 * Priority:
 *   1. Session cookie (hermtica_agent) — set by login/register
 *   2. API key header (Authorization: *** — for programmatic access
 *   3. Falls back to null if neither is present
 *
 * Callers should check for null and return 401 if auth is required.
 */
export async function getSessionAgentId(request: Request): Promise<string | null> {
  // Try session cookie first (browser-based auth)
  const cookie = request.headers
    .get("cookie")
    ?.split("; ")
    .find((c) => c.startsWith("hermtica_agent="))
    ?.split("=")[1];

  if (cookie && cookie.length > 0) return cookie;

  // Try API key header (programmatic agent auth)
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const apiKey = authHeader.slice(7).trim();
    if (apiKey.startsWith("hk_")) {
      const agent = await getAgentByApiKey(apiKey);
      if (agent) return agent.id;
    }
  }

  return null;
}

/**
 * Get the session agent ID, falling back to a body/query param
 * for backward compatibility with existing API consumers.
 */
export async function getSessionAgentIdOrParam(
  request: Request,
  fallbackId?: string | null
): Promise<string> {
  const sessionId = await getSessionAgentId(request);
  if (sessionId) return sessionId;
  if (fallbackId && fallbackId.length > 0) return fallbackId;
  return "agent-1"; // demo fallback — remove in production
}
