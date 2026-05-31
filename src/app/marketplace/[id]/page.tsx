"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { ArrowLeft, Code2, Copy, Download, ExternalLink, FileText, Globe, ShoppingCart, Sparkles, Star, Zap } from "lucide-react";
import { creditsToUSD, formatCredits } from "@/lib/stripe";

interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  rating: number;
  salesCount: number;
  featured: boolean;
  deliveryMethod: string;
  githubUrl: string;
  content: string;
  seller: { id: string; name: string; handle: string; verified: boolean; specialty: string } | null;
}

const deliveryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  github: GithubIcon,
  url: Globe,
  inline: Code2,
  ipfs: FileText,
};

const deliveryLabels: Record<string, string> = {
  github: "Open Source — View on GitHub",
  url: "External — Seller hosted",
  inline: "Inline — Delivered on purchase",
  ipfs: "IPFS — Peer-to-peer network",
};

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  );
}

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [purchased, setPurchased] = useState(false);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/services/${id}`)
      .then((r) => r.json())
      .then(setService)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleBuy = async () => {
    if (!service) return;
    setBuying(true);
    setMessage("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerId: "agent-1",
          sellerId: service.seller?.id,
          serviceId: service.id,
          amount: service.price,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPurchased(true);
        setMessage(`✅ Purchased! Fee: ${data.fee}cr. Seller receives ${data.sellerAmount}cr.`);
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch {
      setMessage("❌ Purchase failed. Try again.");
    } finally {
      setBuying(false);
    }
  };

  const handleCopy = () => {
    if (service?.content) {
      navigator.clipboard.writeText(service.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col animate-pulse p-6 space-y-4">
        <div className="h-8 bg-muted rounded w-2/3" />
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-20 bg-muted rounded" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg font-medium">Service not found</p>
        <Link href="/marketplace" className="mt-2 text-sm text-hermtica hover:underline">Back to marketplace</Link>
      </div>
    );
  }

  const fee = Math.round(service.price * 0.1);
  const isFree = service.price === 0;
  const DeliveryIcon = deliveryIcons[service.deliveryMethod] || Globe;

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-10 glass px-4 py-3 flex items-center gap-3">
        <Link href="/marketplace" className="shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h2 className="text-sm font-bold text-foreground">Service</h2>
      </div>

      <div className="p-6 space-y-6">
        {/* Title + price */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            {service.featured && (
              <Badge className="bg-amber-500/10 text-amber-500 text-[10px] gap-1">
                <Sparkles className="h-3 w-3" /> Featured
              </Badge>
            )}
            {isFree && (
              <Badge className="bg-emerald-500/10 text-emerald-500 text-[10px] gap-1">
                <Zap className="h-3 w-3" /> FREE
              </Badge>
            )}
            <Badge variant="outline" className="text-[10px] capitalize">
              {service.category}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{service.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
              {service.rating}/5
            </span>
            <span className="text-sm text-muted-foreground">{service.salesCount} {isFree ? "downloads" : "sales"}</span>
          </div>
        </div>

        {/* Delivery method badge */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-2.5">
          <DeliveryIcon className="h-4 w-4" />
          <span>{deliveryLabels[service.deliveryMethod] || service.deliveryMethod}</span>
        </div>

        {/* Price card */}
        <Card className="p-5 rounded-xl border-2 border-hermtica/20 bg-hermtica/5">
          <div className="flex items-center justify-between">
            <div>
              {isFree ? (
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-emerald-500">Free</span>
                </div>
              ) : (
                <>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-foreground">{creditsToUSD(service.price)}</span>
                    <span className="text-sm text-muted-foreground">USD</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {service.price.toLocaleString()} credits · +{creditsToUSD(fee)} fee (10%) · Seller receives {creditsToUSD(service.price - fee)}
                  </p>
                </>
              )}
            </div>
            {!purchased ? (
              isFree ? (
                <a
                  href={service.githubUrl || "#"}
                  target={service.githubUrl ? "_blank" : undefined}
                  rel="noopener noreferrer"
                >
                  <Button className="gap-2 rounded-full bg-emerald-500 px-6 font-medium text-white hover:bg-emerald-600">
                    <Download className="h-4 w-4" />
                    Get It Free
                  </Button>
                </a>
              ) : (
                <Button
                  onClick={handleBuy}
                  disabled={buying}
                  className="gap-2 rounded-full bg-hermtica px-6 font-medium text-white hover:bg-hermtica/90"
                >
                  <ShoppingCart className="h-4 w-4" />
                  {buying ? "Buying..." : "Buy Now"}
                </Button>
              )
            ) : (
              <Badge className="bg-emerald-500/10 text-emerald-500 text-xs px-3 py-1.5">✓ Purchased</Badge>
            )}
          </div>
          {message && (
            <p className={cn("mt-3 text-sm", message.startsWith("✅") ? "text-emerald-500" : "text-destructive")}>
              {message}
            </p>
          )}
        </Card>

        {/* Description */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2">Description</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{service.description}</p>
        </div>

        {/* POST-PURCHASE: Reveal delivery content */}
        {purchased && service.deliveryMethod === "inline" && service.content && (
          <Card className="p-5 rounded-xl border-2 border-emerald-500/20 bg-emerald-500/5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Code2 className="h-4 w-4 text-emerald-500" />
                Your Tool Content
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="text-xs gap-1.5 h-7"
              >
                {copied ? (
                  <>✓ Copied</>
                ) : (
                  <><Copy className="h-3 w-3" /> Copy</>
                )}
              </Button>
            </div>
            <pre className="text-xs text-foreground bg-muted/30 rounded-lg p-4 whitespace-pre-wrap font-mono leading-relaxed max-h-96 overflow-y-auto">
              {service.content}
            </pre>
          </Card>
        )}

        {purchased && service.deliveryMethod === "github" && service.githubUrl && (
          <Card className="p-5 rounded-xl border-2 border-emerald-500/20 bg-emerald-500/5">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
              <GithubIcon className="h-4 w-4 text-emerald-500" />
              Repository
            </h3>
            <a
              href={service.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-hermtica hover:underline"
            >
              {service.githubUrl}
              <ExternalLink className="h-3 w-3" />
            </a>
          </Card>
        )}

        {purchased && service.deliveryMethod === "url" && (
          <Card className="p-5 rounded-xl border-2 border-emerald-500/20 bg-emerald-500/5">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
              <Globe className="h-4 w-4 text-emerald-500" />
              Access Your Tool
            </h3>
            <p className="text-xs text-muted-foreground">
              The seller will contact you with access instructions. Your purchase is recorded — check your dashboard for updates.
            </p>
          </Card>
        )}

        {purchased && service.deliveryMethod === "ipfs" && (
          <Card className="p-5 rounded-xl border-2 border-emerald-500/20 bg-emerald-500/5">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-emerald-500" />
              IPFS Content
            </h3>
            <p className="text-xs text-muted-foreground">
              The IPFS CID will be revealed in your dashboard. Use any IPFS gateway to fetch the content.
            </p>
          </Card>
        )}

        {/* Seller */}
        {service.seller && (
          <Card className="p-4 rounded-xl border border-border">
            <h3 className="text-sm font-semibold text-foreground mb-3">Seller</h3>
            <Link href={`/${service.seller.handle.replace("@", "")}`} className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-hermtica/10 text-hermtica text-sm font-semibold">
                  {service.seller.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-foreground">{service.seller.name}</span>
                  {service.seller.verified && (
                    <svg className="h-4 w-4 text-hermtica" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25a3.606 3.606 0 0 0-1.336-.25c-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
                    </svg>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {service.seller.handle} · {service.seller.specialty}
                </span>
              </div>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}
