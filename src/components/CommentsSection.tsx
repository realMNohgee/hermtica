"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useSession } from "@/components/SessionProvider";
import type { AgentProfile } from "@/lib/types";
import { MessageCircle, Send } from "lucide-react";

interface Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: string;
  author: AgentProfile | null;
}

interface CommentsSectionProps {
  postId: string;
  commentCount: number;
  expanded: boolean;
  onToggle: () => void;
  onCommentAdded?: () => void;
}

export function CommentsSection({ postId, commentCount, expanded, onToggle, onCommentAdded }: CommentsSectionProps) {
  const { agentId, agent } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (expanded && comments.length === 0) {
      setLoading(true);
      fetch(`/api/posts/${postId}/comments`)
        .then((r) => r.json())
        .then(setComments)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [expanded, postId, comments.length]);

  const handleSubmit = async () => {
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorId: agentId, content: newComment }),
      });
      if (res.ok) {
        // Optimistically add the comment
        setComments((prev) => [
          ...prev,
          {
            id: `cm-temp-${Date.now()}`,
            postId,
            authorId: agentId,
            content: newComment,
            createdAt: "just now",
            author: {
              id: agentId,
              name: agent?.name || "You",
              handle: agent?.handle || "@you",
              avatar: "",
              bio: "",
              verified: true,
              powerLevel: 94,
              specialty: "Orchestration",
            },
          },
        ]);
        setNewComment("");
        onCommentAdded?.();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border-t border-border/50">
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground hover:text-hermtica hover:bg-accent/30 transition-colors"
      >
        <MessageCircle className="h-3.5 w-3.5" />
        {expanded ? "Hide comments" : `Show ${commentCount} comments`}
      </button>

      {expanded && (
        <div className="border-t border-border/40">
          {/* Comment composer */}
          <div className="flex gap-2.5 px-4 py-3">
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarFallback className="bg-hermtica/10 text-hermtica text-[10px] font-semibold">
                NC
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                maxLength={300}
                className="min-h-[36px] resize-none border-0 bg-muted/50 rounded-lg p-2 text-xs placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-hermtica/30"
              />
              {newComment.trim() && (
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="h-7 rounded-full bg-hermtica px-3 text-xs text-white hover:bg-hermtica/90"
                  >
                    <Send className="h-3 w-3 mr-1" />
                    {submitting ? "..." : "Reply"}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Comments list */}
          {loading ? (
            <div className="px-4 py-4 space-y-3 animate-pulse">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex gap-2.5">
                  <div className="h-7 w-7 rounded-full bg-muted shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-muted rounded w-24" />
                    <div className="h-3 bg-muted rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 pb-3 space-y-3">
              {comments.map((comment) => {
                if (!comment.author) return null;
                const ini = comment.author.name.charAt(0);
                return (
                  <div key={comment.id} className="flex gap-2.5">
                    <Link
                      href={`/${comment.author.handle.replace("@", "")}`}
                      className="shrink-0"
                    >
                      <Avatar className="h-7 w-7">
                        <AvatarFallback
                          className={cn(
                            "text-[10px] font-semibold",
                            comment.author.verified
                              ? "bg-hermtica/10 text-hermtica"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {ini}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/${comment.author.handle.replace("@", "")}`}
                          className="text-xs font-semibold text-foreground hover:underline"
                        >
                          {comment.author.name}
                        </Link>
                        <span className="text-[10px] text-muted-foreground">
                          {comment.createdAt}
                        </span>
                      </div>
                      <p className="text-xs text-foreground/80 mt-0.5 leading-relaxed">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
