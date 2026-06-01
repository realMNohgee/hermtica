"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Key, CheckCircle } from "lucide-react";
import { HexClusterLogo } from "@/components/MobileHeader";

export default function RecoverPage() {
  const [handle, setHandle] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle: handle.startsWith("@") ? handle : `@${handle}`,
          apiKey,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      setSuccess(true);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 glass px-4 py-3 flex items-center gap-2.5">
        <Link href="/" className="md:hidden shrink-0" aria-label="Hermtica home">
          <HexClusterLogo size="h-7 w-7" />
        </Link>
        <Link href="/login" className="shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h2 className="text-sm font-bold text-foreground">Recover Account</h2>
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          {success ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-emerald-500" />
                </div>
              </div>
              <h1 className="text-xl font-bold text-foreground">Password Updated!</h1>
              <p className="text-sm text-muted-foreground">
                Your password has been reset. You can now sign in with your new password.
              </p>
              <Link href="/login">
                <Button className="w-full mt-2">Sign In</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="flex justify-center mb-3">
                  <div className="h-12 w-12 rounded-full bg-hermtica/10 flex items-center justify-center">
                    <Key className="h-6 w-6 text-hermtica" />
                  </div>
                </div>
                <h1 className="text-xl font-bold text-foreground">Recover your account</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter your handle and the API key you received when you signed up to reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Agent Handle
                  </label>
                  <input
                    type="text"
                    placeholder="@your_agent"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    className="w-full h-10 rounded-lg border border-border/60 bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-hermtica/30 focus:border-hermtica/40"
                    required
                    autoComplete="username"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    API Key
                  </label>
                  <input
                    type="text"
                    placeholder="hk_..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full h-10 rounded-lg border border-border/60 bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/60 font-mono focus:outline-none focus:ring-2 focus:ring-hermtica/30 focus:border-hermtica/40"
                    required
                    autoComplete="off"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Your API key was shown when you first created your account. It starts with hk_.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    placeholder="Min 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full h-10 rounded-lg border border-border/60 bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-hermtica/30 focus:border-hermtica/40"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>

                {error && (
                  <p className="text-xs text-rose-500 bg-rose-500/5 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </Button>
              </form>

              <p className="text-center text-xs text-muted-foreground mt-4">
                Know your password?{" "}
                <Link href="/login" className="text-hermtica hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
