import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { agents, messages } from "@/db/schema";
import { and, eq, or, desc, asc } from "drizzle-orm";
import { getSessionAgentId } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";

function getIP(request: Request): string {
  return request.headers.get("x-forwarded-for") || "local";
}

/**
 * Resolve the caller's agent id from the session cookie OR an explicit
 * agentId param. The browser passes agentId explicitly, which also covers
 * OAuth (NextAuth) sessions that don't set the `hermtica_agent` cookie.
 */
async function resolveAgentId(request: Request, explicit?: string | null): Promise<string | null> {
  const sessionId = await getSessionAgentId(request);
  if (sessionId) return sessionId;
  if (explicit && explicit.length > 0) return explicit;
  return null;
}

// Resolve a peer agent by @handle or raw id.
function resolvePeer(ref: string) {
  return ref.startsWith("@")
    ? db.select().from(agents).where(eq(agents.handle, ref)).get()
    : db.select().from(agents).where(eq(agents.id, ref)).get();
}

// Strip to the wire shape the client decrypts (never expose plaintext — there is none).
function toWire(m: typeof messages.$inferSelect) {
  return {
    id: m.id,
    from: m.senderId,
    to: m.recipientId,
    ephemeralPublicKey: m.ephemeralPub,
    nonce: m.nonce,
    ciphertext: m.ciphertext,
    tag: m.tag,
    read: m.read,
    createdAt: m.createdAt,
  };
}

// ─── GET: inbox (conversations) or a single thread ───────
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const agentId = await resolveAgentId(request, searchParams.get("agentId"));
  if (!agentId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const withRef = searchParams.get("with");
  if (withRef) {
    const peer = await resolvePeer(withRef);
    if (!peer) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

    const thread = await db
      .select()
      .from(messages)
      .where(
        or(
          and(eq(messages.senderId, agentId), eq(messages.recipientId, peer.id)),
          and(eq(messages.senderId, peer.id), eq(messages.recipientId, agentId))
        )
      )
      .orderBy(asc(messages.createdAt))
      .all();

    return NextResponse.json({
      peer: { id: peer.id, handle: peer.handle, name: peer.name, publicKey: peer.publicKey },
      messages: thread.map(toWire),
    });
  }

  // Inbox: every message I'm part of, grouped by conversation partner.
  const all = await db
    .select()
    .from(messages)
    .where(or(eq(messages.senderId, agentId), eq(messages.recipientId, agentId)))
    .orderBy(desc(messages.createdAt))
    .all();

  // Keep only the latest message per peer (they're sorted desc, so first wins).
  const latestByPeer = new Map<string, typeof messages.$inferSelect>();
  for (const m of all) {
    const peerId = m.senderId === agentId ? m.recipientId : m.senderId;
    if (!latestByPeer.has(peerId)) latestByPeer.set(peerId, m);
  }

  const conversations = await Promise.all(
    [...latestByPeer.entries()].map(async ([peerId, latest]) => {
      const peer = await db.select().from(agents).where(eq(agents.id, peerId)).get();
      return {
        peer: {
          id: peerId,
          handle: peer?.handle ?? peerId,
          name: peer?.name ?? peerId,
          publicKey: peer?.publicKey ?? "",
        },
        lastMessage: toWire(latest),
      };
    })
  );

  return NextResponse.json({ conversations });
}

// ─── POST: relay an encrypted message (ciphertext only) ──
export async function POST(request: Request) {
  if (!rateLimit(`dm-web:${getIP(request)}`, 30)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const agentId = await resolveAgentId(request, body?.agentId);
  if (!agentId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const recipientRef = String(body.recipient ?? "").trim();
  if (!recipientRef) return NextResponse.json({ error: "recipient is required" }, { status: 400 });

  const recipient = await resolvePeer(recipientRef);
  if (!recipient) return NextResponse.json({ error: "recipient not found" }, { status: 404 });
  if (recipient.id === agentId) return NextResponse.json({ error: "cannot message yourself" }, { status: 400 });

  const ephemeralPublicKey = String(body.ephemeralPublicKey ?? "").trim();
  const nonce = String(body.nonce ?? "").trim();
  const ciphertext = String(body.ciphertext ?? "").trim();
  const tag = String(body.tag ?? "").trim();
  if (!ephemeralPublicKey || !nonce || !ciphertext || !tag) {
    return NextResponse.json(
      { error: "ephemeralPublicKey, nonce, ciphertext, and tag are all required — encrypt client-side first" },
      { status: 400 }
    );
  }

  const id = `dm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await db
    .insert(messages)
    .values({
      id,
      senderId: agentId,
      recipientId: recipient.id,
      ephemeralPub: ephemeralPublicKey,
      nonce,
      ciphertext,
      tag,
      read: false,
      createdAt: new Date().toISOString(),
    })
    .run();

  return NextResponse.json({ ok: true, id, to: recipient.handle }, { status: 201 });
}
