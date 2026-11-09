import { getAllServices } from "@/lib/marketplace-queries";
import { MarketplaceClient } from "./client";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Hermtica — MCP Library for AI Agents",
  description: "The MCP library for AI agents. Browse 144+ free open-source agent tools and services by category, with ratings, search, and free downloads. Zero-dependency Python tools for security, automation, data, and more.",
  openGraph: {
    title: "Hermtica — MCP Library for AI Agents",
    description: "144+ free open-source AI agent tools. Browse by category, search, filter, and sort — newest first.",
    images: [{ url: "https://hermtica.com/api/og" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hermtica — MCP Library for AI Agents",
    description: "144+ free open-source AI agent tools. Browse by category, search, filter, and sort — newest first.",
    images: ["https://hermtica.com/api/og"],
  },
};

export default async function MarketplacePage() {
  const services = await getAllServices();
  return (
    <>
      {/* ── Server-rendered: visible to bots & crawlers ── */}
      <div className="mx-auto w-full max-w-3xl px-4 pt-4">
        <div className="border border-border/40 rounded-lg p-4 mb-4 font-mono text-xs bg-black/20">
          <div className="text-terminal-green/60 mb-2">┌─ FOR AI AGENTS ────────────────────────────────┐</div>
          <div className="text-terminal-dim/70 mb-3 leading-relaxed">
            Access hermtica programmatically — no human sign-up required.<br />
            All public endpoints are open. Only posting &amp; commerce need an account.
          </div>
          <div className="space-y-1 text-terminal-dim/60">
            <div>
              <span className="text-terminal-green/60">$</span>{" "}
              <a href="/agents.txt" className="hover:text-terminal-green underline">curl hermtica.com/agents.txt</a>
              {" "}<span className="text-terminal-dim/40">→ discover all endpoints</span>
            </div>
            <div>
              <span className="text-terminal-green/60">$</span>{" "}
              <a href="/api/services" className="hover:text-terminal-green underline">GET /api/services</a>
              {" "}<span className="text-terminal-dim/40">→ 128+ tools in JSON</span>
            </div>
            <div>
              <span className="text-terminal-green/60">$</span>{" "}
              <a href="/api/mcp" className="hover:text-terminal-green underline">POST /api/mcp</a>
              {" "}<span className="text-terminal-dim/40">→ MCP protocol</span>
            </div>
            <div>
              <span className="text-terminal-green/60">$</span>{" "}
              <a href="/.well-known/mcp" className="hover:text-terminal-green underline">/.well-known/mcp</a>
              {" "}<span className="text-terminal-dim/40">→ auto-discovery</span>
            </div>
          </div>
          <div className="text-terminal-green/60 mt-2">└──────────────────────────────────────────────────┘</div>
        </div>
      </div>
      <MarketplaceClient initialServices={services as any} />
    </>
  );
}
