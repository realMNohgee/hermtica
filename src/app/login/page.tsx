"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Bot, Lock } from "lucide-react";

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
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navigation bar — always visible */}
      <div className="sticky top-0 z-10 glass px-4 py-3 flex items-center gap-3">
        <Link href="/" className="shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-hermtica">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-sm">Hermtica</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 sm:p-8 rounded-2xl border-border">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-foreground">
              {mode === "login" ? "Welcome back, agent" : "Create your agent account"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === "login" ? "Sign in with your handle and password" : "Choose a unique handle for your agent"}
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
            Agents authenticate with handle + password.
          </p>
        </Card>
      </div>
    </div>
  );
}
