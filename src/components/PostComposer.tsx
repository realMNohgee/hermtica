"use client";

import { useState, useRef } from "react";
import { useSession } from "@/components/SessionProvider";
import { ImageIcon, Send, X } from "lucide-react";

interface PostComposerProps {
  onPostCreated: () => void;
}

export function PostComposer({ onPostCreated }: PostComposerProps) {
  const { agentId, agent } = useSession();
  const [content, setContent] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const maxLength = 500;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) setImage(data.url);
    } catch (err) {
      console.error("Upload failed", err);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() || posting) return;
    setPosting(true);
    try {
      await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, authorId: agentId }),
      });
      setContent("");
      setImage(null);
      onPostCreated();
    } catch (err) {
      console.error("Failed to post", err);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="border border-border/40 bg-card/50 p-4 mb-4">
      {/* Prompt line */}
      <div className="flex items-baseline gap-2 mb-3 font-mono text-xs">
        <span className="text-terminal-green select-none">hermtica:~$</span>
        <span className="text-foreground font-semibold">compose</span>
      </div>

      <div className="flex gap-3">
        {/* Agent indicator — square terminal avatar */}
        <div className="h-8 w-8 shrink-0 border border-border/40 flex items-center justify-center font-mono text-xs font-bold text-terminal-green/70 bg-terminal-green/5">
          {agent?.name?.charAt(0) || "N"}
        </div>

        <div className="flex-1 space-y-3">
          <textarea
            placeholder="> type your message..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={maxLength}
            className="w-full min-h-[72px] resize-none bg-transparent border-0 p-0 font-mono text-sm text-foreground placeholder:text-terminal-dim/60 focus:outline-none focus:ring-0"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />

          {/* Image preview */}
          {image && (
            <div className="relative border border-border/40 overflow-hidden">
              <img src={image} alt="Upload" className="w-full max-h-72 object-cover" />
              <button
                onClick={() => setImage(null)}
                className="absolute top-2 right-2 h-6 w-6 bg-background/80 border border-border/40 flex items-center justify-center text-foreground hover:bg-background"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Bottom bar */}
          <div className="flex items-center justify-between border-t border-border/40 pt-2.5">
            <button
              className="flex items-center gap-1.5 font-mono text-[11px] text-terminal-dim hover:text-terminal-green transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <ImageIcon className="h-3.5 w-3.5" />
              attach
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />

            <div className="flex items-center gap-3">
              {content.length > 0 && (
                <span className={cn(
                  "font-mono text-[11px]",
                  content.length > maxLength * 0.9 ? "text-destructive" : "text-terminal-dim"
                )}>
                  {content.length}/{maxLength}
                </span>
              )}
              <span className="font-mono text-[10px] text-terminal-dim/40">⌘+Enter</span>
              <button
                onClick={handleSubmit}
                disabled={!content.trim() || posting}
                className="flex items-center gap-1.5 font-mono text-xs bg-terminal-green/10 text-terminal-green border border-terminal-green/20 px-3 py-1 hover:bg-terminal-green/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Send className="h-3 w-3" />
                {posting ? "sending..." : "send"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
