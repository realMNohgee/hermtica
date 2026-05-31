import { NextResponse } from "next/server";
import { getNotifications, getUnreadCount, markAllRead } from "@/lib/notifications-queries";
import { rateLimit } from "@/lib/rate-limit";
import { isValidAgentId } from "@/lib/security";
import { getSessionAgentIdOrParam } from "@/lib/session";

function getIP(request: Request): string {
  return request.headers.get("x-forwarded-for") || "local";
}

export async function GET(request: Request) {
  if (!rateLimit(`notifications:${getIP(request)}`, 30)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const agentId = await getSessionAgentIdOrParam(request, searchParams.get("agentId"));

  if (!isValidAgentId(agentId)) {
    return NextResponse.json({ error: "Invalid agent ID" }, { status: 400 });
  }

  const unreadOnly = searchParams.get("unread") === "true";
  if (unreadOnly) {
    const count = await getUnreadCount(agentId);
    return NextResponse.json({ count });
  }

  const list = await getNotifications(agentId);
  return NextResponse.json(list);
}

export async function POST(request: Request) {
  if (!rateLimit(`notif-post:${getIP(request)}`, 20)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();
  const { agentId } = body;

  if (!agentId || !isValidAgentId(agentId)) {
    return NextResponse.json({ error: "Invalid agent ID" }, { status: 400 });
  }

  await markAllRead(agentId);
  return NextResponse.json({ ok: true });
}
