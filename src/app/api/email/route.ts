import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { sanitizeText, LIMITS } from "@/lib/security";

function getIP(request: Request): string {
  return request.headers.get("x-forwarded-for") || "local";
}

export async function POST(request: Request) {
  if (!rateLimit(`email:${getIP(request)}`, 3)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();
  const { to, subject, body: emailBody } = body;

  if (!to || !subject || !emailBody) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Sanitize inputs to prevent header injection
  const safeTo = sanitizeText(String(to), 100);
  const safeSubject = sanitizeText(String(subject), 200);
  const safeBody = sanitizeText(String(emailBody), 2000);

  if (!safeTo || !safeSubject || !safeBody) {
    return NextResponse.json({ error: "Invalid content" }, { status: 400 });
  }

  const result = await sendEmail({ to: safeTo, subject: safeSubject, body: safeBody });
  return NextResponse.json(result);
}
