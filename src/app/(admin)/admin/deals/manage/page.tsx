"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePolling } from "@/hooks/usePolling";

type Deal = {
  id: string;
  name: string;
  deal_type: string;
  status: string;
  stock_total: number;
  stock_claimed: number;
};

export default function AdminDealsManagePage() {
  const { supabase } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);

  const load = async () => {
    const { data } = await supabase
      .from("deals")
      .select("id,name,deal_type,status,stock_total,stock_claimed")
      .order("created_at", { ascending: false });
    setDeals((data || []) as Deal[]);
  };

  useEffect(() => {
    void load();
  }, []);
  usePolling(load, { intervalMs: 4000 });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-2">
        <h1 className="text-3xl font-bold">Manage Deals</h1>
        <Button asChild>
          <Link href="/admin/deals/create">Create deal</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Active deals dashboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {deals.map((deal) => (
            <div
              key={deal.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded border p-3"
            >
              <div>
                <p className="font-medium">{deal.name}</p>
                <p className="text-sm text-muted-foreground">
                  {deal.deal_type} • {deal.stock_claimed}/{deal.stock_total} claimed
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge>{deal.status}</Badge>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/admin/deals/${deal.id}/control`}>Control</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/deals/live/${deal.id}`} target="_blank">
                    Live display
                  </Link>
                </Button>
              </div>
            </div>
          ))}
          {deals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No deals created yet.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
