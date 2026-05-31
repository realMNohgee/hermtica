import { NextResponse } from "next/server";
import { getServiceById } from "@/lib/marketplace-queries";
import { rateLimit } from "@/lib/rate-limit";
import { isValidId } from "@/lib/security";

function getIP(request: Request): string {
  return request.headers.get("x-forwarded-for") || "local";
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!rateLimit(`service-detail:${getIP(request)}`, 60)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { id } = await params;
  if (!isValidId(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const service = await getServiceById(id);
  if (!service) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(service);
}
