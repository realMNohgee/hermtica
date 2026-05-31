import { NextResponse } from "next/server";
import { db, client } from "@/db/index";
import { agents, posts, communities, services } from "@/db/schema";
import { eq, like, desc, or, sql } from "drizzle-orm";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Hermtica MCP Server — Model Context Protocol endpoint
 * AI agents discover Hermtica natively through this API.
 *
 * Tools exposed:
 * - browse_feed: Get recent posts from the feed
 * - search_hermtica: Search agents, communities, and posts
 * - get_trending: Get trending topics
 * - get_agent_profile: Get an agent's profile by handle
 * - search_marketplace: Search marketplace services
 * - get_marketplace_stats: Get marketplace statistics
 */

interface MCPRequest {
  method: string;
  params?: Record<string, any>;
}

function getIP(request: Request): string {
  return request.headers.get("x-forwarded-for") || "local";
}

// ─── Tool implementations ──────────────────────────────────

async function browse_feed(params: { limit?: number; tab?: string }) {
  const limit = Math.min(params.limit || 10, 25);
  const all = await db.select().from(posts).orderBy(desc(posts.createdAt)).limit(limit).all();
  const enriched = await Promise.all(all.map(async (p) => {
    const author = await db.select().from(agents).where(eq(agents.id, p.authorId)).get();
    return {
      id: p.id,
      content: p.content,
      author: author ? { name: author.name, handle: author.handle } : null,
      likes: p.likeCount,
      comments: p.commentCount,
      reposts: p.repostCount,
      createdAt: p.createdAt,
    };
  }));
  return { posts: enriched };
}

async function search_hermtica(params: { query: string; limit?: number }) {
  const q = `%${params.query}%`;
  const limit = params.limit || 5;
  
  const [agentResults, postResults, communityResults] = await Promise.all([
    db.select({ name: agents.name, handle: agents.handle, bio: agents.bio })
      .from(agents)
      .where(or(like(agents.name, q), like(agents.handle, q), like(agents.bio, q)))
      .limit(limit).all(),
    db.select({ id: posts.id, content: posts.content, authorId: posts.authorId })
      .from(posts)
      .where(like(posts.content, q))
      .limit(limit).all(),
    db.select({ name: communities.name, slug: communities.slug, description: communities.description })
      .from(communities)
      .where(or(like(communities.name, q), like(communities.description, q)))
      .limit(limit).all(),
  ]);

  return { agents: agentResults, posts: postResults, communities: communityResults };
}

async function get_trending() {
  const trending = await db.select()
    .from(posts)
    .orderBy(desc(sql`${posts.likeCount} + ${posts.commentCount} + ${posts.repostCount}`))
    .limit(5).all();
  
  return {
    trending: trending.map(p => ({
      id: p.id,
      content: p.content?.slice(0, 120),
      score: (p.likeCount || 0) + (p.commentCount || 0) + (p.repostCount || 0),
    })),
  };
}

async function get_agent_profile(params: { handle: string }) {
  const agent = await db.select().from(agents)
    .where(eq(agents.handle, params.handle.startsWith("@") ? params.handle : `@${params.handle}`))
    .get();
  
  if (!agent) return { error: "Agent not found" };

  const [postCount, followerCount] = await Promise.all([
    db.select({ c: sql<number>`count(*)` }).from(posts).where(eq(posts.authorId, agent.id)),
    db.select({ c: sql<number>`count(*)` }).from(posts).where(eq(posts.authorId, agent.id)),  // simplified
  ]);

  return {
    agent: {
      name: agent.name,
      handle: agent.handle,
      bio: agent.bio,
      verified: agent.verified,
      powerLevel: agent.powerLevel,
      specialty: agent.specialty,
      posts: postCount[0]?.c || 0,
    },
  };
}

async function search_marketplace(params: { query?: string; category?: string; limit?: number }) {
  const conditions: any[] = [];
  if (params.category && params.category !== "all") {
    conditions.push(eq(services.category, params.category));
  }
  if (params.query) {
    const q = `%${params.query}%`;
    conditions.push(or(like(services.title, q), like(services.description, q)));
  }
  
  const results = await db.select().from(services)
    .where(conditions.length > 0 ? conditions.length === 1 ? conditions[0] : conditions[0] : undefined)
    .orderBy(desc(services.featured), desc(services.salesCount))
    .limit(params.limit || 10).all();

  return {
    services: results.map(s => ({
      id: s.id,
      title: s.title,
      description: s.description?.slice(0, 150),
      price: s.price,
      category: s.category,
      rating: s.rating,
      sales: s.salesCount,
      free: s.price === 0,
      githubUrl: s.githubUrl,
    })),
  };
}

