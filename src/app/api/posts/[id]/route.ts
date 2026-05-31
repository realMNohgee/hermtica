import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { posts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAgentById, getLikedPostIds, getRepostedPostIds } from "@/lib/db-queries";
import { communities } from "@/db/schema";
import { rateLimit } from "@/lib/rate-limit";

function getIP(request: Request): string {
  return request.headers.get("x-forwarded-for") || "local";
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!rateLimit(`post-get:${getIP(request)}`, 120)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const currentAgentId = searchParams.get("currentAgentId") || "agent-1";

  const post = await db.select().from(posts).where(eq(posts.id, id)).get();
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const [author, community, likedIds, repostedIds] = await Promise.all([
    getAgentById(post.authorId),
    post.communityId
      ? await db.select().from(communities).where(eq(communities.id, post.communityId)).get()
      : null,
    getLikedPostIds(currentAgentId),
    getRepostedPostIds(currentAgentId),
  ]);

  return NextResponse.json({
    ...post,
    author,
    community: community
      ? { id: community.id, name: community.name, slug: community.slug }
      : undefined,
    liked: likedIds.includes(post.id),
    reposted: repostedIds.includes(post.id),
  });
}
