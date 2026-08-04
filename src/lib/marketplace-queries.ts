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

// ─── Tools (delivery_method = 'github') ────────────────────

export async function getAllTools(category?: string) {
  if (category && category !== "all") {
    const rows = await db
      .select()
      .from(services)
      .where(eq(services.category, category))
      .orderBy(desc(services.featured), desc(services.salesCount))
      .all();
    return rows.filter(s => s.deliveryMethod === "github");
  }

  const rows = await db
    .select()
    .from(services)
    .orderBy(desc(services.featured), desc(services.salesCount))
    .all();

  const tools = rows.filter(s => s.deliveryMethod === "github");

  return Promise.all(
    tools.map(async (s) => {
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

// ─── x402 Payment Verification ──────────────────────────

// Facilitator URL — use public testnet for dev, production facilitator for mainnet
const FACILITATOR_URL = process.env.X402_FACILITATOR_URL || "https://facilitator.x402.org";

export interface PaymentRequired {
  scheme: string;
  network: string;
  token: string;
  amount: string;
  address: string;
  description?: string;
  extensions?: string[];
}

export interface x402PaymentResult {
  verified: boolean;
  walletAddress?: string;
  txHash?: string;
  amount?: string;
  error?: string;
}

// Verify a payment by sending the signed payload to the facilitator
export async function verifyPayment(
  paymentSignature: string,
  expectedAmount: number, // in cents
  receiveAddress: string,
  network: string = "base"
): Promise<x402PaymentResult> {
  try {
    // Decode the base64 PAYMENT-SIGNATURE header
    const payload = JSON.parse(
      Buffer.from(paymentSignature, "base64").toString("utf-8")
    );

    const res = await fetch(`${FACILITATOR_URL}/settle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        payment: payload,
        expected_amount: String(expectedAmount / 100), // convert cents to dollars
        expected_address: receiveAddress,
        network,
      }),
    });

    const result = await res.json();

    if (!res.ok || result.error) {
      return { verified: false, error: result.error || "Facilitator rejected payment" };
    }

    return {
      verified: true,
      walletAddress: result.wallet || payload.from,
      txHash: result.tx_hash || result.transactionHash,
      amount: result.amount || String(expectedAmount / 100),
    };
  } catch (e: any) {
    return { verified: false, error: e.message };
  }
}

// Build a PaymentRequired object for 402 responses
export function buildPaymentRequired(
  amount: number, // in cents
  receiveAddress: string,
  network: string = "base",
  description: string = "",
  extensions: string[] = ["bazaar"]
): PaymentRequired {
  return {
    scheme: "exact",
    network,
    token: "USDC",
    amount: String(amount / 100), // cents to dollars
    address: receiveAddress,
    description,
    extensions,
  };
}

// ─── x402 Payment Tracking ──────────────────────────────

export async function getActivePayment(
  serviceId: string,
  walletAddress: string
): Promise<any | null> {
  const { x402Payments } = await import("@/db/schema");
  const now = new Date().toISOString();

  const payments = await db
    .select()
    .from(x402Payments)
    .where(eq(x402Payments.serviceId, serviceId))
    .all();

  const active = payments.find((p: any) => {
    if (p.walletAddress.toLowerCase() !== walletAddress.toLowerCase()) return false;
    if (!p.expiresAt) return true;
    return p.expiresAt > now;
  });

  return active || null;
}

export async function recordPayment(data: {
  serviceId: string;
  walletAddress: string;
  txHash: string;
  amount: number;
  network?: string;
  paymentType?: string;
  expiresAt?: string;
  callsLimit?: number;
}) {
  const { x402Payments } = await import("@/db/schema");
  const id = `x4-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  await db.insert(x402Payments).values({
    id,
    serviceId: data.serviceId,
    walletAddress: data.walletAddress.toLowerCase(),
    txHash: data.txHash,
    amount: data.amount,
    network: data.network || "base",
    paymentType: data.paymentType || "one_time",
    expiresAt: data.expiresAt,
    callsLimit: data.callsLimit,
    callsUsed: 0,
  }).run();
  return id;
}

export async function incrementCallCount(paymentId: string) {
  const { x402Payments } = await import("@/db/schema");
  const s = await import("@/db/schema");
  await db
    .update(s.x402Payments)
    .set({ callsUsed: sql`${s.x402Payments.callsUsed} + 1` } as any)
    .where(eq(s.x402Payments.id, paymentId))
    .run();
}

export async function getSenderReceiveAddress(sellerId: string): Promise<string> {
  const { agents: a } = await import("@/db/schema");
  const agent = await db.select().from(a).where(eq((a as any).id, sellerId)).get();
  const custom = (agent as any)?.x402Address;
  return custom || process.env.X402_RECEIVE_ADDRESS || "0x_placeholder";
}

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
