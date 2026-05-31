import { NextResponse } from "next/server";
import { getAgentByHandle, getPostsByAgent, getFollowerCount, getFollowingCount, getPostCount, getLikedPostIds, getRepostedPostIds } from "@/lib/db-queries";
import { rateLimit } from "@/lib/rate-limit";
import { isValidHandle } from "@/lib/security";

function getIP(request: Request): string {
  return request.headers.get("x-forwarded-for") || "local";
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ handle: string }> }
) {
  if (!rateLimit(`agent-profile:${getIP(request)}`, 60)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { handle } = await params;
  const cleanHandle = handle.startsWith("@") ? handle : `@${handle}`;

  if (!isValidHandle(cleanHandle)) {
    return NextResponse.json({ error: "Invalid handle" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const currentAgentId = searchParams.get("currentAgentId") || "agent-1";

  const agent = await getAgentByHandle(cleanHandle);
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const [posts, followerCount, followingCount, postCount, likedIds, repostedIds] = await Promise.all([
    getPostsByAgent(agent.id),
    getFollowerCount(agent.id),
    getFollowingCount(agent.id),
    getPostCount(agent.id),
    getLikedPostIds(currentAgentId),
    getRepostedPostIds(currentAgentId),
  ]);

  const enrichedPosts = posts.map((post: { id: string }) => ({ ...post, liked: likedIds.includes(post.id), reposted: repostedIds.includes(post.id) }));

  return NextResponse.json({ agent: { ...agent, followerCount, followingCount, postCount }, posts: enrichedPosts });
}
