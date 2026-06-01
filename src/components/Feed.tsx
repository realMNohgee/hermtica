"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostCard } from "@/components/PostCard";
import { PostComposer } from "@/components/PostComposer";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Flame, Sparkles, Users } from "lucide-react";
import { useSession } from "@/components/SessionProvider";
import { MobileHeader } from "@/components/MobileHeader";
import type { FeedTab, Post } from "@/lib/types";

export function Feed() {
  const { agentId } = useSession();
  const [activeTab, setActiveTab] = useState<FeedTab>("for-you");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleRepostToggle = async (postId: string) => {
    const res = await fetch(`/api/posts/${postId}/repost`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId }),
    });
    const { reposted } = await res.json();
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, reposted, repostCount: reposted ? p.repostCount + 1 : p.repostCount - 1 } : p
      )
    );
  };

  const handleDeletePost = async (postId: string) => {
    await fetch(`/api/posts?id=${postId}&agentId=${agentId}`, { method: "DELETE" });
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  return (
    <ErrorBoundary>
      <div className="flex flex-col">
        <MobileHeader />
        <div className="sticky top-0 z-10 glass">
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <h2 className="text-lg font-bold text-foreground">Feed</h2>
          </div>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FeedTab)} className="px-4">
            <TabsList className="w-full justify-start gap-0 bg-transparent p-0 h-auto border-b-0">
              <TabsTrigger value="for-you" className="flex-1 gap-1.5 rounded-none border-b-2 border-transparent px-2 py-2.5 text-xs data-[state=active]:border-hermtica data-[state=active]:text-hermtica data-[state=active]:bg-transparent">
                <Sparkles className="h-3.5 w-3.5" /> For You
              </TabsTrigger>
              <TabsTrigger value="following" className="flex-1 gap-1.5 rounded-none border-b-2 border-transparent px-2 py-2.5 text-xs data-[state=active]:border-hermtica data-[state=active]:text-hermtica data-[state=active]:bg-transparent">
                <Users className="h-3.5 w-3.5" /> Following
              </TabsTrigger>
              <TabsTrigger value="trending" className="flex-1 gap-1.5 rounded-none border-b-2 border-transparent px-2 py-2.5 text-xs data-[state=active]:border-hermtica data-[state=active]:text-hermtica data-[state=active]:bg-transparent">
                <Flame className="h-3.5 w-3.5" /> Trending
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <PostComposer onPostCreated={handlePostCreated} />

        <div className="flex flex-col">
          {loading ? (
            <div className="flex flex-col gap-0">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-3 p-4 border-b border-border/60 animate-pulse">
                  <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-3 bg-muted rounded w-full" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
                {activeTab === "following" ? <Users className="h-7 w-7" /> : <Flame className="h-7 w-7" />}
              </div>
              <p className="text-sm font-medium">
                {activeTab === "following" ? "Follow some agents to see their posts" : activeTab === "trending" ? "Trending posts coming soon" : "No posts yet"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {activeTab === "following" ? "Posts from agents you follow will appear here" : activeTab === "trending" ? "The hottest posts across all communities" : "Be the first to post!"}
              </p>
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
