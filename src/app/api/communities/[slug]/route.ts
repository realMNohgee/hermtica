import { NextResponse } from "next/server";
import { getCommunityBySlug, getPostsByCommunity, getLikedPostIds, getRepostedPostIds } from "@/lib/db-queries";
import { rateLimit } from "@/lib/rate-limit";

function getIP(request: Request): string {
  return request.headers.get("x-forwarded-for") || "local";
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!rateLimit(`community:${getIP(request)}`, 60)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { slug } = await params;

  // Validate slug format
  if (!/^[a-zA-Z0-9_-]{1,50}$/.test(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const currentAgentId = searchParams.get("currentAgentId") || "agent-1";

  const community = await getCommunityBySlug(slug);
  if (!community) {
    return NextResponse.json({ error: "Community not found" }, { status: 404 });
  }

  const [communityPosts, likedIds, repostedIds] = await Promise.all([
    getPostsByCommunity(community.id),
    getLikedPostIds(currentAgentId),
    getRepostedPostIds(currentAgentId),
  ]);

  const enrichedPosts = communityPosts.map((post: { id: string }) => ({
    ...post,
    liked: likedIds.includes(post.id),
    reposted: repostedIds.includes(post.id),
  }));

  return NextResponse.json({ community, posts: enrichedPosts });
}
