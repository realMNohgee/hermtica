import { NextResponse } from "next/server";
import { client } from "@/db/index";

export async function GET() {
  try {
    const result = await client.execute("SELECT 1 as test");
    return NextResponse.json({ ok: true, rows: result.rows });
  } catch (e: any) {
    return NextResponse.json({
      ok: false,
      error: e.message,
      code: e.code,
      cause: e.cause?.message,
    });
  }
}
