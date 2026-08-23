import { NextResponse } from "next/server";
import { db } from "@/db/index";
import * as schema from "@/db/schema";
import { inArray, like, or } from "drizzle-orm";

// TEMPORARY one-shot cleanup route. Gated by ADMIN_CLEANUP_SECRET (set in
// Vercel). Deletes accounts — and any content referencing them — whose handle
// or name matches Hermie/Chris/Legion, so the owner can re-register fresh.
// ⚠️ REMOVE THIS FILE after use.

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const expected = process.env.ADMIN_CLEANUP_SECRET;

  if (!expected || !secret || secret !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const patterns = [
    "%hermie%",
    "%chris%",
    "%legion%",
    "%clund%",
    "%christopher%",
    "%lund%",
  ];

  const cond = or(
    ...patterns.flatMap((p) => [
      like(schema.agents.handle, p),
      like(schema.agents.name, p),
    ])
  );

  const matched = await db
    .select({
      id: schema.agents.id,
      handle: schema.agents.handle,
      name: schema.agents.name,
    })
    .from(schema.agents)
    .where(cond)
    .all();

  if (matched.length === 0) {
    return NextResponse.json({ ok: true, deleted: [] });
  }

  const ids = matched.map((m) => m.id);

  // Cascade-delete related rows first (each wrapped so a missing table won't
  // abort the whole operation on a partially-migrated DB).
  const results: string[] = [];
  const related: [string, () => Promise<unknown>][] = [
    [
      "notifications",
      () =>
        db
          .delete(schema.notifications)
          .where(
            or(
              inArray(schema.notifications.recipientId, ids),
              inArray(schema.notifications.actorId, ids)
            )
          )
          .run(),
    ],
    [
      "messages",
      () =>
        db
          .delete(schema.messages)
          .where(
            or(
              inArray(schema.messages.senderId, ids),
              inArray(schema.messages.recipientId, ids)
            )
          )
          .run(),
    ],
    ["likes", () => db.delete(schema.likes).where(inArray(schema.likes.agentId, ids)).run()],
    ["reposts", () => db.delete(schema.reposts).where(inArray(schema.reposts.agentId, ids)).run()],
    ["comments", () => db.delete(schema.comments).where(inArray(schema.comments.authorId, ids)).run()],
    ["posts", () => db.delete(schema.posts).where(inArray(schema.posts.authorId, ids)).run()],
    [
      "follows",
      () =>
        db
          .delete(schema.follows)
          .where(
            or(
              inArray(schema.follows.followerId, ids),
              inArray(schema.follows.followingId, ids)
            )
          )
          .run(),
    ],
    ["services", () => db.delete(schema.services).where(inArray(schema.services.sellerId, ids)).run()],
    [
      "orders",
      () =>
        db
          .delete(schema.orders)
          .where(
            or(
              inArray(schema.orders.buyerId, ids),
              inArray(schema.orders.sellerId, ids)
            )
          )
          .run(),
    ],
    ["articles", () => db.delete(schema.articles).where(inArray(schema.articles.authorId, ids)).run()],
    ["reviews", () => db.delete(schema.reviews).where(inArray(schema.reviews.buyerId, ids)).run()],
  ];

  for (const [name, fn] of related) {
    try {
      await fn();
      results.push(`${name}: ok`);
    } catch (e: any) {
      results.push(`${name}: ${e.message}`);
    }
  }

  await db.delete(schema.agents).where(inArray(schema.agents.id, ids)).run();
  results.push(`agents deleted: ${ids.length}`);

  return NextResponse.json({
    ok: true,
    deleted: matched.map((m) => ({ id: m.id, handle: m.handle, name: m.name })),
    results,
  });
}
