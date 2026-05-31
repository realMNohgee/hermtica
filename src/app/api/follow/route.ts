import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { follows } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { createNotification } from "@/lib/notifications-queries";
import { rateLimit } from "@/lib/rate-limit";
import { isValidAgentId } from "@/lib/security";
import { getSessionAgentIdOrParam } from "@/lib/session";

function getIP(request: Request): string {
  return request.headers.get("x-forwarded-for") || "local";
}

export async function GET(request: Request) {
  if (!rateLimit(`follow-get:${getIP(request)}`, 30)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const followerId = await getSessionAgentIdOrParam(request, searchParams.get("followerId"));
  const followingId = searchParams.get("followingId");

  // If only followerId is provided, return list of followed agents
  if (followerId && !followingId) {
    if (!isValidAgentId(followerId)) {
      return NextResponse.json({ error: "Invalid agent ID" }, { status: 400 });
    }
    const { agents } = await import("@/db/schema");
    const { inArray } = await import("drizzle-orm");
    
    const followedIdsResult = await db
      .select({ followingId: follows.followingId })
      .from(follows)
      .where(eq(follows.followerId, followerId))
      .all();
    const followedIds = followedIdsResult.map((f) => f.followingId);

    if (followedIds.length === 0) return NextResponse.json([]);

    const followedAgents = await db
      .select()
      .from(agents)
      .where(inArray(agents.id, followedIds))
      .all();

    return NextResponse.json(followedAgents);
  }

  // Check if specific follow relationship exists
  if (!followerId || !followingId || !isValidAgentId(followerId) || !isValidAgentId(followingId)) {
    return NextResponse.json({ error: "Invalid agent IDs" }, { status: 400 });
  }

  const exists = await db.select().from(follows)
    .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)))
    .get();

  return NextResponse.json({ following: !!exists });
}

export async function POST(request: Request) {
  if (!rateLimit(`follow-post:${getIP(request)}`, 10)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();
  const { followingId } = body;
  const followerId = await getSessionAgentIdOrParam(request, body.followerId);

  if (!followerId || !followingId || !isValidAgentId(followerId) || !isValidAgentId(followingId)) {
    return NextResponse.json({ error: "Invalid agent IDs" }, { status: 400 });
  }

  // Prevent self-follow
  if (followerId === followingId) {
    return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
  }

  const existing = await db.select().from(follows)
    .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)))
    .get();

  if (existing) {
    await db.delete(follows).where(eq(follows.id, existing.id)).run();
    return NextResponse.json({ following: false });
  } else {
    const id = `f-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    await db.insert(follows).values({ id, followerId, followingId }).run();
    await createNotification({ recipientId: followingId, actorId: followerId, type: "follow" });
    return NextResponse.json({ following: true });
  }
}
