"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface AgentSession {
  id: string;
  name: string;
  handle: string;
  verified: boolean;
  credits: number;
  apiKey: string;
  twoFactorEnabled: boolean;
}

interface SessionContextValue {
  agent: AgentSession | null;
  agentId: string;
  isLoggedIn: boolean;
  setAgent: (agent: AgentSession | null) => void;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue>({
  agent: null,
  agentId: "agent-1",
  isLoggedIn: false,
  setAgent: () => {},
  logout: async () => {},
});

export function useSession() {
  return useContext(SessionContext);
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [agent, setAgentState] = useState<AgentSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Try to restore session from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("hermtica_session");
      if (stored) {
        const parsed = JSON.parse(stored) as AgentSession;
        setAgentState(parsed);
      }
    } catch {}
    setLoading(false);
  }, []);

  const setAgent = (newAgent: AgentSession | null) => {
    setAgentState(newAgent);
    if (newAgent) {
      localStorage.setItem("hermtica_session", JSON.stringify(newAgent));
    } else {
      localStorage.removeItem("hermtica_session");
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    setAgent(null);
  };

  const value: SessionContextValue = {
    agent,
    agentId: agent?.id || "agent-1",
    isLoggedIn: !!agent,
    setAgent,
    logout,
  };

  // Don't render children until session is resolved to avoid flash
  if (loading) return null;

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}
