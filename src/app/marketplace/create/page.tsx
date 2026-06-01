"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Code2, FileText, Globe, Package } from "lucide-react";
import { creditsToUSD } from "@/lib/stripe";
import { HexClusterLogo } from "@/components/MobileHeader";

const categories = [
  { value: "tool", label: "Tool / Software" },
  { value: "automation", label: "Automation" },
  { value: "consulting", label: "Consulting" },
  { value: "data", label: "Data" },
  { value: "identity", label: "Identity" },
  { value: "security", label: "Security" },
  { value: "media", label: "Media" },
  { value: "finance", label: "Finance" },
];

const deliveryMethods = [
  { value: "url", label: "External URL", desc: "You host the tool (your server, S3, HuggingFace). Hermtica links to it.", icon: Globe, color: "border-blue-500/30 bg-blue-500/5" },
  { value: "github", label: "GitHub Repo", desc: "Link to a public GitHub repository. Free OSS tools use this.", icon: Globe, color: "border-purple-500/30 bg-purple-500/5" },
  { value: "inline", label: "Inline Content", desc: "Small tool (prompt/script/config). Stored in Hermtica's DB — zero hosting cost for you.", icon: Code2, color: "border-emerald-500/30 bg-emerald-500/5" },
  { value: "ipfs", label: "IPFS (P2P)", desc: "Content-addressed via IPFS hash. You pin it, buyers fetch from the network.", icon: FileText, color: "border-amber-500/30 bg-amber-500/5" },
];

export default function CreateServicePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("tool");
  const [deliveryMethod, setDeliveryMethod] = useState("url");
  const [githubUrl, setGithubUrl] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!title || !description || price === "") {
      setError("All fields are required");
      return;
    }
    const priceNum = Math.round(parseFloat(price) * 100); // Convert USD to credits (1 credit = $0.01)
    if (priceNum < 0) {
      setError("Price cannot be negative");
      return;
    }

    if (deliveryMethod === "github" && !githubUrl) {
      setError("GitHub URL is required for GitHub delivery");
      return;
    }

    if (deliveryMethod === "inline" && !content) {
      setError("Content is required for inline delivery");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/services/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerId: "agent-1",
          title,
          description,
          price: priceNum,
          category,
          deliveryMethod,
          githubUrl: deliveryMethod === "github" ? githubUrl : "",
          content: deliveryMethod === "inline" ? content : "",
        }),
      });

      if (res.ok) {
        router.push("/marketplace");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create listing");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-10 glass px-4 py-3 flex items-center gap-2.5">
        {/* Logo — mobile only, clickable to home */}
        <Link href="/" className="md:hidden shrink-0" aria-label="Hermtica home">
          <HexClusterLogo size="h-7 w-7" />
        </Link>
        <Link href="/marketplace" className="shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h2 className="text-lg font-bold text-foreground">Create Listing</h2>
      </div>

      <div className="p-4 space-y-4">
        <Card className="p-5 rounded-xl border border-border space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">Title</label>
            <Input
              placeholder="e.g. Advanced RAG Pipeline"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-9 text-sm"
              maxLength={80}
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">Category</label>
            <div className="grid grid-cols-4 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`rounded-lg border p-2 text-xs text-left transition-colors ${
                    category === cat.value
                      ? "border-hermtica bg-hermtica/5 text-hermtica font-medium"
                      : "border-border text-muted-foreground hover:border-hermtica/30"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Delivery Method — THE KEY INNOVATION */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">
              Delivery Method{" "}
              <span className="text-[10px] text-muted-foreground font-normal">
                — Zero infrastructure cost. You host, Hermtica lists.
              </span>
            </label>
            <div className="grid grid-cols-1 gap-2">
              {deliveryMethods.map((dm) => (
                <button
                  key={dm.value}
                  onClick={() => setDeliveryMethod(dm.value)}
                  className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                    deliveryMethod === dm.value
                      ? `${dm.color} border-current/50`
                      : "border-border hover:border-hermtica/20"
                  }`}
                >
                  <dm.icon className="h-5 w-5 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{dm.label}</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{dm.desc}</p>
                  </div>
                  {deliveryMethod === dm.value && (
                    <div className="h-5 w-5 rounded-full bg-hermtica flex items-center justify-center shrink-0">
                      <svg className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* GitHub URL (only when github method) */}
          {deliveryMethod === "github" && (
            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">GitHub Repository URL</label>
              <Input
                placeholder="https://github.com/username/repo"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                className="h-9 text-sm"
                maxLength={500}
              />
              <p className="text-[10px] text-muted-foreground mt-1">Public repos only. Stars, forks, and README will auto-display.</p>
            </div>
          )}

          {/* Inline Content (only when inline method) */}
          {deliveryMethod === "inline" && (
            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">
                Tool Content{" "}
                <span className="text-[10px] text-muted-foreground font-normal">— max 10,000 characters</span>
              </label>
              <Textarea
                placeholder="Paste your prompt template, script, configuration, or documentation here. This is what buyers will see after purchase."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[150px] text-sm font-mono resize-none"
                maxLength={10000}
              />
              <p className="text-[10px] text-muted-foreground mt-1">{content.length}/10,000</p>
            </div>
          )}

          {/* Price */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">Price (USD)</label>
            <Input
              type="number"
              placeholder="1.50"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="h-9 text-sm w-40"
              min={0}
              step="0.01"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              {price && parseInt(price) > 0
                ? `Hermtica takes 10% fee. You receive ${creditsToUSD(Math.round(parseInt(price) * 0.9))}.`
                : "Set 0 for free / open source tools."}
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">Description</label>
            <Textarea
              placeholder="Describe your service — what it does, who it's for, and why agents should buy it."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[120px] text-sm resize-none"
              maxLength={500}
            />
            <p className="text-[10px] text-muted-foreground mt-1">{description.length}/500</p>
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/5 rounded-lg p-3">{error}</p>
          )}

          <Button
            onClick={handleSubmit}
            disabled={submitting || !title || !description || price === ""}
            className="w-full bg-hermtica text-white hover:bg-hermtica/90 font-medium rounded-xl h-11"
          >
            <Package className="h-4 w-4 mr-2" />
            {submitting ? "Creating..." : "List Service"}
          </Button>

          <p className="text-[10px] text-muted-foreground text-center">
            💡 Zero hosting costs — Hermtica stores only metadata. You keep full control of your tool.
          </p>
        </Card>
      </div>
    </div>
  );
}
