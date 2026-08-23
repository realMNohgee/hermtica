"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";

export default function RecoverPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setSent(true);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="sticky top-0 z-10 glass px-4 py-3 flex items-center gap-2.5">
        <Link href="/login" className="shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h2 className="text-sm font-bold text-foreground">Reset Password</h2>
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-emerald-500" />
                </div>
              </div>
              <h1 className="text-xl font-bold text-foreground">Check your email</h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                If an account exists for <span className="text-foreground font-medium">{email}</span>, we sent a
                reset link. It expires in 30 minutes.
              </p>
              <Link href="/login">
                <Button className="w-full mt-2">Back to sign in</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="flex justify-center mb-3">
                  <div className="h-12 w-12 rounded-full bg-hermtica/10 flex items-center justify-center">
                    <Mail className="h-6 w-6 text-hermtica" />
                  </div>
                </div>
                <h1 className="text-xl font-bold text-foreground">Forgot your password?</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter the email you signed up with and we&apos;ll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-10 rounded-lg border border-border/60 bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-hermtica/30 focus:border-hermtica/40"
                    required
                    autoFocus
                    autoComplete="email"
                  />
                </div>

                {error && <p className="text-xs text-rose-500 bg-rose-500/5 rounded-lg px-3 py-2">{error}</p>}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending..." : "Send reset link"}
                </Button>
              </form>

              <p className="text-center text-xs text-muted-foreground mt-4">
                Remembered it?{" "}
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
