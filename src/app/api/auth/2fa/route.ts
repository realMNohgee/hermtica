import { NextResponse } from "next/server";
import { generateTotpSecret, getTotpUri, enableTwoFactor, verifyTwoFactor } from "@/lib/auth";
import { db } from "@/db/index";
import { agents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { rateLimit } from "@/lib/rate-limit";
import { isValidAgentId } from "@/lib/security";
import { getSessionAgentIdOrParam } from "@/lib/session";

function getIP(request: Request): string {
  return request.headers.get("x-forwarded-for") || "local";
}

export async function POST(request: Request) {
  if (!rateLimit(`2fa:${getIP(request)}`, 5)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();
  const { action, token } = body;
  const agentId = await getSessionAgentIdOrParam(request, body.agentId);

  if (!agentId || !isValidAgentId(agentId)) {
    return NextResponse.json({ error: "Invalid agent" }, { status: 400 });
  }

  const agent = await db.select().from(agents).where(eq(agents.id, agentId)).get();
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  // ─── SETUP: Generate secret ────────────────────────────
  if (action === "setup") {
    if (agent.twoFactorEnabled) {
      return NextResponse.json({ error: "2FA already enabled" }, { status: 400 });
    }
    const secret = generateTotpSecret();
    const uri = getTotpUri(secret, agent.handle);
    return NextResponse.json({ secret, uri });
  }

  // ─── VERIFY: Confirm setup ─────────────────────────────
  if (action === "verify") {
    if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

    // Get the secret from the body (stored client-side during setup)
    const secret = body.secret;
    if (!secret) return NextResponse.json({ error: "Secret required" }, { status: 400 });

    const valid = verifyTwoFactor(agent.id, token);
    if (!valid) {
      // Try with provided secret directly
      const { verifyTotp } = await import("@/lib/auth");
      if (!verifyTotp(secret, token)) {
        return NextResponse.json({ error: "Invalid code" }, { status: 400 });
      }
    }

    await enableTwoFactor(agent.id, secret);
    return NextResponse.json({ enabled: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
