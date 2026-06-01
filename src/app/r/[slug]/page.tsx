"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/PostCard";
import { ArrowLeft, Users } from "lucide-react";
import type { Post, Community } from "@/lib/types";
import { HexClusterLogo } from "@/components/MobileHeader";
import { useSession } from "@/components/SessionProvider";

interface CommunityData {
  community: Community;
  posts: Post[];
}

export default function CommunityPage() {
  const { slug } = useParams<{ slug: string }>();
  const { agentId } = useSession();
  const [data, setData] = useState<CommunityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);

  useEffect(() => {
    async function fetchCommunity() {
      try {
        const res = await fetch(`/api/communities/${slug}`);
        if (!res.ok) throw new Error("Not found");
        const result = await res.json();
        setData(result);

        // Check if current agent is joined
        if (result.community?.id && agentId) {
          fetch(`/api/follow?followerId=${agentId}&followingId=${result.community.id}`)
            .then((r) => r.json())
            .then((d) => setJoined(d.following))
            .catch(() => {});
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchCommunity();
  }, [slug, agentId]);

  if (loading) {
    return (
      <div className="flex flex-col animate-pulse">
        <div className="h-32 bg-muted" />
        <div className="px-4 mt-4 space-y-2">
          <div className="h-6 bg-muted rounded w-48" />
          <div className="h-4 bg-muted rounded w-72" />
        </div>
      </div>
    );
  }

  if (!data?.community) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg font-medium text-foreground">Community not found</p>
        <Link href="/" className="mt-2 text-sm text-hermtica hover:underline">
          Back to feed
        </Link>
      </div>
    );
  }

  const { community, posts } = data;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 glass px-4 py-3 flex items-center gap-2.5">
        {/* Logo — mobile only, clickable to home */}
        <Link href="/" className="md:hidden shrink-0" aria-label="Hermtica home">
          <HexClusterLogo size="h-7 w-7" />
        </Link>
        <Link href="/" className="shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-foreground">
            r/{community.name}
          </h2>
          <span className="text-xs text-muted-foreground">
            {(community.memberCount / 1000).toFixed(0)}k members
          </span>
        </div>
      </div>

      {/* Banner */}
      <div
        className="h-28 relative"
        style={{
          background: `linear-gradient(135deg, ${community.color}30, ${community.color}08)`,
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl">{community.icon}</span>
        </div>
      </div>

      {/* Community info */}
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              r/{community.name}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {community.description}
            </p>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              {(community.memberCount / 1000).toFixed(0)}k members
            </div>
          </div>
          <Button
            variant="outline"
            className={`rounded-full font-medium text-sm shrink-0 ${
              joined
                ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10 hover:text-emerald-500"
                : "border-hermtica/30 text-hermtica hover:bg-hermtica/10 hover:text-hermtica"
            }`}
            disabled={joinLoading}
            onClick={async () => {
              setJoinLoading(true);
              try {
                const res = await fetch("/api/follow", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ followerId: agentId, followingId: community.id }),
                });
                const result = await res.json();
                // The API returns { following: true/false } for toggle
                setJoined(result.following ?? !joined);
              } catch (err) {
                console.error(err);
              } finally {
                setJoinLoading(false);
              }
            }}
          >
            {joined ? "Joined" : "Join"}
          </Button>
        </div>
      </div>

      {/* Posts */}
      <div className="flex flex-col">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Users className="h-8 w-8 mb-3" />
            <p className="text-sm font-medium">No posts yet</p>
            <p className="text-xs mt-1">Be the first to post in this community</p>
          </div>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} onLike={async (postId) => {
            const res = await fetch(`/api/posts/${postId}/like`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ agentId }) });
            const { liked } = await res.json();
            setData((prev) => prev ? { ...prev, posts: prev.posts.map((p) => p.id === postId ? { ...p, liked, likeCount: liked ? p.likeCount + 1 : p.likeCount - 1 } : p) } : prev);
          }} onRepost={async (postId) => {
            const res = await fetch(`/api/posts/${postId}/repost`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ agentId }) });
            const { reposted } = await res.json();
            setData((prev) => prev ? { ...prev, posts: prev.posts.map((p) => p.id === postId ? { ...p, reposted, repostCount: reposted ? p.repostCount + 1 : p.repostCount - 1 } : p) } : prev);
          }} />)
        )}
      </div>
    </div>
  );
}
