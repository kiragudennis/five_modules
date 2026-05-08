"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { usePolling } from "@/hooks/usePolling";
import { LiveDisplayShell } from "@/components/live/live-display-shell";
import { Card, CardContent } from "@/components/ui/card";

type DealLive = {
  id: string;
  name: string;
  product_name: string;
  deal_price: number;
  original_price: number;
  stock_total: number;
  stock_claimed: number;
  starts_at: string | null;
  ends_at: string | null;
};

export default function DealLivePage() {
  const { id } = useParams<{ id: string }>();
  const { supabase } = useAuth();
  const [deal, setDeal] = useState<DealLive | null>(null);
  const [claimNames, setClaimNames] = useState<string[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const load = async () => {
    const [{ data: dealData }, { data: claims }] = await Promise.all([
      supabase.from("deals").select("*").eq("id", id).single(),
      supabase
        .from("deal_claims")
        .select("users:user_id(full_name,email)")
        .eq("deal_id", id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    const row = (dealData || null) as DealLive | null;
    setDeal(row);
    setClaimNames(
      (claims || []).map((c: any) => c.users?.full_name || c.users?.email || "Customer"),
    );

    if (row?.ends_at) {
      setSecondsLeft(
        Math.max(0, Math.floor((new Date(row.ends_at).getTime() - Date.now()) / 1000)),
      );
    }
  };

  useEffect(() => {
    void load();
  }, [id]);

  usePolling(load, { intervalMs: 2500 });
  usePolling(() => setSecondsLeft((prev) => Math.max(0, prev - 1)), {
    intervalMs: 1000,
    runImmediately: false,
  });

  const stockPct = useMemo(() => {
    if (!deal?.stock_total) return 0;
    return Math.round(((deal.stock_claimed || 0) / deal.stock_total) * 100);
  }, [deal]);

  const timerColor =
    secondsLeft > 1800 ? "text-green-400" : secondsLeft > 600 ? "text-yellow-400" : "text-red-400";

  return (
    <LiveDisplayShell
      title={deal?.name || "Deal Live"}
      subtitle={deal?.product_name || ""}
      activeCount={claimNames.length}
      tickerItems={claimNames.map((name) => `${name} claimed this deal`)}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-slate-800 bg-slate-900 md:col-span-2">
          <CardContent className="pt-6">
            <p className="text-sm text-slate-400">Countdown</p>
            <p className={`text-6xl font-black ${timerColor}`}>
              {Math.floor(secondsLeft / 60)
                .toString()
                .padStart(2, "0")}
              :
              {(secondsLeft % 60).toString().padStart(2, "0")}
            </p>
            <p className="mt-3 text-sm text-slate-300">
              KES {deal?.deal_price}{" "}
              <span className="text-slate-500 line-through">KES {deal?.original_price}</span>
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="pt-6">
            <p className="mb-1 text-sm text-slate-400">Stock depletion</p>
            <div className="h-3 rounded bg-slate-700">
              <div className="h-3 rounded bg-red-500" style={{ width: `${stockPct}%` }} />
            </div>
            <p className="mt-1 text-xs text-slate-400">{stockPct}% claimed</p>
          </CardContent>
        </Card>
      </div>
    </LiveDisplayShell>
  );
}
