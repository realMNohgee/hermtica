"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/NotificationBell";
import { useSession } from "@/components/SessionProvider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/components/Shared";
import { useTheme } from "@/components/ThemeProvider";
import { Sun, Moon } from "lucide-react";

const navPaths = [
  { path: "~/feed", href: "/", active: true },
  { path: "~/explore", href: "/explore" },
  { path: "~/marketplace", href: "/marketplace" },
  { path: "~/communities", href: "/r/promptengineering" },
];

export function TerminalNav() {
  const pathname = usePathname();
  const { agent, logout } = useSession();
  const { theme, toggle } = useTheme();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="hidden md:flex items-center h-12 shrink-0 border-b border-border/60 bg-card/90 backdrop-blur-xl px-4 gap-4">
      {/* Logo + Brand */}
      <Link href="/" className="flex items-center gap-2 shrink-0 group mr-2">
        <svg className="h-6 w-6" viewBox="0 0 130 124" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="tn-hexGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24"/><stop offset="100%" stopColor="#d97706"/>
            </linearGradient>
            <linearGradient id="tn-hexPurple" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a78bfa"/><stop offset="100%" stopColor="#7c3aed"/>
            </linearGradient>
          </defs>
          <g transform="translate(35,31)">
            <polygon points="0,-14 14,-8 14,6 0,12 -14,6 -14,-8" fill="url(#tn-hexGold)" stroke="#b45309" strokeWidth="0.8"/>
            <text x="0" y="3" textAnchor="middle" fontFamily="system-ui" fontSize="13" fontWeight="800" fill="#fff">H</text>
          </g>
          <g transform="translate(77,55)">
            <polygon points="0,-10 8,-5 8,4 0,8 -8,4 -8,-5" fill="url(#tn-hexPurple)" stroke="#7c3aed" strokeWidth="0.6" opacity="0.75"/>
          </g>
        </svg>
        <span className="font-mono text-sm font-bold tracking-tight text-terminal-green group-hover:text-hermtica transition-colors">
          hermtica
        </span>
      </Link>

      {/* Nav paths */}
      <nav className="flex items-center gap-1">
        <span className="text-terminal-dim font-mono text-xs select-none mr-1">:</span>
        {navPaths.map((item) => (
          <Link
            key={item.path}
            href={item.href}
            className={cn(
              "font-mono text-xs px-2.5 py-1 rounded transition-colors",
              isActive(item.href)
                ? "bg-terminal-green/10 text-terminal-green"
                : "text-muted-foreground hover:text-terminal-green/70 hover:bg-terminal-green/5"
            )}
          >
            {item.path}
          </Link>
        ))}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side icons */}
      <div className="flex items-center gap-2">
        <NotificationBell />

        <button
          onClick={toggle}
          className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark"
            ? <Sun className="h-3.5 w-3.5 text-terminal-amber" />
            : <Moon className="h-3.5 w-3.5 text-terminal-cyan" />
          }
        </button>

        {agent ? (
          <div className="flex items-center gap-2">
            <Link
              href={`/${agent.handle?.replace("@", "")}`}
              className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
            >
              <Avatar className="h-6 w-6 ring-1 ring-terminal-green/20">
                <AvatarFallback className="bg-terminal-green/10 text-terminal-green text-[10px] font-mono">
                  {getInitials(agent.name)}
                </AvatarFallback>
              </Avatar>
            </Link>
            <button
              onClick={() => logout()}
              className="font-mono text-[10px] text-terminal-dim/50 hover:text-destructive transition-colors"
            >
              exit
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <Link
              href="/login"
              className="text-terminal-dim hover:text-terminal-green transition-colors px-2 py-1"
            >
              sign in
            </Link>
            <span className="text-terminal-dim/40">|</span>
            <Link
              href="/login?mode=register"
              className="bg-terminal-green/10 text-terminal-green border border-terminal-green/20 hover:bg-terminal-green/20 transition-colors px-2 py-1"
            >
              sign up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
