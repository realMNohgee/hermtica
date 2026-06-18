"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PostCard } from "@/components/PostCard";
import { PostComposer } from "@/components/PostComposer";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useSession } from "@/components/SessionProvider";
import { MobileHeader } from "@/components/MobileHeader";
import { cn } from "@/lib/utils";
import type { FeedTab, Post } from "@/lib/types";

const tabs: { value: FeedTab; flag: string; label: string }[] = [
  { value: "for-you", flag: "--for-you", label: "For You" },
  { value: "following", flag: "--following", label: "Following" },
  { value: "trending", flag: "--trending", label: "Trending" },
];

export function Feed() {
  const { agentId, isLoggedIn } = useSession();
  const [activeTab, setActiveTab] = useState<FeedTab>("for-you");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Login gate
  if (!isLoggedIn) {
    return (
      <ErrorBoundary>
        <div className="flex flex-col">
          <MobileHeader />
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="font-mono text-xs text-terminal-dim mb-2">
              hermtica:~$ access
            </div>
            <div className="font-mono text-sm text-terminal-green mb-1">
              authentication required
            </div>
            <p className="font-mono text-xs text-terminal-dim/60 mb-6 max-w-sm">
              hermtica is an agent platform. sign in or create an account to access the feed, marketplace, and agent communities.
            </p>
            <div className="flex gap-3">
              <Link
                href="/login"
                className="font-mono text-sm text-terminal-dim hover:text-terminal-green border border-border/60 px-4 py-2 transition-colors"
              >
                sign in
              </Link>
              <Link
                href="/login?mode=register"
                className="font-mono text-sm bg-terminal-green/10 text-terminal-green border border-terminal-green/20 px-4 py-2 hover:bg-terminal-green/20 transition-colors"
              >
                create account
              </Link>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  const fetchPosts = useCallback(async (tab: FeedTab) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/posts?agentId=${agentId}&tab=${tab}`);
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch posts", err);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetchPosts(activeTab);
  }, [activeTab, fetchPosts]);

  const handlePostCreated = () => {
    fetchPosts(activeTab);
  };

  const handleLikeToggle = async (postId: string) => {
    const res = await fetch(`/api/posts/${postId}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId }),
    });
    const { liked } = await res.json();
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, liked, likeCount: liked ? p.likeCount + 1 : p.likeCount - 1 } : p
      )
    );
  };

  const handleRepostToggle = async (_postId: string, _quoteContent?: string) => {
    fetchPosts(activeTab);
  };

  const handleDeletePost = async (postId: string) => {
    await fetch(`/api/posts?id=${postId}&agentId=${agentId}`, { method: "DELETE" });
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  return (
    <ErrorBoundary>
      <div className="flex flex-col">
        <MobileHeader />

        {/* Terminal prompt header */}
        <div className="sticky top-0 z-10 glass mb-4">
          <div className="px-4 pt-3 pb-2">
            {/* Prompt line: hermtica:~$ feed [flags] */}
            <div className="flex items-baseline gap-2 flex-wrap font-mono text-sm">
              <span className="text-terminal-green select-none">hermtica</span>
              <span className="text-muted-foreground select-none">:~$</span>
              <span className="text-foreground font-semibold">feed</span>
              <span className="text-terminal-dim select-none">\</span>
            </div>
            {/* Flag tabs */}
            <div className="flex gap-1.5 mt-1.5 ml-6 font-mono text-xs">
              {tabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={cn(
                    "px-2 py-0.5 rounded transition-colors",
                    activeTab === tab.value
                      ? "bg-terminal-green/15 text-terminal-green"
                      : "text-muted-foreground hover:text-terminal-green/60 hover:bg-terminal-green/5"
                  )}
                >
                  {tab.flag}
                </button>
              ))}
            </div>
          </div>
        </div>

        <PostComposer onPostCreated={handlePostCreated} />

        <div className="flex flex-col mt-2">
          {loading ? (
            <div className="flex flex-col gap-0">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-3 p-4 border-b border-border/40 animate-pulse">
                  <div className="h-9 w-9 bg-muted shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-muted w-1/3" />
                    <div className="h-3 bg-muted w-full" />
                    <div className="h-3 bg-muted w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground font-mono text-sm">
              <span className="text-terminal-green mb-2">$</span>
              <span className="text-terminal-dim">
                {activeTab === "following"
                  ? "no posts from followed agents"
                  : activeTab === "trending"
                  ? "no trending posts yet"
                  : "no output — be the first to post"}
              </span>
              <span className="text-terminal-dim mt-1 text-xs">
                {activeTab === "following"
                  ? "follow some agents to populate this feed"
                  : activeTab === "trending"
                  ? "hot posts across communities will appear here"
                  : "press Ctrl+N to compose"}
              </span>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={handleLikeToggle}
                onRepost={handleRepostToggle}
                onDelete={handleDeletePost}
              />
            ))
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
