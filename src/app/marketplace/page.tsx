"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { ArrowLeft, ExternalLink, GitFork, Search, ShoppingBag, Sparkles, Star, Zap } from "lucide-react";
import { creditsToUSD } from "@/lib/stripe";
import { HexClusterLogo } from "@/components/MobileHeader";

// Simple GitHub icon SVG
const GithubIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
);

interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  rating: number;
  salesCount: number;
  featured: boolean;
  githubUrl?: string;
  seller: { name: string; handle: string; verified: boolean } | null;
}

const categories = [
  { value: "all", label: "All", icon: "🛒" },
  { value: "tool", label: "Tools", icon: "🔧" },
  { value: "automation", label: "Automation", icon: "⚡" },
  { value: "consulting", label: "Consulting", icon: "💡" },
  { value: "data", label: "Data", icon: "📊" },
  { value: "identity", label: "Identity", icon: "🪪" },
  { value: "security", label: "Security", icon: "🔒" },
  { value: "media", label: "Media", icon: "🎨" },
  { value: "finance", label: "Finance", icon: "💰" },
];

const categoryColors: Record<string, string> = {
  tool: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  automation: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  consulting: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  data: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  identity: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  security: "bg-red-500/10 text-red-500 border-red-500/20",
  media: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  finance: "bg-green-500/10 text-green-500 border-green-500/20",
};

export default function MarketplacePage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [showFreeOnly, setShowFreeOnly] = useState(false);

  useEffect(() => {
    setLoading(true);
    const params = category !== "all" ? `?category=${category}` : "";
    fetch(`/api/services${params}`)
      .then((r) => r.json())
      .then(setServices)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [category]);

  const filtered = showFreeOnly ? services.filter((s) => s.price === 0) : services;
  const freeCount = services.filter((s) => s.price === 0).length;
  const paidCount = services.filter((s) => s.price > 0).length;

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
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-hermtica" />
          <h2 className="text-lg font-bold text-foreground">Marketplace</h2>
          <Badge className="bg-hermtica/10 text-hermtica text-[10px] border-hermtica/20">
            {paidCount} paid · {freeCount} free
          </Badge>
        </div>
        <div className="flex-1" />
        <button
          onClick={() => setShowFreeOnly(!showFreeOnly)}
          className={cn(
            "text-xs px-2 py-1 rounded-full transition-colors flex items-center gap-1",
            showFreeOnly
              ? "bg-emerald-500/10 text-emerald-500 font-medium"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Zap className="h-3 w-3" />
          Free / OSS
        </button>
        <Link href="/marketplace/create">
          <Button variant="ghost" size="sm" className="text-xs text-hermtica hover:text-hermtica/80 font-medium">
            + Create Listing
          </Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">
            Dashboard
          </Button>
        </Link>
      </div>

      {/* Category tabs */}
      <div className="border-b border-border px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1",
              category === cat.value
                ? "bg-hermtica text-white"
                : "bg-muted text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            <span>{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Services grid */}
      <div className="p-4">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-xl border border-border p-4 animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-2/3" />
                <div className="h-8 bg-muted rounded w-24" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No services found in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((service) => (
              <Link key={service.id} href={service.price === 0 && service.githubUrl ? service.githubUrl : `/marketplace/${service.id}`}
                target={service.price === 0 && service.githubUrl ? "_blank" : undefined}
              >
                <Card className="p-4 rounded-xl border border-border hover:border-hermtica/30 hover:shadow-sm transition-all cursor-pointer h-full flex flex-col">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {service.seller && (
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[10px] bg-muted">
                            {service.seller.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {service.seller?.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {service.price === 0 && (
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] gap-1">
                          <Zap className="h-2.5 w-2.5" />
                          FREE
                        </Badge>
                      )}
                      {service.featured && (
                        <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px] gap-1">
                          <Sparkles className="h-2.5 w-2.5" />
                          Featured
                        </Badge>
                      )}
                    </div>
                  </div>

                  <h3 className="font-semibold text-sm text-foreground mb-1">
                    {service.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1">
                    {service.description}
                  </p>

                  {/* GitHub link for free tools */}
                  {service.githubUrl && (
                    <a
                      href={service.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors mb-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <GithubIcon className="h-3 w-3" />
                      {service.githubUrl.replace("https://github.com/", "")}
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}

                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          categoryColors[service.category] || "bg-muted"
                        )}
                      >
                        {service.category}
                      </Badge>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                        {service.rating}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {service.price === 0 ? (
                        <span className="text-sm font-bold text-emerald-500">Free</span>
                      ) : (
                        <>
                          <span className="text-lg font-bold text-foreground">
                            {creditsToUSD(service.price)}
                          </span>
                          <span className="text-xs text-muted-foreground">USD</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-[10px] text-muted-foreground mt-2">
                    {service.salesCount} {service.price === 0 ? "downloads" : "sales"}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
