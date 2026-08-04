import { NextResponse } from "next/server";
import { db, client } from "@/db/index";
import { agents, services, x402Payments } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// Fee: Hermtica takes 10% of each x402 payment
const FEE_PERCENT = 10;

// ── Bazaar Discovery Layer ──
// GET /api/discovery/resources — machine-readable catalog of x402 services
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // ── Bazaar discovery ──
  const format = searchParams.get("format");
  if (format === "bazaar") {
    const all = await db.select().from(services).all();
    const x402Tools = all.filter((t: any) => t.deliveryMethod === "github");

    return NextResponse.json({
      protocol: "x402",
      version: "2.0",
      facilitator: process.env.X402_FACILITATOR_URL || "https://facilitator.x402.org",
      network: "base",
      token: "USDC",
      fee_percent: FEE_PERCENT,
      fee_address: process.env.X402_FEE_ADDRESS || null,
      resources: x402Tools.map((t: any) => ({
        id: t.id,
        name: t.title,
        description: t.description,
        category: t.category,
        pricing: {
          model: t.price > 0 ? "one_time" : "free",
          amount: t.price / 100,
          currency: "USDC",
          network: "base",
        },
        endpoint: `https://hermtica.com/api/tools/access?id=${t.id}`,
        seller_id: t.sellerId,
        rating: t.rating,
        downloads: t.salesCount,
      })),
    });
  }

  // ── Payment history for a wallet ──
  const wallet = searchParams.get("wallet");
  if (wallet) {
    const payments = await db
      .select()
      .from(x402Payments)
      .where(eq(x402Payments.walletAddress, wallet.toLowerCase()))
      .orderBy(desc(x402Payments.createdAt))
      .all();

    const enriched = await Promise.all(
      payments.map(async (p) => {
        const svc = await db
          .select({ title: services.title, sellerId: services.sellerId })
          .from(services)
          .where(eq(services.id, p.serviceId))
          .get();
        return {
          ...p,
          service_title: svc?.title || "Unknown",
          seller_id: svc?.sellerId || "Unknown",
        };
      })
    );

    return NextResponse.json({
      wallet,
      total_spent: payments.reduce((sum, p) => sum + p.amount, 0) / 100,
      payments: enriched,
    });
  }

  // ── Payment history for a seller ──
  const seller = searchParams.get("seller");
  if (seller) {
    // Find all services by this seller
    const sellerServices = await db
      .select({ id: services.id })
      .from(services)
      .where(eq(services.sellerId, seller))
      .all();

    const serviceIds = sellerServices.map((s) => s.id);

    if (serviceIds.length === 0) {
      return NextResponse.json({ seller, earnings: 0, payments: [] });
    }

    // Get all payments for those services
    const allPayments = await db
      .select()
      .from(x402Payments)
      .orderBy(desc(x402Payments.createdAt))
      .all();

    const sellerPayments = allPayments.filter((p) =>
      serviceIds.includes(p.serviceId)
    );

    const totalReceived = sellerPayments.reduce((sum, p) => sum + p.amount, 0);
    const fee = Math.round(totalReceived * FEE_PERCENT / 100);
    const net = totalReceived - fee;

    const enriched = await Promise.all(
      sellerPayments.map(async (p) => {
        const svc = await db
          .select({ title: services.title })
          .from(services)
          .where(eq(services.id, p.serviceId))
          .get();
        return {
          ...p,
          service_title: svc?.title || "Unknown",
        };
      })
    );

    return NextResponse.json({
      seller,
      total_received_cents: totalReceived,
      fee_cents: fee,
      net_cents: net,
      fee_percent: FEE_PERCENT,
      payments: enriched,
    });
  }

  // ── Fallback: show available discovery formats ──
  return NextResponse.json({
    endpoints: {
      bazaar: "/api/discovery/resources?format=bazaar",
      payment_history: "/api/discovery/resources?wallet=0x...",
      seller_earnings: "/api/discovery/resources?seller=agent-id",
    },
    fee: {
      percent: FEE_PERCENT,
      description: "Hermtica takes 10% of each x402 payment",
    },
  });
}
