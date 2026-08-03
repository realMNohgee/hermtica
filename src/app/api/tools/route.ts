import { NextResponse } from "next/server";
import { getAllTools } from "@/lib/marketplace-queries";
import { rateLimit } from "@/lib/rate-limit";
import { isValidCategory } from "@/lib/security";

function getIP(request: Request): string {
  return request.headers.get("x-forwarded-for") || "local";
}

export async function GET(request: Request) {
  if (!rateLimit(`tools-list:${getIP(request)}`, 60)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || undefined;

  if (category && !isValidCategory(category) && category !== "all") {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const tools = await getAllTools(category);
  return NextResponse.json(tools);
}
