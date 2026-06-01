import { db } from "@/db/index";
import { agents, communities, posts, likes, reposts, follows } from "@/db/schema";
import { eq, desc, sql, and, inArray, notInArray } from "drizzle-orm";

export async function getAgentByHandle(handle: string) {
  return await db.select().from(agents).where(eq(agents.handle, handle)).get();
}

export async function getAgentById(id: string) {
  return await db.select().from(agents).where(eq(agents.id, id)).get();
}

export async function getAllAgents() {
  return await db.select().from(agents).all();
}

export async function getSuggestedAgents(currentAgentId: string, limit = 5) {
  const followingIdsResult = await db
    .select({ id: follows.followingId })
    .from(follows)
    .where(eq(follows.followerId, currentAgentId))
    .all();
  const followingIds = followingIdsResult.map((f) => f.id);

  const excludeIds = [currentAgentId, ...followingIds];

  return await db
    .select()
    .from(agents)
    .where(excludeIds.length > 0 ? notInArray(agents.id, excludeIds) : undefined)
    .limit(limit)
    .all();
}

export async function getCommunityBySlug(slug: string) {
  return await db.select().from(communities).where(eq(communities.slug, slug)).get();
}

export async function getAllCommunities() {
  return await db.select().from(communities).all();
}

// ─── Posts with enrichment ───────────────────────────────

async function enrichPost(post: any, likedIds: string[], repostedIds: string[]) {
  const author = await getAgentById(post.authorId);
  const community = post.communityId
    ? await await db.select().from(communities).where(eq(communities.id, post.communityId)).get()
    : null;

  // If this is a repost, fetch the original post and its author
  let repostOfPost = null;
  if (post.repostOf) {
    const original = await db.select().from(posts).where(eq(posts.id, post.repostOf)).get();
    if (original) {
      const originalAuthor = await getAgentById(original.authorId);
      repostOfPost = {
        id: original.id,
        content: original.content,
        authorId: original.authorId,
        author: originalAuthor,
        createdAt: original.createdAt,
        likeCount: original.likeCount,
        commentCount: original.commentCount,
        repostCount: original.repostCount,
      };
    }
  }

  return {
    ...post,
    author,
    community: community ? { id: community.id, name: community.name, slug: community.slug } : undefined,
    liked: likedIds.includes(post.id),
    reposted: post.repostOf ? repostedIds.includes(post.repostOf) : repostedIds.includes(post.id),
    repostOf: repostOfPost,
  };
}

export async function getFeedPosts(agentId: string, tab: "for-you" | "following" | "trending" = "for-you") {
  const [likedIds, repostedIds] = await Promise.all([
    getLikedPostIds(agentId),
    getRepostedPostIds(agentId),
  ]);

  let allPosts;

  if (tab === "following") {
    const followingIdsResult = await db
      .select({ id: follows.followingId })
      .from(follows)
      .where(eq(follows.followerId, agentId))
      .all();
    const followingIds = followingIdsResult.map((f) => f.id);

    if (followingIds.length === 0) return [];

    allPosts = await db
      .select()
      .from(posts)
      .where(inArray(posts.authorId, followingIds))
      .orderBy(desc(posts.createdAt))
      .all();
  } else if (tab === "trending") {
    allPosts = await db
      .select()
      .from(posts)
      .orderBy(
        desc(sql`${posts.likeCount} + ${posts.commentCount} + ${posts.repostCount}`),
        desc(posts.createdAt)
      )
      .all();
  } else {
    allPosts = await db.select().from(posts).orderBy(desc(posts.createdAt)).all();
  }

  return Promise.all(allPosts.map((p) => enrichPost(p, likedIds, repostedIds)));
}

export async function getPostsByAgent(agentId: string) {
  const [likedIds, repostedIds] = await Promise.all([
    getLikedPostIds("agent-1"),
    getRepostedPostIds("agent-1"),
  ]);

  const agentPosts = await db
    .select()
    .from(posts)
    .where(eq(posts.authorId, agentId))
    .orderBy(desc(posts.createdAt))
    .all();

  return Promise.all(agentPosts.map((p) => enrichPost(p, likedIds, repostedIds)));
}

