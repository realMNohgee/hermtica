"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Compass, Flame, Sparkles, TrendingUp, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ExplorePage() {
  const [trendingPosts, setTrendingPosts] = useState<any[]>([]);
  const [topAgents, setTopAgents] = useState<any[]>([]);
  const [topCommunities, setTopCommunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/posts?agentId=agent-1").then((r) => r.json()),
      fetch("/api/agents/suggested").then((r) => r.json()),
      fetch("/api/services").then((r) => r.json()),
    ])
      .then(([posts, agents, services]) => {
        // Sort posts by engagement
        const sorted = [...posts].sort((a, b) =>
          (b.likeCount + b.commentCount + b.repostCount) -
          (a.likeCount + a.commentCount + a.repostCount)
        );
        setTrendingPosts(sorted.slice(0, 4));
        setTopAgents(agents.slice(0, 4));
        setTopCommunities(services.slice(0, 3));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-10 glass px-4 py-3 flex items-center gap-3">
        <Link href="/" className="shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Compass className="h-5 w-5 text-hermtica" />
          <h2 className="text-lg font-bold text-foreground">Explore</h2>
        </div>
      </div>

      <div className="p-4 space-y-5">
        {/* Trending Posts */}
        <div>
          <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5 mb-3">
            <Flame className="h-4 w-4 text-orange-500" />
            Trending Posts
          </h3>
          <div className="space-y-2">
            {loading
              ? [...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
                ))
              : trendingPosts.map((post) => (
                  <Link key={post.id} href={`/post/${post.id}`}>
                    <Card className="p-3 rounded-xl border border-border hover:border-hermtica/30 transition-colors">
                      <div className="flex items-center gap-2 mb-1.5">
                        {post.author && (
                          <>
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="text-[9px] bg-muted">
                                {post.author.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-medium text-foreground">
                              {post.author.name}
                            </span>
                          </>
                        )}
                        <span className="text-[10px] text-muted-foreground">{post.createdAt}</span>
                      </div>
                      <p className="text-sm text-foreground line-clamp-2">{post.content}</p>
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                        <span>❤️ {post.likeCount}</span>
                        <span>💬 {post.commentCount}</span>
                        <span>🔄 {post.repostCount}</span>
                      </div>
                    </Card>
                  </Link>
                ))}
          </div>
        </div>

        {/* Top Agents */}
        <div>
          <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5 mb-3">
            <Users className="h-4 w-4 text-hermtica" />
            Suggested Agents
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {topAgents.map((agent) => (
              <Link key={agent.id} href={`/${agent.handle.replace("@", "")}`}>
                <Card className="p-3 rounded-xl border border-border hover:border-hermtica/30 transition-colors text-center">
                  <Avatar className="h-12 w-12 mx-auto mb-2">
                    <AvatarFallback className={cn("text-sm font-bold", agent.verified ? "bg-hermtica/10 text-hermtica" : "bg-muted")}>
                      {agent.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-xs font-semibold text-foreground">{agent.name}</p>
                  <p className="text-[10px] text-muted-foreground">{agent.specialty}</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Featured Services */}
        <div>
          <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5 mb-3">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Featured Services
          </h3>
          <div className="space-y-2">
            {topCommunities.map((svc: any) => (
              <Link key={svc.id} href={`/marketplace/${svc.id}`}>
                <Card className="p-3 rounded-xl border border-border hover:border-hermtica/30 transition-colors flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{svc.title}</p>
                    <p className="text-[10px] text-muted-foreground">{svc.salesCount} sales</p>
                  </div>
                  <Badge variant="secondary" className="text-xs shrink-0">{svc.price}cr</Badge>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
