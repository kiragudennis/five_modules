"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { usePolling } from "@/hooks/usePolling";

type Deal = {
  id: string;
  name: string;
  status: "scheduled" | "active" | "ended";
  stock_total: number;
  stock_claimed: number;
  ends_at: string | null;
  mystery_revealed?: boolean;
};

export default function DealControlPage() {
  const { id } = useParams<{ id: string }>();
  const { supabase } = useAuth();
  const [deal, setDeal] = useState<Deal | null>(null);

  const load = async () => {
    const { data } = await supabase.from("deals").select("*").eq("id", id).single();
    setDeal((data || null) as Deal | null);
  };

  useEffect(() => {
    void load();
  }, [id]);
  usePolling(load, { intervalMs: 3000 });

  const patch = async (values: Partial<Deal>) => {
    if (!deal) return;
    const { error } = await supabase.from("deals").update(values).eq("id", deal.id);
    if (error) {
      toast.error("Action failed.");
      return;
    }
    await load();
  };

  const triggerFlashSale = async () => {
    await patch({ status: "active" });
    toast.success("Flash sale triggered.");
  };

  const extendByTen = async () => {
    if (!deal?.ends_at) return;
    const next = new Date(new Date(deal.ends_at).getTime() + 10 * 60 * 1000).toISOString();
    await patch({ ends_at: next });
    toast.success("Timer extended by 10 minutes.");
  };

  const addStock = async () => {
    if (!deal) return;
    await patch({ stock_total: (deal.stock_total || 0) + 25 });
    toast.success("Added 25 stock.");
  };

  const revealMystery = async () => {
    await patch({ mystery_revealed: true });
    toast.success("Mystery deal revealed.");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {!deal ? (
        <p className="text-sm text-muted-foreground">Loading control panel...</p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2">
              <span>{deal.name} control</span>
              <Badge>{deal.status}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 md:grid-cols-2">
              <Button variant="outline" onClick={() => void triggerFlashSale()}>
                Trigger flash sale instantly
              </Button>
              <Button variant="outline" onClick={() => void extendByTen()}>
                Extend timer +10 minutes
              </Button>
              <Button variant="outline" onClick={() => void addStock()}>
                Add more stock (+25)
              </Button>
              <Button variant="outline" onClick={() => void revealMystery()}>
                Reveal mystery deal
              </Button>
            </div>

            <div className="rounded border p-3 text-sm">
              <p>Status: {deal.status}</p>
              <p>
                Stock: {deal.stock_claimed}/{deal.stock_total}
              </p>
              <p>Ends at: {deal.ends_at || "Not set"}</p>
              <p>Mystery revealed: {deal.mystery_revealed ? "Yes" : "No"}</p>
            </div>

            <div className="flex gap-2">
              <Button asChild variant="secondary">
                <Link href={`/deals/live/${deal.id}`} target="_blank">
                  Open live display
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/deals/${deal.id}`} target="_blank">
                  Open customer page
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
