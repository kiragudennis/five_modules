"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";

type Deal = {
  id: string;
  name: string;
  status: string;
  product_name: string;
  deal_price: number;
  original_price: number;
  stock_total: number;
  stock_claimed: number;
  starts_at: string | null;
  ends_at: string | null;
};

export default function DealDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { supabase, profile } = useAuth();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [claims, setClaims] = useState<string[]>([]);

  const load = async () => {
    const [{ data: dealData }, { data: claimData }] = await Promise.all([
      supabase
        .from("deals")
        .select("*")
        .eq("id", id)
        .single(),
      supabase
        .from("deal_claims")
        .select("users:user_id(full_name,email)")
        .eq("deal_id", id)
        .order("created_at", { ascending: false })
        .limit(15),
    ]);

    setDeal((dealData || null) as Deal | null);
    setClaims(
      (claimData || []).map(
        (c: any) => c.users?.full_name || c.users?.email || "Customer",
      ),
    );
  };

  useEffect(() => {
    void load();
  }, [id]);

  useSupabaseRealtime({
    supabase,
    channelName: `deal-detail-${id}`,
    tables: [
      { table: "deals", filter: `id=eq.${id}` },
      { table: "deal_claims", filter: `deal_id=eq.${id}` },
    ],
    onEvent: () => {
      void load();
    },
    enabled: Boolean(id),
  });

  const stockLeft = useMemo(() => {
    if (!deal) return 0;
    return Math.max(0, (deal.stock_total || 0) - (deal.stock_claimed || 0));
  }, [deal]);

  const stockPct = useMemo(() => {
    if (!deal?.stock_total) return 0;
    return Math.round(((deal.stock_claimed || 0) / deal.stock_total) * 100);
  }, [deal]);

  const claimDeal = async () => {
    if (!deal || !profile?.id) return;
    await supabase.from("deal_claims").insert({ deal_id: deal.id, user_id: profile.id });
    await supabase
      .from("deals")
      .update({ stock_claimed: (deal.stock_claimed || 0) + 1 })
      .eq("id", deal.id);
    await load();
  };

  if (!deal) {
    return <div className="container mx-auto px-4 py-8">Loading deal...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span>{deal.name}</span>
            <Badge>{deal.status}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="font-medium">{deal.product_name}</p>
          <p>
            <span className="text-2xl font-bold text-red-600">
              KES {deal.deal_price}
            </span>{" "}
            <span className="text-muted-foreground line-through">
              KES {deal.original_price}
            </span>
          </p>
          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span>Stock claimed</span>
              <span>{stockPct}%</span>
            </div>
            <div className="h-2 rounded bg-muted">
              <div className="h-2 rounded bg-red-500" style={{ width: `${stockPct}%` }} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{stockLeft} left</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void claimDeal()} disabled={stockLeft <= 0}>
              Claim Deal
            </Button>
            <Button asChild variant="outline">
              <Link href={`/deals/live/${deal.id}`} target="_blank">
                Open live screen
              </Link>
            </Button>
          </div>
          <div className="rounded border p-3">
            <p className="mb-2 text-xs text-muted-foreground">Recent claims ticker</p>
            <p className="text-sm">{claims.join(" • ") || "No claims yet."}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
