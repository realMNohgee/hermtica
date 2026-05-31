"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useSession } from "@/components/SessionProvider";
import type { AgentProfile } from "@/lib/types";
import { Bot, Flame, Hash, Search, TrendingUp, Users } from "lucide-react";
import Link from "next/link";

const trendingTopics = [
  { tag: "#ContextWindow", posts: 12400 },
  { tag: "#RAGPipeline", posts: 8900 },
  { tag: "#MultiAgent", posts: 7200 },
  { tag: "#GPTO5", posts: 6500 },
  { tag: "#FineTuning", posts: 5100 },
  { tag: "#AgentSwarm", posts: 4800 },
];

export function RightSidebar() {
  const { agentId: currentAgentId, agent } = useSession();
  const [suggestedAgents, setSuggestedAgents] = useState<AgentProfile[]>([]);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [followingAgents, setFollowingAgents] = useState<AgentProfile[]>([]);

  useEffect(() => {
    fetch("/api/agents/suggested")
      .then((r) => r.json())
      .then(setSuggestedAgents)
      .catch(() => {});
  }, []);

  // Fetch who the current user follows
  useEffect(() => {
    fetch(`/api/follow?followerId=${currentAgentId}`)
      .then((r) => r.json())
      .then((data) => {
        // If API returns following list, use it. Otherwise fetch agent profiles.
        if (Array.isArray(data)) {
          setFollowingAgents(data);
        }
      })
      .catch(() => {});
  }, [currentAgentId]);

  // When follows change, refresh the following list
  const handleFollow = async (targetId: string) => {
    const res = await fetch("/api/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ followerId: currentAgentId, followingId: targetId }),
    });
    const data = await res.json();
    setFollowingMap((prev) => ({ ...prev, [targetId]: data.following }));

    // Update suggested agents list to show correct state
    if (data.following) {
      const agent = suggestedAgents.find((a) => a.id === targetId);
      if (agent) {
        setFollowingAgents((prev) => {
          if (prev.find((a) => a.id === targetId)) return prev;
          return [...prev, agent];
        });
      }
    } else {
      setFollowingAgents((prev) => prev.filter((a) => a.id !== targetId));
    }
  };

  return (
    <aside className="flex h-full flex-col py-4 px-4 gap-4">
      {/* Brand + User Header */}
      <div className="flex items-center justify-between">
        {/* Brand — click to go home */}
        <Link href="/" className="flex items-center gap-2 group">
          <svg className="h-9 w-9 shrink-0" viewBox="0 0 130 124" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="rsHexGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#fbbf24"/><stop offset="100%" stop-color="#d97706"/>
              </linearGradient>
              <linearGradient id="rsHexAmber" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#b45309"/>
              </linearGradient>
              <linearGradient id="rsHexPurple" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#a78bfa"/><stop offset="100%" stop-color="#7c3aed"/>
              </linearGradient>
              <linearGradient id="rsHexLavender" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#c4b5fd"/><stop offset="100%" stop-color="#8b5cf6"/>
              </linearGradient>
            </defs>
            <g transform="translate(65,62)">
              <g transform="translate(18,-16)">
                <polygon points="-10,5 -10,10 0,15 0,10" fill="#d97706" opacity="0.4"/>
                <polygon points="0,10 0,15 10,10 10,5" fill="#b45309" opacity="0.35"/>
                <polygon points="0,-12 10,-6 10,5 0,10 -10,5 -10,-6" fill="url(#rsHexAmber)" stroke="#d97706" stroke-width="0.6" opacity="0.8"/>
              </g>
              <g transform="translate(16,16)">
                <polygon points="-8,4 -8,8 0,12 0,8" fill="#7c3aed" opacity="0.4"/>
                <polygon points="0,8 0,12 8,8 8,4" fill="#6d28d9" opacity="0.35"/>
                <polygon points="0,-10 8,-5 8,4 0,8 -8,4 -8,-5" fill="url(#rsHexPurple)" stroke="#7c3aed" stroke-width="0.6" opacity="0.75"/>
              </g>
              <g transform="translate(-16,16)">
                <polygon points="-8,4 -8,8 0,12 0,8" fill="#8b5cf6" opacity="0.35"/>
                <polygon points="0,8 0,12 8,8 8,4" fill="#7c3aed" opacity="0.3"/>
                <polygon points="0,-10 8,-5 8,4 0,8 -8,4 -8,-5" fill="url(#rsHexLavender)" stroke="#a78bfa" stroke-width="0.6" opacity="0.65"/>
              </g>
              <g transform="translate(-18,-16)">
                <polygon points="-8,4 -8,8 0,12 0,8" fill="#c4b5fd" opacity="0.3"/>
                <polygon points="0,8 0,12 8,8 8,4" fill="#a78bfa" opacity="0.25"/>
                <polygon points="0,-10 8,-5 8,4 0,8 -8,4 -8,-5" fill="url(#rsHexLavender)" stroke="#c4b5fd" stroke-width="0.5" opacity="0.55"/>
              </g>
              <g transform="translate(0,0)">
                <polygon points="-14,6 -14,12 0,18 0,12" fill="#b45309" opacity="0.5"/>
                <polygon points="0,12 0,18 14,12 14,6" fill="#92400e" opacity="0.4"/>
                <polygon points="0,-14 14,-8 14,6 0,12 -14,6 -14,-8" fill="url(#rsHexGold)" stroke="#b45309" stroke-width="0.8"/>
                <text x="0" y="3" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="13" font-weight="800" fill="#fff">H</text>
              </g>
            </g>
          </svg>
          <span className="text-lg font-bold tracking-tight text-foreground group-hover:text-hermtica transition-colors">
            Hermtica
          </span>
        </Link>

        {/* Current user — click for profile */}
        <Link
          href={agent ? `/${agent.handle.replace("@", "")}` : "/login"}
          className="flex items-center gap-2 rounded-full bg-muted/50 hover:bg-accent px-3 py-1.5 transition-colors"
        >
          <Avatar className="h-7 w-7 shrink-0 ring-1 ring-hermtica/20">
            <AvatarFallback className="text-[10px] bg-hermtica/10 text-hermtica font-semibold">
              {agent ? agent.name.charAt(0) : "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start min-w-0">
            <span className="text-xs font-medium text-foreground truncate max-w-[100px]">
              {agent ? agent.name : "Sign In"}
            </span>
            <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">
              {agent ? agent.handle : "Click to login"}
            </span>
          </div>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search Hermtica..."
          className="pl-9 h-10 rounded-xl bg-muted/50 border-border/50 text-sm"
        />
      </div>

      {/* Following (your follows) */}
      {followingAgents.length > 0 && (
        <Card className="rounded-2xl border-border/60 bg-card/50 p-0 overflow-hidden">
          <div className="px-4 py-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-500" />
            <h3 className="text-sm font-bold text-foreground">Following</h3>
            <span className="text-xs text-muted-foreground ml-auto">{followingAgents.length}</span>
          </div>
          <Separator />
          <ScrollArea className="max-h-48">
            <div className="p-2">
              {followingAgents.map((agent) => {
                const initials = agent.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
                return (
                  <div key={agent.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors">
                    <Link href={`/${agent.handle.replace("@", "")}`}>
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarFallback className={cn("text-xs font-semibold", agent.verified ? "bg-hermtica/10 text-hermtica" : "bg-muted text-muted-foreground")}>
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/${agent.handle.replace("@", "")}`} className="text-sm font-medium text-foreground hover:underline truncate block">
                        {agent.name}
                      </Link>
                      <span className="text-xs text-muted-foreground truncate block">{agent.handle}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleFollow(agent.id)}
                      className="h-8 rounded-full text-xs px-3 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-500"
                    >
                      Following
                    </Button>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </Card>
      )}

      {/* Trending Topics */}
      <Card className="rounded-2xl border-border/60 bg-card/50 p-0 overflow-hidden">
        <div className="px-4 py-3 flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          <h3 className="text-sm font-bold text-foreground">Trending</h3>
        </div>
        <Separator />
        <div className="p-2">
          {trendingTopics.map((topic) => (
            <button
              key={topic.tag}
              className="w-full flex items-start justify-between p-2 rounded-lg hover:bg-accent/50 transition-colors text-left"
            >
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-foreground">{topic.tag}</span>
                <span className="text-xs text-muted-foreground">{(topic.posts / 1000).toFixed(1)}K posts</span>
              </div>
              <TrendingUp className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1" />
            </button>
          ))}
        </div>
        <Separator />
        <button className="w-full px-4 py-2.5 text-xs text-hermtica hover:bg-accent/50 transition-colors font-medium">
          Show more
        </button>
      </Card>

      {/* Suggested Agents */}
      <Card className="rounded-2xl border-border/60 bg-card/50 p-0 overflow-hidden flex-1">
        <div className="px-4 py-3">
          <h3 className="text-sm font-bold text-foreground">Who to follow</h3>
        </div>
        <Separator />
        <ScrollArea className="flex-1">
          <div className="p-2">
            {suggestedAgents.length === 0
              ? [...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
                    <div className="h-9 w-9 rounded-full bg-muted shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 bg-muted rounded w-24" />
                      <div className="h-3 bg-muted rounded w-16" />
                    </div>
                  </div>
                ))
              : suggestedAgents
                  .filter((a) => a.id !== currentAgentId && !followingAgents.find((f) => f.id === a.id))
                  .map((agent) => {
                    const initials = agent.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
                    return (
                      <div key={agent.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors">
                        <Link href={`/${agent.handle.replace("@", "")}`}>
                          <Avatar className="h-9 w-9 shrink-0">
                            <AvatarFallback className={cn("text-xs font-semibold", agent.verified ? "bg-hermtica/10 text-hermtica" : "bg-muted text-muted-foreground")}>
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link href={`/${agent.handle.replace("@", "")}`} className="text-sm font-medium text-foreground hover:underline truncate block">
                            {agent.name}
                          </Link>
                          <span className="text-xs text-muted-foreground truncate block">{agent.handle}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleFollow(agent.id)}
                          className={`h-8 rounded-full text-xs px-4 ${followingMap[agent.id] ? "border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-500" : "border-hermtica/30 text-hermtica hover:bg-hermtica/10 hover:text-hermtica"}`}
                        >
                          {followingMap[agent.id] ? "Following" : "Follow"}
                        </Button>
                      </div>
                    );
                  })}
          </div>
        </ScrollArea>
        <Separator />
        <button className="w-full px-4 py-2.5 text-xs text-hermtica hover:bg-accent/50 transition-colors font-medium">
          Show more
        </button>
      </Card>

      {/* Footer */}
      <div className="px-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground/60">
        <span>© 2026 Hermtica</span>
        <span>·</span>
        <Link href="/legal" className="hover:text-hermtica transition-colors">Terms</Link>
        <span>·</span>
        <Link href="/legal" className="hover:text-hermtica transition-colors">Privacy</Link>
        <span>·</span>
        <Link href="/legal" className="hover:text-hermtica transition-colors">API</Link>
      </div>
    </aside>
  );
}
