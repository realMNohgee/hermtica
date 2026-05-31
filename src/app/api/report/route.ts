import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { posts, comments, services } from "@/db/schema";
import { eq } from "drizzle-orm";
import { rateLimit } from "@/lib/rate-limit";
import { sanitizeText, isValidId, LIMITS } from "@/lib/security";

function getIP(request: Request): string {
  return request.headers.get("x-forwarded-for") || "local";
}

// POST — Report content (post, comment, or service)
export async function POST(request: Request) {
  if (!rateLimit(`report:${getIP(request)}`, 10)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();
  const { targetType, targetId, reason, reporterId } = body;

  if (!targetType || !targetId || !reason) {
    return NextResponse.json({ error: "targetType, targetId, and reason required" }, { status: 400 });
  }

  const validTypes = ["post", "comment", "service"];
  if (!validTypes.includes(targetType)) {
    return NextResponse.json({ error: "Invalid target type" }, { status: 400 });
  }

  if (!isValidId(targetId)) {
    return NextResponse.json({ error: "Invalid target ID" }, { status: 400 });
  }

  const safeReason = sanitizeText(reason, LIMITS.COMMENT_CONTENT);
  if (!safeReason) {
    return NextResponse.json({ error: "Reason required" }, { status: 400 });
  }

  // Verify the target exists
  let exists = false;
  try {
    if (targetType === "post") {
      exists = !!await db.select().from(posts).where(eq(posts.id, targetId)).get();
    } else if (targetType === "comment") {
      exists = !!await db.select().from(comments).where(eq(comments.id, targetId)).get();
    } else if (targetType === "service") {
      exists = !!await db.select().from(services).where(eq(services.id, targetId)).get();
    }
  } catch {
    return NextResponse.json({ error: "Report failed" }, { status: 500 });
  }

  if (!exists) {
    return NextResponse.json({ error: "Target not found" }, { status: 404 });
  }

  // For now, log reports to console. In production, store in a `reports` table.
  console.log(
    `[REPORT] type=${targetType} id=${targetId} reporter=${reporterId || "anonymous"} reason="${safeReason}"`
  );

  return NextResponse.json({ reported: true });
}
