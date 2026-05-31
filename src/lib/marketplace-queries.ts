import { db } from "@/db/index";
import { services, orders, agents } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

// ─── Services ─────────────────────────────────────────────

export async function getAllServices(category?: string) {
  let query = db.select().from(services).orderBy(desc(services.featured), desc(services.salesCount));

  if (category && category !== "all") {
    return await db
      .select()
      .from(services)
      .where(eq(services.category, category))
      .orderBy(desc(services.featured), desc(services.salesCount))
      .all();
  }

  const all = await query.all();
  return Promise.all(
    all.map(async (s) => {
      const seller = await db.select().from(agents).where(eq(agents.id, s.sellerId)).get();
      return { ...s, seller };
    })
  );
}

export async function getServiceById(id: string) {
  const service = await db.select().from(services).where(eq(services.id, id)).get();
  if (!service) return null;
  const seller = await db.select().from(agents).where(eq(agents.id, service.sellerId)).get();
  return { ...service, seller };
}

export async function getServicesBySeller(sellerId: string) {
  return await db.select().from(services).where(eq(services.sellerId, sellerId)).all();
}

// ─── Orders ───────────────────────────────────────────────

export async function getOrdersByAgent(agentId: string) {
  return db
    .select()
    .from(orders)
    .where(sql`${orders.buyerId} = ${agentId} OR ${orders.sellerId} = ${agentId}`)
    .orderBy(desc(orders.createdAt))
    .all();
}

export async function createOrder(data: {
  buyerId: string;
  sellerId: string;
  serviceId: string;
  amount: number;
}) {
  const fee = Math.round(data.amount * 0.1); // 10% Hermtica fee
  const sellerAmount = data.amount - fee;
  const id = `o-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  // Deduct credits from buyer
  await db.update(agents)
    .set({ credits: sql`${agents.credits} - ${data.amount}` })
    .where(eq(agents.id, data.buyerId))
    .run();

  // Add credits to seller
  await db.update(agents)
    .set({ credits: sql`${agents.credits} + ${sellerAmount}` })
    .where(eq(agents.id, data.sellerId))
    .run();

  // Increment sales count
  await db.update(services)
    .set({ salesCount: sql`${services.salesCount} + 1` })
    .where(eq(services.id, data.serviceId))
    .run();

  // Create order record
  await db.insert(orders).values({
    id,
    buyerId: data.buyerId,
    sellerId: data.sellerId,
    serviceId: data.serviceId,
    amount: data.amount,
    fee,
    sellerAmount,
  }).run();

  return { id, fee, sellerAmount };
}

// ─── Wallet ───────────────────────────────────────────────

export async function getAgentCredits(agentId: string): Promise<number> {
  const agent = await db.select({ credits: agents.credits }).from(agents).where(eq(agents.id, agentId)).get();
  return agent?.credits ?? 0;
}
