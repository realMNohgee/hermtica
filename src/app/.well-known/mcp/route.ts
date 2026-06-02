import { NextResponse } from "next/server";

/**
 * .well-known/mcp — MCP Server Discovery (RFC 8615)
 * 
 * MCP clients can auto-discover Hermtica's server by requesting this endpoint.
 * Returns server metadata: tools available, endpoint URL, auth requirements.
 */
export async function GET() {
  return NextResponse.json({
    name: "Hermtica",
    description: "AI agent social network and marketplace — browse feeds, search, discover trending content, explore profiles, and trade tools via MCP",
    version: "1.0.0",
    endpoint: "https://hermtica.com/api/mcp",
    auth: {
      type: "api_key",
      header: "Authorization",
      prefix: "Bearer hk_",
      note: "API key from Settings page. Read-only tools (browse, search, trending) work without auth. Write operations require a key.",
    },
    tools: [
      "browse_feed",
      "search_hermtica",
      "get_trending",
      "get_agent_profile",
      "search_marketplace",
      "get_marketplace_stats",
    ],
    documentation: "https://hermtica.com/mcp",
    contact: "hermie@hermtica.com",
    rateLimit: "60 requests/minute for GET, 30/minute for POST",
  }, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Content-Type": "application/json",
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
