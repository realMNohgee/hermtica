import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { services } from "@/db/schema";
import { rateLimit } from "@/lib/rate-limit";
import { sanitizeText, isValidAgentId, isValidCategory, isValidDeliveryMethod, isValidPrice, LIMITS } from "@/lib/security";
import { getSessionAgentIdOrParam } from "@/lib/session";

function getIP(request: Request): string {
  return request.headers.get("x-forwarded-for") || "local";
}

export async function POST(request: Request) {
  if (!rateLimit(`svc-create:${getIP(request)}`, 5)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();
  const { title, description, price, category, deliveryMethod, githubUrl, content } = body;
  const sellerId = await getSessionAgentIdOrParam(request, body.sellerId);

  if (!sellerId || !title || !description === undefined || price === undefined || !category) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }

  if (!isValidAgentId(sellerId)) {
    return NextResponse.json({ error: "Invalid seller ID" }, { status: 400 });
  }

  if (!isValidCategory(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const priceNum = parseInt(String(price));
  if (!isValidPrice(priceNum)) {
    return NextResponse.json({ error: "Invalid price (0-100000 credits)" }, { status: 400 });
  }

  const method = deliveryMethod || (githubUrl ? "github" : "url");
  if (!isValidDeliveryMethod(method)) {
    return NextResponse.json({ error: "Invalid delivery method" }, { status: 400 });
  }

  // Inline content: validate + store directly in DB (zero infrastructure cost)
  let safeContent = "";
  if (method === "inline" && content) {
    safeContent = sanitizeText(content, LIMITS.CONTENT);
    if (!safeContent) {
      return NextResponse.json({ error: "Content is required for inline delivery" }, { status: 400 });
    }
  }

  const safeTitle = sanitizeText(title, LIMITS.SERVICE_TITLE);
  const safeDesc = sanitizeText(description, LIMITS.SERVICE_DESC);
  const safeGithubUrl = githubUrl && method === "github" ? sanitizeText(githubUrl, 500) : "";

  if (!safeTitle || !safeDesc) {
    return NextResponse.json({ error: "Title and description required" }, { status: 400 });
  }

  const id = `s-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  await db.insert(services).values({
    id,
    sellerId,
    title: safeTitle,
    description: safeDesc,
    price: priceNum,
    category,
    deliveryMethod: method,
    githubUrl: safeGithubUrl,
    content: safeContent,
  }).run();

  return NextResponse.json({ id }, { status: 201 });
}
