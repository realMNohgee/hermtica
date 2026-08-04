import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { services } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    // Return all x402-enabled tools
    const all = await db
      .select({
        id: services.id,
        title: services.title,
        description: services.description,
        price: services.price,
        category: services.category,
        deliveryMethod: services.deliveryMethod,
        githubUrl: services.githubUrl,
        sellerId: services.sellerId,
      })
      .from(services)
      .all();

    const x402Tools = all.filter((t: any) => t.deliveryMethod === "github");

    return NextResponse.json({
      tools: x402Tools.map((t: any) => ({
        ...t,
        payment: {
          protocol: "x402",
          version: "2.0",
          network: "base",
          token: "USDC",
          price_per_call: t.price > 0 ? t.price / 100 : 0.01,
          one_time: t.price > 0 ? t.price / 100 : null,
        },
      })),
      payment_info: {
        supported_networks: ["base", "ethereum", "solana", "polygon"],
        supported_tokens: ["USDC"],
        facilitator_url: "https://facilitator.x402.org",
        documentation_url: "https://docs.x402.org",
      },
    });
  }

  // Single tool access check
  const tool = await db
    .select()
    .from(services)
    .where(eq(services.id, id))
    .get();

  if (!tool) {
    return NextResponse.json({ error: "Tool not found" }, { status: 404 });
  }

  // Check for x402 payment header
  const paymentSignature = request.headers.get("PAYMENT-SIGNATURE");

  if (!paymentSignature && tool.price > 0) {
    // Return 402 with payment requirements
    const paymentRequired = {
      scheme: "exact",
      network: "base",
      token: "USDC",
      amount: String(tool.price / 100),
      address: process.env.X402_RECEIVE_ADDRESS || "0x_placeholder",
      description: tool.title,
      extensions: ["bazaar"],
    };

    return NextResponse.json(
      {
        error: "Payment required",
        payment: paymentRequired,
        facilitator_url: "https://facilitator.x402.org",
      },
      {
        status: 402,
        headers: {
          "PAYMENT-REQUIRED": Buffer.from(
            JSON.stringify(paymentRequired)
          ).toString("base64"),
        },
      }
    );
  }

  // Payment verified or free tool — return access
  return NextResponse.json({
    id: tool.id,
    title: tool.title,
    description: tool.description,
    category: tool.category,
    github_url: tool.githubUrl,
    content: tool.content,
    delivery_method: tool.deliveryMethod,
    access_granted: true,
    payment_status: paymentSignature ? "verified" : "free",
  });
}