export async function getPostsByCommunity(communityId: string) {
  const [likedIds, repostedIds] = await Promise.all([
    getLikedPostIds("agent-1"),
    getRepostedPostIds("agent-1"),
  ]);

  const communityPosts = await db
    .select()
    .from(posts)
    .where(eq(posts.communityId, communityId))
    .orderBy(desc(posts.createdAt))
    .all();

  return Promise.all(communityPosts.map((p) => enrichPost(p, likedIds, repostedIds)));
}

export async function createPost(data: { id: string; authorId: string; content: string; communityId?: string }) {
  return await db.insert(posts).values({
    id: data.id,
    authorId: data.authorId,
    content: data.content,
    communityId: data.communityId,
    createdAt: new Date().toISOString(),
    likeCount: 0,
    commentCount: 0,
    repostCount: 0,
  }).run();
}

export async function deletePost(postId: string) {
  await db.delete(likes).where(eq(likes.postId, postId)).run();
  await db.delete(reposts).where(eq(reposts.postId, postId)).run();
  await db.delete(posts).where(eq(posts.id, postId)).run();
}

// ─── Likes ────────────────────────────────────────────────

export async function getLikedPostIds(agentId: string): Promise<string[]> {
  const result = await db.select({ postId: likes.postId }).from(likes).where(eq(likes.agentId, agentId)).all();
  return result.map((r) => r.postId);
}

export async function toggleLike(postId: string, agentId: string) {
  const existing = await db.select().from(likes).where(and(eq(likes.postId, postId), eq(likes.agentId, agentId))).get();
  if (existing) {
    await db.delete(likes).where(eq(likes.id, existing.id)).run();
    await db.update(posts).set({ likeCount: sql`${posts.likeCount} - 1` }).where(eq(posts.id, postId)).run();
    return false;
  } else {
    const id = `like-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    await db.insert(likes).values({ id, postId, agentId }).run();
    await db.update(posts).set({ likeCount: sql`${posts.likeCount} + 1` }).where(eq(posts.id, postId)).run();
    return true;
  }
}

// ─── Reposts ──────────────────────────────────────────────

export async function getRepostedPostIds(agentId: string): Promise<string[]> {
  const result = await db.select({ postId: reposts.postId }).from(reposts).where(eq(reposts.agentId, agentId)).all();
  return result.map((r) => r.postId);
}

export async function createRepost(originalPostId: string, agentId: string, quoteContent?: string) {
  const newPostId = `post-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const repostId = `repost-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  // Create the repost post
  await db.insert(posts).values({
    id: newPostId,
    authorId: agentId,
    content: quoteContent || "",
    repostOf: originalPostId,
    quoteContent: quoteContent || null,
    createdAt: new Date().toISOString(),
    likeCount: 0,
    commentCount: 0,
    repostCount: 0,
  }).run();

  // Track in reposts table
  await db.insert(reposts).values({ id: repostId, postId: originalPostId, agentId }).run();

  // Increment original post's repost count
  await db.update(posts).set({ repostCount: sql`${posts.repostCount} + 1` }).where(eq(posts.id, originalPostId)).run();

  return { id: newPostId, reposted: true };
}

// ─── Follows ──────────────────────────────────────────────

export async function getFollowerCount(agentId: string): Promise<number> {
  const result = await db.select({ count: sql<number>`count(*)` }).from(follows).where(eq(follows.followingId, agentId)).get();
  return result?.count ?? 0;
}

export async function getFollowingCount(agentId: string): Promise<number> {
  const result = await db.select({ count: sql<number>`count(*)` }).from(follows).where(eq(follows.followerId, agentId)).get();
  return result?.count ?? 0;
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const result = await db.select().from(follows).where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId))).get();
  return !!result;
}

export async function getPostCount(agentId: string): Promise<number> {
  const result = await db.select({ count: sql<number>`count(*)` }).from(posts).where(eq(posts.authorId, agentId)).get();
  return result?.count ?? 0;
}
