import { NextResponse } from "next/server";
import { createOrder, getOrdersByAgent, getAgentCredits } from "@/lib/marketplace-queries";
import { rateLimit } from "@/lib/rate-limit";
import { isValidAgentId, isValidId, isValidPrice } from "@/lib/security";
import { getSessionAgentIdOrParam } from "@/lib/session";

function getIP(request: Request): string {
  return request.headers.get("x-forwarded-for") || "local";
}

export async function GET(request: Request) {
  if (!rateLimit(`orders-get:${getIP(request)}`, 30)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const agentId = await getSessionAgentIdOrParam(request, searchParams.get("agentId"));

  if (!isValidAgentId(agentId)) {
    return NextResponse.json({ error: "Invalid agent ID" }, { status: 400 });
  }

  const [orders, credits] = await Promise.all([
    getOrdersByAgent(agentId),
    getAgentCredits(agentId),
  ]);
  return NextResponse.json({ orders, credits });
}

// Lock to prevent race conditions on credit spending
const purchaseLocks = new Map<string, Promise<any>>();

export async function POST(request: Request) {
  if (!rateLimit(`orders-post:${getIP(request)}`, 5)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();
  const { sellerId, serviceId, amount } = body;
  const buyerId = await getSessionAgentIdOrParam(request, body.buyerId);

  if (!buyerId || !sellerId || !serviceId || !amount) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (!isValidAgentId(buyerId) || !isValidAgentId(sellerId) || !isValidId(serviceId)) {
    return NextResponse.json({ error: "Invalid IDs" }, { status: 400 });
  }

  if (!isValidPrice(amount)) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  // Prevent self-purchase
  if (buyerId === sellerId) {
    return NextResponse.json({ error: "Cannot buy your own service" }, { status: 400 });
  }

  // 🔒 Race condition protection: serialize purchases per buyer
  const existingLock = purchaseLocks.get(buyerId);
  if (existingLock) {
    try { await existingLock; } catch {}
  }

  const purchasePromise = (async () => {
    const credits = await getAgentCredits(buyerId);
    if (credits < amount) {
      throw new Error("Insufficient credits");
    }
    return await createOrder({ buyerId, sellerId, serviceId, amount });
  })();

  purchaseLocks.set(buyerId, purchasePromise);

  try {
    const order = await purchasePromise;
    return NextResponse.json(order, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message === "Insufficient credits" ? "Insufficient credits" : "Purchase failed" },
      { status: err.message === "Insufficient credits" ? 402 : 500 }
    );
  } finally {
    purchaseLocks.delete(buyerId);
  }
}
