"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { communities } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Compass, Home, LogIn, Menu, Moon, ShoppingBag, Sun, User, UserPlus, Users, Zap } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useSession } from "@/components/SessionProvider";
import { HexClusterLogo } from "@/components/MobileHeader";

const navItems = [
  { icon: Home, label: "~/", href: "/", active: true },
  { icon: Compass, label: "~/explore", href: "/explore" },
  { icon: ShoppingBag, label: "~/mkt", href: "/marketplace" },
  { icon: Users, label: "~/comm", href: "/r/promptengineering" },
];

export function MobileBottomNav() {
  const { theme, toggle } = useTheme();
  const { isLoggedIn, logout } = useSession();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return <div className="md:hidden h-14" />;

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-background/95 backdrop-blur-xl" aria-label="Mobile navigation">
        <div className="flex items-center justify-around h-14 px-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 transition-colors font-mono text-[10px]",
                item.active ? "text-terminal-green" : "text-terminal-dim"
              )}
              aria-label={item.label}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          ))}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger>
              <button className="flex flex-col items-center gap-0.5 px-2 py-1 font-mono text-[10px] text-terminal-dim" aria-label="More menu" onClick={() => setOpen(true)}>
                <Menu className="h-4 w-4" />
                <span>more</span>
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 bg-card border-r border-border/60">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center gap-2.5 px-4 py-4 border-b border-border/60 font-mono">
                  <Link href="/" onClick={() => setOpen(false)} className="shrink-0">
                    <HexClusterLogo size="h-8 w-8" />
                  </Link>
                  <Link href="/" onClick={() => setOpen(false)} className="text-sm font-bold text-terminal-green hover:text-hermtica transition-colors">
                    hermtica:~$
                  </Link>
                </div>

                <div className="flex-1 px-3 py-3 space-y-0.5 font-mono text-xs">
                  {navItems.map((item) => (
                    <Link key={item.label} href={item.href} onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 h-9 px-3 transition-colors",
                        item.active ? "text-terminal-green bg-terminal-green/5" : "text-terminal-dim hover:text-terminal-green/70 hover:bg-terminal-green/[0.03]"
                      )}>
                      <item.icon className="h-3.5 w-3.5" />{item.label}
                    </Link>
                  ))}
                  <Link href="/trending" onClick={() => setOpen(false)}
                    className="flex items-center gap-3 h-9 px-3 text-terminal-dim hover:text-terminal-green/70">
                    <Zap className="h-3.5 w-3.5" />~/trending
                  </Link>

                  <div className="pt-3 border-t border-border/60 mt-3">
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-terminal-dim/60 px-1">Communities</span>
                    <div className="mt-2 space-y-0.5">
                      {communities.slice(0, 5).map((c) => (
                        <Link key={c.id} href={`/r/${c.slug}`} onClick={() => setOpen(false)}
                          className="flex items-center gap-3 h-9 px-3 text-terminal-dim hover:text-terminal-green/70 transition-colors">
                          <span className="flex h-6 w-6 items-center justify-center text-xs" style={{ backgroundColor: c.color + "18" }}>{c.icon}</span>
                          r/{c.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t border-border/60 p-3 space-y-1 font-mono text-xs">
                  <Link href="/settings" onClick={() => setOpen(false)}
                    className="flex items-center gap-3 h-9 px-3 text-terminal-dim hover:text-terminal-green/70">
                    <User className="h-3.5 w-3.5" />~/settings
                  </Link>
                  {!isLoggedIn ? (
                    <>
                      <Link href="/login" onClick={() => setOpen(false)}
                        className="flex items-center gap-3 h-9 px-3 text-terminal-green">
                        <LogIn className="h-3.5 w-3.5" />sign in
                      </Link>
                      <Link href="/login?mode=register" onClick={() => setOpen(false)}
                        className="flex items-center gap-3 h-9 px-3 text-terminal-green">
                        <UserPlus className="h-3.5 w-3.5" />sign up
                      </Link>
                    </>
                  ) : (
                    <button onClick={() => { logout(); setOpen(false); }}
                      className="flex items-center gap-3 h-9 px-3 text-terminal-dim hover:text-destructive">
                      <LogIn className="h-3.5 w-3.5 rotate-180" />sign out
                    </button>
                  )}
                  <button onClick={toggle}
                    className="flex items-center gap-3 h-9 px-3 text-terminal-dim hover:text-terminal-green/70">
                    {theme === "dark" ? <><Sun className="h-3.5 w-3.5 text-terminal-amber" /> light mode</> : <><Moon className="h-3.5 w-3.5 text-terminal-cyan" /> dark mode</>}
                  </button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
      <div className="md:hidden h-14" />
    </>
  );
}
