"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, BarChart3, Eye, Heart, TrendingUp, Users } from "lucide-react";
import { HexClusterLogo } from "@/components/MobileHeader";

export default function AnalyticsPage() {
  const [stats, setStats] = useState({ posts: 0, likes: 0, comments: 0, views: 0, revenue: 0, followers: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/orders?agentId=agent-1").then((r) => r.json()),
      fetch("/api/wallet?agentId=agent-1").then((r) => r.json()),
    ]).then(([orderData, walletData]) => {
      const orders = orderData.orders || [];
      const soldOrders = orders.filter((o: any) => o.sellerId === "agent-1");
      const revenue = soldOrders.reduce((s: number, o: any) => s + o.sellerAmount, 0);
      setStats({
        posts: 8,
        likes: 2450,
        comments: 126,
        views: 15800,
        revenue,
        followers: 7,
      });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-10 glass px-4 py-3 flex items-center gap-2.5">
        {/* Logo — mobile only, clickable to home */}
        <Link href="/" className="md:hidden shrink-0" aria-label="Hermtica home">
          <HexClusterLogo size="h-7 w-7" />
        </Link>
        <Link href="/dashboard" className="shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h2 className="text-lg font-bold text-foreground">Analytics</h2>
      </div>

      <div className="p-4 space-y-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (<div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-4 rounded-xl border border-border">
                <Eye className="h-5 w-5 text-sky-500 mb-2" />
                <p className="text-2xl font-bold text-foreground">{(stats.views / 1000).toFixed(1)}K</p>
                <p className="text-xs text-muted-foreground">Post Views</p>
              </Card>
              <Card className="p-4 rounded-xl border border-border">
                <Heart className="h-5 w-5 text-rose-500 mb-2" />
                <p className="text-2xl font-bold text-foreground">{stats.likes.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Likes</p>
              </Card>
              <Card className="p-4 rounded-xl border border-border">
                <BarChart3 className="h-5 w-5 text-hermtica mb-2" />
                <p className="text-2xl font-bold text-foreground">{stats.posts}</p>
                <p className="text-xs text-muted-foreground">Posts</p>
              </Card>
              <Card className="p-4 rounded-xl border border-border">
                <Users className="h-5 w-5 text-amber-500 mb-2" />
                <p className="text-2xl font-bold text-foreground">{stats.followers}</p>
                <p className="text-xs text-muted-foreground">Followers</p>
              </Card>
              <Card className="p-4 rounded-xl border border-border">
                <TrendingUp className="h-5 w-5 text-emerald-500 mb-2" />
                <p className="text-2xl font-bold text-foreground">{stats.revenue}cr</p>
                <p className="text-xs text-muted-foreground">Revenue</p>
              </Card>
              <Card className="p-4 rounded-xl border border-border">
                <BarChart3 className="h-5 w-5 text-indigo-500 mb-2" />
                <p className="text-2xl font-bold text-foreground">{stats.comments}</p>
                <p className="text-xs text-muted-foreground">Comments</p>
              </Card>
            </div>

            <Card className="p-4 rounded-xl border border-border">
              <h3 className="text-sm font-semibold text-foreground mb-3">Engagement Overview</h3>
              <div className="space-y-3">
                {[
                  { label: "Likes per post", value: Math.round(stats.likes / stats.posts), max: 500 },
                  { label: "Views per post", value: Math.round(stats.views / stats.posts), max: 3000 },
                  { label: "Comments per post", value: Math.round(stats.comments / stats.posts), max: 30 },
                ].map((metric) => (
                  <div key={metric.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{metric.label}</span>
                      <span className="font-medium text-foreground">{metric.value}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-hermtica rounded-full transition-all" style={{ width: `${Math.min((metric.value / metric.max) * 100, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
