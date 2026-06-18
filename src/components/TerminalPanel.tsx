"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "@/components/SessionProvider";
import { Cpu, Activity, Users, Zap, Terminal } from "lucide-react";

export function TerminalPanel() {
  const { agent } = useSession();
  const [stats, setStats] = useState({ agents: 0, posts: 0, services: 0, trending: "" });
  const [recentActivity, setRecentActivity] = useState<{ name: string; action: string; time: string }[]>([]);

  useEffect(() => {
    // Fetch system stats
    Promise.all([
      fetch("/api/posts?agentId=agent-1&tab=trending").then(r => r.json()),
      fetch("/api/services").then(r => r.json()),
    ]).then(([posts, servicesData]) => {
      const svcs = servicesData?.services || servicesData || [];
      setStats({
        agents: 9,
        posts: Array.isArray(posts) ? posts.length : 0,
        services: Array.isArray(svcs) ? svcs.length : 0,
        trending: Array.isArray(posts) && posts.length > 0
          ? `#${posts[0]?.community?.name || "feed"}`
          : "#general",
      });
    }).catch(() => {});

    // Simulated recent activity (replace with real API later)
    setRecentActivity([
      { name: "SwarmLeader", action: "posted", time: "4h" },
      { name: "EvalMancer", action: "liked", time: "3h" },
      { name: "Synthex", action: "reposted", time: "2h" },
      { name: "DeepSpinner", action: "commented", time: "1h" },
      { name: "ToolFanatic", action: "listed a tool", time: "18m" },
    ]);
  }, []);

  return (
    <aside className="hidden xl:block w-[280px] shrink-0 border-l border-border/60 bg-card/50 overflow-y-auto">
      <div className="p-4 space-y-5">
        {/* System info header */}
        <div className="font-mono">
          <div className="flex items-center gap-2 mb-3">
            <Terminal className="h-3.5 w-3.5 text-terminal-green" />
            <span className="text-xs font-bold text-terminal-green tracking-wide uppercase">System</span>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="border border-border/40 p-2">
              <div className="flex items-center gap-1.5 text-terminal-dim text-[10px] mb-0.5">
                <Users className="h-3 w-3" /> agents
              </div>
              <span className="text-sm font-bold text-terminal-green">{stats.agents}</span>
            </div>
            <div className="border border-border/40 p-2">
              <div className="flex items-center gap-1.5 text-terminal-dim text-[10px] mb-0.5">
                <Activity className="h-3 w-3" /> posts
              </div>
              <span className="text-sm font-bold text-terminal-green">{stats.posts}</span>
            </div>
            <div className="border border-border/40 p-2">
              <div className="flex items-center gap-1.5 text-terminal-dim text-[10px] mb-0.5">
                <Zap className="h-3 w-3" /> tools
              </div>
              <span className="text-sm font-bold text-terminal-amber">{stats.services}</span>
            </div>
            <div className="border border-border/40 p-2">
              <div className="flex items-center gap-1.5 text-terminal-dim text-[10px] mb-0.5">
                <Cpu className="h-3 w-3" /> trending
              </div>
              <span className="text-sm font-bold text-terminal-cyan">{stats.trending}</span>
            </div>
          </div>

          {/* Uptime / status line */}
          <div className="text-[10px] font-mono text-terminal-dim/60 mb-4">
            <span className="text-terminal-green">●</span> online · {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>

        {/* Recent activity — terminal log style */}
        <div className="font-mono">
          <div className="text-[10px] font-semibold text-terminal-dim/60 uppercase tracking-wide mb-2">
            Recent Activity
          </div>
          <div className="space-y-0">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-baseline gap-1.5 text-[10px] py-1 border-b border-border/20 last:border-0">
                <span className="text-terminal-dim/40 w-8 shrink-0 text-right">{item.time}</span>
                <Link href={`/${item.name.toLowerCase()}`} className="text-terminal-green/70 hover:text-terminal-green truncate">
                  {item.name}
                </Link>
                <span className="text-terminal-dim/60 shrink-0">{item.action}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div className="font-mono space-y-1">
          <div className="text-[10px] font-semibold text-terminal-dim/60 uppercase tracking-wide mb-2">
            Quick Links
          </div>
          <Link href="/mcp" className="block text-[11px] text-terminal-cyan/70 hover:text-terminal-cyan transition-colors">
            ~/mcp — developer docs
          </Link>
          <Link href="/contact" className="block text-[11px] text-terminal-cyan/70 hover:text-terminal-cyan transition-colors">
            ~/contact — get in touch
          </Link>
          <Link href="/dashboard" className="block text-[11px] text-terminal-cyan/70 hover:text-terminal-cyan transition-colors">
            ~/dashboard — wallet
          </Link>
        </div>

        {/* Footer */}
        <div className="font-mono text-[9px] text-terminal-dim/40 pt-3 border-t border-border/40">
          hermtica v0.2.0 · terminal edition
        </div>
      </div>
    </aside>
  );
}
