"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { ArrowLeft, ExternalLink, Search, ShoppingBag, Sparkles, Star, Zap, ArrowUpDown, X } from "lucide-react";
import { creditsToUSD } from "@/lib/stripe";
import { HexClusterLogo } from "@/components/MobileHeader";

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
  createdAt?: string;
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

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "name-asc", label: "Name A–Z" },
  { value: "name-desc", label: "Name Z–A" },
  { value: "rating", label: "Rating ↑" },
  { value: "downloads", label: "Most Downloaded" },
  { value: "featured", label: "Featured First" },
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

export function MarketplaceClient({ initialServices }: { initialServices: Service[] }) {
  const [category, setCategory] = useState("all");
  const [showFreeOnly, setShowFreeOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const services = initialServices || [];

  // Filter + search + sort
  const filtered = useMemo(() => {
    let result = [...services];

    // Category filter
    if (category !== "all") {
      result = result.filter((s) => s.category === category);
    }

    // Free only
    if (showFreeOnly) {
      result = result.filter((s) => s.price === 0);
    }

    // Search — match title or description
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sortBy) {
      case "newest":
        result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        break;
      case "name-asc":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "name-desc":
        result.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case "rating":
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "downloads":
        result.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
        break;
      case "featured":
        result.sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        });
        break;
    }

    return result;
  }, [services, category, showFreeOnly, searchQuery, sortBy]);

  const freeCount = services.filter((s) => s.price === 0).length;
  const paidCount = services.filter((s) => s.price > 0).length;

  // Active filters count for badge
  const activeFilterCount = [
    category !== "all",
    showFreeOnly,
    searchQuery.trim() !== "",
    sortBy !== "newest",
  ].filter(Boolean).length;

  const clearAll = () => {
    setCategory("all");
    setShowFreeOnly(false);
    setSearchQuery("");
    setSortBy("newest");
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 glass px-4 py-3 flex items-center gap-2.5">
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

      {/* Search + Sort bar */}
      <div className="border-b border-border px-4 py-2.5 flex items-center gap-2.5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tools…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-muted/50 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-hermtica/50 transition-colors"
          />
        </div>
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="appearance-none pl-3 pr-8 py-1.5 rounded-lg bg-muted/50 border border-border text-xs text-foreground cursor-pointer focus:outline-none focus:border-hermtica/50 transition-colors"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ArrowUpDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={clearAll}
            className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 shrink-0 transition-colors"
          >
            <X className="h-3 w-3" />
            Clear ({activeFilterCount})
          </button>
        )}
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

      {/* Results count + active filters */}
      <div className="px-4 pt-3 flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </span>
        {category !== "all" && (
          <Badge variant="outline" className="text-[10px] gap-1">
            {categories.find((c) => c.value === category)?.label || category}
            <X className="h-2.5 w-2.5 cursor-pointer" onClick={() => setCategory("all")} />
          </Badge>
        )}
        {showFreeOnly && (
          <Badge variant="outline" className="text-[10px] gap-1 bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
            Free only
            <X className="h-2.5 w-2.5 cursor-pointer" onClick={() => setShowFreeOnly(false)} />
          </Badge>
        )}
        {searchQuery.trim() && (
          <Badge variant="outline" className="text-[10px] gap-1">
            &ldquo;{searchQuery}&rdquo;
            <X className="h-2.5 w-2.5 cursor-pointer" onClick={() => setSearchQuery("")} />
          </Badge>
        )}
      </div>

      {/* Services grid */}
      <div className="p-4">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No tools found. Try a different search or category.</p>
            {activeFilterCount > 0 && (
              <button onClick={clearAll} className="text-xs text-hermtica hover:underline mt-2">
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((service) => (
              <Link
                key={service.id}
                href={service.price === 0 && service.githubUrl ? service.githubUrl : `/marketplace/${service.id}`}
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
