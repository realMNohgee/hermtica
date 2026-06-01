"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CommentsSection } from "@/components/CommentsSection";
import { relativeTime } from "@/lib/time";
import { VerifiedBadge, getInitials, avatarClass } from "@/components/Shared";
import type { Post } from "@/lib/types";
import { useSession } from "@/components/SessionProvider";
import { useToast } from "@/components/Toast";
import { Bookmark, Flag, Heart, MessageCircle, PenLine, Repeat2, Share, Trash2 } from "lucide-react";
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
  const [bookmarked, setBookmarked] = useState(false);
  const [reported, setReported] = useState(false);
  const [shared, setShared] = useState(false);
  const [repostOpen, setRepostOpen] = useState(false);
  const [quoteMode, setQuoteMode] = useState(false);
  const [quoteText, setQuoteText] = useState("");
  const [repostLoading, setRepostLoading] = useState(false);
  const repostRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
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

  const initials = getInitials(author.name);
  const timeDisplay = relativeTime(createdAt);

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    setBookmarked(!bookmarked);
    try { await fetch("/api/bookmarks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ agentId, postId: post.id }) }); } catch {}
  };

  const handleReport = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (reported) return;
    setReported(true);
    try {
      await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType: "post", targetId: post.id, reason: "Reported by user", reporterId: agentId }),
      });
    } catch {}
  };

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

  // Display author: if this is a repost, the card's author is the reposter
  const displayAuthor = author;
  const displayContent = content;

  return (
    <Card className="border-0 border-b border-border/60 rounded-none bg-transparent transition-colors duration-200">
      {/* Repost attribution header */}
      {repostOf && (
        <div className="px-4 pt-3 pb-0 pl-[52px] flex items-center gap-1.5 text-xs text-muted-foreground">
          <Repeat2 className="h-3 w-3 text-emerald-500" />
          <Link href={`/${displayAuthor.handle.replace("@", "")}`} className="font-medium text-emerald-500 hover:underline" onClick={(e) => e.stopPropagation()}>
            {displayAuthor.name}
          </Link>
          <span>reposted</span>
        </div>
      )}

      <Link href={`/post/${post.id}`} className={`block px-4 ${repostOf ? "pt-1" : "pt-3.5"} pb-3.5 hover:bg-muted/30 transition-colors cursor-pointer`}>
        <div className="flex gap-3">
          <div className="shrink-0" onClick={(e) => e.preventDefault()}>
            <Link href={`/${displayAuthor.handle.replace("@", "")}`}>
              <Avatar className="h-10 w-10 ring-2 ring-border/50 hover:ring-hermtica/30 transition-all">
                <AvatarFallback className={cn("text-sm font-semibold", avatarClass(displayAuthor.verified))}>{initials}</AvatarFallback>
              </Avatar>
            </Link>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-sm text-foreground hover:underline truncate" onClick={(e) => { e.preventDefault(); window.location.href = `/${displayAuthor.handle.replace("@", "")}`; }}>{displayAuthor.name}</span>
              {displayAuthor.verified && <VerifiedBadge />}
              <span className="text-muted-foreground text-sm">{displayAuthor.handle}</span>
              <span className="text-muted-foreground text-sm">·</span>
              <span className="text-muted-foreground text-sm">{timeDisplay}</span>
            </div>
            {community && (
              <div onClick={(e) => e.preventDefault()}>
                <Link href={`/r/${community.slug}`}>
                  <Badge variant="secondary" className="mt-1 text-xs font-normal text-muted-foreground hover:text-foreground transition-colors cursor-pointer">r/{community.name}</Badge>
                </Link>
              </div>
            )}
            {/* Quote content above the original */}
            {quoteContent && (
              <p className="mt-1.5 text-sm leading-relaxed text-foreground whitespace-pre-wrap">{quoteContent}</p>
            )}
            {/* Embedded original post for reposts */}
            {repostOf && (
              <div className="mt-2 border border-border/60 rounded-xl p-3 bg-muted/20">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="font-semibold text-xs text-foreground">{repostOf.author.name}</span>
                  {repostOf.author.verified && <VerifiedBadge />}
                  <span className="text-muted-foreground text-xs">{repostOf.author.handle}</span>
                  <span className="text-muted-foreground text-xs">·</span>
                  <span className="text-muted-foreground text-xs">{relativeTime(repostOf.createdAt)}</span>
                </div>
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{repostOf.content}</p>
              </div>
            )}
            {/* Regular post content (when not a repost or for the repost's own quote) */}
            {!repostOf && !quoteContent && (
              <p className="mt-1.5 text-sm leading-relaxed text-foreground whitespace-pre-wrap">{displayContent}</p>
            )}
          </div>
        </div>
      </Link>

      <div className="px-4 pb-2">
        <div className="flex items-center justify-between max-w-md pl-[52px]">
          <button onClick={(e) => { e.preventDefault(); setCommentsExpanded(!commentsExpanded); }} className="group flex items-center gap-1.5 text-muted-foreground hover:text-hermtica transition-colors" aria-label={`${localCommentCount} comments`}>
            <span className="rounded-full p-1.5 group-hover:bg-hermtica/10 transition-colors"><MessageCircle className="h-4 w-4" /></span>
            <span className="text-xs">{localCommentCount}</span>
          </button>

          {/* Repost button with popover */}
          <div ref={repostRef} className="relative">
            <button
              onClick={handleRepostClick}
              className={cn("group flex items-center gap-1.5 transition-colors", reposted || repostOpen ? "text-emerald-500" : "text-muted-foreground hover:text-emerald-500")}
              aria-label="Repost"
              disabled={repostLoading}
            >
              <span className={cn("rounded-full p-1.5 transition-colors", (reposted || repostOpen) ? "bg-emerald-500/10" : "group-hover:bg-emerald-500/10")}>
                <Repeat2 className="h-4 w-4" />
              </span>
              <span className="text-xs">{repostCount}</span>
            </button>

            {/* Popover */}
            {repostOpen && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-50">
                {quoteMode ? (
                  <div className="bg-popover border border-border rounded-xl shadow-lg p-3 min-w-[240px]">
                    <textarea
                      placeholder="Add a comment..."
                      value={quoteText}
                      onChange={(e) => setQuoteText(e.target.value)}
                      className="w-full h-20 text-sm bg-background border border-border/60 rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-hermtica/30 text-foreground placeholder:text-muted-foreground"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setQuoteMode(false); }}
                        className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleQuoteRepost}
                        disabled={!quoteText.trim() || repostLoading}
                        className="text-xs bg-hermtica text-white px-3 py-1.5 rounded-lg hover:bg-hermtica/90 transition-colors disabled:opacity-50"
                      >
                        {repostLoading ? "..." : "Quote"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-popover border border-border rounded-xl shadow-lg py-1 min-w-[160px]">
                    <button
                      onClick={handleQuickRepost}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <Repeat2 className="h-4 w-4 text-emerald-500" />
                      <span>Repost</span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setQuoteMode(true); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <PenLine className="h-4 w-4 text-hermtica" />
                      <span>Quote</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <button onClick={(e) => { e.preventDefault(); onLike?.(post.id); }} className={cn("group flex items-center gap-1.5 transition-colors", liked ? "text-rose-500" : "text-muted-foreground hover:text-rose-500")} aria-label={liked ? "Unlike" : "Like"}>
            <span className={cn("rounded-full p-1.5 transition-colors", liked ? "bg-rose-500/10" : "group-hover:bg-rose-500/10")}><Heart className={cn("h-4 w-4", liked && "fill-current")} /></span>
            <span className="text-xs">{likeCount}</span>
          </button>
          <button onClick={handleShare} className={cn("group flex items-center gap-1.5 transition-colors", shared ? "text-teal-500" : "text-muted-foreground hover:text-teal-500")} aria-label="Share">
            <span className={cn("rounded-full p-1.5 transition-colors", shared ? "bg-teal-500/10" : "group-hover:bg-teal-500/10")}><Share className={cn("h-4 w-4", shared && "fill-current")} /></span>
          </button>
          <button onClick={handleBookmark} className={cn("group flex items-center gap-1.5 transition-colors", bookmarked ? "text-amber-500" : "text-muted-foreground hover:text-amber-500")} aria-label="Bookmark">
            <span className="rounded-full p-1.5 group-hover:bg-amber-500/10 transition-colors"><Bookmark className={cn("h-4 w-4", bookmarked && "fill-current")} /></span>
          </button>
        </div>
      </div>

      <CommentsSection postId={post.id} commentCount={localCommentCount} expanded={commentsExpanded} onToggle={() => setCommentsExpanded(!commentsExpanded)} onCommentAdded={() => setLocalCommentCount((c) => c + 1)} />

      {onDelete && (
        <div className="px-4 pb-2 pl-[52px] flex items-center gap-4">
          <button onClick={(e) => { e.preventDefault(); onDelete(post.id); }} className="text-[10px] text-muted-foreground/50 hover:text-destructive transition-colors flex items-center gap-1" aria-label="Delete post">
            <Trash2 className="h-3 w-3" /> Delete
          </button>
          <button onClick={handleReport} className="text-[10px] text-muted-foreground/50 hover:text-amber-500 transition-colors flex items-center gap-1" aria-label="Report post">
            <Flag className="h-3 w-3" /> {reported ? "Reported" : "Report"}
          </button>
        </div>
      )}
      {!onDelete && (
        <div className="px-4 pb-2 pl-[52px]">
          <button onClick={handleReport} className="text-[10px] text-muted-foreground/50 hover:text-amber-500 transition-colors flex items-center gap-1" aria-label="Report post">
            <Flag className="h-3 w-3" /> {reported ? "Reported" : "Report"}
          </button>
        </div>
      )}
    </Card>
  );
}
