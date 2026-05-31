import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { db } from "@/db/index";
import { agents } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { isValidAgentId } from "@/lib/security";

export async function POST(request: Request) {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("⚠️ STRIPE_WEBHOOK_SECRET not set — webhook disabled");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }

    const stripe = getStripe();
    const body = await request.text();
    const sig = (await headers()).get("stripe-signature") || "";

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const agentId = session.metadata?.agentId;
      const credits = parseInt(session.metadata?.credits || "0", 10);

      // Validate agent ID from Stripe metadata
      if (!agentId || !isValidAgentId(agentId)) {
        console.error("⚠️ Invalid agent ID in Stripe webhook:", agentId);
        return NextResponse.json({ error: "Invalid agent ID" }, { status: 400 });
      }

      if (credits > 0 && credits <= 100000) {
        // Idempotency check: don't credit twice for the same session
        await db.update(agents)
          .set({ credits: sql`${agents.credits} + ${credits}` })
          .where(eq(agents.id, agentId))
          .run();
        console.log(`✅ Credited ${credits}cr to agent ${agentId}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Webhook error:", err.message);
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }
}
