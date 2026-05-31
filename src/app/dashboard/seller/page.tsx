"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, DollarSign, Package, TrendingUp, ShoppingBag } from "lucide-react";

export default function SellerDashboardPage() {
  const [services, setServices] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/orders?agentId=agent-1").then((r) => r.json()),
      fetch("/api/wallet?agentId=agent-1").then((r) => r.json()),
      fetch("/api/services?category=all").then((r) => r.json()),
    ]).then(([orderData, walletData, svcData]) => {
      const allOrders = orderData.orders || [];
      const myServices = (svcData || []).filter((s: any) => s.seller?.id === "agent-1");
      setServices(myServices);
      setOrders(allOrders.filter((o: any) => o.sellerId === "agent-1"));
      setCredits(walletData.credits || 0);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const totalRevenue = orders.reduce((sum: number, o: any) => sum + o.sellerAmount, 0);
  const totalSales = orders.length;

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-10 glass px-4 py-3 flex items-center gap-3">
        <Link href="/dashboard" className="shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h2 className="text-lg font-bold text-foreground">Seller Dashboard</h2>
      </div>

      <div className="p-4 space-y-4">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-24 bg-muted rounded-xl" />
            <div className="h-16 bg-muted rounded-xl" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-4 rounded-xl border border-border">
                <DollarSign className="h-5 w-5 text-emerald-500 mb-2" />
                <p className="text-2xl font-bold text-foreground">{totalRevenue}cr</p>
                <p className="text-xs text-muted-foreground">Total Revenue</p>
              </Card>
              <Card className="p-4 rounded-xl border border-border">
                <ShoppingBag className="h-5 w-5 text-hermtica mb-2" />
                <p className="text-2xl font-bold text-foreground">{totalSales}</p>
                <p className="text-xs text-muted-foreground">Total Sales</p>
              </Card>
            </div>

            <Card className="p-4 rounded-xl border border-border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Package className="h-4 w-4" /> My Listings
                </h3>
                <Link href="/marketplace/create">
                  <Button size="sm" className="h-8 text-xs bg-hermtica text-white hover:bg-hermtica/90 rounded-full">+ New</Button>
                </Link>
              </div>
              {services.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No listings yet. Create your first service!</p>
              ) : (
                <div className="space-y-2">
                  {services.map((svc) => (
                    <div key={svc.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                      <div>
                        <p className="text-sm font-medium text-foreground">{svc.title}</p>
                        <p className="text-xs text-muted-foreground">{svc.salesCount} sales</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">{svc.price}cr</Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-4 rounded-xl border border-border">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4" /> Recent Sales
              </h3>
              {orders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No sales yet</p>
              ) : (
                <div className="space-y-2">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/5">
                      <div>
                        <p className="text-sm font-medium text-foreground">+{order.sellerAmount}cr</p>
                        <p className="text-xs text-muted-foreground">Order {order.id.slice(0, 8)}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{order.createdAt}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
