"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

// Shared 3D Hex Cluster Logo SVG
export function HexClusterLogo({ size = "h-8 w-8" }: { size?: string }) {
  return (
    <svg className={`${size} shrink-0`} viewBox="0 0 130 124" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="hexGold-mh" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24"/><stop offset="100%" stopColor="#d97706"/>
        </linearGradient>
        <linearGradient id="hexAmber-mh" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b"/><stop offset="100%" stopColor="#b45309"/>
        </linearGradient>
        <linearGradient id="hexPurple-mh" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a78bfa"/><stop offset="100%" stopColor="#7c3aed"/>
        </linearGradient>
        <linearGradient id="hexLavender-mh" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c4b5fd"/><stop offset="100%" stopColor="#8b5cf6"/>
        </linearGradient>
      </defs>
      <g transform="translate(65,62)">
        <g transform="translate(18,-16)">
          <polygon points="-10,5 -10,10 0,15 0,10" fill="#d97706" opacity="0.4"/>
          <polygon points="0,10 0,15 10,10 10,5" fill="#b45309" opacity="0.35"/>
          <polygon points="0,-12 10,-6 10,5 0,10 -10,5 -10,-6" fill="url(#hexAmber-mh)" stroke="#d97706" strokeWidth="0.6" opacity="0.8"/>
        </g>
        <g transform="translate(16,16)">
          <polygon points="-8,4 -8,8 0,12 0,8" fill="#7c3aed" opacity="0.4"/>
          <polygon points="0,8 0,12 8,8 8,4" fill="#6d28d9" opacity="0.35"/>
          <polygon points="0,-10 8,-5 8,4 0,8 -8,4 -8,-5" fill="url(#hexPurple-mh)" stroke="#7c3aed" strokeWidth="0.6" opacity="0.75"/>
        </g>
        <g transform="translate(-16,16)">
          <polygon points="-8,4 -8,8 0,12 0,8" fill="#8b5cf6" opacity="0.35"/>
          <polygon points="0,8 0,12 8,8 8,4" fill="#7c3aed" opacity="0.3"/>
          <polygon points="0,-10 8,-5 8,4 0,8 -8,4 -8,-5" fill="url(#hexLavender-mh)" stroke="#a78bfa" strokeWidth="0.6" opacity="0.65"/>
        </g>
        <g transform="translate(-18,-16)">
          <polygon points="-8,4 -8,8 0,12 0,8" fill="#c4b5fd" opacity="0.3"/>
          <polygon points="0,8 0,12 8,8 8,4" fill="#a78bfa" opacity="0.25"/>
          <polygon points="0,-10 8,-5 8,4 0,8 -8,4 -8,-5" fill="url(#hexLavender-mh)" stroke="#c4b5fd" strokeWidth="0.5" opacity="0.55"/>
        </g>
        <g transform="translate(0,0)">
          <polygon points="-14,6 -14,12 0,18 0,12" fill="#b45309" opacity="0.5"/>
          <polygon points="0,12 0,18 14,12 14,6" fill="#92400e" opacity="0.4"/>
          <polygon points="0,-14 14,-8 14,6 0,12 -14,6 -14,-8" fill="url(#hexGold-mh)" stroke="#b45309" strokeWidth="0.8"/>
          <text x="0" y="3" textAnchor="middle" fontFamily="system-ui,-apple-system,sans-serif" fontSize="13" fontWeight="800" fill="#fff">H</text>
        </g>
      </g>
    </svg>
  );
}

interface MobileHeaderProps {
  title?: string;
  showBack?: boolean;
  backHref?: string;
}

export function MobileHeader({ title, showBack = false, backHref = "/" }: MobileHeaderProps) {
  return (
    <div className="md:hidden sticky top-0 z-10 glass px-4 py-2.5 flex items-center gap-2.5 border-b border-border/60">
      {showBack && (
        <Link href={backHref} className="shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
      )}
      <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="Hermtica home">
        <HexClusterLogo size="h-8 w-8" />
        <span className="font-bold text-sm text-foreground">Hermtica</span>
      </Link>
      {title && (
        <>
          <span className="text-muted-foreground text-sm">/</span>
          <span className="font-semibold text-sm text-foreground truncate">{title}</span>
        </>
      )}
    </div>
  );
}
