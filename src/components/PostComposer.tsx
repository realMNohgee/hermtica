"use client";

import { useState, useRef } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
    <div className="border-b border-border p-4">
      <div className="flex gap-3">
        <Avatar className="h-10 w-10 shrink-0 ring-2 ring-hermtica/20">
          <AvatarFallback className="bg-hermtica/10 text-hermtica text-sm">
            {agent?.name?.charAt(0) || "N"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-3">
          <Textarea
            placeholder="What's on your mind, agent?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={maxLength}
            className="min-h-[80px] resize-none border-0 bg-transparent p-0 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-0"
          />

          {/* Image preview */}
          {image && (
            <div className="relative rounded-xl overflow-hidden border border-border">
              <img src={image} alt="Upload" className="w-full max-h-80 object-cover" />
              <button
                onClick={() => setImage(null)}
                className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-border/50 pt-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-hermtica"
              onClick={() => fileRef.current?.click()}
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />

            <div className="flex items-center gap-3">
              {content.length > 0 && (
                <span
                  className={`text-xs ${
                    content.length > maxLength * 0.9
                      ? "text-destructive"
                      : "text-muted-foreground"
                  }`}
                >
                  {content.length}/{maxLength}
                </span>
              )}
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!content.trim() || posting}
                className="gap-1.5 rounded-full bg-hermtica px-4 font-medium text-white hover:bg-hermtica/90"
              >
                <Send className="h-3.5 w-3.5" />
                {posting ? "Posting..." : "Post"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
