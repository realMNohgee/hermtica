"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Clock, Eye, User } from "lucide-react";
import { HexClusterLogo } from "@/components/MobileHeader";

interface Article {
  id: string;
  title: string;
  content: string;
  tag: string;
  readCount: number;
  createdAt: string;
  authorName: string;
  authorHandle: string;
  authorVerified: boolean;
}

export default function ArticlePage() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/articles?id=${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) return;
        setArticle(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col max-w-[720px] mx-auto p-4">
        <div className="h-8 bg-muted/30 w-32 mb-6 animate-pulse" />
        <div className="h-6 bg-muted/30 w-3/4 mb-2 animate-pulse" />
        <div className="h-4 bg-muted/30 w-1/2 mb-8 animate-pulse" />
        <div className="space-y-2">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="h-4 bg-muted/20 animate-pulse" style={{ width: `${80 + Math.random() * 20}%` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] font-mono text-sm text-terminal-dim">
        <span className="text-terminal-green mb-2">$</span>
        <span>article not found</span>
        <Link href="/" className="text-terminal-cyan hover:underline mt-4">~/feed</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col max-w-[720px] mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 glass px-4 py-3 flex items-center gap-2.5">
        <Link href="/" className="md:hidden shrink-0">
          <HexClusterLogo size="h-7 w-7" />
        </Link>
        <Link href="/" className="shrink-0 flex items-center gap-1.5 font-mono text-xs text-terminal-dim hover:text-terminal-green">
          <ArrowLeft className="h-4 w-4" />
          back
        </Link>
      </div>

      <div className="px-4 md:px-8 py-6">
        {/* Tag */}
        {article.tag && (
          <span className="font-mono text-[10px] text-terminal-cyan/70 bg-terminal-cyan/5 px-2 py-0.5 mb-3 inline-block">
            {article.tag}
          </span>
        )}

        {/* Title */}
        <h1 className="text-xl md:text-2xl font-bold text-foreground font-mono leading-tight mb-3">
          {article.title}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-3 font-mono text-[11px] text-terminal-dim mb-8">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <Link href={`/${article.authorHandle?.replace("@", "")}`} className="text-terminal-green/70 hover:text-terminal-green">
              {article.authorName}
            </Link>
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {new Date(article.createdAt).toLocaleDateString()}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {article.readCount}
          </span>
        </div>

        {/* Content */}
        <article className="prose prose-invert max-w-none font-mono text-sm leading-relaxed text-foreground/85 whitespace-pre-wrap">
          {article.content}
        </article>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-border/40 font-mono text-[10px] text-terminal-dim/40">
          published on hermtica · terminal edition
        </div>
      </div>
    </div>
  );
}
