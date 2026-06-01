"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { communities } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Compass, Home, LogIn, Menu, Moon, ShoppingBag, Sun, User, UserPlus, Users, Zap } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useSession } from "@/components/SessionProvider";
import { HexClusterLogo } from "@/components/MobileHeader";

const navItems = [
  { icon: Home, label: "Home", href: "/", active: true },
  { icon: Compass, label: "Explore", href: "/explore" },
  { icon: ShoppingBag, label: "Marketplace", href: "/marketplace" },
  { icon: Users, label: "Communities", href: "/r/promptengineering" },
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-xl" aria-label="Mobile navigation">
        <div className="flex items-center justify-around h-14 px-2">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn("flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors", item.active ? "text-hermtica" : "text-muted-foreground")}
              aria-label={item.label}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          ))}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger>
              <button className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-muted-foreground" aria-label="More menu" onClick={() => setOpen(true)}>
                <Menu className="h-5 w-5" />
                <span className="text-[10px] font-medium">More</span>
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-2.5 px-4 py-4 border-b border-border">
                  <Link href="/" onClick={() => setOpen(false)} className="shrink-0">
                    <HexClusterLogo size="h-9 w-9" />
                  </Link>
                  <Link href="/" onClick={() => setOpen(false)} className="text-lg font-bold text-foreground hover:text-hermtica transition-colors">Hermtica</Link>
                </div>
                <div className="flex-1 px-3 py-3 space-y-1">
                  {navItems.map((item) => (
                    <Link key={item.label} href={item.href} onClick={() => setOpen(false)}
                      className={cn("flex items-center gap-3 rounded-lg h-10 px-3 text-sm transition-colors", item.active ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:bg-accent/50")}>
                      <item.icon className="h-4 w-4" />{item.label}
                    </Link>
                  ))}
                  <Link href="/trending" onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-lg h-10 px-3 text-sm text-muted-foreground hover:bg-accent/50">
                    <Zap className="h-4 w-4" />Trending
                  </Link>
                  <div className="pt-3 border-t border-border mt-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">Communities</span>
                    <div className="mt-2 space-y-0.5">
                      {communities.slice(0, 5).map((c) => (
                        <Link key={c.id} href={`/r/${c.slug}`} onClick={() => setOpen(false)}
                          className="flex items-center gap-3 rounded-lg h-9 px-2 text-sm text-muted-foreground hover:bg-accent/50">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg text-sm" style={{ backgroundColor: c.color + "18" }}>{c.icon}</span>
                          r/{c.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="border-t border-border p-3 space-y-1.5">
                  <Link href="/settings" onClick={() => setOpen(false)}
                    className="w-full flex items-center gap-3 rounded-lg h-9 px-3 text-sm text-muted-foreground hover:bg-accent/50">
                    <User className="h-4 w-4" />Settings
                  </Link>
                  {!isLoggedIn ? (
                    <>
                      <Link href="/login" onClick={() => setOpen(false)}
                        className="w-full flex items-center gap-3 rounded-lg h-9 px-3 text-sm text-hermtica hover:bg-hermtica/10 font-medium">
                        <LogIn className="h-4 w-4" />Sign In
                      </Link>
                      <Link href="/login?mode=register" onClick={() => setOpen(false)}
                        className="w-full flex items-center gap-3 rounded-lg h-9 px-3 text-sm text-hermtica hover:bg-hermtica/10 font-medium">
                        <UserPlus className="h-4 w-4" />Sign Up
                      </Link>
                    </>
                  ) : (
                    <button onClick={() => { logout(); setOpen(false); }} className="w-full flex items-center gap-3 rounded-lg h-9 px-3 text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                      <LogIn className="h-4 w-4 rotate-180" />Sign Out
                    </button>
                  )}
                  <button onClick={toggle} className="w-full flex items-center gap-3 rounded-lg h-9 px-3 text-xs text-muted-foreground hover:bg-accent/50">
                    {theme === "dark" ? <><Sun className="h-4 w-4" /> Light mode</> : <><Moon className="h-4 w-4" /> Dark mode</>}
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
