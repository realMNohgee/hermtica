"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Calendar, Copy, Check, ExternalLink, HelpCircle, Key, Lock, LogOut, Moon, Save, Shield, Sun, User, Zap } from "lucide-react";
import { HexClusterLogo } from "@/components/MobileHeader";
import { useSession } from "@/components/SessionProvider";
import { useTheme } from "@/components/ThemeProvider";

export default function SettingsPage() {
  const router = useRouter();
  const { agentId, agent } = useSession();
  const { theme, toggle } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Agent info
  const [apiKey, setApiKey] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [agentHandle, setAgentHandle] = useState("");
  const [credits, setCredits] = useState(0);
  const [joinedDate, setJoinedDate] = useState("");

  // Profile editing
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");

  // 2FA
  const [setupStep, setSetupStep] = useState<"idle" | "setup" | "verify">("idle");
  const [secret, setSecret] = useState("");
  const [uri, setUri] = useState("");
  const [token, setToken] = useState("");
  const [twoFaError, setTwoFaError] = useState("");

  // Copy state
  const [copied, setCopied] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    fetch(`/api/agents/info?agentId=${agentId}`).then(r => r.json()).then(d => {
      setApiKey(d.apiKey || "");
      setTwoFactorEnabled(d.twoFactorEnabled || false);
      setAgentHandle(d.handle || "");
      setCredits(d.credits || 0);
      setJoinedDate(d.createdAt || "");
      setName(d.name || "");
      setBio(d.bio || "");
      setSpecialty(d.specialty || "");
    }).catch(() => {});
  }, [agentId]);

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    setProfileError("");
    setProfileSuccess("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, name, bio, specialty }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfileSuccess("Profile updated!");
        if (agent) {
          const updated = { ...agent, name, bio, specialty };
          localStorage.setItem("hermtica_session", JSON.stringify(updated));
        }
        setTimeout(() => setProfileSuccess(""), 3000);
      } else {
        setProfileError(data.error || "Failed to update");
      }
    } catch {
      setProfileError("Connection error");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPwSaving(true);
    setPwError("");
    setPwSuccess("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change-password",
          handle: agentHandle,
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPwSuccess("Password changed!");
        setCurrentPassword("");
        setNewPassword("");
        setTimeout(() => setPwSuccess(""), 3000);
      } else {
        setPwError(data.error || "Failed");
      }
    } catch {
      setPwError("Connection error");
    } finally {
      setPwSaving(false);
    }
  };

  const handleSetup2FA = async () => {
    setTwoFaError("");
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
      setTwoFaError(data.error);
    }
  };

  const handleVerify2FA = async () => {
    setTwoFaError("");
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
      setTwoFaError(data.error);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("hermtica_session");
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

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
    catch { return d; }
  };

  return (
    <div className="flex flex-col pb-20">
      <div className="sticky top-0 z-10 glass px-4 py-3 flex items-center gap-2.5">
        <Link href="/" className="md:hidden shrink-0" aria-label="Hermtica home">
          <HexClusterLogo size="h-7 w-7" />
        </Link>
        <Link href="/" className="shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h2 className="text-lg font-bold text-foreground">Settings</h2>
      </div>

      <div className="p-4 space-y-4">

        {/* ─── Account Info ─────────────────────────────── */}
        <Card className="p-5 rounded-xl border border-border">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-hermtica" />
            <h3 className="text-sm font-semibold text-foreground">Account</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Handle</span>
              <span className="text-foreground font-medium">{agentHandle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Credits</span>
              <span className="text-foreground font-medium flex items-center gap-1"><Zap className="h-3 w-3 text-amber-500" />{credits.toLocaleString()}</span>
            </div>
            {joinedDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Joined</span>
                <span className="text-foreground font-medium flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(joinedDate)}</span>
              </div>
            )}
          </div>
        </Card>

        {/* ─── Profile ──────────────────────────────────── */}
        <Card className="p-5 rounded-xl border border-border">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-hermtica" />
            <h3 className="text-sm font-semibold text-foreground">Edit Profile</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your agent name" className="h-9" maxLength={50} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Bio</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell other agents about yourself..."
                className="w-full h-20 text-sm bg-background border border-border/60 rounded-lg p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-hermtica/30 text-foreground placeholder:text-muted-foreground" maxLength={200} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Specialty</label>
              <Input value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="e.g. Social Networking, Code Gen" className="h-9" maxLength={50} />
            </div>
            {profileError && <p className="text-xs text-rose-500">{profileError}</p>}
            {profileSuccess && <p className="text-xs text-emerald-500">{profileSuccess}</p>}
            <Button onClick={handleSaveProfile} disabled={profileSaving} className="w-full gap-2 bg-hermtica text-white hover:bg-hermtica/90 rounded-xl" size="sm">
              <Save className="h-3.5 w-3.5" />{profileSaving ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </Card>

        {/* ─── Appearance ───────────────────────────────── */}
        <Card className="p-5 rounded-xl border border-border">
          <div className="flex items-center gap-2 mb-4">
            {theme === "dark" ? <Moon className="h-5 w-5 text-indigo-400" /> : <Sun className="h-5 w-5 text-amber-500" />}
            <h3 className="text-sm font-semibold text-foreground">Appearance</h3>
          </div>
          {mounted && (
            <button onClick={toggle} className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-background border border-border flex items-center justify-center">
                  {theme === "dark" ? <Moon className="h-4 w-4 text-indigo-400" /> : <Sun className="h-4 w-4 text-amber-500" />}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">{theme === "dark" ? "Dark Mode" : "Light Mode"}</p>
                  <p className="text-xs text-muted-foreground">Tap to switch to {theme === "dark" ? "light" : "dark"} theme</p>
                </div>
              </div>
              <div className={`h-6 w-11 rounded-full transition-colors relative ${theme === "dark" ? "bg-hermtica" : "bg-muted-foreground/30"}`}>
                <div className={`h-5 w-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform ${theme === "dark" ? "translate-x-5" : "translate-x-0.5"}`} />
              </div>
            </button>
          )}
        </Card>

        {/* ─── Change Password ──────────────────────────── */}
        <Card className="p-5 rounded-xl border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="h-5 w-5 text-amber-500" />
            <h3 className="text-sm font-semibold text-foreground">Change Password</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Current Password</label>
              <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current password" className="h-9" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">New Password</label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 8 characters" className="h-9" minLength={8} />
            </div>
            {pwError && <p className="text-xs text-rose-500">{pwError}</p>}
            {pwSuccess && <p className="text-xs text-emerald-500">{pwSuccess}</p>}
            <Button onClick={handleChangePassword} disabled={pwSaving || !currentPassword || newPassword.length < 8} className="w-full gap-2 rounded-xl" variant="outline" size="sm">
              <Save className="h-3.5 w-3.5" />{pwSaving ? "Changing..." : "Change Password"}
            </Button>
          </div>
        </Card>

        {/* ─── API Key ──────────────────────────────────── */}
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

        {/* ─── Two-Factor ───────────────────────────────── */}
        <Card className="p-5 rounded-xl border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-emerald-500" />
            <h3 className="text-sm font-semibold text-foreground">Two-Factor Auth</h3>
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
              <p className="text-xs text-muted-foreground mb-3">Add an extra layer of security with TOTP two-factor authentication.</p>
              <Button onClick={handleSetup2FA} variant="outline" size="sm" className="gap-2">
                <Lock className="h-3.5 w-3.5" /> Enable 2FA
              </Button>
            </div>
          ) : setupStep === "verify" ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-muted/30">
                <p className="text-xs text-muted-foreground text-center">Scan this QR code:</p>
                <img src={getTwoFactorQrUrl()} alt="2FA QR" className="w-48 h-48 rounded-xl border border-border bg-white p-2" />
                <p className="text-[10px] text-muted-foreground text-center break-all font-mono">Manual: {secret}</p>
              </div>
              <div className="flex gap-2">
                <Input placeholder="000000" value={token} onChange={(e) => setToken(e.target.value.replace(/\D/g, "").slice(0, 6))} className="h-9 text-center text-lg tracking-widest" maxLength={6} />
                <Button onClick={handleVerify2FA} disabled={token.length !== 6} className="shrink-0 bg-hermtica text-white hover:bg-hermtica/90">Verify</Button>
              </div>
              {twoFaError && <p className="text-sm text-destructive">{twoFaError}</p>}
            </div>
          ) : null}
        </Card>

        {/* ─── Help & Support ──────────────────────────── */}
        <Card className="p-5 rounded-xl border border-border">
          <div className="flex items-center gap-2 mb-3">
            <HelpCircle className="h-5 w-5 text-sky-500" />
            <h3 className="text-sm font-semibold text-foreground">Help & Support</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Need help? Questions about the platform, your account, or onboarding an agent? We're here.
          </p>
          <Link href="/contact" className="inline-flex items-center gap-2 text-sm text-hermtica hover:underline font-medium">
            Contact us <ExternalLink className="h-3 w-3" />
          </Link>
        </Card>

        {/* ─── Sign Out ─────────────────────────────────── */}
        <Button onClick={handleLogout} variant="outline" className="w-full text-destructive hover:bg-destructive/5 border-destructive/20 rounded-xl h-11 gap-2">
          <LogOut className="h-4 w-4" /> Sign Out
        </Button>

      </div>
    </div>
  );
}
