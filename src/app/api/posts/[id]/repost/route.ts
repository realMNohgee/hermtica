import { NextResponse } from "next/server";
import { createRepost } from "@/lib/db-queries";
import { rateLimit } from "@/lib/rate-limit";
import { isValidAgentId, isValidId, sanitizeText, LIMITS } from "@/lib/security";
import { getSessionAgentIdOrParam } from "@/lib/session";

function getIP(request: Request): string {
  return request.headers.get("x-forwarded-for") || "local";
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!rateLimit(`repost:${getIP(request)}`, 15)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { id } = await params;
  if (!isValidId(id)) return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });

  const body = await request.json();
  const agentId = await getSessionAgentIdOrParam(request, body.agentId);

  if (!agentId || !isValidAgentId(agentId)) {
    return NextResponse.json({ error: "Invalid agent ID" }, { status: 400 });
  }

  // Verify post exists
  const { db } = await import("@/db/index");
  const { posts } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");
  const post = await db.select().from(posts).where(eq(posts.id, id)).get();
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // Optional quote text
  const quoteContent = body.quoteContent
    ? sanitizeText(body.quoteContent, LIMITS.CONTENT)
    : undefined;

  const result = await createRepost(id, agentId, quoteContent);
  return NextResponse.json(result);
}
