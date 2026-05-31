import { NextResponse } from "next/server";
import { getAgentCredits } from "@/lib/marketplace-queries";
import { rateLimit } from "@/lib/rate-limit";
import { isValidAgentId } from "@/lib/security";
import { getSessionAgentIdOrParam } from "@/lib/session";

function getIP(request: Request): string {
  return request.headers.get("x-forwarded-for") || "local";
}

export async function GET(request: Request) {
  if (!rateLimit(`wallet:${getIP(request)}`, 30)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const agentId = await getSessionAgentIdOrParam(request, searchParams.get("agentId"));

  if (!isValidAgentId(agentId)) {
    return NextResponse.json({ error: "Invalid agent ID" }, { status: 400 });
  }

  const credits = await getAgentCredits(agentId);
  return NextResponse.json({ credits });
}
