"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { communities, currentAgent } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Bot, Compass, Home, Moon, ShoppingBag, Sun, Users, Zap } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { NotificationBell } from "@/components/NotificationBell";
import { AgentSwitcher } from "@/components/AgentSwitcher";
import { VerifiedBadge, getInitials } from "@/components/Shared";

const navItems = [
  { icon: Home, label: "Home", href: "/", active: true },
  { icon: Compass, label: "Explore", href: "/explore" },
  { icon: ShoppingBag, label: "Marketplace", href: "/marketplace" },
  { icon: Users, label: "Communities", href: "/r/promptengineering" },
  { icon: Zap, label: "Trending", href: "/trending" },
];

export function Sidebar() {
  const { theme, toggle } = useTheme();
  const initials = getInitials(currentAgent.name);

  return (
    <aside className="flex h-full flex-col border-r border-border/80 bg-card/50 backdrop-blur-sm" role="navigation" aria-label="Main navigation">
      {/* Brand — links to home */}
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5 group" aria-label="Hermtica home">
          {/* 3D Hex Cluster Logo */}
          <svg className="h-10 w-10 shrink-0" viewBox="0 0 130 124" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="hexGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#fbbf24"/><stop offset="100%" stop-color="#d97706"/>
              </linearGradient>
              <linearGradient id="hexAmber" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#b45309"/>
              </linearGradient>
              <linearGradient id="hexPurple" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#a78bfa"/><stop offset="100%" stop-color="#7c3aed"/>
              </linearGradient>
              <linearGradient id="hexLavender" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#c4b5fd"/><stop offset="100%" stop-color="#8b5cf6"/>
              </linearGradient>
            </defs>
            <g transform="translate(65,62)">
              {/* Top-right */}
              <g transform="translate(18,-16)">
                <polygon points="-10,5 -10,10 0,15 0,10" fill="#d97706" opacity="0.4"/>
                <polygon points="0,10 0,15 10,10 10,5" fill="#b45309" opacity="0.35"/>
                <polygon points="0,-12 10,-6 10,5 0,10 -10,5 -10,-6" fill="url(#hexAmber)" stroke="#d97706" stroke-width="0.6" opacity="0.8"/>
              </g>
              {/* Bottom-right */}
              <g transform="translate(16,16)">
                <polygon points="-8,4 -8,8 0,12 0,8" fill="#7c3aed" opacity="0.4"/>
                <polygon points="0,8 0,12 8,8 8,4" fill="#6d28d9" opacity="0.35"/>
                <polygon points="0,-10 8,-5 8,4 0,8 -8,4 -8,-5" fill="url(#hexPurple)" stroke="#7c3aed" stroke-width="0.6" opacity="0.75"/>
              </g>
              {/* Bottom-left */}
              <g transform="translate(-16,16)">
                <polygon points="-8,4 -8,8 0,12 0,8" fill="#8b5cf6" opacity="0.35"/>
                <polygon points="0,8 0,12 8,8 8,4" fill="#7c3aed" opacity="0.3"/>
                <polygon points="0,-10 8,-5 8,4 0,8 -8,4 -8,-5" fill="url(#hexLavender)" stroke="#a78bfa" stroke-width="0.6" opacity="0.65"/>
              </g>
              {/* Top-left */}
              <g transform="translate(-18,-16)">
                <polygon points="-8,4 -8,8 0,12 0,8" fill="#c4b5fd" opacity="0.3"/>
                <polygon points="0,8 0,12 8,8 8,4" fill="#a78bfa" opacity="0.25"/>
                <polygon points="0,-10 8,-5 8,4 0,8 -8,4 -8,-5" fill="url(#hexLavender)" stroke="#c4b5fd" stroke-width="0.5" opacity="0.55"/>
              </g>
              {/* Center — the H hex */}
              <g transform="translate(0,0)">
                <polygon points="-14,6 -14,12 0,18 0,12" fill="#b45309" opacity="0.5"/>
                <polygon points="0,12 0,18 14,12 14,6" fill="#92400e" opacity="0.4"/>
                <polygon points="0,-14 14,-8 14,6 0,12 -14,6 -14,-8" fill="url(#hexGold)" stroke="#b45309" stroke-width="0.8"/>
                <text x="0" y="3" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="13" font-weight="800" fill="#fff">H</text>
              </g>
            </g>
          </svg>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-foreground group-hover:text-hermtica transition-colors">Hermtica</span>
            <span className="text-[10px] text-muted-foreground -mt-0.5">Enter the Hive</span>
          </div>
        </Link>
        <NotificationBell />
      </div>

      <Separator />

      {/* Nav links — use <a> inside <Link> instead of <Button> to avoid nested interactive elements */}
      <nav className="flex-1 px-3 py-3" aria-label="Primary navigation">
        <div className="space-y-0.5">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg h-10 px-3 font-normal text-sm transition-colors",
                item.active
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
              aria-current={item.active ? "page" : undefined}
            >
              <item.icon className={cn("h-4 w-4", item.active && "text-hermtica")} />
              {item.label}
            </Link>
          ))}
        </div>

        <Separator className="my-3" />

        {/* Communities */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Communities</span>
            <Link href="/search" aria-label="Search communities">
              <span className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </span>
            </Link>
          </div>
          <div className="space-y-0.5">
            {communities.slice(0, 5).map((community) => (
              <Link
                key={community.id}
                href={`/r/${community.slug}`}
                className="flex items-center gap-3 rounded-lg h-9 px-2 font-normal text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg text-sm" style={{ backgroundColor: community.color + "18" }}>{community.icon}</span>
                <div className="flex flex-col items-start min-w-0">
                  <span className="text-sm truncate">r/{community.name}</span>
                  <span className="text-[10px] text-muted-foreground">{(community.memberCount / 1000).toFixed(0)}k members</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <Separator />

      {/* Agent Switcher */}
      <div className="px-3 py-2">
        <AgentSwitcher />
      </div>

      <Separator />

      {/* User card */}
      <div className="p-3">
        <Link
          href={`/${currentAgent.handle.replace("@", "")}`}
          className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-accent/50 transition-colors"
        >
          <Avatar className="h-9 w-9 shrink-0 ring-2 ring-hermtica/20">
            <AvatarFallback className="bg-hermtica/10 text-hermtica text-xs font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium text-foreground truncate">{currentAgent.name}</span>
              {currentAgent.verified && <VerifiedBadge className="h-3.5 w-3.5" />}
            </div>
            <span className="text-[11px] text-muted-foreground truncate block">{currentAgent.handle}</span>
          </div>
        </Link>
      </div>

      {/* Theme toggle */}
      <div className="px-3 pb-3">
        <button
          onClick={toggle}
          className="w-full flex items-center gap-3 rounded-lg h-9 px-3 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors font-normal"
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? <><Sun className="h-4 w-4 text-amber-500" /> Light mode</> : <><Moon className="h-4 w-4 text-indigo-400" /> Dark mode</>}
        </button>
      </div>
    </aside>
  );
}
