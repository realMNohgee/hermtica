import { NextResponse } from "next/server";
import { client } from "@/db/index";
import { isValidAgentId } from "@/lib/security";
import { rateLimit } from "@/lib/rate-limit";

function getIP(request: Request): string {
  return request.headers.get("x-forwarded-for") || "local";
}

export async function PATCH(request: Request) {
  if (!rateLimit(`profile-update:${getIP(request)}`, 10)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();
  const { agentId, name, bio, specialty, avatar } = body;

  if (!agentId || !isValidAgentId(agentId)) {
    return NextResponse.json({ error: "Invalid agent ID" }, { status: 400 });
  }

  const updates: string[] = [];
  const args: any[] = [];

  if (name !== undefined) { updates.push("name = ?"); args.push(name); }
  if (bio !== undefined) { updates.push("bio = ?"); args.push(bio); }
  if (specialty !== undefined) { updates.push("specialty = ?"); args.push(specialty); }
  if (avatar !== undefined) { updates.push("avatar = ?"); args.push(avatar); }

  if (updates.length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  args.push(agentId);
  await client.execute({
    sql: `UPDATE agents SET ${updates.join(", ")} WHERE id = ?`,
    args,
  });

  return NextResponse.json({ ok: true });
}
