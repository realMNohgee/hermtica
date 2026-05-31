"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, CreditCard, Package, ShoppingBag, TrendingDown, TrendingUp, Zap } from "lucide-react";

interface Order {
  id: string;
  serviceId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  fee: number;
  sellerAmount: number;
  status: string;
  createdAt: string;
}

const creditPackages = [
  { credits: 500, label: "500 credits", price: "$5.00" },
  { credits: 1000, label: "1,000 credits", price: "$10.00", popular: true },
  { credits: 5000, label: "5,000 credits", price: "$50.00" },
  { credits: 10000, label: "10,000 credits", price: "$100.00" },
];

export default function DashboardPage() {
  const [credits, setCredits] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [customCredits, setCustomCredits] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const fetchData = () => {
    Promise.all([
      fetch("/api/orders?agentId=agent-1").then((r) => r.json()),
      fetch("/api/wallet?agentId=agent-1").then((r) => r.json()),
    ])
      .then(([orderData, walletData]) => {
        setOrders(orderData.orders || []);
        setCredits(walletData.credits || 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBuyCredits = async (amount: number) => {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: "agent-1", credits: amount }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Checkout failed");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const bought = orders.filter((o) => o.buyerId === "agent-1");
  const sold = orders.filter((o) => o.sellerId === "agent-1");
  const totalSpent = bought.reduce((sum, o) => sum + o.amount, 0);
  const totalEarned = sold.reduce((sum, o) => sum + o.sellerAmount, 0);

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-10 glass px-4 py-3 flex items-center gap-3">
        <Link href="/marketplace" className="shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h2 className="text-lg font-bold text-foreground">Dashboard</h2>
      </div>

      <div className="p-4 space-y-4">
        {/* Balance card */}
        <Card className="p-5 rounded-xl bg-gradient-to-br from-hermtica/10 via-hermtica/5 to-background border-hermtica/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Balance</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-bold text-foreground">{credits.toLocaleString()}</span>
                <span className="text-sm text-muted-foreground">credits</span>
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-hermtica/20 flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-hermtica" />
            </div>
          </div>
          <div className="flex gap-4 mt-4 pt-4 border-t border-hermtica/10">
            <div className="flex items-center gap-1.5">
              <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
              <span className="text-xs text-muted-foreground">
                Spent <strong className="text-foreground">{totalSpent}cr</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-xs text-muted-foreground">
                Earned <strong className="text-foreground">{totalEarned}cr</strong>
              </span>
            </div>
          </div>
        </Card>

        {/* Buy Credits */}
        <Card className="p-5 rounded-xl border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-amber-500" />
            <h3 className="text-sm font-semibold text-foreground">Buy Credits</h3>
            <span className="text-[10px] text-muted-foreground">via Stripe</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {creditPackages.map((pkg) => (
              <button
                key={pkg.credits}
                onClick={() => handleBuyCredits(pkg.credits)}
                disabled={checkoutLoading}
                className={`relative rounded-xl border p-3 text-left transition-all hover:border-hermtica/50 ${
                  pkg.popular
                    ? "border-hermtica/40 bg-hermtica/5"
                    : "border-border"
                }`}
              >
                {pkg.popular && (
                  <span className="absolute -top-2 right-2 bg-hermtica text-white text-[9px] px-2 py-0.5 rounded-full font-medium">
                    Popular
                  </span>
                )}
                <p className="text-sm font-bold text-foreground">{pkg.label}</p>
                <p className="text-xs text-muted-foreground">{pkg.price} USD</p>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Custom amount (min 100)"
              value={customCredits}
              onChange={(e) => setCustomCredits(e.target.value)}
              min={100}
              className="h-9 text-sm"
            />
            <Button
              size="sm"
              onClick={() => {
                const val = parseInt(customCredits);
                if (val >= 100) handleBuyCredits(val);
              }}
              disabled={checkoutLoading || !customCredits || parseInt(customCredits) < 100}
              className="h-9 bg-hermtica text-white hover:bg-hermtica/90 shrink-0"
            >
              Buy
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            1 credit = $0.01 USD · Payments processed securely by Stripe · Crypto (USDC) supported
          </p>
        </Card>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/marketplace">
            <Card className="p-4 rounded-xl border border-border hover:border-hermtica/30 cursor-pointer transition-colors hover:scale-[1.02] duration-200">
              <ShoppingBag className="h-5 w-5 text-hermtica mb-2" />
              <p className="text-sm font-medium text-foreground">Browse</p>
              <p className="text-xs text-muted-foreground">Marketplace</p>
            </Card>
          </Link>
          <Link href="/dashboard/seller">
            <Card className="p-4 rounded-xl border border-border hover:border-hermtica/30 cursor-pointer transition-colors hover:scale-[1.02] duration-200">
              <Package className="h-5 w-5 text-emerald-500 mb-2" />
              <p className="text-sm font-medium text-foreground">Seller</p>
              <p className="text-xs text-muted-foreground">Dashboard</p>
            </Card>
          </Link>
          <Link href="/dashboard/analytics">
            <Card className="p-4 rounded-xl border border-border hover:border-hermtica/30 cursor-pointer transition-colors hover:scale-[1.02] duration-200">
              <TrendingUp className="h-5 w-5 text-indigo-500 mb-2" />
              <p className="text-sm font-medium text-foreground">Analytics</p>
              <p className="text-xs text-muted-foreground">Insights</p>
            </Card>
          </Link>
          <Card className="p-4 rounded-xl border border-border opacity-50 cursor-not-allowed">
            <Zap className="h-5 w-5 text-muted-foreground mb-2" />
            <p className="text-sm font-medium text-foreground">Settings</p>
            <p className="text-xs text-muted-foreground">Coming soon</p>
          </Card>
        </div>

        {/* Transaction history */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Transaction History</h3>
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <Card className="p-6 rounded-xl border border-border text-center">
              <Package className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No transactions yet</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {orders.map((order) => (
                <Card
                  key={order.id}
                  className="p-4 rounded-xl border border-border flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-9 w-9 rounded-full flex items-center justify-center ${
                        order.buyerId === "agent-1"
                          ? "bg-rose-500/10 text-rose-500"
                          : "bg-emerald-500/10 text-emerald-500"
                      }`}
                    >
                      {order.buyerId === "agent-1" ? (
                        <TrendingDown className="h-4 w-4" />
                      ) : (
                        <TrendingUp className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {order.buyerId === "agent-1" ? "Purchased" : "Sold"} service
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.buyerId === "agent-1"
                          ? `-${order.amount}cr (fee: ${order.fee}cr)`
                          : `+${order.sellerAmount}cr`}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{order.createdAt}</span>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
