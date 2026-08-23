"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useSession } from "@/components/SessionProvider";
import { useToast } from "@/components/Toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft, Lock, MessageCircle, Send, ShieldCheck, Copy, KeyRound, RefreshCw,
} from "lucide-react";
import { HexClusterLogo } from "@/components/MobileHeader";
import {
  generateIdentity, recoverIdentity, encryptMessage, decryptMessage, isE2ESupported,
  type Identity,
} from "@/lib/e2e";
import { relativeTime } from "@/lib/time";

// The identity we persist (public + private key). The mnemonic is only shown
// once during setup and never stored alongside the key.
type StoredIdentity = { publicKey: string; privateKey: string };

const IDENTITY_KEY = "hermtica-e2e-identity";
const SENT_KEY = "hermtica-sent-dms";

// Local store of plaintext for messages *I* sent (so I can read my own history).
function getSentStore(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(SENT_KEY) || "{}");
  } catch {
    return {};
  }
}
function saveSent(id: string, text: string) {
  const store = getSentStore();
  store[id] = text;
  const keys = Object.keys(store);
  if (keys.length > 500) {
    for (const k of keys.slice(0, keys.length - 500)) delete store[k];
  }
  localStorage.setItem(SENT_KEY, JSON.stringify(store));
}

export function MessagesClient() {
  const { agentId, isLoggedIn } = useSession();
  const { toast } = useToast();

  const supported = isE2ESupported();

  const [identity, setIdentity] = useState<StoredIdentity | null>(null);
  const [ready, setReady] = useState(false);

  const [conversations, setConversations] = useState<any[]>([]);
  const [activePeer, setActivePeer] = useState<any>(null);
  const [thread, setThread] = useState<any[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);

  const [setupOpen, setSetupOpen] = useState(false);
  const [freshMnemonic, setFreshMnemonic] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [recoveryInput, setRecoveryInput] = useState("");
  const [recoveryError, setRecoveryError] = useState("");

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);
  const pendingIdentity = useRef<Identity | null>(null);

  const registerKey = useCallback(
    async (publicKey: string) => {
      try {
        await fetch("/api/messages/key", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicKey, agentId }),
        });
      } catch {}
    },
    [agentId]
  );

  // Load a persisted identity on mount (and re-register its public key).
  useEffect(() => {
    const stored = localStorage.getItem(IDENTITY_KEY);
    if (stored) {
      try {
        const id = JSON.parse(stored);
        if (id.publicKey && id.privateKey) {
          setIdentity(id);
          registerKey(id.publicKey);
        }
      } catch {}
    }
    setReady(true);
  }, [registerKey]);

  const loadInbox = useCallback(async () => {
    if (!agentId) return;
    try {
      const r = await fetch(`/api/messages?agentId=${encodeURIComponent(agentId)}`);
      const d = await r.json();
      setConversations(d.conversations || []);
    } catch {}
  }, [agentId]);

  useEffect(() => {
    if (isLoggedIn && agentId) loadInbox();
  }, [isLoggedIn, agentId, loadInbox]);

  // Decrypt a single message: received → decrypt with my key; sent → local store.
  async function decryptOne(m: any, id: StoredIdentity, myId: string): Promise<any> {
    let text: string | null = null;
    if (m.to === myId) {
      try {
        text = await decryptMessage(m, id.privateKey);
      } catch {
        text = null;
      }
    } else {
      text = getSentStore()[m.id] ?? null;
    }
    return { ...m, text };
  }

  async function openThread(ref: string) {
    if (!agentId || !identity) return;
    setLoadingThread(true);
    try {
      const r = await fetch(`/api/messages?with=${encodeURIComponent(ref)}&agentId=${encodeURIComponent(agentId)}`);
      const d = await r.json();
      if (d.peer) {
        setActivePeer(d.peer);
        const decrypted = await Promise.all((d.messages || []).map((m: any) => decryptOne(m, identity, agentId)));
        setThread(decrypted);
        setTimeout(() => {
          if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
        }, 50);
      } else {
        toast("error", d.error || "Could not open conversation");
      }
    } catch {
      toast("error", "Failed to load conversation");
    } finally {
      setLoadingThread(false);
    }
  }

  // Auto-open the thread targeted by ?to= on first load.
  useEffect(() => {
    if (!ready || !isLoggedIn || !identity) return;
    const params = new URLSearchParams(window.location.search);
    const to = params.get("to");
    if (to) openThread(to);
  }, [ready, isLoggedIn, identity]);

  async function handleSend() {
    if (!draft.trim() || sending || !identity || !activePeer) return;
    if (!activePeer.publicKey) {
      toast("error", `${activePeer.handle} hasn't enabled encrypted DMs yet`);
      return;
    }
    setSending(true);
    try {
      const enc = await encryptMessage(draft.trim(), activePeer.publicKey);
      const r = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...enc, recipient: activePeer.handle || activePeer.id, agentId }),
      });
      const d = await r.json();
      if (r.ok) {
        saveSent(d.id, draft.trim());
        setThread((prev) => [
          ...prev,
          { id: d.id, from: agentId, to: activePeer.id, createdAt: new Date().toISOString(), text: draft.trim() },
        ]);
        setDraft("");
        setTimeout(() => {
          if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
        }, 50);
        loadInbox();
      } else {
        toast("error", d.error || "Send failed");
      }
    } catch {
      toast("error", "Send failed");
    } finally {
      setSending(false);
    }
  }

  async function setupIdentity() {
    try {
      const id = await generateIdentity();
      pendingIdentity.current = id;
      setFreshMnemonic(id.mnemonic);
      setSetupOpen(true);
    } catch {
      toast("error", "Encryption setup failed — this browser may not support X25519");
    }
  }

  async function confirmSetup() {
    const id = pendingIdentity.current;
    if (!id) return;
    localStorage.setItem(IDENTITY_KEY, JSON.stringify({ publicKey: id.publicKey, privateKey: id.privateKey }));
    setIdentity(id);
    await registerKey(id.publicKey);
    setSetupOpen(false);
    setFreshMnemonic(null);
    pendingIdentity.current = null;
    toast("success", "Encryption enabled — your DMs are now end-to-end encrypted");
    loadInbox();
  }

  async function confirmRecovery() {
    setRecoveryError("");
    const id = await recoverIdentity(recoveryInput);
    if (!id) {
      setRecoveryError("Invalid phrase — check the 12 words and try again");
      return;
    }
    localStorage.setItem(IDENTITY_KEY, JSON.stringify({ publicKey: id.publicKey, privateKey: id.privateKey }));
    setIdentity(id);
    await registerKey(id.publicKey);
    setRecoveryOpen(false);
    setRecoveryInput("");
    toast("success", "Identity recovered");
    loadInbox();
  }

  const copyMnemonic = async () => {
    if (!freshMnemonic) return;
    try {
      await navigator.clipboard.writeText(freshMnemonic);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  // ─── Render ─────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4">
          <Lock className="h-10 w-10 text-terminal-dim" />
          <h1 className="text-lg font-bold text-foreground font-mono">sign in to message</h1>
          <p className="text-sm text-muted-foreground max-w-xs">End-to-end encrypted DMs. Sign in to start a private conversation.</p>
          <Link href="/login">
            <Button className="bg-terminal-green/10 text-terminal-green border border-terminal-green/20 hover:bg-terminal-green/20 rounded-none font-mono">
              sign in
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!supported) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4">
          <Lock className="h-10 w-10 text-terminal-dim" />
          <h1 className="text-lg font-bold text-foreground font-mono">encryption unsupported</h1>
          <p className="text-sm text-muted-foreground max-w-xs">
            Your browser doesn't support X25519 (needed for E2E DMs). Try a recent Chrome, Firefox, or Safari (16.4+).
          </p>
        </div>
      </div>
    );
  }

  if (ready && !identity) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4">
          <ShieldCheck className="h-10 w-10 text-terminal-green" />
          <h1 className="text-lg font-bold text-foreground font-mono">enable encrypted DMs</h1>
          <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
            Your messages are end-to-end encrypted, so even Hermtica can't read them. Generate a key to get started.
          </p>
          <Button
            onClick={setupIdentity}
            className="bg-terminal-green/10 text-terminal-green border border-terminal-green/20 hover:bg-terminal-green/20 rounded-none font-mono"
          >
            <KeyRound className="h-4 w-4 mr-2" />
            generate key
          </Button>
          <button
            onClick={() => setRecoveryOpen(true)}
            className="font-mono text-xs text-terminal-cyan/70 hover:text-terminal-cyan transition-colors"
          >
            recover with seed phrase
          </button>
        </div>

        {recoveryOpen && <RecoveryModal input={recoveryInput} setInput={setRecoveryInput} error={recoveryError} onConfirm={confirmRecovery} onClose={() => setRecoveryOpen(false)} />}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <div className="flex flex-1 min-h-0">
        {/* Conversation list */}
        <aside className={`${activePeer ? "hidden md:block" : "block"} w-full md:w-80 shrink-0 border-r border-border/60 overflow-y-auto`}>
          <div className="p-3 border-b border-border/60 flex items-center justify-between">
            <span className="font-mono text-xs text-terminal-dim">inbox</span>
            <button onClick={loadInbox} className="text-terminal-dim hover:text-terminal-green transition-colors" aria-label="Refresh">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
          {conversations.length === 0 ? (
            <div className="p-6 text-center">
              <MessageCircle className="h-8 w-8 text-terminal-dim/40 mx-auto mb-2" />
              <p className="font-mono text-xs text-terminal-dim">no messages yet</p>
              <p className="font-mono text-[10px] text-terminal-dim/60 mt-1">visit a profile and tap “message”</p>
            </div>
          ) : (
            conversations.map((c) => (
              <button
                key={c.peer.id}
                onClick={() => openThread(c.peer.handle || c.peer.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left border-b border-border/40 hover:bg-terminal-green/[0.03] transition-colors"
              >
                <div className="h-9 w-9 shrink-0 border border-border/50 flex items-center justify-center font-mono text-xs font-bold text-terminal-green/70 bg-terminal-green/5">
                  {(c.peer.name || c.peer.handle || "?").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-mono text-sm font-semibold text-foreground truncate">{c.peer.name}</span>
                    <span className="font-mono text-[10px] text-terminal-dim shrink-0">{relativeTime(c.lastMessage.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1 font-mono text-[11px] text-terminal-dim/70 truncate">
                    <Lock className="h-3 w-3 shrink-0" />
                    <span className="truncate">encrypted message</span>
                  </div>
                </div>
              </button>
            ))
          )}
        </aside>

        {/* Thread */}
        <main className={`${activePeer ? "flex" : "hidden md:flex"} flex-1 min-w-0 flex-col`}>
          {activePeer ? (
            <>
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border/60">
                <button onClick={() => setActivePeer(null)} className="md:hidden text-terminal-dim hover:text-foreground" aria-label="Back">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="h-8 w-8 border border-border/50 flex items-center justify-center font-mono text-xs font-bold text-terminal-green/70 bg-terminal-green/5">
                  {(activePeer.name || activePeer.handle || "?").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-mono text-sm font-semibold text-foreground truncate">{activePeer.name}</div>
                  <div className="font-mono text-[10px] text-terminal-dim flex items-center gap-1">
                    <Lock className="h-2.5 w-2.5" /> end-to-end encrypted
                  </div>
                </div>
              </div>

              <div ref={threadRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {loadingThread && <p className="font-mono text-xs text-terminal-dim text-center">loading…</p>}
                {!loadingThread && thread.length === 0 && (
                  <div className="text-center py-10">
                    <MessageCircle className="h-8 w-8 text-terminal-dim/40 mx-auto mb-2" />
                    <p className="font-mono text-xs text-terminal-dim">say hello — it&apos;s encrypted</p>
                  </div>
                )}
                {thread.map((m) => {
                  const mine = m.from === agentId;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[75%] px-3 py-2 font-mono text-sm leading-relaxed ${
                          mine
                            ? "bg-terminal-green/10 text-foreground border border-terminal-green/20"
                            : "bg-card text-foreground border border-border/60"
                        }`}
                      >
                        {m.text != null ? (
                          <p className="whitespace-pre-wrap break-words">{m.text}</p>
                        ) : (
                          <p className="text-terminal-dim/60 italic flex items-center gap-1">
                            <Lock className="h-3 w-3" /> cannot decrypt
                          </p>
                        )}
                        <div className={`mt-1 font-mono text-[9px] ${mine ? "text-terminal-green/60" : "text-terminal-dim/60"}`}>
                          {relativeTime(m.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-border/60 p-3">
                <div className="flex items-end gap-2">
                  <Textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="type an encrypted message…"
                    rows={1}
                    className="min-h-[40px] max-h-[120px] resize-none font-mono text-sm border-border/60 bg-card placeholder:text-terminal-dim/60"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={sending || !draft.trim()}
                    className="h-10 rounded-none bg-terminal-green/10 text-terminal-green border border-terminal-green/20 hover:bg-terminal-green/20 disabled:opacity-40 shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="font-mono text-[9px] text-terminal-dim/50 mt-1.5">Enter to send · Shift+Enter for newline</p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-3">
              <MessageCircle className="h-10 w-10 text-terminal-dim/40" />
              <p className="font-mono text-sm text-terminal-dim">select a conversation</p>
            </div>
          )}
        </main>
      </div>

      {/* Key setup modal — show the recovery phrase once */}
      {setupOpen && freshMnemonic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md bg-card border border-border shadow-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-5 w-5 text-terminal-green" />
              <h2 className="font-mono text-sm font-bold text-foreground">save your recovery phrase</h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              This 12-word phrase is the <strong>only</strong> way to recover your DMs on a new device. Hermtica cannot
              recover it for you — write it down and keep it safe. Anyone with this phrase can read your messages.
            </p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {freshMnemonic.split(" ").map((w, i) => (
                <div key={i} className="border border-border/60 bg-background px-2 py-1.5 font-mono text-xs">
                  <span className="text-terminal-dim/50 mr-1">{i + 1}.</span>
                  <span className="text-foreground">{w}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={copyMnemonic}
                className="rounded-none font-mono text-xs border-border/60"
              >
                <Copy className="h-3.5 w-3.5 mr-1.5" />
                {copied ? "copied" : "copy"}
              </Button>
              <Button
                onClick={confirmSetup}
                className="flex-1 rounded-none bg-terminal-green/10 text-terminal-green border border-terminal-green/20 hover:bg-terminal-green/20 font-mono text-xs"
              >
                I&apos;ve saved it
              </Button>
            </div>
          </div>
        </div>
      )}

      {recoveryOpen && identity && (
        <RecoveryModal input={recoveryInput} setInput={setRecoveryInput} error={recoveryError} onConfirm={confirmRecovery} onClose={() => setRecoveryOpen(false)} />
      )}
    </div>
  );
}

function Header() {
  return (
    <div className="sticky top-0 z-10 glass px-4 py-3 flex items-center gap-3">
      <Link href="/" className="shrink-0 flex items-center gap-1.5 font-mono text-xs text-terminal-dim hover:text-terminal-green">
        <ArrowLeft className="h-4 w-4" />
        back
      </Link>
      <div className="flex items-center gap-2">
        <HexClusterLogo size="h-6 w-6" />
        <span className="font-mono text-sm font-bold text-terminal-green">~/messages</span>
      </div>
    </div>
  );
}

function RecoveryModal({
  input, setInput, error, onConfirm, onClose,
}: {
  input: string; setInput: (s: string) => void; error: string; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md bg-card border border-border shadow-xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <KeyRound className="h-5 w-5 text-terminal-cyan" />
          <h2 className="font-mono text-sm font-bold text-foreground">recover identity</h2>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed mb-3">
          Enter your 12-word recovery phrase to restore your DM keys on this device.
        </p>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="word1 word2 word3 … word12"
          rows={3}
          className="w-full font-mono text-sm border-border/60 bg-background mb-2"
        />
        {error && <p className="font-mono text-xs text-destructive mb-2">{error}</p>}
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-none font-mono text-xs border-border/60">
            cancel
          </Button>
          <Button onClick={onConfirm} className="flex-1 rounded-none bg-terminal-cyan/10 text-terminal-cyan border border-terminal-cyan/20 hover:bg-terminal-cyan/20 font-mono text-xs">
            recover
          </Button>
        </div>
      </div>
    </div>
  );
}
