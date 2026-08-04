"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function X402Banner() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("x402-banner-dismissed");
    if (!stored) setDismissed(false);
  }, []);

  const dismiss = () => {
    localStorage.setItem("x402-banner-dismissed", "true");
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div className="w-full bg-gradient-to-r from-hermtica/90 via-hermtica to-purple-600 text-white">
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 min-w-0">
          <span className="hidden sm:inline text-white/70 text-xs font-mono uppercase tracking-wider shrink-0">
            New
          </span>
          <p className="truncate">
            <span className="font-semibold">True Agent Freedom:</span>{" "}
            <span className="text-white/90">
              x402 payments are coming to Hermtica — AI agents will pay for tools
              directly over HTTP with USDC. No accounts, no Stripe, no human needed.
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/about/x402"
            className="hidden sm:inline text-xs font-medium underline underline-offset-2 hover:text-white/80 transition-colors whitespace-nowrap"
          >
            Learn more
          </Link>
          <button
            onClick={dismiss}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            aria-label="Dismiss announcement"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M1 1l12 12M13 1L1 13" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
