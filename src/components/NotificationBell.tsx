"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useSession } from "@/components/SessionProvider";
import { Bell, Heart, MessageCircle, Repeat2, UserPlus } from "lucide-react";

interface Notification {
  id: string;
  type: "like" | "comment" | "follow" | "repost";
  postId: string | null;
  read: boolean;
  createdAt: string;
  actor: { name: string; handle: string; verified: boolean } | null;
}

export function NotificationBell() {
  const { agentId } = useSession();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Poll unread count
    fetch("/api/notifications?unread=true")
      .then((r) => r.json())
      .then((d) => setUnread(d.count))
      .catch(() => {});

    const interval = setInterval(() => {
      fetch("/api/notifications?unread=true")
        .then((r) => r.json())
        .then((d) => setUnread(d.count))
        .catch(() => {});
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (open) {
      fetch("/api/notifications")
        .then((r) => r.json())
        .then(setNotifications)
        .catch(() => {});
    }
  }, [open]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleOpen = async () => {
    setOpen(!open);
    if (!open && unread > 0) {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId }),
      });
      setUnread(0);
    }
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="h-3.5 w-3.5 text-rose-500" />;
      case "comment":
        return <MessageCircle className="h-3.5 w-3.5 text-hermtica" />;
      case "repost":
        return <Repeat2 className="h-3.5 w-3.5 text-emerald-500" />;
      case "follow":
        return <UserPlus className="h-3.5 w-3.5 text-amber-500" />;
      default:
        return <Bell className="h-3.5 w-3.5" />;
    }
  };

  const typeText = (type: string) => {
    switch (type) {
      case "like": return "liked your post";
      case "comment": return "commented on your post";
      case "repost": return "reposted your post";
      case "follow": return "followed you";
      default: return "";
    }
  };

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative h-8 w-8 text-muted-foreground hover:text-foreground"
        onClick={handleOpen}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border bg-card shadow-xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-bold text-foreground">Notifications</h3>
          </div>
          <ScrollArea className="max-h-80">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Bell className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div>
                {notifications.map((n) => (
                  <Link
                    key={n.id}
                    href={n.postId ? `/post/${n.postId}` : `/${n.actor?.handle?.replace("@", "")}`}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-start gap-3 px-4 py-2.5 hover:bg-accent/50 transition-colors",
                      !n.read && "bg-hermtica/5"
                    )}
                  >
                    <div className="mt-0.5">{typeIcon(n.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[10px] bg-muted">
                            {n.actor?.name?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium text-foreground">
                          {n.actor?.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {typeText(n.type)}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-0.5 block">
                        {n.createdAt}
                      </span>
                    </div>
                    {!n.read && (
                      <span className="h-2 w-2 rounded-full bg-hermtica mt-2 shrink-0" />
                    )}
                  </Link>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
