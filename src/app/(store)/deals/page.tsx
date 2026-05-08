"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type DealRow = {
  id: string;
  name: string;
  deal_type: "daily" | "flash" | "quantity_drop" | "bogo" | "free_gift";
  status: "active" | "scheduled" | "ended";
  product_name: string;
  deal_price: number;
  original_price: number;
  ends_at: string | null;
};

export default function DealsPage() {
  const { supabase } = useAuth();
  const [deals, setDeals] = useState<DealRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("deals")
        .select(
          "id,name,deal_type,status,product_name,deal_price,original_price,ends_at",
        )
        .order("created_at", { ascending: false });
      setDeals((data || []) as DealRow[]);
      setLoading(false);
    };
    void load();
  }, [supabase]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold">Today's Deals</h1>
      <p className="mb-6 text-muted-foreground">
        Daily deals, flash sales, quantity drops, BOGO, and free gifts.
      </p>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading deals...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {deals.map((deal) => (
            <Card key={deal.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  <span>{deal.name}</span>
                  <Badge>{deal.status}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {deal.product_name} • {deal.deal_type}
                </p>
                <p className="text-sm">
                  <span className="text-lg font-bold">KES {deal.deal_price}</span>{" "}
                  <span className="text-muted-foreground line-through">
                    KES {deal.original_price}
                  </span>
                </p>
                <div className="flex gap-2">
                  <Button asChild size="sm">
                    <Link href={`/deals/${deal.id}`}>Open deal</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/deals/live/${deal.id}`} target="_blank">
                      Open live display
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {deals.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No live deals right now.
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}
    </div>
  );
}
