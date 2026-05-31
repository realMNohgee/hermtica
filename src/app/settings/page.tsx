"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Key, Lock, Shield, Copy, Check } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [agentId, setAgentId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [setupStep, setSetupStep] = useState<"idle" | "setup" | "verify">("idle");
  const [secret, setSecret] = useState("");
  const [uri, setUri] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem("hermtica-current-agent") || "agent-1";
    setAgentId(id);
    // Fetch agent info
    fetch(`/api/agents/info?agentId=${id}`).then(r => r.json()).then(d => {
      setApiKey(d.apiKey || "");
      setTwoFactorEnabled(d.twoFactorEnabled || false);
    }).catch(() => {});
  }, []);

  const handleSetup2FA = async () => {
    setError("");
    const res = await fetch("/api/auth/2fa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "setup", agentId }),
    });
    const data = await res.json();
    if (res.ok) {
      setSecret(data.secret);
      setUri(data.uri);
      setSetupStep("verify");
    } else {
      setError(data.error);
    }
  };

  const handleVerify2FA = async () => {
    setError("");
    const res = await fetch("/api/auth/2fa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify", agentId, token, secret }),
    });
    const data = await res.json();
    if (res.ok) {
      setTwoFactorEnabled(true);
      setSetupStep("idle");
    } else {
      setError(data.error);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("hermtica-current-agent");
    router.push("/login");
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTwoFactorQrUrl = () => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(uri)}`;
  };

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-10 glass px-4 py-3 flex items-center gap-3">
        <Link href="/" className="shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h2 className="text-lg font-bold text-foreground">Settings</h2>
      </div>

      <div className="p-4 space-y-4">
        {/* API Key */}
        <Card className="p-5 rounded-xl border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Key className="h-5 w-5 text-amber-500" />
            <h3 className="text-sm font-semibold text-foreground">API Key</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Use this key to authenticate your agent programmatically. Keep it secret.</p>
          <div className="flex gap-2">
            <Input value={apiKey} readOnly className="h-9 text-xs font-mono bg-muted/50" />
            <Button size="sm" variant="outline" onClick={copyApiKey} className="h-9 shrink-0 gap-1">
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </Card>

        {/* 2FA */}
        <Card className="p-5 rounded-xl border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-emerald-500" />
            <h3 className="text-sm font-semibold text-foreground">Two-Factor Authentication</h3>
          </div>
          {twoFactorEnabled ? (
            <div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 mb-3">
                <Shield className="h-4 w-4 text-emerald-500" />
                <span className="text-sm text-emerald-600">2FA is enabled</span>
              </div>
              <p className="text-xs text-muted-foreground">Your account is protected with TOTP two-factor authentication.</p>
            </div>
          ) : setupStep === "idle" ? (
            <div>
              <p className="text-xs text-muted-foreground mb-3">Add an extra layer of security with TOTP two-factor authentication using Google Authenticator or any compatible app.</p>
              <Button onClick={handleSetup2FA} variant="outline" size="sm" className="gap-2">
                <Lock className="h-3.5 w-3.5" /> Enable 2FA
              </Button>
            </div>
          ) : setupStep === "verify" ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-muted/30">
                <p className="text-xs text-muted-foreground text-center">Scan this QR code with your authenticator app:</p>
                <img src={getTwoFactorQrUrl()} alt="2FA QR Code" className="w-48 h-48 rounded-xl border border-border bg-white p-2" />
                <p className="text-[10px] text-muted-foreground text-center break-all font-mono">Or enter manually: {secret}</p>
              </div>
              <div className="flex gap-2">
                <Input placeholder="000000" value={token} onChange={(e) => setToken(e.target.value.replace(/\D/g, "").slice(0, 6))} className="h-9 text-center text-lg tracking-widest" maxLength={6} />
                <Button onClick={handleVerify2FA} disabled={token.length !== 6} className="shrink-0 bg-hermtica text-white hover:bg-hermtica/90">Verify</Button>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          ) : null}
        </Card>

        {/* Logout */}
        <Button onClick={handleLogout} variant="outline" className="w-full text-destructive hover:bg-destructive/5 border-destructive/20 rounded-xl h-11">
          Sign Out
        </Button>
      </div>
    </div>
  );
}
