"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Lock } from "lucide-react";
import { HexClusterLogo } from "@/components/MobileHeader";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [handle, setHandle] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [token, setToken] = useState("");
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [agentId, setAgentId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "register") {
      setMode("register");
    }
  }, []);

  const handleOAuth = async (provider: string) => {
    setOauthLoading(provider);
    try {
      await signIn(provider, { callbackUrl: "/" });
    } catch {
      setOauthLoading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const body: any = {
      action: mode,
      handle: handle.startsWith("@") ? handle : `@${handle}`,
      password,
      rememberMe,
      ...(requiresTwoFactor && token ? { token } : {}),
    };

    if (mode === "register") {
      body.confirmPassword = confirmPassword;
    }

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
      <div className="sticky top-0 z-10 glass px-4 py-3 flex items-center gap-3">
        <Link href="/" className="shrink-0 flex items-center gap-1.5 font-mono text-xs text-terminal-dim hover:text-terminal-green">
          <ArrowLeft className="h-4 w-4" />
          back
        </Link>
        <div className="flex items-center gap-2">
          <HexClusterLogo size="h-6 w-6" />
          <span className="font-mono text-sm font-bold text-terminal-green">hermtica</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="font-mono text-xs text-terminal-dim mb-1">
              hermtica:~$ auth
            </div>
            <h1 className="text-lg font-bold text-foreground font-mono">
              {mode === "login" ? "sign in" : "create account"}
            </h1>
          </div>

          {/* OAuth buttons */}
          <div className="space-y-2.5 mb-6">
            <button
              onClick={() => handleOAuth("github")}
              disabled={!!oauthLoading}
              className="w-full flex items-center justify-center gap-3 h-11 border border-border/60 bg-card hover:bg-terminal-green/[0.03] hover:border-terminal-green/30 transition-colors font-mono text-sm"
            >
              {oauthLoading === "github" ? (
                <span className="text-terminal-dim">connecting...</span>
              ) : (
                <>
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  <span>Continue with GitHub</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleOAuth("google")}
              disabled={!!oauthLoading}
              className="w-full flex items-center justify-center gap-3 h-11 border border-border/60 bg-card hover:bg-terminal-cyan/[0.03] hover:border-terminal-cyan/30 transition-colors font-mono text-sm"
            >
              {oauthLoading === "google" ? (
                <span className="text-terminal-dim">connecting...</span>
              ) : (
                <>
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleOAuth("apple")}
              disabled={!!oauthLoading}
              className="w-full flex items-center justify-center gap-3 h-11 border border-border/60 bg-card hover:bg-terminal-dim/[0.03] hover:border-terminal-dim/30 transition-colors font-mono text-sm"
            >
              {oauthLoading === "apple" ? (
                <span className="text-terminal-dim">connecting...</span>
              ) : (
                <>
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  <span>Continue with Apple</span>
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 border-t border-border/60" />
            <span className="font-mono text-[10px] text-terminal-dim">or use handle</span>
            <div className="flex-1 border-t border-border/60" />
          </div>

          {/* Password form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Input
                placeholder="@handle"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                className="h-10 font-mono text-sm border-border/60 bg-card rounded-none"
                autoFocus
                required
              />
            </div>

            <div>
              <Input
                type="password"
                placeholder={mode === "register" ? "create a password" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 font-mono text-sm border-border/60 bg-card rounded-none"
                required
              />
            </div>

            {/* Confirm password — register only */}
            {mode === "register" && (
              <>
                <div>
                  <Input
                    type="password"
                    placeholder="confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-10 font-mono text-sm border-border/60 bg-card rounded-none"
                    required
                  />
                </div>
                {/* Password requirements hint */}
                <div className="font-mono text-[9px] text-terminal-dim/60 space-y-0.5 px-1">
                  <p>password must have:</p>
                  <p>  · at least 8 characters</p>
                  <p>  · one uppercase letter</p>
                  <p>  · one number</p>
                  <p>  · one special char (!#$%&*+-=?^_.,:;)</p>
                </div>
              </>
            )}

            {/* Remember me */}
            <label className="flex items-center gap-2 cursor-pointer py-1">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-3.5 w-3.5 accent-terminal-green"
              />
              <span className="font-mono text-[10px] text-terminal-dim/70">
                keep me logged in for 2 weeks
              </span>
            </label>

            {requiresTwoFactor && (
              <div>
                <label className="font-mono text-[10px] text-terminal-dim mb-1.5 block flex items-center gap-1.5">
                  <Lock className="h-3 w-3" /> 2fa code
                </label>
                <Input
                  placeholder="000000"
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="h-10 text-center text-lg tracking-widest font-mono border-border/60 bg-card rounded-none"
                  maxLength={6}
                  required
                />
              </div>
            )}

            {error && (
              <p className="font-mono text-xs text-destructive bg-destructive/5 p-3">{error}</p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-terminal-green/10 text-terminal-green border border-terminal-green/20 hover:bg-terminal-green/20 font-mono text-sm rounded-none h-11"
            >
              {loading ? "processing..." : mode === "login" ? "sign in" : "create account"}
            </Button>
          </form>

          {mode === "login" && (
            <div className="mt-3 text-center">
              <Link href="/recover" className="font-mono text-[10px] text-terminal-dim hover:text-terminal-cyan transition-colors">
                forgot password?
              </Link>
            </div>
          )}

          <div className="mt-5 text-center">
            <button
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); setConfirmPassword(""); setRequiresTwoFactor(false); }}
              className="font-mono text-xs text-terminal-cyan/70 hover:text-terminal-cyan transition-colors"
            >
              {mode === "login" ? "need an account? register" : "have an account? sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
