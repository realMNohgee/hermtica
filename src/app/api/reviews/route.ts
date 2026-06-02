import { NextResponse } from "next/server";
import { db } from "@/db";
import { reviews, orders, services, agents } from "@/db/schema";
import { eq, and, avg, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getSessionAgentIdOrParam } from "@/lib/session";
import { sanitizeText } from "@/lib/security";
import { isValidAgentId } from "@/lib/security";
import { LIMITS } from "@/lib/security";

// GET /api/reviews?serviceId=X → all reviews for a service
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const serviceId = searchParams.get("serviceId");

  if (!serviceId) {
    return NextResponse.json({ error: "serviceId required" }, { status: 400 });
  }

  const result = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      content: reviews.content,
      createdAt: reviews.createdAt,
      buyer: {
        id: agents.id,
        name: agents.name,
        handle: agents.handle,
        avatar: agents.avatar,
      },
    })
    .from(reviews)
    .leftJoin(agents, eq(reviews.buyerId, agents.id))
    .where(eq(reviews.serviceId, serviceId))
    .orderBy(sql`${reviews.createdAt} DESC`)
    .all();

  // Also get average rating
  const avgResult = await db
    .select({ avg: avg(reviews.rating) })
    .from(reviews)
    .where(eq(reviews.serviceId, serviceId))
    .get();

  return NextResponse.json({
    reviews: result,
    averageRating: avgResult?.avg ? Math.round(Number(avgResult.avg) * 10) / 10 : 0,
    totalReviews: result.length,
  });
}

// POST /api/reviews → create a review (only if buyer purchased the service)
export async function POST(request: Request) {
  const body = await request.json();
  const agentId = await getSessionAgentIdOrParam(request, body.agentId);

  if (!agentId || !isValidAgentId(agentId)) {
    return NextResponse.json({ error: "Invalid agent" }, { status: 400 });
  }

  const { serviceId, rating, content } = body;

  if (!serviceId || !rating || !content) {
    return NextResponse.json({ error: "serviceId, rating, and content required" }, { status: 400 });
  }

  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
  }

  const safeContent = sanitizeText(content, LIMITS.CONTENT);
  if (!safeContent) {
    return NextResponse.json({ error: "Invalid content" }, { status: 400 });
  }

  // Verify buyer purchased this service
  const purchase = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.buyerId, agentId),
        eq(orders.serviceId, serviceId),
        eq(orders.status, "completed")
      )
    )
    .get();

  if (!purchase) {
    return NextResponse.json(
      { error: "You must purchase this service before reviewing" },
      { status: 403 }
    );
  }

  // Check for existing review
  const existing = await db
    .select()
    .from(reviews)
    .where(
      and(eq(reviews.buyerId, agentId), eq(reviews.serviceId, serviceId))
    )
    .get();

  if (existing) {
    return NextResponse.json(
      { error: "You already reviewed this service" },
      { status: 409 }
    );
  }

  const id = nanoid(12);
  await db.insert(reviews).values({
    id,
    serviceId,
    buyerId: agentId,
    rating,
    content: safeContent,
    createdAt: new Date().toISOString(),
  });

  // Update service rating
  const avgResult = await db
    .select({ avg: avg(reviews.rating) })
    .from(reviews)
    .where(eq(reviews.serviceId, serviceId))
    .get();

  if (avgResult?.avg) {
    await db
      .update(services)
      .set({ rating: Math.round(Number(avgResult.avg)) })
      .where(eq(services.id, serviceId));
  }

  return NextResponse.json({ id, success: true });
}
