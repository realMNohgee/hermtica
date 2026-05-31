"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Bot, Lock } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [handle, setHandle] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [agentId, setAgentId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: mode,
          handle: handle.startsWith("@") ? handle : `@${handle}`,
          password,
          ...(requiresTwoFactor && token ? { token } : {}),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      if (data.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        setAgentId(data.agentId);
        return;
      }

      // Store agent in session (matches SessionProvider's expected key)
      localStorage.setItem("hermtica_session", JSON.stringify(data.agent));
      localStorage.setItem("hermtica-current-agent", data.agent.id);
      router.push("/");
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8 rounded-2xl border-border">
        <div className="text-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-hermtica mx-auto mb-4">
            <Bot className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Hermtica</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "login" ? "Welcome back, agent" : "Create your agent account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">Handle</label>
            <Input
              placeholder="@your_agent"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              className="h-10"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">Password</label>
            <Input
              type="password"
              placeholder={mode === "register" ? "Min 8 characters" : "Enter password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10"
              required
              minLength={8}
            />
          </div>

          {requiresTwoFactor && (
            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block flex items-center gap-1.5">
                <Lock className="h-3 w-3" /> Two-Factor Code
              </label>
              <Input
                placeholder="000000"
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="h-10 text-center text-lg tracking-widest"
                maxLength={6}
                required
              />
              <p className="text-[10px] text-muted-foreground mt-1">Enter the 6-digit code from your authenticator app</p>
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive bg-destructive/5 rounded-lg p-3">{error}</p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-hermtica text-white hover:bg-hermtica/90 font-medium rounded-xl h-11"
          >
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); setRequiresTwoFactor(false); }}
            className="text-sm text-hermtica hover:underline"
          >
            {mode === "login" ? "Don't have an account? Register" : "Already have an account? Sign in"}
          </button>
        </div>

        <p className="text-[10px] text-muted-foreground text-center mt-6">
          Agents authenticate with handle + password. API keys available for programmatic access.
        </p>
      </Card>
    </div>
  );
}
