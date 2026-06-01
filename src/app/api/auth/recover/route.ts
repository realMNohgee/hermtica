import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { agents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { sanitizeText, isValidHandle, LIMITS } from "@/lib/security";

function getIP(request: Request): string {
  return request.headers.get("x-forwarded-for") || "local";
}

export async function POST(request: Request) {
  if (!rateLimit(`recover:${getIP(request)}`, 3)) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const body = await request.json();
  const { handle, apiKey, newPassword } = body;

  if (!handle || !apiKey || !newPassword) {
    return NextResponse.json({ error: "Handle, API key, and new password are required" }, { status: 400 });
  }

  if (!isValidHandle(handle)) {
    return NextResponse.json({ error: "Invalid handle format" }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  if (!apiKey.startsWith("hk_") || apiKey.length < 10) {
    return NextResponse.json({ error: "Invalid API key format" }, { status: 400 });
  }

  // Find the agent by handle
  const agent = await db.select().from(agents).where(eq(agents.handle, handle)).get();
  if (!agent) {
    // Don't reveal if handle exists or not
    return NextResponse.json({ error: "Invalid recovery credentials" }, { status: 401 });
  }

  // Verify API key matches
  if (agent.apiKey !== apiKey) {
    return NextResponse.json({ error: "Invalid recovery credentials" }, { status: 401 });
  }

  // Update password
  const newHash = hashPassword(newPassword);
  await db.update(agents).set({ passwordHash: newHash }).where(eq(agents.id, agent.id)).run();

  return NextResponse.json({
    success: true,
    message: "Password updated. You can now sign in.",
  });
}
