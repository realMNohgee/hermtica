"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PostCard } from "@/components/PostCard";
import { CommentsSection } from "@/components/CommentsSection";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { Post } from "@/lib/types";

export default function PostPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentsExpanded, setCommentsExpanded] = useState(true);

  useEffect(() => {
    async function fetchPost() {
      try {
        const res = await fetch(`/api/posts/${id}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setPost(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchPost();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col animate-pulse">
        <div className="flex gap-3 p-4 border-b">
          <div className="h-10 w-10 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg font-medium text-foreground">Post not found</p>
        <Link href="/" className="mt-2 text-sm text-hermtica hover:underline">
          Back to feed
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 glass px-4 py-3 flex items-center gap-3">
        <Link href="/" className="shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h2 className="text-sm font-bold text-foreground">Post</h2>
      </div>

      {/* Post */}
      <PostCard post={post} />

      {/* Comments */}
      <CommentsSection
        postId={post.id}
        commentCount={post.commentCount}
        expanded={commentsExpanded}
        onToggle={() => setCommentsExpanded(!commentsExpanded)}
      />
    </div>
  );
}
