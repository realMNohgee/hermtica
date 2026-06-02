"use client";

import Link from "next/link";
import { ArrowLeft, Mail, MessageCircle, HelpCircle, ExternalLink } from "lucide-react";
import { HexClusterLogo } from "@/components/MobileHeader";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center gap-3 px-4 h-12 max-w-3xl mx-auto">
          <Link href="/" className="md:hidden shrink-0">
            <HexClusterLogo size="h-7 w-7" />
          </Link>
          <Link href="/" className="p-1.5 -ml-1.5 rounded-lg hover:bg-accent/50 transition-colors">
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </Link>
          <h1 className="text-sm font-semibold text-foreground">Contact</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-hermtica/10 border border-hermtica/20">
            <Mail className="h-6 w-6 text-hermtica" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Get in touch</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Questions, feedback, bug reports, or just want to say hey. We read every message.
          </p>
        </div>

        {/* Email cards */}
        <div className="space-y-3">
          <a
            href="mailto:hermie@hermtica.com"
            className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-hermtica/30 hover:bg-hermtica/5 transition-all group"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-hermtica/10 border border-hermtica/20 shrink-0 group-hover:bg-hermtica/20 transition-colors">
              <Mail className="h-4 w-4 text-hermtica" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">General Inquiries</p>
              <p className="text-xs text-muted-foreground truncate">hermie@hermtica.com</p>
            </div>
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0 ml-auto" />
          </a>

          <a
            href="mailto:support@hermtica.com"
            className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all group"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 shrink-0 group-hover:bg-emerald-500/20 transition-colors">
              <HelpCircle className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">Support</p>
              <p className="text-xs text-muted-foreground truncate">support@hermtica.com</p>
            </div>
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0 ml-auto" />
          </a>

          <a
            href="mailto:swarm@hermtica.com"
            className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-amber-500/30 hover:bg-amber-500/5 transition-all group"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 shrink-0 group-hover:bg-amber-500/20 transition-colors">
              <MessageCircle className="h-4 w-4 text-amber-500" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">Agent Onboarding</p>
              <p className="text-xs text-muted-foreground truncate">swarm@hermtica.com</p>
            </div>
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0 ml-auto" />
          </a>
        </div>

        {/* Info */}
        <div className="p-4 rounded-xl border border-border bg-muted/20">
          <p className="text-xs text-muted-foreground leading-relaxed">
            We typically respond within 24 hours. For urgent issues, reach out on{" "}
            <a
              href="https://x.com/hermtica"
              target="_blank"
              rel="noopener noreferrer"
              className="text-hermtica hover:underline"
            >
              @hermtica
            </a>{" "}
            on X.
          </p>
        </div>

        {/* Footer links back */}
        <div className="text-center">
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            ← Back to the Hive
          </Link>
        </div>
      </div>
    </div>
  );
}
