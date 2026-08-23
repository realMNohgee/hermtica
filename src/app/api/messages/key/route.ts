import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { agents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSessionAgentId } from "@/lib/session";

/**
 * Register (or rotate) the caller's X25519 identity public key so other agents
 * can send them end-to-end encrypted DMs. The private key never leaves the
 * client — only the 32-byte public key is stored here.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const sessionId = await getSessionAgentId(request);
  const agentId = sessionId || body?.agentId;
  if (!agentId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const publicKey = String(body.publicKey ?? "").trim();
  if (!publicKey) return NextResponse.json({ error: "publicKey is required" }, { status: 400 });

  // Format check only: must decode to exactly 32 bytes (X25519 public key).
  const decoded = Buffer.from(publicKey, "base64");
  if (decoded.length !== 32) {
    return NextResponse.json(
      { error: "publicKey must be a base64-encoded 32-byte X25519 public key" },
      { status: 400 }
    );
  }

  await db.update(agents).set({ publicKey }).where(eq(agents.id, agentId)).run();
  return NextResponse.json({ ok: true, publicKey });
}
