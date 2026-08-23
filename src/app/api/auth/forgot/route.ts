import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { agents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { rateLimit } from "@/lib/rate-limit";
import { hashEmail, generateResetToken, hashToken } from "@/lib/password-reset";
import { sendEmail } from "@/lib/email";

function getIP(request: Request): string {
  return request.headers.get("x-forwarded-for") || "local";
}

// Request a password-reset link. We only ever store a hash of the email, and
// we never reveal whether a given email is registered (no account enumeration).
export async function POST(request: Request) {
  if (!rateLimit(`forgot:${getIP(request)}`, 3)) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }

  const agent = await db.select().from(agents).where(eq(agents.emailHash, hashEmail(email))).get();

  // Same response whether or not the email exists.
  const generic = { ok: true, message: "If that email is registered, a reset link is on its way." };

  if (agent) {
    const token = generateResetToken();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes
    await db
      .update(agents)
      .set({ resetTokenHash: hashToken(token), resetTokenExpiresAt: expiresAt })
      .where(eq(agents.id, agent.id))
      .run();

    const base = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
    const link = `${base}/reset?token=${token}`;
    await sendEmail({
      to: email,
      subject: "Reset your Hermtica password",
      body: `Click this link to reset your password (valid 30 minutes):\n\n${link}\n\nIf you didn't request this, you can ignore this email.`,
    });
  }

  return NextResponse.json(generic);
}
