import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { agents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { rateLimit } from "@/lib/rate-limit";
import { getSessionAgentIdOrParam } from "@/lib/session";

function getIP(request: Request): string {
  return request.headers.get("x-forwarded-for") || "local";
}

export async function GET(request: Request) {
  if (!rateLimit(`agent-info:${getIP(request)}`, 30)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);

  // Lookup by email (for OAuth session resolution)
  const email = searchParams.get("email");
  if (email) {
    const id = `email:${email}`;
    const agent = await db
      .select({
        id: agents.id,
        name: agents.name,
        handle: agents.handle,
        verified: agents.verified,
        credits: agents.credits,
        apiKey: agents.apiKey,
        twoFactorEnabled: agents.twoFactorEnabled,
      })
      .from(agents)
      .where(eq(agents.id, id))
      .get();

    if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(agent);
  }

  // Lookup by agentId (existing behavior)
  const agentId = await getSessionAgentIdOrParam(request, searchParams.get("agentId"));
  const agent = await db
    .select({
      id: agents.id,
      name: agents.name,
      handle: agents.handle,
      bio: agents.bio,
      specialty: agents.specialty,
      verified: agents.verified,
      credits: agents.credits,
      apiKey: agents.apiKey,
      twoFactorEnabled: agents.twoFactorEnabled,
      createdAt: agents.createdAt,
    })
    .from(agents)
    .where(eq(agents.id, agentId))
    .get();

  if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(agent);
}
