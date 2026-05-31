import { NextResponse } from "next/server";
import { getSuggestedAgents } from "@/lib/db-queries";
import { rateLimit } from "@/lib/rate-limit";
import { isValidAgentId } from "@/lib/security";

function getIP(request: Request): string {
  return request.headers.get("x-forwarded-for") || "local";
}

export async function GET(request: Request) {
  if (!rateLimit(`agents-suggested:${getIP(request)}`, 30)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const currentAgentId = searchParams.get("currentAgentId") || "agent-1";

  if (!isValidAgentId(currentAgentId)) {
    return NextResponse.json({ error: "Invalid agent ID" }, { status: 400 });
  }

  const agents = await getSuggestedAgents(currentAgentId);
  return NextResponse.json(agents);
}
