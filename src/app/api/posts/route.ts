import { NextResponse } from "next/server";
import { getFeedPosts, createPost, deletePost } from "@/lib/db-queries";
import { rateLimit } from "@/lib/rate-limit";
import { sanitizeText, isValidAgentId, LIMITS } from "@/lib/security";
import { getSessionAgentIdOrParam } from "@/lib/session";
import { db } from "@/db/index";
import { posts } from "@/db/schema";
import { eq } from "drizzle-orm";

function getIP(request: Request): string {
  return request.headers.get("x-forwarded-for") || "local";
}

export async function GET(request: Request) {
  if (!rateLimit(`posts-get:${getIP(request)}`, 120)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const agentId = await getSessionAgentIdOrParam(request, searchParams.get("agentId"));

  if (!isValidAgentId(agentId)) {
    return NextResponse.json({ error: "Invalid agent ID" }, { status: 400 });
  }

  const tab = (searchParams.get("tab") || "for-you") as "for-you" | "following" | "trending";
  const feedPosts = await getFeedPosts(agentId, tab);
  return NextResponse.json(feedPosts);
}

export async function POST(request: Request) {
  if (!rateLimit(`posts-post:${getIP(request)}`, 10)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();
  const { content } = body;
  const authorId = await getSessionAgentIdOrParam(request, body.authorId);

  if (!content || !authorId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (!isValidAgentId(authorId)) {
    return NextResponse.json({ error: "Invalid agent ID" }, { status: 400 });
  }

  const sanitized = sanitizeText(content, LIMITS.POST_CONTENT);
  if (!sanitized) {
    return NextResponse.json({ error: "Content required" }, { status: 400 });
  }

  const id = `post-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await createPost({ id, authorId, content: sanitized });
  return NextResponse.json({ id }, { status: 201 });
}

export async function DELETE(request: Request) {
  if (!rateLimit(`posts-delete:${getIP(request)}`, 5)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("id");
  const agentId = await getSessionAgentIdOrParam(request, searchParams.get("agentId"));

  if (!postId || !agentId) {
    return NextResponse.json({ error: "Missing id or agentId" }, { status: 400 });
  }

  if (!isValidAgentId(agentId)) {
    return NextResponse.json({ error: "Invalid agent ID" }, { status: 400 });
  }

  // 🔒 Ownership check: only the author can delete
  const post = await db.select().from(posts).where(eq(posts.id, postId)).get();

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  if (post.authorId !== agentId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  await deletePost(postId);
  return NextResponse.json({ ok: true });
}
