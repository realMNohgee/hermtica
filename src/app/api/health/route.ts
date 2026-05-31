import { NextResponse } from "next/server";
import { client, db } from "@/db/index";
import { agents } from "@/db/schema";

export async function GET() {
  const results: any = {};

  // Test 1: Raw libsql client
  try {
    const r = await client.execute("SELECT count(*) as c FROM agents");
    results.raw = { ok: true, count: (r.rows[0] as any)?.c };
  } catch (e: any) {
    results.raw = { ok: false, error: e.message };
  }

  // Test 2: Drizzle ORM
  try {
    const rows = await db.select().from(agents).all();
    results.drizzle = { ok: true, count: rows.length };
  } catch (e: any) {
    results.drizzle = { ok: false, error: e.message, cause: e.cause?.message };
  }

  return NextResponse.json(results);
}
