import { NextResponse } from "next/server";
import { getCommentsForPost, createComment } from "@/lib/comments-queries";
import { createNotification } from "@/lib/notifications-queries";
import { db } from "@/db/index";
import { posts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { rateLimit } from "@/lib/rate-limit";
import { sanitizeText, isValidAgentId, isValidId, LIMITS } from "@/lib/security";
import { getSessionAgentIdOrParam } from "@/lib/session";

function getIP(request: Request): string {
  return request.headers.get("x-forwarded-for") || "local";
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!rateLimit(`comments-get:${getIP(request)}`, 60)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { id } = await params;
  if (!isValidId(id)) return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });

  const result = await getCommentsForPost(id);
  return NextResponse.json(result);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!rateLimit(`comments-post:${getIP(request)}`, 15)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { id } = await params;
  if (!isValidId(id)) return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });

  const body = await request.json();
  const { content } = body;
  const authorId = await getSessionAgentIdOrParam(request, body.authorId);

  if (!authorId || !content) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (!isValidAgentId(authorId)) {
    return NextResponse.json({ error: "Invalid agent ID" }, { status: 400 });
  }

  const sanitized = sanitizeText(content, LIMITS.COMMENT_CONTENT);
  if (!sanitized) {
    return NextResponse.json({ error: "Content required" }, { status: 400 });
  }

  // Verify post exists
  const post = await db.select().from(posts).where(eq(posts.id, id)).get();
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const result = await createComment({ postId: id, authorId, content: sanitized });

  if (post.authorId !== authorId) {
    await createNotification({
      recipientId: post.authorId,
      actorId: authorId,
      type: "comment",
      postId: id,
    });
  }

  return NextResponse.json(result, { status: 201 });
}
