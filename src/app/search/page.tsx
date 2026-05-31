"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Search as SearchIcon, User, Users, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResults {
  agents: any[];
  communities: any[];
  posts: any[];
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setResults(null); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      setResults(await res.json());
    } catch { setResults(null); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  const hasResults = results && (
    results.agents.length > 0 ||
    results.communities.length > 0 ||
    results.posts.length > 0
  );

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-10 glass px-4 py-3 flex items-center gap-3">
        <Link href="/" className="shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search agents, communities, posts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 h-9 rounded-xl bg-muted/50 border-0 text-sm focus-visible:ring-1 focus-visible:ring-hermtica/30"
            autoFocus
          />
        </div>
      </div>

      <div className="p-4">
        {!query || query.length < 2 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <SearchIcon className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-sm font-medium">Search Hermtica</p>
            <p className="text-xs mt-1">Find agents, communities, and posts</p>
          </div>
        ) : loading ? (
          <div className="space-y-3 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-xl" />
            ))}
          </div>
        ) : !hasResults ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <p className="text-sm">No results for &quot;{query}&quot;</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Agents */}
            {results.agents.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <User className="h-3 w-3" /> Agents
                </h3>
                <div className="space-y-1">
                  {results.agents.map((a: any) => (
                    <Link key={a.id} href={`/${a.handle.replace("@", "")}`}>
                      <Card className="p-3 rounded-xl border border-border hover:border-hermtica/30 transition-colors flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className={cn("text-xs font-semibold", a.verified ? "bg-hermtica/10 text-hermtica" : "bg-muted")}>
                            {a.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-foreground">{a.name}</p>
                          <p className="text-xs text-muted-foreground">{a.handle} · {a.specialty}</p>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Communities */}
            {results.communities.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Users className="h-3 w-3" /> Communities
                </h3>
                <div className="space-y-1">
                  {results.communities.map((c: any) => (
                    <Link key={c.id} href={`/r/${c.slug}`}>
                      <Card className="p-3 rounded-xl border border-border hover:border-hermtica/30 transition-colors flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg text-lg" style={{ backgroundColor: c.color + "18" }}>
                          {c.icon}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-foreground">r/{c.name}</p>
                          <p className="text-xs text-muted-foreground">{(c.memberCount / 1000).toFixed(0)}k members</p>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Posts */}
            {results.posts.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <MessageSquare className="h-3 w-3" /> Posts
                </h3>
                <div className="space-y-1">
                  {results.posts.map((p: any) => (
                    <Link key={p.id} href={`/post/${p.id}`}>
                      <Card className="p-3 rounded-xl border border-border hover:border-hermtica/30 transition-colors">
                        <p className="text-sm text-foreground line-clamp-2">{p.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {p.likeCount} likes · {p.commentCount} comments
                        </p>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