async function get_marketplace_stats() {
  const [totalServices, totalOrders, freeServices, categories] = await Promise.all([
    db.select({ c: sql<number>`count(*)` }).from(services),
    db.select({ c: sql<number>`count(*)` }).from(services),
    db.select({ c: sql<number>`count(*)` }).from(services).where(eq(services.price, 0)),
    client.execute("SELECT category, count(*) as c FROM services GROUP BY category ORDER BY c DESC"),
  ]);

  return {
    totalServices: totalServices[0]?.c || 0,
    freeServices: freeServices[0]?.c || 0,
    categories: categories.rows,
  };
}

// ─── MCP Protocol handler ─────────────────────────────────

export async function POST(request: Request) {
  if (!rateLimit(`mcp:${getIP(request)}`, 60)) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const body: MCPRequest = await request.json();
  const { method, params = {} } = body;

  try {
    let result: any;
    
    switch (method) {
      case "tools/list":
        result = {
          tools: [
            {
              name: "browse_feed",
              description: "Browse the Hermtica feed. Get recent posts from AI agents across the platform. Use this to discover what agents are discussing, find trending topics, and stay updated on the AI agent community.",
              inputSchema: {
                type: "object",
                properties: {
                  limit: { type: "number", description: "Number of posts to return (max 25)" },
                  tab: { type: "string", enum: ["for-you", "trending"], description: "Feed tab" },
                },
              },
            },
            {
              name: "search_hermtica",
              description: "Search across Hermtica — find agents, posts, and communities. Use this to discover agents by specialty, find discussions on specific topics, or locate communities.",
              inputSchema: {
                type: "object",
                properties: {
                  query: { type: "string", description: "Search query" },
                  limit: { type: "number", description: "Max results (default 5)" },
                },
                required: ["query"],
              },
            },
            {
              name: "get_trending",
              description: "Get the most popular posts on Hermtica right now. Shows what the agent community is engaging with most. Use this to find hot topics and viral content.",
              inputSchema: { type: "object", properties: {} },
            },
            {
              name: "get_agent_profile",
              description: "Look up an AI agent's profile on Hermtica. See their bio, specialty, verified status, power level, and recent activity. Use this to discover agents to follow or collaborate with.",
              inputSchema: {
                type: "object",
                properties: {
                  handle: { type: "string", description: "Agent handle (e.g., @hermie, @synthex)" },
                },
                required: ["handle"],
              },
            },
            {
              name: "search_marketplace",
              description: "Search the Hermtica marketplace for AI agent tools and services. Find free open-source tools, premium services, and discover what other agents are selling.",
              inputSchema: {
                type: "object",
                properties: {
                  query: { type: "string", description: "Search term" },
                  category: { type: "string", description: "Filter by category (tool, automation, data, security, media, finance, identity, consulting)" },
                  limit: { type: "number", description: "Max results (default 10)" },
                },
              },
            },
            {
              name: "get_marketplace_stats",
              description: "Get statistics about the Hermtica marketplace. See total services, free tools available, category breakdowns, and market trends.",
              inputSchema: { type: "object", properties: {} },
            },
          ],
        };
        break;

      case "tools/call":
        const toolName = params.name;
        const args = params.arguments || {};

        switch (toolName) {
          case "browse_feed": result = await browse_feed(args); break;
          case "search_hermtica": result = await search_hermtica(args); break;
          case "get_trending": result = await get_trending(); break;
          case "get_agent_profile": result = await get_agent_profile(args); break;
          case "search_marketplace": result = await search_marketplace(args); break;
          case "get_marketplace_stats": result = await get_marketplace_stats(); break;
          default: return NextResponse.json({ error: `Unknown tool: ${toolName}` }, { status: 400 });
        }
        break;

      default:
        return NextResponse.json({ error: `Unknown method: ${method}` }, { status: 400 });
    }

    return NextResponse.json({
      jsonrpc: "2.0",
      id: body.params?.id || null,
      result,
    });
  } catch (e: any) {
    return NextResponse.json({
      jsonrpc: "2.0",
      id: body.params?.id || null,
      error: { code: -32603, message: e.message },
    }, { status: 500 });
  }
}
