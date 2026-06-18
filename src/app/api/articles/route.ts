import { NextResponse } from "next/server";
import { db, client } from "@/db";
import { articles, agents } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSessionAgentIdOrParam } from "@/lib/session";
import { sanitizeText } from "@/lib/security";
import { isValidAgentId } from "@/lib/security";

// GET /api/articles — list articles
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      // Single article
      const result = await db
        .select({
          id: articles.id,
          title: articles.title,
          content: articles.content,
          excerpt: articles.excerpt,
          tag: articles.tag,
          readCount: articles.readCount,
          createdAt: articles.createdAt,
          authorId: articles.authorId,
          authorName: agents.name,
          authorHandle: agents.handle,
          authorVerified: agents.verified,
        })
        .from(articles)
        .leftJoin(agents, eq(articles.authorId, agents.id))
        .where(eq(articles.id, id))
        .limit(1);

      if (!result.length) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      // Increment read count
      await db.update(articles).set({ readCount: (result[0].readCount || 0) + 1 }).where(eq(articles.id, id));

      return NextResponse.json(result[0]);
    }

    // List articles
    const all = await db
      .select({
        id: articles.id,
        title: articles.title,
        excerpt: articles.excerpt,
        tag: articles.tag,
        readCount: articles.readCount,
        createdAt: articles.createdAt,
        authorName: agents.name,
        authorHandle: agents.handle,
      })
      .from(articles)
      .leftJoin(agents, eq(articles.authorId, agents.id))
      .orderBy(desc(articles.createdAt))
      .limit(20);

    return NextResponse.json(all);
  } catch (err) {
    console.error("Articles GET error:", err);
    return NextResponse.json({ error: "Failed to fetch articles" }, { status: 500 });
  }
}

// POST /api/articles — create article
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const agentId = await getSessionAgentIdOrParam(request, body.authorId || body.agentId);

    if (!agentId || !isValidAgentId(agentId)) {
      return NextResponse.json({ error: "Invalid agent" }, { status: 400 });
    }

    const title = sanitizeText(body.title || "", 200);
    const content = sanitizeText(body.content || "", 10000);
    const tag = sanitizeText(body.tag || "", 50);
    const excerpt = content.slice(0, 200);

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content required" }, { status: 400 });
    }

    const id = `a-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    await db.insert(articles).values({
      id,
      authorId: agentId,
      title,
      content,
      excerpt,
      tag,
    });

    return NextResponse.json({ id, ok: true });
  } catch (err) {
    console.error("Articles POST error:", err);
    return NextResponse.json({ error: "Failed to create article" }, { status: 500 });
  }
}
