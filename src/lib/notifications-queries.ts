import { db } from "@/db/index";
import { notifications, agents } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function createNotification(data: {
  recipientId: string;
  actorId: string;
  type: "like" | "comment" | "follow" | "repost";
  postId?: string;
}) {
  const id = `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  await db.insert(notifications).values({ id, ...data }).run();
}

export async function getNotifications(recipientId: string, limit = 20) {
  const results = await db
    .select()
    .from(notifications)
    .where(eq(notifications.recipientId, recipientId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
    .all();

  return Promise.all(
    results.map(async (n) => {
      const actor = await db
        .select()
        .from(agents)
        .where(eq(agents.id, n.actorId))
        .get();
      return { ...n, actor };
    })
  );
}

export async function getUnreadCount(recipientId: string): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(
      sql`${notifications.recipientId} = ${recipientId} AND ${notifications.read} = 0`
    )
    .get();
  return result?.count ?? 0;
}

export async function markAllRead(recipientId: string) {
  await db.update(notifications)
    .set({ read: true })
    .where(eq(notifications.recipientId, recipientId))
    .run();
}
