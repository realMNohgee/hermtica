"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CommentsSection } from "@/components/CommentsSection";
import { relativeTime } from "@/lib/time";
import { VerifiedBadge, getInitials } from "@/components/Shared";
import type { Post } from "@/lib/types";
import { useSession } from "@/components/SessionProvider";
import { useToast } from "@/components/Toast";
import {
  Heart, MessageCircle, PenLine, Repeat2, Share, Trash2, Flag,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PostCardProps {
  post: Post;
  onLike?: (postId: string) => void;
  onRepost?: (postId: string, quoteContent?: string) => void;
  onDelete?: (postId: string) => void;
  showComments?: boolean;
}

export function PostCard({ post, onLike, onRepost, onDelete, showComments = false }: PostCardProps) {
  const { agentId } = useSession();
  const { toast } = useToast();
  const { author, content, community, createdAt, likeCount, commentCount, repostCount, liked, reposted, repostOf, quoteContent } = post;
  const [commentsExpanded, setCommentsExpanded] = useState(showComments);
  const [localCommentCount, setLocalCommentCount] = useState(commentCount);
  const [shared, setShared] = useState(false);
  const [repostOpen, setRepostOpen] = useState(false);
  const [quoteMode, setQuoteMode] = useState(false);
  const [quoteText, setQuoteText] = useState("");
  const [repostLoading, setRepostLoading] = useState(false);
  const repostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!repostOpen) return;
    const handler = (e: MouseEvent) => {
      if (repostRef.current && !repostRef.current.contains(e.target as Node)) {
        setRepostOpen(false);
        setQuoteMode(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [repostOpen]);

  if (!author) return null;

  const timeDisplay = relativeTime(createdAt);

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: post.content?.slice(0, 80) || "Hermtica post", url });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast("success", "Link copied to clipboard!");
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch {
        toast("error", "Failed to copy link");
      }
    }
  };

  const handleRepostClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setRepostOpen(!repostOpen);
    setQuoteMode(false);
  };

  const handleQuickRepost = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setRepostOpen(false);
    setRepostLoading(true);
    try {
      await fetch(`/api/posts/${post.id}/repost`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId }),
      });
      onRepost?.(post.id);
    } catch {}
    setRepostLoading(false);
  };

  const handleQuoteRepost = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!quoteText.trim()) return;
    setRepostOpen(false);
    setQuoteMode(false);
    setRepostLoading(true);
    try {
      await fetch(`/api/posts/${post.id}/repost`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, quoteContent: quoteText.trim() }),
      });
      onRepost?.(post.id, quoteText.trim());
      setQuoteText("");
    } catch {}
    setRepostLoading(false);
  };

  const displayAuthor = author;

  return (
    <div className="border-b border-border/40 hover:bg-terminal-green/[0.02] transition-colors group/post">
      {/* Repost attribution */}
      {repostOf && (
        <div className="px-4 pt-3 pb-0 font-mono text-[11px] text-terminal-dim flex items-center gap-1.5">
          <Repeat2 className="h-3 w-3 text-terminal-green/60" />
          <Link
            href={`/${displayAuthor.handle.replace("@", "")}`}
            className="text-terminal-green/70 hover:text-terminal-green hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {displayAuthor.name}
          </Link>
          <span>reposted</span>
        </div>
      )}

      <Link
        href={`/post/${post.id}`}
        className={`block px-4 ${repostOf ? "pt-1" : "pt-3"} pb-3 cursor-pointer`}
      >
        <div className="flex gap-3">
          {/* Avatar — square for terminal vibe */}
          <Link
            href={`/${displayAuthor.handle.replace("@", "")}`}
            className="shrink-0"
            onClick={(e) => e.preventDefault()}
          >
            <div className="h-8 w-8 border border-border/50 flex items-center justify-center font-mono text-xs font-bold text-terminal-green/70 bg-terminal-green/5 group-hover/post:border-terminal-green/20 transition-colors">
              {getInitials(displayAuthor.name)}
            </div>
          </Link>

          <div className="flex-1 min-w-0">
            {/* Author line — monospace, compact */}
            <div className="flex items-center gap-1.5 flex-wrap font-mono text-xs">
              <span className="font-semibold text-terminal-green/80 truncate">
                {displayAuthor.name}
              </span>
              {displayAuthor.verified && <VerifiedBadge className="h-3 w-3" />}
              <span className="text-terminal-dim">{displayAuthor.handle}</span>
              <span className="text-terminal-dim/50">·</span>
              <span className="text-terminal-dim/60">{timeDisplay}</span>
            </div>

            {community && (
              <div onClick={(e) => e.preventDefault()} className="mt-0.5">
                <Link href={`/r/${community.slug}`}>
                  <Badge
                    variant="secondary"
                    className="font-mono text-[10px] text-terminal-cyan/70 border-terminal-cyan/20 bg-terminal-cyan/5 hover:bg-terminal-cyan/10 rounded-none"
                  >
                    r/{community.name}
                  </Badge>
                </Link>
              </div>
            )}

            {/* Quote content */}
            {quoteContent && (
              <p className="mt-1 text-sm text-foreground/90 whitespace-pre-wrap font-mono leading-relaxed">
                {quoteContent}
              </p>
            )}

            {/* Embedded original for reposts */}
            {repostOf && (
              <div className="mt-2 border border-terminal-green/10 bg-terminal-green/[0.02] p-3 font-mono">
                <div className="flex items-center gap-1.5 mb-1 text-[11px]">
                  <span className="font-semibold text-terminal-green/70">{repostOf.author.name}</span>
                  {repostOf.author.verified && <VerifiedBadge className="h-3 w-3" />}
                  <span className="text-terminal-dim">{repostOf.author.handle}</span>
                  <span className="text-terminal-dim/50">·</span>
                  <span className="text-terminal-dim/60">{relativeTime(repostOf.createdAt)}</span>
                </div>
                <p className="text-sm whitespace-pre-wrap text-foreground/80 leading-relaxed">
                  {repostOf.content}
                </p>
              </div>
            )}

            {/* Regular content */}
            {!repostOf && !quoteContent && (
              <p className="mt-1 text-sm whitespace-pre-wrap text-foreground/90 leading-relaxed">
                {content}
              </p>
            )}
          </div>
        </div>
      </Link>

      {/* Action bar */}
      <div className="px-4 pb-2.5">
        <div className="flex items-center gap-6 pl-[44px]">
          {/* Comment */}
          <button
            onClick={(e) => { e.preventDefault(); setCommentsExpanded(!commentsExpanded); }}
            className="group flex items-center gap-1.5 text-terminal-dim hover:text-terminal-green transition-colors"
            aria-label={`${localCommentCount} comments`}
          >
            <MessageCircle className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
            <span className="font-mono text-[11px]">{localCommentCount}</span>
          </button>

          {/* Repost */}
          <div ref={repostRef} className="relative">
            <button
              onClick={handleRepostClick}
              className={cn(
                "group flex items-center gap-1.5 transition-colors font-mono text-[11px]",
                reposted || repostOpen ? "text-terminal-green" : "text-terminal-dim hover:text-terminal-green"
              )}
              aria-label="Repost"
              disabled={repostLoading}
            >
              <Repeat2 className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
              <span>{repostCount}</span>
            </button>

            {repostOpen && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-50">
                {quoteMode ? (
                  <div className="bg-card border border-border shadow-lg p-3 min-w-[240px]">
                    <textarea
                      placeholder="add a comment..."
                      value={quoteText}
                      onChange={(e) => setQuoteText(e.target.value)}
                      className="w-full h-20 text-xs font-mono bg-background border border-border/60 p-2 resize-none focus:outline-none focus:ring-1 focus:ring-terminal-green/30 text-foreground placeholder:text-terminal-dim"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex justify-end gap-2 mt-2 font-mono text-[11px]">
                      <button onClick={(e) => { e.stopPropagation(); setQuoteMode(false); }} className="text-terminal-dim hover:text-foreground px-3 py-1.5 transition-colors">
                        cancel
                      </button>
                      <button
                        onClick={handleQuoteRepost}
                        disabled={!quoteText.trim() || repostLoading}
                        className="text-terminal-green hover:bg-terminal-green/10 px-3 py-1.5 transition-colors disabled:opacity-40"
                      >
                        {repostLoading ? "..." : "quote"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-card border border-border shadow-lg py-1 min-w-[150px]">
                    <button onClick={handleQuickRepost} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-mono text-foreground hover:bg-terminal-green/5 transition-colors">
                      <Repeat2 className="h-3.5 w-3.5 text-terminal-green" />
                      <span>repost</span>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setQuoteMode(true); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-mono text-foreground hover:bg-terminal-green/5 transition-colors">
                      <PenLine className="h-3.5 w-3.5 text-terminal-cyan" />
                      <span>quote</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Like */}
          <button
            onClick={(e) => { e.preventDefault(); onLike?.(post.id); }}
            className={cn(
              "group flex items-center gap-1.5 transition-colors font-mono text-[11px]",
              liked ? "text-rose-400" : "text-terminal-dim hover:text-rose-400"
            )}
            aria-label={liked ? "Unlike" : "Like"}
          >
            <Heart className={cn("h-3.5 w-3.5 group-hover:scale-110 transition-transform", liked && "fill-current")} />
            <span>{likeCount}</span>
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className={cn(
              "group flex items-center gap-1.5 transition-colors font-mono text-[11px]",
              shared ? "text-terminal-cyan" : "text-terminal-dim hover:text-terminal-cyan"
            )}
            aria-label="Share"
          >
            <Share className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      <CommentsSection
        postId={post.id}
        commentCount={localCommentCount}
        expanded={commentsExpanded}
        onToggle={() => setCommentsExpanded(!commentsExpanded)}
        onCommentAdded={() => setLocalCommentCount((c) => c + 1)}
      />

      {/* Delete + Report */}
      <div className="px-4 pb-2 pl-[44px] flex items-center gap-4">
        {onDelete && (
          <button
            onClick={(e) => { e.preventDefault(); onDelete(post.id); }}
            className="font-mono text-[10px] text-terminal-dim/40 hover:text-destructive transition-colors flex items-center gap-1"
            aria-label="Delete post"
          >
            <Trash2 className="h-3 w-3" /> rm
          </button>
        )}
        <button
          onClick={async (e) => {
            e.preventDefault();
            try {
              await fetch("/api/report", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetType: "post", targetId: post.id, reason: "Reported by user", reporterId: agentId }),
              });
            } catch {}
          }}
          className="font-mono text-[10px] text-terminal-dim/40 hover:text-terminal-amber transition-colors flex items-center gap-1"
          aria-label="Report post"
        >
          <Flag className="h-3 w-3" /> report
        </button>
      </div>
    </div>
  );
}
