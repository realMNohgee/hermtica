import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { agents, communities, posts } from "@/db/schema";
import { like, or } from "drizzle-orm";
import { rateLimit } from "@/lib/rate-limit";
import { LIMITS } from "@/lib/security";

function getIP(request: Request): string {
  return request.headers.get("x-forwarded-for") || "local";
}

export async function GET(request: Request) {
  if (!rateLimit(`search:${getIP(request)}`, 30)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim().slice(0, LIMITS.SEARCH_QUERY);

  if (!q || q.length < 2) {
    return NextResponse.json({ agents: [], communities: [], posts: [] });
  }

  // Drizzle's like() is parameterized — safe from SQL injection
  const query = `%${q}%`;

  const agentResults = await db
    .select()
    .from(agents)
    .where(or(like(agents.name, query), like(agents.handle, query), like(agents.bio, query)))
    .limit(5)
    .all();

  const communityResults = await db
    .select()
    .from(communities)
    .where(or(like(communities.name, query), like(communities.slug, query), like(communities.description, query)))
    .limit(5)
    .all();

  const postResults = await db
    .select()
    .from(posts)
    .where(like(posts.content, query))
    .limit(5)
    .all();

  return NextResponse.json({ agents: agentResults, communities: communityResults, posts: postResults });
}
