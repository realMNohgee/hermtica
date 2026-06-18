"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight, Cpu, Newspaper, TrendingUp, Zap } from "lucide-react";

interface Tool {
  id: string;
  title: string;
  price: number;
  salesCount: number;
  rating: number;
  category: string;
}

interface Article {
  id: string;
  title: string;
  authorName: string;
  tag: string;
  createdAt: string;
}

export function LeftPanel() {
  const [activeTab, setActiveTab] = useState<"tools" | "news">("news");
  const [tools, setTools] = useState<Tool[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch trending tools
    fetch("/api/services")
      .then(r => r.json())
      .then(data => {
        const svcs = data?.services || data || [];
        const sorted = [...svcs].sort((a: any, b: any) => b.salesCount - a.salesCount);
        setTools(sorted.slice(0, 8));
      })
      .catch(() => {});

    // Fetch articles
    fetch("/api/articles")
      .then(r => r.json())
      .then(data => {
        setArticles(Array.isArray(data) ? data.slice(0, 6) : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <aside className="hidden xl:flex w-[260px] shrink-0 border-r border-border/60 bg-card/40 flex-col overflow-y-auto">
      {/* Tab bar */}
      <div className="flex border-b border-border/60 font-mono text-[11px]">
        <button
          onClick={() => setActiveTab("tools")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 transition-colors ${
            activeTab === "tools"
              ? "text-terminal-green border-b border-terminal-green bg-terminal-green/[0.03]"
              : "text-terminal-dim hover:text-terminal-green/60"
          }`}
        >
          <TrendingUp className="h-3 w-3" />
          trending
        </button>
        <button
          onClick={() => setActiveTab("news")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 transition-colors ${
            activeTab === "news"
              ? "text-terminal-cyan border-b border-terminal-cyan bg-terminal-cyan/[0.03]"
              : "text-terminal-dim hover:text-terminal-cyan/60"
          }`}
        >
          <Newspaper className="h-3 w-3" />
          news
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === "tools" ? (
          <div className="space-y-1">
            <div className="font-mono text-[10px] text-terminal-dim/60 uppercase tracking-wide mb-2 px-1">
              Trending Tools
            </div>
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-muted/30 animate-pulse" />
                ))}
              </div>
            ) : (
              tools.map((tool, i) => (
                <Link
                  key={tool.id}
                  href={`/marketplace/${tool.id}`}
                  className="flex items-start gap-2 p-2 hover:bg-terminal-green/[0.03] transition-colors group border border-transparent hover:border-border/40"
                >
                  <span className="font-mono text-[10px] text-terminal-dim/40 w-4 shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-[11px] font-mono text-foreground/80 group-hover:text-terminal-green truncate leading-tight">
                        {tool.title}
                      </span>
                      <ArrowUpRight className="h-3 w-3 text-terminal-dim/30 group-hover:text-terminal-green shrink-0 mt-0.5" />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-[9px] text-terminal-dim/50">
                        {tool.salesCount.toLocaleString()} sales
                      </span>
                      <span className="font-mono text-[9px] text-terminal-amber/60">
                        {tool.price === 0 ? "free" : `${tool.price}cr`}
                      </span>
                      {tool.rating > 0 && (
                        <span className="font-mono text-[9px] text-terminal-amber/60">
                          {"★".repeat(tool.rating)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            )}
            <Link
              href="/marketplace"
              className="block font-mono text-[10px] text-terminal-cyan/60 hover:text-terminal-cyan text-center pt-2 pb-1"
            >
              view all 38 tools →
            </Link>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="font-mono text-[10px] text-terminal-dim/60 uppercase tracking-wide mb-2 px-1">
              AI News
            </div>
            {loading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-14 bg-muted/30 animate-pulse" />
                ))}
              </div>
            ) : articles.length === 0 ? (
              <div className="text-center py-8 font-mono text-[10px] text-terminal-dim/50">
                <Newspaper className="h-4 w-4 mx-auto mb-1 opacity-30" />
                no articles yet
                <br />
                <Link href="/articles/new" className="text-terminal-cyan/60 hover:text-terminal-cyan">
                  write the first →
                </Link>
              </div>
            ) : (
              articles.map((article, i) => (
                <Link
                  key={article.id}
                  href={`/articles/${article.id}`}
                  className="block p-2 hover:bg-terminal-cyan/[0.03] transition-colors group border border-transparent hover:border-border/40"
                >
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-[10px] text-terminal-dim/40 w-4 shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-mono text-foreground/80 group-hover:text-terminal-cyan leading-tight line-clamp-2">
                        {article.title}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[9px] text-terminal-dim/50">
                          {article.authorName}
                        </span>
                        {article.tag && (
                          <span className="font-mono text-[9px] text-terminal-cyan/50 bg-terminal-cyan/5 px-1">
                            {article.tag}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
            <Link
              href="/articles"
              className="block font-mono text-[10px] text-terminal-cyan/60 hover:text-terminal-cyan text-center pt-2 pb-1"
            >
              all articles →
            </Link>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="font-mono text-[9px] text-terminal-dim/30 px-3 py-2 border-t border-border/40 flex items-center justify-between">
        <span>hermtica v0.2</span>
        <span className="flex items-center gap-1">
          <Cpu className="h-2.5 w-2.5" />
          terminal
        </span>
      </div>
    </aside>
  );
}
