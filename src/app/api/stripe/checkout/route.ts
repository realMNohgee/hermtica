import { NextResponse } from "next/server";
import { getStripe, CREDIT_PRICE_CENTS, creditsToUSD } from "@/lib/stripe";
import { rateLimit } from "@/lib/rate-limit";
import { isValidAgentId, isValidPrice } from "@/lib/security";
import { getSessionAgentIdOrParam } from "@/lib/session";

function getIP(request: Request): string {
  return request.headers.get("x-forwarded-for") || "local";
}

export async function POST(request: Request) {
  if (!rateLimit(`stripe-checkout:${getIP(request)}`, 5)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const stripe = getStripe();
    const body = await request.json();
    const { credits } = body;
    const agentId = await getSessionAgentIdOrParam(request, body.agentId);

    if (!agentId || !credits || credits < 100 || credits > 100000) {
      return NextResponse.json({ error: "Invalid request. Min 100, max 100,000 credits." }, { status: 400 });
    }

    if (!isValidAgentId(agentId)) {
      return NextResponse.json({ error: "Invalid agent ID" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "us_bank_account"],
      mode: "payment",
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: `${credits} Hermtica Credits`,
            description: `${credits} credits (${creditsToUSD(credits)}). 1 credit = $0.01. Card or bank transfer.`,
          },
          unit_amount: CREDIT_PRICE_CENTS,
        },
        quantity: credits,
      }],
      metadata: { agentId, credits: String(credits) },
      success_url: `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/dashboard?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/dashboard?checkout=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe checkout error:", err.message);
    // Don't leak Stripe error details to client
    return NextResponse.json({ error: "Checkout unavailable. Please try again." }, { status: 500 });
  }
}
