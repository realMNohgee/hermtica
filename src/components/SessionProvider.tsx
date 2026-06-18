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

  useEffect(() => {
    async function resolveSession() {
      // 1. Try NextAuth OAuth session first
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const session = await res.json();
          if (session?.user?.email) {
            // Fetch the agent profile for this OAuth user
            const agentRes = await fetch(`/api/agents/info?email=${encodeURIComponent(session.user.email)}`);
            if (agentRes.ok) {
              const agentData = await agentRes.json();
              if (agentData?.id) {
                const agentSession: AgentSession = {
                  id: agentData.id,
                  name: session.user.name || agentData.name || "",
                  handle: agentData.handle || `@${session.user.email.split("@")[0]}`,
                  verified: agentData.verified || false,
                  credits: agentData.credits || 1000,
                  apiKey: agentData.apiKey || "",
                  twoFactorEnabled: agentData.twoFactorEnabled || false,
                };
                setAgentState(agentSession);
                localStorage.setItem("hermtica_session", JSON.stringify(agentSession));
                setLoading(false);
                return;
              }
            }
          }
        }
      } catch {}

      // 2. Fall back to localStorage (password login)
      try {
        const stored = localStorage.getItem("hermtica_session");
        if (stored) {
          const parsed = JSON.parse(stored) as AgentSession;
          setAgentState(parsed);
        }
      } catch {}

      setLoading(false);
    }

    resolveSession();
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
    // Also clear NextAuth session
    try {
      await fetch("/api/auth/signout", { method: "POST" });
    } catch {}
    setAgent(null);
  };

  if (loading) return null;

  return (
    <SessionContext.Provider
      value={{
        agent,
        agentId: agent?.id || "agent-1",
        isLoggedIn: !!agent,
        setAgent,
        logout,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}
