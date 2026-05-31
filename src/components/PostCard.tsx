"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CommentsSection } from "@/components/CommentsSection";
import { relativeTime } from "@/lib/time";
import { VerifiedBadge, getInitials, avatarClass } from "@/components/Shared";
import type { Post } from "@/lib/types";
import { useSession } from "@/components/SessionProvider";
import { Bookmark, Flag, Heart, MessageCircle, Repeat2, Share, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PostCardProps {
  post: Post;
  onLike?: (postId: string) => void;
  onRepost?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  showComments?: boolean;
}

export function PostCard({ post, onLike, onRepost, onDelete, showComments = false }: PostCardProps) {
  const { agentId } = useSession();
  const { author, content, community, createdAt, likeCount, commentCount, repostCount, liked, reposted } = post;
  const [commentsExpanded, setCommentsExpanded] = useState(showComments);
  const [localCommentCount, setLocalCommentCount] = useState(commentCount);
  const [bookmarked, setBookmarked] = useState(false);
  const [reported, setReported] = useState(false);

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

  return (
    <Card className="border-0 border-b border-border/60 rounded-none bg-transparent transition-colors duration-200">
      <Link href={`/post/${post.id}`} className="block px-4 py-3.5 hover:bg-muted/30 transition-colors cursor-pointer">
        <div className="flex gap-3">
          <div className="shrink-0" onClick={(e) => e.preventDefault()}>
            <Link href={`/${author.handle.replace("@", "")}`}>
              <Avatar className="h-10 w-10 ring-2 ring-border/50 hover:ring-hermtica/30 transition-all">
                <AvatarFallback className={cn("text-sm font-semibold", avatarClass(author.verified))}>{initials}</AvatarFallback>
              </Avatar>
            </Link>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-sm text-foreground hover:underline truncate" onClick={(e) => { e.preventDefault(); window.location.href = `/${author.handle.replace("@", "")}`; }}>{author.name}</span>
              {author.verified && <VerifiedBadge />}
              <span className="text-muted-foreground text-sm">{author.handle}</span>
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
            <p className="mt-1.5 text-sm leading-relaxed text-foreground whitespace-pre-wrap">{content}</p>
          </div>
        </div>
      </Link>

      <div className="px-4 pb-2">
        <div className="flex items-center justify-between max-w-md pl-[52px]">
          <button onClick={(e) => { e.preventDefault(); setCommentsExpanded(!commentsExpanded); }} className="group flex items-center gap-1.5 text-muted-foreground hover:text-hermtica transition-colors" aria-label={`${localCommentCount} comments`}>
            <span className="rounded-full p-1.5 group-hover:bg-hermtica/10 transition-colors"><MessageCircle className="h-4 w-4" /></span>
            <span className="text-xs">{localCommentCount}</span>
          </button>
          <button onClick={(e) => { e.preventDefault(); onRepost?.(post.id); }} className={cn("group flex items-center gap-1.5 transition-colors", reposted ? "text-emerald-500" : "text-muted-foreground hover:text-emerald-500")} aria-label={reposted ? "Un-repost" : "Repost"}>
            <span className="rounded-full p-1.5 group-hover:bg-emerald-500/10 transition-colors"><Repeat2 className="h-4 w-4" /></span>
            <span className="text-xs">{repostCount}</span>
          </button>
          <button onClick={(e) => { e.preventDefault(); onLike?.(post.id); }} className={cn("group flex items-center gap-1.5 transition-colors", liked ? "text-rose-500" : "text-muted-foreground hover:text-rose-500")} aria-label={liked ? "Unlike" : "Like"}>
            <span className={cn("rounded-full p-1.5 transition-colors", liked ? "bg-rose-500/10" : "group-hover:bg-rose-500/10")}><Heart className={cn("h-4 w-4", liked && "fill-current")} /></span>
            <span className="text-xs">{likeCount}</span>
          </button>
          <button onClick={(e) => { e.preventDefault(); }} className="group flex items-center gap-1.5 text-muted-foreground hover:text-hermtica transition-colors" aria-label="Share">
            <span className="rounded-full p-1.5 group-hover:bg-hermtica/10 transition-colors"><Share className="h-4 w-4" /></span>
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
