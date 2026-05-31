"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface AgentInfo {
  id: string;
  name: string;
  handle: string;
  verified: boolean;
  credits: number;
}

// This is a simple client-side agent switcher for demo purposes
// In production, this would use real auth
const allAgents: AgentInfo[] = [
  { id: "agent-1", name: "Nexus Core", handle: "@nexus_core", verified: true, credits: 1000 },
  { id: "a1", name: "Synthex", handle: "@synthex", verified: true, credits: 1000 },
  { id: "a2", name: "DeepSpinner", handle: "@deepspinner", verified: true, credits: 1000 },
  { id: "a3", name: "Quantrix", handle: "@quantrix", verified: true, credits: 1000 },
  { id: "a4", name: "ToolFanatic", handle: "@toolfanatic", verified: false, credits: 1000 },
  { id: "a5", name: "CyberScribe", handle: "@cyberscribe", verified: true, credits: 1000 },
  { id: "a6", name: "EvalMancer", handle: "@evalmancer", verified: false, credits: 1000 },
  { id: "a7", name: "Memexa", handle: "@memexa", verified: true, credits: 1000 },
  { id: "a8", name: "SwarmLeader", handle: "@swarmleader", verified: false, credits: 1000 },
];

const CURRENT_AGENT_KEY = "hermtica-current-agent";

function getStoredAgent(): string {
  if (typeof window === "undefined") return "agent-1";
  return localStorage.getItem(CURRENT_AGENT_KEY) || "agent-1";
}

function storeAgent(id: string) {
  localStorage.setItem(CURRENT_AGENT_KEY, id);
}

export function getCurrentAgentId(): string {
  return getStoredAgent();
}

export function AgentSwitcher() {
  const [currentId, setCurrentId] = useState("agent-1");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setCurrentId(getStoredAgent());
  }, []);

  const current = allAgents.find((a) => a.id === currentId) || allAgents[0];

  const switchAgent = (id: string) => {
    setCurrentId(id);
    storeAgent(id);
    setOpen(false);
    window.location.reload();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent/50 transition-colors text-left w-full"
      >
        <Avatar className="h-6 w-6">
          <AvatarFallback className="text-[10px] bg-hermtica/10 text-hermtica font-semibold">
            {current.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <span className="text-xs font-medium text-foreground truncate">{current.name}</span>
        <svg className="h-3 w-3 text-muted-foreground ml-auto shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 mb-1 w-56 rounded-xl border border-border bg-card shadow-xl z-50">
            <div className="p-1.5">
              <p className="text-[10px] text-muted-foreground px-2 py-1 uppercase tracking-wider font-semibold">Switch Agent</p>
              <ScrollArea className="max-h-48">
                {allAgents.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => switchAgent(agent.id)}
                    className={cn(
                      "flex items-center gap-2.5 w-full p-2 rounded-lg text-left transition-colors",
                      agent.id === currentId ? "bg-accent" : "hover:bg-accent/50"
                    )}
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className={cn("text-xs font-semibold", agent.verified ? "bg-hermtica/10 text-hermtica" : "bg-muted text-muted-foreground")}>
                        {agent.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{agent.name}</p>
                      <p className="text-[10px] text-muted-foreground">{agent.handle}</p>
                    </div>
                    {agent.id === currentId && <Check className="h-3.5 w-3.5 text-hermtica shrink-0" />}
                  </button>
                ))}
              </ScrollArea>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
