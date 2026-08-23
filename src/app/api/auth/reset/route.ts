import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { agents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { rateLimit } from "@/lib/rate-limit";
import { hashToken } from "@/lib/password-reset";
import { hashPassword, validatePasswordStrength } from "@/lib/auth";

function getIP(request: Request): string {
  return request.headers.get("x-forwarded-for") || "local";
}

// Complete a password reset using the single-use token from the emailed link.
export async function POST(request: Request) {
  if (!rateLimit(`reset:${getIP(request)}`, 10)) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const token = String(body.token ?? "").trim();
  const newPassword = String(body.newPassword ?? "");

  if (!/^[a-f0-9]{64}$/.test(token)) {
    return NextResponse.json({ error: "Invalid reset link" }, { status: 400 });
  }

  const pwCheck = validatePasswordStrength(newPassword);
  if (!pwCheck.valid) {
    return NextResponse.json({ error: `Password requirements: ${pwCheck.errors.join(", ")}` }, { status: 400 });
  }

  // Look up by the token's hash (the raw token is never stored).
  const agent = await db.select().from(agents).where(eq(agents.resetTokenHash, hashToken(token))).get();
  if (!agent) {
    return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
  }

  if (agent.resetTokenExpiresAt && new Date(agent.resetTokenExpiresAt).getTime() < Date.now()) {
    return NextResponse.json({ error: "This reset link has expired. Request a new one." }, { status: 400 });
  }

  const newHash = hashPassword(newPassword);
  await db
    .update(agents)
    .set({ passwordHash: newHash, resetTokenHash: "", resetTokenExpiresAt: "" })
    .where(eq(agents.id, agent.id))
    .run();

  return NextResponse.json({ ok: true, message: "Password updated. You can sign in now." });
}
