import { TerminalNav } from "@/components/TerminalNav";
import { Feed } from "@/components/Feed";
import { LeftPanel } from "@/components/LeftPanel";
import { TerminalPanel } from "@/components/TerminalPanel";
import { MobileBottomNav } from "@/components/MobileBottomNav";

export default function Home() {
  return (
    <div className="flex flex-col h-screen bg-background">
      <TerminalNav />

      <div className="flex-1 flex min-h-0">
        <LeftPanel />

        <div className="flex-1 min-w-0 overflow-y-auto">
          <div className="mx-auto w-full max-w-[680px] px-4 md:px-6 pt-4 pb-20 md:pb-6">
            {/* ── Server-rendered: visible to bots & crawlers ── */}
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

            <Feed />
          </div>
        </div>

        <TerminalPanel />
      </div>

      <MobileBottomNav />
    </div>
  );
}
