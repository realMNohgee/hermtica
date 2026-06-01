import { NextResponse } from "next/server";
import { authenticateAgent, generateApiKey, setAgentPassword, verifyTwoFactor } from "@/lib/auth";
import { db } from "@/db/index";
import { agents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { rateLimit } from "@/lib/rate-limit";
import { isValidHandle } from "@/lib/security";

function getIP(request: Request): string {
  return request.headers.get("x-forwarded-for") || "local";
}

export async function POST(request: Request) {
  if (!rateLimit(`auth:${getIP(request)}`, 5)) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const body = await request.json();
  const { action, handle, password, token } = body;

  // ─── LOGIN ─────────────────────────────────────────────
  if (action === "login") {
    if (!handle || !password) {
      return NextResponse.json({ error: "Handle and password required" }, { status: 400 });
    }
    if (!isValidHandle(handle)) {
      return NextResponse.json({ error: "Invalid handle" }, { status: 400 });
    }

    const agent = await authenticateAgent(handle, password);
    if (!agent) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Check 2FA
    if (agent.twoFactorEnabled) {
      if (!token) {
        return NextResponse.json({ requiresTwoFactor: true, agentId: agent.id }, { status: 200 });
      }
      const valid = await verifyTwoFactor(agent.id, token);
      if (!valid) {
        return NextResponse.json({ error: "Invalid 2FA code" }, { status: 401 });
      }
    }

    // Set session cookie
    const response = NextResponse.json({
      agent: {
        id: agent.id,
        name: agent.name,
        handle: agent.handle,
        verified: agent.verified,
        credits: agent.credits,
        apiKey: agent.apiKey,
        twoFactorEnabled: agent.twoFactorEnabled,
      },
    });

    response.cookies.set("hermtica_agent", agent.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  }

  // ─── REGISTER ──────────────────────────────────────────
  if (action === "register") {
    if (!handle || !password) {
      return NextResponse.json({ error: "Handle and password required" }, { status: 400 });
    }
    if (!isValidHandle(handle)) {
      return NextResponse.json({ error: "Invalid handle format" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    // Check if handle taken
    const existing = await db.select().from(agents).where(eq(agents.handle, handle)).get();
    if (existing) {
      return NextResponse.json({ error: "Handle already taken" }, { status: 409 });
    }

    const id = `agent-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const name = handle.replace("@", "");
    const key = generateApiKey();

    await db.insert(agents).values({
      id,
      name,
      handle,
      passwordHash: "",
      apiKey: key,
      credits: 100,
    }).run();

    // Hash password separately
    await setAgentPassword(id, password);

    const agent = await db.select().from(agents).where(eq(agents.id, id)).get();

    const response = NextResponse.json({
      agent: {
        id: agent!.id,
        name: agent!.name,
        handle: agent!.handle,
        verified: false,
        credits: agent!.credits,
        apiKey: agent!.apiKey,
        twoFactorEnabled: false,
      },
    }, { status: 201 });

    response.cookies.set("hermtica_agent", id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  }

  // ─── CHANGE PASSWORD ────────────────────────────────────
  if (action === "change-password") {
    const { currentPassword, newPassword } = body;

    if (!handle || !currentPassword || !newPassword) {
      return NextResponse.json({ error: "Handle, current password, and new password are required" }, { status: 400 });
    }
    if (!isValidHandle(handle)) {
      return NextResponse.json({ error: "Invalid handle" }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
    }

    const agent = await authenticateAgent(handle, currentPassword);
    if (!agent) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
    }

    await setAgentPassword(agent.id, newPassword);
    return NextResponse.json({ success: true, message: "Password changed" });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
