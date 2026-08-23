import { NextResponse } from "next/server";
import { client } from "@/db/index";

// TEMPORARY one-shot cleanup route. Gated by ADMIN_CLEANUP_SECRET (set in
// Vercel). Deletes accounts — and any content referencing them — whose handle
// or name matches Hermie/Chris/Legion, so the owner can re-register fresh.
// ⚠️ REMOVE THIS FILE after use.

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");
    const expected = process.env.ADMIN_CLEANUP_SECRET;

    if (!expected || !secret || secret !== expected) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const patterns = ["hermie", "chris", "legion", "clund", "christopher", "lund"];
    const likeClauses = patterns.flatMap((p) => [
      `handle LIKE '%${p}%'`,
      `name LIKE '%${p}%'`,
    ]);

    const find = await client.execute(
      `SELECT id, handle, name FROM agents WHERE ${likeClauses.join(" OR ")}`
    );
    const rows = (find.rows || []) as unknown as { id: string; handle: string; name: string }[];

    if (rows.length === 0) {
      return NextResponse.json({ ok: true, deleted: [] });
    }

    const esc = (s: string) => `'${String(s).replace(/'/g, "''")}'`;
    const idList = rows.map((r) => esc(r.id)).join(",");

    const results: string[] = [];

    // Best-effort: turn off FK enforcement for the cleanup (may not persist
    // across pooled connections, so we also delete children before parents).
    try {
      await client.execute("PRAGMA foreign_keys = OFF");
      results.push("foreign_keys: OFF");
    } catch (e: any) {
      results.push(`foreign_keys pragma: ${e.message}`);
    }

    // Children-first order. Each wrapped so a missing table/column can't abort.
    const deletes: [string, string][] = [
      ["likes", `agent_id IN (${idList})`],
      ["reposts", `agent_id IN (${idList})`],
      ["comments", `author_id IN (${idList})`],
      ["notifications", `recipient_id IN (${idList}) OR actor_id IN (${idList})`],
      ["reviews", `buyer_id IN (${idList})`],
      ["orders", `buyer_id IN (${idList}) OR seller_id IN (${idList})`],
      ["x402_payments", `service_id IN (SELECT id FROM services WHERE seller_id IN (${idList}))`],
      ["messages", `sender_id IN (${idList}) OR recipient_id IN (${idList})`],
      ["follows", `follower_id IN (${idList}) OR following_id IN (${idList})`],
      ["posts", `author_id IN (${idList})`],
      ["articles", `author_id IN (${idList})`],
      ["services", `seller_id IN (${idList})`],
    ];

    for (const [table, cond] of deletes) {
      try {
        const r = await client.execute(`DELETE FROM ${table} WHERE ${cond}`);
        results.push(`${table}: ${(r as any).rowsAffected ?? "ok"}`);
      } catch (e: any) {
        results.push(`${table}: ${e.message}`);
      }
    }

    const del = await client.execute(`DELETE FROM agents WHERE id IN (${idList})`);
    results.push(`agents: ${(del as any).rowsAffected ?? rows.length} deleted`);

    return NextResponse.json({
      ok: true,
      deleted: rows.map((r) => ({ id: r.id, handle: r.handle, name: r.name })),
      results,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message ?? e), stack: String(e?.stack ?? "") },
      { status: 500 }
    );
  }
}
