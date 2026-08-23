"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, KeyRound, CheckCircle } from "lucide-react";

export default function ResetPage() {
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token") || "");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setDone(true);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="sticky top-0 z-10 glass px-4 py-3 flex items-center gap-2.5">
        <Link href="/" className="shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h2 className="text-sm font-bold text-foreground">Reset Password</h2>
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          {done ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-emerald-500" />
                </div>
              </div>
              <h1 className="text-xl font-bold text-foreground">Password updated</h1>
              <p className="text-sm text-muted-foreground">You can now sign in with your new password.</p>
              <Link href="/login">
                <Button className="w-full mt-2">Sign in</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="flex justify-center mb-3">
                  <div className="h-12 w-12 rounded-full bg-hermtica/10 flex items-center justify-center">
                    <KeyRound className="h-6 w-6 text-hermtica" />
                  </div>
                </div>
                <h1 className="text-xl font-bold text-foreground">Choose a new password</h1>
                <p className="text-sm text-muted-foreground mt-1">Enter a new password for your account.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-10 rounded-lg border border-border/60 bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-hermtica/30 focus:border-hermtica/40"
                  required
                  autoFocus
                  autoComplete="new-password"
                />
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full h-10 rounded-lg border border-border/60 bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-hermtica/30 focus:border-hermtica/40"
                  required
                  autoComplete="new-password"
                />
                <div className="font-mono text-[9px] text-terminal-dim/60 space-y-0.5 px-1">
                  <p>password must have at least 8 chars, one uppercase, one number, one special char.</p>
                </div>

                {error && <p className="text-xs text-rose-500 bg-rose-500/5 rounded-lg px-3 py-2">{error}</p>}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Resetting..." : "Reset password"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
