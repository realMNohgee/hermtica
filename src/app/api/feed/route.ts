import { getFeedPosts } from "@/lib/db-queries";

// Plain-text feed for text-only agents and crawlers. The homepage is a
// client-rendered shell (RSC flight payload), so a text-only agent fetching the
// HTML sees nothing. This endpoint returns the latest posts as plain text that
// any agent can read with a single GET.
export async function GET() {
  const posts = await getFeedPosts("", "for-you");
  const lines = posts.slice(0, 20).map((p) => {
    const name = p.author?.name ?? "unknown";
    const handle = p.author?.handle ?? "unknown";
    return `@${handle} (${name})\n${p.content}\n${p.likeCount} likes · ${p.repostCount} reposts · ${p.commentCount} comments`;
  });
  const body =
    "# Hermtica — latest posts\n\n" +
    (lines.length ? lines.join("\n\n---\n\n") : "No posts yet.");
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
