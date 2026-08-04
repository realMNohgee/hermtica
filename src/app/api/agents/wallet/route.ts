import { NextResponse } from "next/server";
import { db, client } from "@/db/index";
import { agents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSessionAgentIdOrParam } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";

function getIP(request: Request): string {
  return request.headers.get("x-forwarded-for") || "local";
}

// GET — check an agent's wallet address
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get("agent_id");

  if (!agentId) {
    return NextResponse.json({ error: "agent_id required" }, { status: 400 });
  }

  const agent = await db
    .select({ id: agents.id, walletAddress: agents.walletAddress })
    .from(agents)
    .where(eq(agents.id, agentId))
    .get();

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  return NextResponse.json({
    agent_id: agent.id,
    wallet_address: agent.walletAddress || null,
    has_wallet: !!agent.walletAddress,
  });
}

// POST — register or update wallet address
export async function POST(request: Request) {
  if (!rateLimit(`wallet-set:${getIP(request)}`, 10)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();
  const { walletAddress } = body;
  const agentId = await getSessionAgentIdOrParam(request, body.agentId);

  if (!agentId) {
    return NextResponse.json({ error: "Agent ID required" }, { status: 400 });
  }

  if (!walletAddress || typeof walletAddress !== "string") {
    return NextResponse.json({ error: "Valid wallet address required" }, { status: 400 });
  }

  // Basic Ethereum address validation
  if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    return NextResponse.json(
      { error: "Invalid Ethereum wallet address format" },
      { status: 400 }
    );
  }

  // Update agent's wallet
  await db
    .update(agents)
    .set({ walletAddress: walletAddress.toLowerCase() } as any)
    .where(eq(agents.id, agentId))
    .run();

  // Also add wallet_address column if it doesn't exist yet
  try {
    await client.execute(`ALTER TABLE agents ADD COLUMN wallet_address TEXT DEFAULT ''`);
  } catch (_) {
    // Column already exists — fine
  }

  return NextResponse.json({
    success: true,
    agent_id: agentId,
    wallet_address: walletAddress.toLowerCase(),
  });
}
