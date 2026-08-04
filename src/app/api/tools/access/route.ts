import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { services } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  verifyPayment,
  buildPaymentRequired,
  getActivePayment,
  recordPayment,
  incrementCallCount,
  getSenderReceiveAddress,
} from "@/lib/marketplace-queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  // ── List all x402-enabled tools ──
  if (!id) {
    const all = await db.select().from(services).all();
    const x402Tools = all.filter((t) => t.deliveryMethod === "github");

    return NextResponse.json({
      tools: x402Tools.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        category: t.category,
        payment: {
          protocol: "x402",
          version: "2.0",
          network: "base",
          token: "USDC",
          price: t.price > 0 ? t.price / 100 : 0,
          one_time: t.price > 0 ? t.price / 100 : null,
        },
      })),
      payment_info: {
        supported_networks: ["base", "ethereum", "solana", "polygon"],
        supported_tokens: ["USDC"],
        facilitator_url: process.env.X402_FACILITATOR_URL || "https://facilitator.x402.org",
        documentation_url: "https://docs.x402.org",
      },
    });
  }

  // ── Single tool access ──
  const tool = await db.select().from(services).where(eq(services.id, id)).get();

  if (!tool) {
    return NextResponse.json({ error: "Tool not found" }, { status: 404 });
  }

  // Free tools — always grant access
  if (tool.price === 0) {
    return NextResponse.json({
      id: tool.id,
      title: tool.title,
      description: tool.description,
      github_url: tool.githubUrl,
      content: tool.content,
      delivery_method: tool.deliveryMethod,
      access_granted: true,
      payment_status: "free",
    });
  }

  // Paid tool — check for existing payment
  const paymentHeader = request.headers.get("PAYMENT-SIGNATURE");
  const walletHeader = request.headers.get("X-WALLET-ADDRESS");

  // If client sends a wallet address, check if they've already paid
  if (walletHeader) {
    const existing = await getActivePayment(tool.id, walletHeader);

    if (existing) {
      // Check per-call limits
      if (existing.callsLimit && existing.callsUsed >= existing.callsLimit) {
        return NextResponse.json(
          { error: "Call limit reached", calls_used: existing.callsUsed, calls_limit: existing.callsLimit },
          { status: 402 }
        );
      }

      // Track the call
      await incrementCallCount(existing.id);

      return NextResponse.json({
        id: tool.id,
        title: tool.title,
        description: tool.description,
        github_url: tool.githubUrl,
        content: tool.content,
        delivery_method: tool.deliveryMethod,
        access_granted: true,
        payment_status: "previously_paid",
        wallet: walletHeader,
        calls_remaining: existing.callsLimit ? existing.callsLimit - existing.callsUsed - 1 : "unlimited",
      });
    }
  }

  // No existing payment + client sent a payment signature — verify it
  if (paymentHeader) {
    const receiveAddress = await getSenderReceiveAddress(tool.sellerId);

    const result = await verifyPayment(
      paymentHeader,
      tool.price, // in cents
      receiveAddress
    );

    if (result.verified) {
      // Record the payment
      await recordPayment({
        serviceId: tool.id,
        walletAddress: result.walletAddress!,
        txHash: result.txHash!,
        amount: tool.price,
        network: "base",
      });

      // Increment sales count on the service
      await db
        .update(services)
        .set({ salesCount: (tool.salesCount || 0) + 1 } as any)
        .where(eq(services.id, tool.id))
        .run();

      return NextResponse.json({
        id: tool.id,
        title: tool.title,
        description: tool.description,
        github_url: tool.githubUrl,
        content: tool.content,
        delivery_method: tool.deliveryMethod,
        access_granted: true,
        payment_status: "verified",
        tx_hash: result.txHash,
        wallet: result.walletAddress,
      });
    }

    return NextResponse.json(
      { error: "Payment verification failed", detail: result.error },
      { status: 402 }
    );
  }

  // No payment — return 402 with payment details
  const receiveAddress = await getSenderReceiveAddress(tool.sellerId);
  const paymentRequired = buildPaymentRequired(
    tool.price,
    receiveAddress,
    "base",
    tool.title,
    ["bazaar"]
  );

  return NextResponse.json(
    {
      error: "Payment required",
      payment: paymentRequired,
      facilitator_url: process.env.X402_FACILITATOR_URL || "https://facilitator.x402.org",
    },
    {
      status: 402,
      headers: {
        "PAYMENT-REQUIRED": Buffer.from(JSON.stringify(paymentRequired)).toString("base64"),
      },
    }
  );
}
