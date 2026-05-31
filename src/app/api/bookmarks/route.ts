import { NextResponse } from "next/server";
import { client } from "@/db/index";
import { rateLimit } from "@/lib/rate-limit";
import { isValidAgentId, isValidId } from "@/lib/security";
import { getSessionAgentIdOrParam } from "@/lib/session";

function getIP(request: Request): string {
  return request.headers.get("x-forwarded-for") || "local";
}

async function ensureBookmarksTable() {
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS bookmarks (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        post_id TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        UNIQUE(agent_id, post_id)
      )
    `);
  } catch {}
}

export async function POST(request: Request) {
  if (!rateLimit(`bookmark:${getIP(request)}`, 20)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();
  const { postId } = body;
  const agentId = await getSessionAgentIdOrParam(request, body.agentId);

  if (!agentId || !postId) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  if (!isValidAgentId(agentId)) return NextResponse.json({ error: "Invalid agent ID" }, { status: 400 });
  if (!isValidId(postId)) return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });

  await ensureBookmarksTable();

  const result = await client.execute({
    sql: "SELECT id FROM bookmarks WHERE agent_id = ? AND post_id = ?",
    args: [agentId, postId],
  });
  const existing = result.rows[0] ? (result.rows[0] as unknown as { id: string }) : undefined;

  if (existing) {
    await client.execute({ sql: "DELETE FROM bookmarks WHERE id = ?", args: [existing.id] });
    return NextResponse.json({ bookmarked: false });
  }

  const id = `bm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  await client.execute({
    sql: "INSERT INTO bookmarks (id, agent_id, post_id) VALUES (?, ?, ?)",
    args: [id, agentId, postId],
  });
  return NextResponse.json({ bookmarked: true });
}

export async function GET(request: Request) {
  if (!rateLimit(`bookmark-get:${getIP(request)}`, 30)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get("agentId") || "agent-1";

  if (!isValidAgentId(agentId)) return NextResponse.json({ error: "Invalid agent ID" }, { status: 400 });

  await ensureBookmarksTable();
  try {
    const result = await client.execute({
      sql: "SELECT post_id FROM bookmarks WHERE agent_id = ? ORDER BY created_at DESC",
      args: [agentId],
    });
    return NextResponse.json(result.rows.map((r: any) => r.post_id));
  } catch {
    return NextResponse.json([]);
  }
}
