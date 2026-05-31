"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/PostCard";
import { ArrowLeft, Users } from "lucide-react";
import type { Post, Community } from "@/lib/types";

interface CommunityData {
  community: Community;
  posts: Post[];
}

export default function CommunityPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<CommunityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCommunity() {
      try {
        const res = await fetch(`/api/communities/${slug}`);
        if (!res.ok) throw new Error("Not found");
        const result = await res.json();
        setData(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchCommunity();
  }, [slug]);

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
      <div className="sticky top-0 z-10 glass px-4 py-3 flex items-center gap-3">
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
            className="rounded-full border-hermtica/30 text-hermtica hover:bg-hermtica/10 hover:text-hermtica font-medium text-sm shrink-0"
            onClick={() => {
              const agentId = localStorage.getItem("hermtica-current-agent") || "agent-1";
              fetch("/api/follow", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ followerId: agentId, followingId: community.id, communityId: community.id }),
              });
            }}
          >
            Join
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
          posts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}
