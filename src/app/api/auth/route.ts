import { NextResponse } from "next/server";
import { authenticateAgent, generateApiKey, setAgentPassword, verifyTwoFactor, validatePasswordStrength } from "@/lib/auth";
import { db } from "@/db/index";
import { agents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { rateLimit } from "@/lib/rate-limit";
import { isValidHandle } from "@/lib/security";

function getIP(request: Request): string {
  return request.headers.get("x-forwarded-for") || "local";
}

function makeCookieOptions(rememberMe: boolean, production: boolean) {
  return {
    httpOnly: true,
    secure: production,
    sameSite: "lax" as const,
    maxAge: rememberMe ? 60 * 60 * 24 * 14 : 60 * 60 * 4, // 2 weeks or 4 hours
    path: "/",
  };
}

export async function POST(request: Request) {
  if (!rateLimit(`auth:${getIP(request)}`, 5)) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const body = await request.json();
  const { action, handle, password, token, rememberMe } = body;
  const isProduction = process.env.NODE_ENV === "production";

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

    if (agent.twoFactorEnabled) {
      if (!token) {
        return NextResponse.json({ requiresTwoFactor: true, agentId: agent.id }, { status: 200 });
      }
      const valid = await verifyTwoFactor(agent.id, token);
      if (!valid) {
        return NextResponse.json({ error: "Invalid 2FA code" }, { status: 401 });
      }
    }

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

    response.cookies.set("hermtica_agent", agent.id, makeCookieOptions(!!rememberMe, isProduction));
    return response;
  }

  // ─── REGISTER ──────────────────────────────────────────
  if (action === "register") {
    const { confirmPassword } = body;

    if (!handle || !password) {
      return NextResponse.json({ error: "Handle and password required" }, { status: 400 });
    }
    if (!isValidHandle(handle)) {
      return NextResponse.json({ error: "Invalid handle format. Use letters, numbers, underscores, hyphens." }, { status: 400 });
    }
    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
    }

    // Validate password strength
    const pwCheck = validatePasswordStrength(password);
    if (!pwCheck.valid) {
      return NextResponse.json({
        error: `Password requirements: ${pwCheck.errors.join(", ")}`,
      }, { status: 400 });
    }

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

    response.cookies.set("hermtica_agent", id, makeCookieOptions(!!rememberMe, isProduction));
    return response;
  }

  // ─── CHANGE PASSWORD ────────────────────────────────────
  if (action === "change-password") {
    const { currentPassword, newPassword, confirmNewPassword } = body;

    if (!handle || !currentPassword || !newPassword) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }
    if (!isValidHandle(handle)) {
      return NextResponse.json({ error: "Invalid handle" }, { status: 400 });
    }
    if (newPassword !== confirmNewPassword) {
      return NextResponse.json({ error: "New passwords do not match" }, { status: 400 });
    }

    const pwCheck = validatePasswordStrength(newPassword);
    if (!pwCheck.valid) {
      return NextResponse.json({
        error: `Password requirements: ${pwCheck.errors.join(", ")}`,
      }, { status: 400 });
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
